/**
 * Password History Management
 * Prevents password reuse and tracks password changes
 */

import { compare, hash } from 'bcryptjs';
import { prisma } from '@/lib/data';

const PASSWORD_HISTORY_COUNT = 5; // Number of previous passwords to check

/**
 * Check if password was used recently
 */
export async function isPasswordReused(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    const history = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_HISTORY_COUNT,
    });

    for (const entry of history) {
      const isMatch = await compare(newPassword, entry.passwordHash);
      if (isMatch) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking password history:', error);
    return false;
  }
}

/**
 * Add password to history
 */
export async function addPasswordToHistory(
  userId: string,
  password: string
): Promise<void> {
  try {
    const passwordHash = await hash(password, 12);

    // Add new password to history
    await prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash,
      },
    });

    // Clean up old history entries (keep only last N)
    const allHistory = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (allHistory.length > PASSWORD_HISTORY_COUNT) {
      const idsToDelete = allHistory
        .slice(PASSWORD_HISTORY_COUNT)
        .map((h) => h.id);

      await prisma.passwordHistory.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
    }
  } catch (error) {
    console.error('Error adding password to history:', error);
    throw error;
  }
}

/**
 * Get password history count for user
 */
export async function getPasswordHistoryCount(userId: string): Promise<number> {
  try {
    return await prisma.passwordHistory.count({
      where: { userId },
    });
  } catch (error) {
    console.error('Error getting password history count:', error);
    return 0;
  }
}

/**
 * Clear password history for user (e.g., on account deletion)
 */
export async function clearPasswordHistory(userId: string): Promise<void> {
  try {
    await prisma.passwordHistory.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error('Error clearing password history:', error);
    throw error;
  }
}
