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

    // Fetch general settings from SystemSetting table
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'site_name',
            'site_description',
            'contact_email',
            'max_recipes_per_user',
            'enable_registration',
            'enable_guest_mode',
          ],
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
        siteName: data.site_name || 'Recipe Hub',
        siteDescription: data.site_description || 'Your digital cookbook and meal planning companion',
        contactEmail: data.contact_email || 'admin@recipehub.com',
        maxRecipesPerUser: data.max_recipes_per_user || 100,
        enableRegistration: data.enable_registration ?? true,
        enableGuestMode: data.enable_guest_mode ?? true,
      },
    });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch general settings' },
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
    const {
      siteName,
      siteDescription,
      contactEmail,
      maxRecipesPerUser,
      enableRegistration,
      enableGuestMode,
    } = body;

    // Update settings in database
    const settingsToUpdate = [
      { key: 'site_name', value: siteName },
      { key: 'site_description', value: siteDescription },
      { key: 'contact_email', value: contactEmail },
      { key: 'max_recipes_per_user', value: maxRecipesPerUser },
      { key: 'enable_registration', value: enableRegistration },
      { key: 'enable_guest_mode', value: enableGuestMode },
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
            category: 'General',
            description: `General setting: ${setting.key}`,
            dataType: typeof setting.value === 'boolean' ? 'boolean' : typeof setting.value === 'number' ? 'number' : 'string',
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
        entityId: 'general',
        changes: JSON.stringify({
          siteName,
          siteDescription,
          contactEmail,
          maxRecipesPerUser,
          enableRegistration,
          enableGuestMode,
        }),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'General settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating general settings:', error);
    return NextResponse.json(
      { error: 'Failed to update general settings' },
      { status: 500 }
    );
  }
}
