import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { maintenanceMode, maintenanceMessage } = body;

    // Update settings in database
    const settingsToUpdate = [
      { key: 'maintenance_mode', value: maintenanceMode },
      { key: 'maintenance_message', value: maintenanceMessage },
    ];

    await Promise.all(
      settingsToUpdate.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: JSON.stringify(setting.value),
            updatedBy: session.user.id,
          },
          create: {
            key: setting.key,
            value: JSON.stringify(setting.value),
            category: 'Maintenance',
            description: `Maintenance setting: ${setting.key}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : 'string',
            updatedBy: session.user.id,
          },
        })
      )
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
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
    });

    return NextResponse.json({
      success: true,
      message: 'Maintenance settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance settings' },
      { status: 500 }
    );
  }
}
