/**
 * THE RAIL EXCHANGE™ — Thread List Component
 * 
 * Displays list of message threads with preview and unread indicators.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ThreadItem {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    image?: string;
  }>;
  listing?: {
    id: string;
    title: string;
    slug: string;
    images?: Array<{ url: string }>;
  };
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount: number;
}

export interface ThreadListProps {
  threads: ThreadItem[];
  currentUserId: string;
  selectedThreadId?: string;
  onThreadSelect?: (id: string) => void;
  className?: string;
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  currentUserId,
  selectedThreadId,
  onThreadSelect,
  className,
}) => {
  const getOtherParticipant = (thread: ThreadItem) => {
    return thread.participants.find(p => p.id !== currentUserId) || thread.participants[0];
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (threads.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-text-secondary font-medium">No messages yet</p>
        <p className="text-sm text-text-tertiary mt-1">
          Start a conversation by contacting a seller or contractor
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="divide-y divide-surface-border">
        {threads.map((thread) => {
          const otherUser = getOtherParticipant(thread);
          const isSelected = thread.id === selectedThreadId;
          const hasUnread = thread.unreadCount > 0;
          const initials = otherUser.name
            ? otherUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : otherUser.email[0].toUpperCase();

          const content = (
            <div
              className={cn(
                "flex gap-3 p-4 cursor-pointer transition-colors",
                isSelected ? "bg-surface-secondary" : "hover:bg-surface-secondary/50",
                hasUnread && "bg-rail-orange/5"
              )}
              onClick={() => onThreadSelect?.(thread.id)}
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={otherUser.image} alt={otherUser.name} />
                <AvatarFallback className="bg-navy-900 text-white text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={cn(
                    "font-medium truncate",
                    hasUnread ? "text-navy-900" : "text-text-secondary"
                  )}>
                    {otherUser.name || otherUser.email}
                  </span>
                  {thread.lastMessage && (
                    <span className="text-xs text-text-tertiary flex-shrink-0">
                      {formatTime(thread.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                {/* Listing Badge */}
                {thread.listing && (
                  <div className="mb-1">
                    <Badge variant="outline" className="text-xs font-normal bg-surface-secondary border-0">
                      Re: {thread.listing.title}
                    </Badge>
                  </div>
                )}

                {/* Last Message Preview */}
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-sm truncate flex-1",
                    hasUnread ? "text-navy-900 font-medium" : "text-text-tertiary"
                  )}>
                    {thread.lastMessage?.senderId === currentUserId && (
                      <span className="text-text-tertiary">You: </span>
                    )}
                    {thread.lastMessage?.content || 'No messages yet'}
                  </p>
                  {hasUnread && (
                    <Badge className="bg-rail-orange text-white text-xs h-5 min-w-5 flex items-center justify-center">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );

          return onThreadSelect ? (
            <div key={thread.id}>{content}</div>
          ) : (
            <Link key={thread.id} href={`/dashboard/messages/${thread.id}`}>
              {content}
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export { ThreadList };
