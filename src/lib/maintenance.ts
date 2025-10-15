import { prisma } from '@/lib/data';

export async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'maintenance_mode' },
    });

    if (!setting) {
      return false;
    }

    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value === 'true';
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    return false;
  }
}

export async function getMaintenanceMessage(): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'maintenance_message' },
    });

    if (!setting) {
      return 'We are currently performing maintenance. Please check back soon!';
    }

    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  } catch (error) {
    console.error('Error fetching maintenance message:', error);
    return 'We are currently performing maintenance. Please check back soon!';
  }
}
