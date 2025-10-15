/**
 * API Route: IP Allowlist Management for Super Admins
 * GET /api/admin/security/ip-allowlist - List allowed IPs
 * POST /api/admin/security/ip-allowlist - Add IP to allowlist
 * DELETE /api/admin/security/ip-allowlist - Remove IP from allowlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import {
  addIPToAllowlist,
  removeIPFromAllowlist,
  getAllowedIPs,
  getClientIP,
  cleanupExpiredIPs
} from '@/lib/ip-allowlist';
import { createAuditLog } from '@/lib/audit-log';

// GET - List all allowed IPs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can manage IP allowlist' },
        { status: 403 }
      );
    }

    // Clean up expired IPs first
    await cleanupExpiredIPs();

    const allowedIPs = await getAllowedIPs();

    return NextResponse.json({ ips: allowedIPs });
  } catch (error) {
    console.error('IP allowlist GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add IP to allowlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can manage IP allowlist' },
        { status: 403 }
      );
    }

    const { ipAddress, description, expiresInDays } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Validate IP format (basic check)
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    // Calculate expiration
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    await addIPToAllowlist(
      ipAddress,
      user.id,
      description,
      expiresAt
    );

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'System',
      changes: {
        action: 'IP_ADDED_TO_ALLOWLIST',
        ipAddress,
        description,
        expiresAt
      },
      ipAddress: getClientIP(request)
    });

    return NextResponse.json({
      success: true,
      message: 'IP added to allowlist successfully'
    });
  } catch (error) {
    console.error('IP allowlist POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove IP from allowlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can manage IP allowlist' },
        { status: 403 }
      );
    }

    const { ipAddress } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Prevent removing current IP
    const currentIP = getClientIP(request);
    if (ipAddress === currentIP) {
      return NextResponse.json(
        { error: 'Cannot remove your current IP address' },
        { status: 400 }
      );
    }

    await removeIPFromAllowlist(ipAddress);

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'System',
      changes: {
        action: 'IP_REMOVED_FROM_ALLOWLIST',
        ipAddress
      },
      ipAddress: getClientIP(request)
    });

    return NextResponse.json({
      success: true,
      message: 'IP removed from allowlist successfully'
    });
  } catch (error) {
    console.error('IP allowlist DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
