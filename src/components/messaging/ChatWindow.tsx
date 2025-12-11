/**
 * THE RAIL EXCHANGE™ — Chat Window Component
 * 
 * Displays messages in a conversation with input for new messages.
 */

'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VerifiedSellerBadge } from '@/components/VerifiedSellerBadge';

export interface MessageItem {
  id: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  content: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  createdAt: string;
  isRead: boolean;
}

export interface ChatWindowProps {
  messages: MessageItem[];
  currentUserId: string;
  recipientName: string;
  recipientImage?: string;
  recipientIsVerifiedSeller?: boolean;
  listingTitle?: string;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUserId,
  recipientName,
  recipientImage,
  recipientIsVerifiedSeller,
  listingTitle,
  onSendMessage,
  isLoading,
  className,
}) => {
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const recipientInitials = recipientName
    ? recipientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl border border-surface-border", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipientImage} alt={recipientName} />
          <AvatarFallback className="bg-navy-900 text-white text-sm">
            {recipientInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-navy-900 truncate">{recipientName}</p>
            {recipientIsVerifiedSeller && (
              <VerifiedSellerBadge size="xs" />
            )}
          </div>
          {listingTitle && (
            <p className="text-xs text-text-tertiary truncate">Re: {listingTitle}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-rail-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-text-secondary">No messages yet</p>
            <p className="text-sm text-text-tertiary mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const showAvatar = !isOwn && 
                (index === 0 || messages[index - 1].senderId !== message.senderId);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar (for received messages) */}
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.image} alt={message.sender.name} />
                          <AvatarFallback className="bg-surface-secondary text-navy-900 text-xs">
                            {message.sender.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-rail-orange text-white rounded-br-md"
                        : "bg-surface-secondary text-navy-900 rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment, i) => (
                          <a
                            key={i}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-2 text-xs underline",
                              isOwn ? "text-white/80" : "text-rail-orange"
                            )}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {attachment.name}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={cn(
                      "text-[10px] mt-1",
                      isOwn ? "text-white/60" : "text-text-tertiary"
                    )}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-surface-border">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="h-11 px-4 bg-rail-orange hover:bg-rail-orange-dark flex-shrink-0"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ChatWindow };
