'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChefHat, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500',
        !isAssistant && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        'w-8 h-8 flex-shrink-0',
        isAssistant ? 'bg-primary/10' : 'bg-secondary'
      )}>
        <AvatarFallback>
          {isAssistant ? (
            <ChefHat className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        'flex-1 space-y-1',
        !isAssistant && 'flex flex-col items-end'
      )}>
        <Card className={cn(
          'px-4 py-3 max-w-[80%] inline-block',
          isAssistant 
            ? 'bg-card border-border' 
            : 'bg-primary text-primary-foreground border-primary'
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </Card>
        
        <p className="text-xs text-muted-foreground px-1">
          {format(message.timestamp, 'h:mm a')}
        </p>
      </div>
    </div>
  );
}
