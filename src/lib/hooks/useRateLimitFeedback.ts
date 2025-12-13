/**
 * THE RAIL EXCHANGE™ — Rate Limit Feedback Hook
 * 
 * S-15.1: Provides consistent rate limit feedback UI across the app.
 * 
 * Features:
 * - Parses Retry-After header from 429 responses
 * - Shows countdown timer for retry
 * - Consistent copy across all rate-limited actions
 */

import { useState, useEffect, useCallback } from 'react';

export interface RateLimitState {
  isRateLimited: boolean;
  retryAfterSeconds: number;
  message: string;
}

/**
 * S-15.1: Parse Retry-After header from response
 */
export function parseRetryAfter(response: Response): number {
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds;
    }
  }
  // Default to 60 seconds if header not present
  return 60;
}

/**
 * S-15.1: Get user-friendly rate limit message with countdown
 */
export function getRateLimitMessage(seconds: number): string {
  if (seconds <= 0) {
    return 'You can try again now.';
  }
  if (seconds === 1) {
    return 'Too many requests. Please wait 1 second and try again.';
  }
  if (seconds < 60) {
    return `Too many requests. Please wait ${seconds} seconds and try again.`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes === 1) {
    return 'Too many requests. Please wait 1 minute and try again.';
  }
  return `Too many requests. Please wait ${minutes} minutes and try again.`;
}

/**
 * S-15.1: Hook for rate limit feedback with countdown
 */
export function useRateLimitFeedback() {
  const [state, setState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfterSeconds: 0,
    message: '',
  });

  // Countdown timer
  useEffect(() => {
    if (state.retryAfterSeconds <= 0) {
      if (state.isRateLimited) {
        setState(prev => ({
          ...prev,
          isRateLimited: false,
          message: 'You can try again now.',
        }));
      }
      return;
    }

    const timer = setInterval(() => {
      setState(prev => {
        const newSeconds = prev.retryAfterSeconds - 1;
        return {
          ...prev,
          retryAfterSeconds: newSeconds,
          message: getRateLimitMessage(newSeconds),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.retryAfterSeconds, state.isRateLimited]);

  /**
   * Handle a 429 response - call this when you get rate limited
   */
  const handleRateLimit = useCallback((response: Response) => {
    const seconds = parseRetryAfter(response);
    setState({
      isRateLimited: true,
      retryAfterSeconds: seconds,
      message: getRateLimitMessage(seconds),
    });
  }, []);

  /**
   * Clear rate limit state (e.g., on successful action)
   */
  const clearRateLimit = useCallback(() => {
    setState({
      isRateLimited: false,
      retryAfterSeconds: 0,
      message: '',
    });
  }, []);

  /**
   * Check if response is rate limited and handle it
   * Returns true if rate limited, false otherwise
   */
  const checkAndHandleRateLimit = useCallback((response: Response): boolean => {
    if (response.status === 429) {
      handleRateLimit(response);
      return true;
    }
    return false;
  }, [handleRateLimit]);

  return {
    ...state,
    handleRateLimit,
    clearRateLimit,
    checkAndHandleRateLimit,
  };
}

/**
 * S-15.1: Rate Limit Alert Component Props
 */
export interface RateLimitAlertProps {
  message: string;
  className?: string;
}
