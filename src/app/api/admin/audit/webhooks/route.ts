/**
 * Audit Webhook Management API
 * Manage SIEM integrations and audit event webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { isSuperAdmin } from '@/lib/admin-permissions';
import { requireAdmin } from '@/lib/admin-middleware';
import { createAuditLog } from '@/lib/audit-log';
import { getClientIP } from '@/lib/ip-allowlist';

// GET - List all webhooks
export async function GET() {
  try {
    const auth = await requireAdmin(isSuperAdmin, 'Only Super Admins can manage webhooks');
    if (!auth.authorized) return auth.response;

    const webhooks = await prisma.auditWebhook.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

// POST - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(isSuperAdmin, 'Only Super Admins can manage webhooks');
    if (!auth.authorized) return auth.response;
    const adminUser = auth.user;

    const { name, url, secret, events } = await request.json();

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const webhook = await prisma.auditWebhook.create({
      data: {
        name,
        url,
        secret: secret || null,
        events,
        isActive: true,
      },
    });

    await createAuditLog({
      userId: adminUser.id,
      action: 'CREATE',
      entityType: 'System',
      entityId: webhook.id,
      changes: { name, url, events },
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// PATCH - Update webhook
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(isSuperAdmin, 'Only Super Admins can manage webhooks');
    if (!auth.authorized) return auth.response;
    const adminUser = auth.user;

    const { id, name, url, secret, events, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      );
    }

    const webhook = await prisma.auditWebhook.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(secret !== undefined && { secret }),
        ...(events !== undefined && { events }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await createAuditLog({
      userId: adminUser.id,
      action: 'UPDATE',
      entityType: 'System',
      entityId: webhook.id,
      changes: { name, url, events, isActive },
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE - Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(isSuperAdmin, 'Only Super Admins can manage webhooks');
    if (!auth.authorized) return auth.response;
    const adminUser = auth.user;

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      );
    }

    await prisma.auditWebhook.delete({
      where: { id },
    });

    await createAuditLog({
      userId: adminUser.id,
      action: 'DELETE',
      entityType: 'System',
      entityId: id,
      ipAddress: getClientIP(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
