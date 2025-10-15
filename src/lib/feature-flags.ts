import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

// Types for feature flag system
export interface FeatureFlagConfig {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage: number;
  environment?: 'development' | 'staging' | 'production' | 'all';
  dependencies?: string[]; // Other flags that must be enabled
  killSwitch?: boolean; // Emergency disable override
  targetUsers?: string[]; // Specific user IDs to always enable for
  excludedUsers?: string[]; // Specific user IDs to never enable for
  metadata?: Record<string, any>;
}

export interface FeatureFlagUser {
  id: string;
  email?: string;
  role?: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

export interface FeatureFlagEvaluation {
  enabled: boolean;
  reason: 'kill-switch' | 'disabled' | 'excluded' | 'targeted' | 'rollout' | 'dependency-failed' | 'environment-mismatch';
  metadata?: Record<string, any>;
}

// Stable hashing function for consistent user bucketing
export function hashUserToBucket(userId: string, flagName: string): number {
  const hash = createHash('md5').update(`${userId}:${flagName}`).digest('hex');
  // Convert first 8 characters of hash to number, then mod 100 for percentage
  const hashNumber = parseInt(hash.substring(0, 8), 16);
  return hashNumber % 100;
}

// Main feature flag evaluation class
export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private cache: Map<string, FeatureFlagConfig> = new Map();
  private cacheExpiry: number = 60000; // 1 minute cache
  private lastFetch: number = 0;
  private environment: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  // Fetch flags from database with caching
  private async fetchFlags(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch < this.cacheExpiry) {
      return; // Use cached data
    }

    try {
      const flags = await prisma.featureFlag.findMany();
      this.cache.clear();

      for (const flag of flags) {
        // Parse metadata if stored as JSON string
        let metadata = {};
        let dependencies: string[] = [];
        let targetUsers: string[] = [];
        let excludedUsers: string[] = [];
        let environment = 'all';
        let killSwitch = false;

        // If description contains JSON metadata, parse it
        if (flag.description && flag.description.startsWith('{')) {
          try {
            const parsed = JSON.parse(flag.description);
            metadata = parsed.metadata || {};
            dependencies = parsed.dependencies || [];
            targetUsers = parsed.targetUsers || [];
            excludedUsers = parsed.excludedUsers || [];
            environment = parsed.environment || 'all';
            killSwitch = parsed.killSwitch || false;
          } catch (e) {
            // If not valid JSON, treat as regular description
          }
        }

        this.cache.set(flag.name, {
          name: flag.name,
          enabled: flag.enabled,
          description: flag.description || undefined,
          rolloutPercentage: flag.rolloutPercentage,
          environment: environment as any,
          dependencies,
          killSwitch,
          targetUsers,
          excludedUsers,
          metadata,
        });
      }

      this.lastFetch = now;
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      // Keep existing cache if fetch fails
    }
  }

  // Clear cache to force refresh
  public clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }

  // Check if a feature is enabled for a specific user
  public async isEnabled(
    flagName: string,
    user?: FeatureFlagUser | null,
    options: { skipCache?: boolean; checkDependencies?: boolean } = {}
  ): Promise<boolean> {
    const evaluation = await this.evaluate(flagName, user, options);
    return evaluation.enabled;
  }

  // Detailed evaluation with reasoning
  public async evaluate(
    flagName: string,
    user?: FeatureFlagUser | null,
    options: { skipCache?: boolean; checkDependencies?: boolean } = {}
  ): Promise<FeatureFlagEvaluation> {
    if (options.skipCache) {
      this.clearCache();
    }

    await this.fetchFlags();

    const flag = this.cache.get(flagName);
    if (!flag) {
      return { enabled: false, reason: 'disabled' };
    }

    // Check kill switch first
    if (flag.killSwitch) {
      return { enabled: false, reason: 'kill-switch' };
    }

    // Check if flag is disabled
    if (!flag.enabled) {
      return { enabled: false, reason: 'disabled' };
    }

    // Check environment
    if (flag.environment && flag.environment !== 'all') {
      if (flag.environment !== this.environment) {
        return { enabled: false, reason: 'environment-mismatch' };
      }
    }

    // Check dependencies
    if (options.checkDependencies !== false && flag.dependencies && flag.dependencies.length > 0) {
      for (const dep of flag.dependencies) {
        const depEnabled = await this.isEnabled(dep, user, { ...options, checkDependencies: false });
        if (!depEnabled) {
          return { enabled: false, reason: 'dependency-failed', metadata: { failedDependency: dep } };
        }
      }
    }

    // If no user provided, only check global settings
    if (!user) {
      return { enabled: flag.rolloutPercentage === 100, reason: 'rollout' };
    }

    // Check excluded users
    if (flag.excludedUsers && flag.excludedUsers.includes(user.id)) {
      return { enabled: false, reason: 'excluded' };
    }

    // Check targeted users
    if (flag.targetUsers && flag.targetUsers.includes(user.id)) {
      return { enabled: true, reason: 'targeted' };
    }

    // Check rollout percentage with stable hashing
    const bucket = hashUserToBucket(user.id, flagName);
    const enabled = bucket < flag.rolloutPercentage;

    return {
      enabled,
      reason: 'rollout',
      metadata: { bucket, rolloutPercentage: flag.rolloutPercentage }
    };
  }

  // Get all flags for a user (useful for client-side hydration)
  public async getAllFlags(user?: FeatureFlagUser | null): Promise<Record<string, boolean>> {
    await this.fetchFlags();

    const result: Record<string, boolean> = {};
    for (const [name] of this.cache) {
      result[name] = await this.isEnabled(name, user);
    }

    return result;
  }

  // Get flag configuration (admin use)
  public async getFlag(flagName: string): Promise<FeatureFlagConfig | null> {
    await this.fetchFlags();
    return this.cache.get(flagName) || null;
  }

  // Update flag configuration
  public async updateFlag(flagName: string, updates: Partial<FeatureFlagConfig>): Promise<void> {
    const existing = await this.getFlag(flagName);
    if (!existing) {
      throw new Error(`Flag ${flagName} not found`);
    }

    // Store complex data in description as JSON
    const metadata = {
      dependencies: updates.dependencies || existing.dependencies,
      targetUsers: updates.targetUsers || existing.targetUsers,
      excludedUsers: updates.excludedUsers || existing.excludedUsers,
      environment: updates.environment || existing.environment,
      killSwitch: updates.killSwitch !== undefined ? updates.killSwitch : existing.killSwitch,
      metadata: updates.metadata || existing.metadata,
      description: typeof updates.description === 'string' ? updates.description : existing.description,
    };

    await prisma.featureFlag.update({
      where: { name: flagName },
      data: {
        enabled: updates.enabled !== undefined ? updates.enabled : existing.enabled,
        rolloutPercentage: updates.rolloutPercentage !== undefined ? updates.rolloutPercentage : existing.rolloutPercentage,
        description: JSON.stringify(metadata),
      },
    });

    this.clearCache();
  }

  // Create a new flag
  public async createFlag(config: Omit<FeatureFlagConfig, 'metadata'> & { metadata?: Record<string, any> }): Promise<void> {
    const metadata = {
      dependencies: config.dependencies || [],
      targetUsers: config.targetUsers || [],
      excludedUsers: config.excludedUsers || [],
      environment: config.environment || 'all',
      killSwitch: config.killSwitch || false,
      metadata: config.metadata || {},
      description: config.description || '',
    };

    await prisma.featureFlag.create({
      data: {
        name: config.name,
        enabled: config.enabled || false,
        rolloutPercentage: config.rolloutPercentage || 0,
        description: JSON.stringify(metadata),
      },
    });

    this.clearCache();
  }
}

// Singleton instance
export const featureFlags = FeatureFlagService.getInstance();

// React hook for client-side feature flags
export function useFeatureFlag(flagName: string, user?: FeatureFlagUser | null): boolean {
  // This would need to be implemented with React hooks and context
  // For now, return a placeholder
  return false;
}

// Helper function for easy server-side usage
export async function isFeatureEnabled(
  flagName: string,
  user?: FeatureFlagUser | null
): Promise<boolean> {
  return featureFlags.isEnabled(flagName, user);
}

// Kill switch pattern documentation
export const KILL_SWITCH_PATTERNS = {
  // Emergency disable all AI features
  disableAllAI: async () => {
    const aiFlags = ['ai_recipes', 'ai_recommendations', 'ai_chat'];
    for (const flag of aiFlags) {
      await featureFlags.updateFlag(flag, { killSwitch: true });
    }
  },

  // Disable features causing high load
  disableHighLoadFeatures: async () => {
    const heavyFlags = ['analytics_dashboard', 'real_time_updates', 'image_processing'];
    for (const flag of heavyFlags) {
      await featureFlags.updateFlag(flag, { killSwitch: true });
    }
  },

  // Re-enable after incident
  resetKillSwitches: async () => {
    const flags = await prisma.featureFlag.findMany();
    for (const flag of flags) {
      await featureFlags.updateFlag(flag.name, { killSwitch: false });
    }
  },
};