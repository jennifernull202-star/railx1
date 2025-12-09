/**
 * THE RAIL EXCHANGE™ — New Message Composer Component
 * 
 * Modal/dialog for composing new messages to sellers or contractors.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface NewMessageComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  listing?: {
    id: string;
    title: string;
    images?: Array<{ url: string }>;
  };
  onSend: (data: { recipientId: string; content: string; listingId?: string }) => Promise<void>;
}

const NewMessageComposer: React.FC<NewMessageComposerProps> = ({
  isOpen,
  onClose,
  recipient,
  listing,
  onSend,
}) => {
  const [content, setContent] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSend = async () => {
    if (!content.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend({
        recipientId: recipient.id,
        content: content.trim(),
        listingId: listing?.id,
      });
      setContent('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const recipientInitials = recipient.name
    ? recipient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : recipient.email[0].toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Start a conversation with {recipient.name || recipient.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipient.image} alt={recipient.name} />
              <AvatarFallback className="bg-navy-900 text-white text-sm">
                {recipientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy-900 truncate">
                {recipient.name || 'User'}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {recipient.email}
              </p>
            </div>
          </div>

          {/* Listing Context */}
          {listing && (
            <div className="flex items-center gap-3 p-3 border border-surface-border rounded-lg">
              {listing.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.images[0].url}
                  alt={listing.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-tertiary">Regarding:</p>
                <p className="font-medium text-navy-900 truncate">
                  {listing.title}
                </p>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message here..."
              className="min-h-[120px] resize-none"
              maxLength={5000}
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>{error && <span className="text-status-error">{error}</span>}</span>
              <span>{content.length}/5000</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!content.trim() || isSending}
              className="bg-rail-orange hover:bg-rail-orange-dark"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { NewMessageComposer };
