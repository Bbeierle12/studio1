import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

export async function checkMaintenanceMode() {
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

export async function requireMaintenanceAccess() {
  const session = await getServerSession(authOptions);
  const isMaintenanceMode = await checkMaintenanceMode();

  if (!isMaintenanceMode) {
    return null; // Not in maintenance mode, allow access
  }

  // Check if user is admin
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user && ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (isAdmin) {
      return null; // Admin user, allow access
    }
  }

  // Non-admin user during maintenance
  return NextResponse.json(
    {
      error: 'Service Unavailable',
      message: 'The site is currently under maintenance. Please try again later.',
    },
    { status: 503 }
  );
}
