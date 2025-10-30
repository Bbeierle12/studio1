'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  CheckCircle2,
  Info,
  AlertCircle,
  UserPlus,
  ChefHat,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'activity';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Recipe Saved',
      message: 'Chocolate Chip Cookies saved to your collection',
      time: '5 min ago',
      read: false,
      icon: CheckCircle2,
    },
    {
      id: '2',
      type: 'activity',
      title: 'Family Member Joined',
      message: 'Sarah joined your family household',
      time: '1 hour ago',
      read: false,
      icon: UserPlus,
    },
    {
      id: '3',
      type: 'info',
      title: 'Meal Plan Updated',
      message: "This week's dinner plan is ready",
      time: '3 hours ago',
      read: true,
      icon: ChefHat,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) {
      const Icon = notification.icon;
      return <Icon className="h-4 w-4" />;
    }

    switch (notification.type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 relative hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 min-w-[20px] px-1 justify-center rounded-full text-xs font-bold"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </TooltipContent>

          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-2">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-6 text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-6 text-xs text-destructive hover:text-destructive"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {notifications.map(notification => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 cursor-pointer',
                        !notification.read && 'bg-primary/5'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        {getNotificationIcon(notification)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
