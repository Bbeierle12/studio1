/**
 * Security Webhooks API
 * Manage security event webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';

// GET - List all webhooks (SUPER_ADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

// POST - Create new webhook (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, secret, events } = body;

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
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
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

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

// PATCH - Update webhook (SUPER_ADMIN only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, url, secret, events, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
    }
    if (secret !== undefined) updateData.secret = secret || null;
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.isActive = isActive;

    const webhook = await prisma.auditWebhook.update({
      where: { id },
      data: updateData,
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

// DELETE - Remove webhook (SUPER_ADMIN only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      );
    }

    await prisma.auditWebhook.delete({
      where: { id },
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
