'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasPermission, ROLE_LABELS } from '@/lib/admin-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    if (!loading && (!user || !user.role || !hasPermission(user.role, 'VIEW_AUDIT_LOGS'))) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role && hasPermission(user.role, 'VIEW_AUDIT_LOGS')) {
      fetchLogs();
    }
  }, [user, pagination.page, actionFilter, entityTypeFilter]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityTypeFilter !== 'all') params.append('entityType', entityTypeFilter);

      const response = await fetch(`/api/admin/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch audit logs',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('BAN')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('CREATE')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const isSecurityEvent = (log: AuditLog) => {
    const securityActions = ['DELETE', 'BAN', 'SUSPEND', 'MANAGE_ROLES', 'BULK_DELETE'];
    return securityActions.some((action) => log.action.includes(action));
  };

  if (loading || !user) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user.role || !hasPermission(user.role, 'VIEW_AUDIT_LOGS')) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You do not have permission to view audit logs.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-3xl font-bold'>Audit Logs</h1>
            <p className='text-muted-foreground'>
              Track all administrative actions and system events
            </p>
          </div>
          <Button onClick={fetchLogs} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-col md:flex-row gap-4'>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className='w-full md:w-[200px]'>
                  <SelectValue placeholder='Filter by action' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Actions</SelectItem>
                  <SelectItem value='CREATE'>Create</SelectItem>
                  <SelectItem value='UPDATE'>Update</SelectItem>
                  <SelectItem value='DELETE'>Delete</SelectItem>
                  <SelectItem value='VIEW'>View</SelectItem>
                  <SelectItem value='BULK_ACTIVATE'>Bulk Activate</SelectItem>
                  <SelectItem value='BULK_SUSPEND'>Bulk Suspend</SelectItem>
                  <SelectItem value='BULK_DELETE'>Bulk Delete</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger className='w-full md:w-[200px]'>
                  <SelectValue placeholder='Filter by entity' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Entities</SelectItem>
                  <SelectItem value='User'>User</SelectItem>
                  <SelectItem value='Recipe'>Recipe</SelectItem>
                  <SelectItem value='Settings'>Settings</SelectItem>
                  <SelectItem value='Feature'>Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loadingLogs ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : logs.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-muted-foreground'>No audit logs found</p>
              </div>
            ) : (
              <>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className='w-12'></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow
                          key={log.id}
                          className={
                            isSecurityEvent(log) ? 'bg-yellow-50' : undefined
                          }
                        >
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='text-sm'>
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                              <span className='text-xs text-muted-foreground'>
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {log.user.name || 'Unknown'}
                              </span>
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-muted-foreground'>
                                  {log.user.email}
                                </span>
                                <Badge
                                  className='text-xs'
                                  variant='outline'
                                >
                                  {ROLE_LABELS[log.user.role]}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              {isSecurityEvent(log) && (
                                <AlertTriangle className='h-4 w-4 text-yellow-600' />
                              )}
                              <Badge className={getActionBadgeColor(log.action)}>
                                {log.action}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='font-medium'>{log.entityType}</span>
                              {log.entityId && (
                                <span className='text-xs text-muted-foreground font-mono'>
                                  {log.entityId.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className='font-mono text-sm'>
                              {log.ipAddress || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className='flex items-center justify-between mt-4'>
                  <div className='text-sm text-muted-foreground'>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalCount
                    )}{' '}
                    of {pagination.totalCount} logs
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Timestamp
                  </div>
                  <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Action
                  </div>
                  <Badge className={getActionBadgeColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    User
                  </div>
                  <div>{selectedLog.user.name || selectedLog.user.email}</div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    User Role
                  </div>
                  <div>{ROLE_LABELS[selectedLog.user.role]}</div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Entity Type
                  </div>
                  <div>{selectedLog.entityType}</div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Entity ID
                  </div>
                  <div className='font-mono text-sm'>
                    {selectedLog.entityId || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    IP Address
                  </div>
                  <div className='font-mono text-sm'>
                    {selectedLog.ipAddress || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Log ID
                  </div>
                  <div className='font-mono text-xs break-all'>
                    {selectedLog.id}
                  </div>
                </div>
              </div>
              
              {selectedLog.userAgent && (
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    User Agent
                  </div>
                  <div className='text-sm font-mono bg-muted p-2 rounded'>
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <div className='text-sm font-medium text-muted-foreground mb-1'>
                    Changes
                  </div>
                  <pre className='text-xs bg-muted p-3 rounded overflow-x-auto'>
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
