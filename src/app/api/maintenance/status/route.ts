import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';

export async function GET(req: NextRequest) {
  try {
    // Fetch maintenance mode status
    const [modesSetting, messageSetting] = await Promise.all([
      prisma.systemSetting.findUnique({
        where: { key: 'maintenance_mode' },
      }),
      prisma.systemSetting.findUnique({
        where: { key: 'maintenance_message' },
      }),
    ]);

    let maintenanceMode = false;
    let maintenanceMessage = 'We are currently performing maintenance. Please check back soon!';

    if (modesSetting) {
      try {
        maintenanceMode = JSON.parse(modesSetting.value);
      } catch {
        maintenanceMode = modesSetting.value === 'true';
      }
    }

    if (messageSetting) {
      try {
        maintenanceMessage = JSON.parse(messageSetting.value);
      } catch {
        maintenanceMessage = messageSetting.value;
      }
    }

    return NextResponse.json({
      maintenanceMode,
      message: maintenanceMessage,
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json(
      {
        maintenanceMode: false,
        message: 'We are currently performing maintenance. Please check back soon!',
      },
      { status: 200 }
    );
  }
}
