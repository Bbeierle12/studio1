/**
 * Permission System for Family Household Roles
 * 
 * Role Hierarchy:
 * - OWNER: Full control
 * - CURATOR: Can edit all recipes, curate collections
 * - CONTRIBUTOR: Can add recipes, edit own recipes
 * - KID: Can view and react only
 */

import { User, Recipe, HouseholdRole } from '@prisma/client';

export type UserWithHousehold = User & {
  household?: {
    id: string;
    ownerId: string;
  } | null;
};

export type RecipeWithUser = Recipe & {
  userId: string;
};

// ============= RECIPE PERMISSIONS =============

/**
 * Check if user can view a recipe
 * @returns true if user can view the recipe
 */
export function canViewRecipe(user: UserWithHousehold | null): boolean {
  // All authenticated users can view recipes
  return !!user;
}

/**
 * Check if user can add a new recipe
 * @returns true if user can add recipes
 */
export function canAddRecipe(user: UserWithHousehold | null): boolean {
  if (!user) return false;
  
  // Everyone except kids can add recipes
  return user.householdRole !== 'KID';
}

/**
 * Check if user can edit a specific recipe
 * @returns true if user can edit the recipe
 */
export function canEditRecipe(
  user: UserWithHousehold | null,
  recipe: RecipeWithUser | null
): boolean {
  if (!user || !recipe) return false;
  
  // Owner and Curator can edit any recipe in their household
  if (user.householdRole === 'OWNER' || user.householdRole === 'CURATOR') {
    return true;
  }
  
  // Contributors can only edit their own recipes
  if (user.householdRole === 'CONTRIBUTOR' && recipe.userId === user.id) {
    return true;
  }
  
  // Kids can't edit anything
  return false;
}

/**
 * Check if user can delete a specific recipe
 * @returns true if user can delete the recipe
 */
export function canDeleteRecipe(
  user: UserWithHousehold | null,
  recipe: RecipeWithUser | null
): boolean {
  if (!user || !recipe) return false;
  
  // Owner and Curator can delete any recipe
  if (user.householdRole === 'OWNER' || user.householdRole === 'CURATOR') {
    return true;
  }
  
  // Contributors can only delete their own recipes
  if (user.householdRole === 'CONTRIBUTOR' && recipe.userId === user.id) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can feature a recipe (highlight in foyer)
 * @returns true if user can feature recipes
 */
export function canFeatureRecipe(user: UserWithHousehold | null): boolean {
  if (!user) return false;
  
  // Only Owner and Curator can feature recipes
  return user.householdRole === 'OWNER' || user.householdRole === 'CURATOR';
}

// ============= REACTION PERMISSIONS =============

/**
 * Check if user can react to recipes (emoji reactions)
 * @returns true if user can react
 */
export function canReact(user: UserWithHousehold | null): boolean {
  // Everyone can react, including kids!
  return !!user;
}

// ============= HOUSEHOLD PERMISSIONS =============

/**
 * Check if user can manage household (add/remove members, change settings)
 * @returns true if user can manage the household
 */
export function canManageHousehold(user: UserWithHousehold | null): boolean {
  if (!user) return false;
  
  // Only the household owner can manage it
  return user.householdRole === 'OWNER';
}

/**
 * Check if user can change another user's role
 * @returns true if user can change roles
 */
export function canChangeRole(
  user: UserWithHousehold | null,
  targetUser: UserWithHousehold | null
): boolean {
  if (!user || !targetUser) return false;
  
  // Only owner can change roles
  if (user.householdRole !== 'OWNER') return false;
  
  // Can't change your own role
  if (user.id === targetUser.id) return false;
  
  // Must be in same household
  if (user.householdId !== targetUser.householdId) return false;
  
  return true;
}

/**
 * Check if user can invite new members to household
 * @returns true if user can invite
 */
export function canInviteMembers(user: UserWithHousehold | null): boolean {
  if (!user) return false;
  
  // Owner and Curator can invite
  return user.householdRole === 'OWNER' || user.householdRole === 'CURATOR';
}

// ============= COLLECTION PERMISSIONS =============

/**
 * Check if user can curate collections (feature, organize)
 * @returns true if user can curate
 */
export function canCurateCollections(user: UserWithHousehold | null): boolean {
  if (!user) return false;
  
  // Owner and Curator can curate
  return user.householdRole === 'OWNER' || user.householdRole === 'CURATOR';
}

// ============= MEAL PLANNING PERMISSIONS =============

/**
 * Check if user can create and edit meal plans
 * @returns true if user can manage meal plans
 */
export function canManageMealPlans(user: UserWithHousehold | null): boolean {
  if (!user) return false;
  
  // Everyone except kids can manage meal plans
  return user.householdRole !== 'KID';
}

// ============= UTILITY FUNCTIONS =============

/**
 * Get a human-readable role name
 */
export function getRoleName(role: HouseholdRole): string {
  const roleNames: Record<HouseholdRole, string> = {
    OWNER: 'Owner',
    CURATOR: 'Curator',
    CONTRIBUTOR: 'Contributor',
    KID: 'Kid'
  };
  
  return roleNames[role] || 'Unknown';
}

/**
 * Get role description
 */
export function getRoleDescription(role: HouseholdRole): string {
  const descriptions: Record<HouseholdRole, string> = {
    OWNER: 'Full control over household and all recipes',
    CURATOR: 'Can edit all recipes and curate collections',
    CONTRIBUTOR: 'Can add recipes and edit own recipes',
    KID: 'Can view recipes and add reactions'
  };
  
  return descriptions[role] || 'Unknown role';
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: HouseholdRole): string {
  const colors: Record<HouseholdRole, string> = {
    OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    CURATOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    CONTRIBUTOR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    KID: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  };
  
  return colors[role] || 'bg-gray-100 text-gray-800';
}

/**
 * Get list of all available roles (for role selection UI)
 */
export function getAvailableRoles(): Array<{
  value: HouseholdRole;
  label: string;
  description: string;
}> {
  return [
    {
      value: 'CURATOR',
      label: 'Curator',
      description: 'Can edit all recipes and curate collections'
    },
    {
      value: 'CONTRIBUTOR',
      label: 'Contributor',
      description: 'Can add recipes and edit own recipes'
    },
    {
      value: 'KID',
      label: 'Kid',
      description: 'Can view recipes and add reactions'
    }
  ];
}

/**
 * Check if user has at least a certain role level
 */
export function hasRoleLevel(
  user: UserWithHousehold | null,
  minRole: HouseholdRole
): boolean {
  if (!user) return false;
  
  const roleHierarchy: Record<HouseholdRole, number> = {
    KID: 1,
    CONTRIBUTOR: 2,
    CURATOR: 3,
    OWNER: 4
  };
  
  const userLevel = roleHierarchy[user.householdRole] || 0;
  const requiredLevel = roleHierarchy[minRole] || 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Permission summary for debugging
 */
export function getPermissionSummary(user: UserWithHousehold | null) {
  if (!user) {
    return {
      isAuthenticated: false,
      role: null,
      permissions: {}
    };
  }
  
  return {
    isAuthenticated: true,
    role: user.householdRole,
    roleName: getRoleName(user.householdRole),
    permissions: {
      viewRecipes: canViewRecipe(user),
      addRecipe: canAddRecipe(user),
      // editRecipe requires recipe context
      // deleteRecipe requires recipe context
      featureRecipe: canFeatureRecipe(user),
      react: canReact(user),
      manageHousehold: canManageHousehold(user),
      inviteMembers: canInviteMembers(user),
      curateCollections: canCurateCollections(user),
      manageMealPlans: canManageMealPlans(user)
    }
  };
}
