import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { isSuperAdmin } from '@/lib/admin-permissions';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(isSuperAdmin);
    if (!auth.authorized) return auth.response;

    // Fetch maintenance settings from SystemSetting table
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['maintenance_mode', 'maintenance_message'],
        },
      },
    });

    // Convert to object format
    const data: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        data[setting.key] = JSON.parse(setting.value);
      } catch {
        data[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        maintenanceMode: data.maintenance_mode ?? false,
        maintenanceMessage:
          data.maintenance_message ||
          'We are currently performing maintenance. Please check back soon!',
      },
    });
  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(isSuperAdmin);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { maintenanceMode, maintenanceMessage } = body;

    // Update settings in database
    const settingsToUpdate = [
      { key: 'maintenance_mode', value: maintenanceMode },
      { key: 'maintenance_message', value: maintenanceMessage },
    ];

    // Apply all setting upserts and the audit log atomically
    await prisma.$transaction([
      ...settingsToUpdate.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: JSON.stringify(setting.value),
            updatedBy: auth.user.id,
          },
          create: {
            key: setting.key,
            value: JSON.stringify(setting.value),
            category: 'Maintenance',
            description: `Maintenance setting: ${setting.key}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : 'string',
            updatedBy: auth.user.id,
          },
        })
      ),
      // Create audit log
      prisma.auditLog.create({
        data: {
          userId: auth.user.id,
          action: 'SETTING_UPDATE',
          entityType: 'settings',
          entityId: 'maintenance',
          changes: JSON.stringify({
            maintenanceMode,
            maintenanceMessage,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        },
      }),
    ]);

    // Create response and set cookie to match maintenance mode state
    const response = NextResponse.json({
      success: true,
      message: 'Maintenance settings updated successfully',
    });

    // Set cookie to match maintenance mode state.
    // httpOnly so client JS cannot flip maintenance_mode to bypass the gate;
    // the cookie is read only server-side by middleware.
    response.cookies.set('maintenance_mode', maintenanceMode ? 'true' : 'false', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance settings' },
      { status: 500 }
    );
  }
}
