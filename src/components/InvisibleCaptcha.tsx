/**
 * THE RAIL EXCHANGE™ — Invisible reCAPTCHA Component
 * 
 * S-15.3: CAPTCHA placement for abuse prevention.
 * 
 * Uses reCAPTCHA v3 (invisible) by default, shows v2 challenge
 * only after repeated failures.
 * 
 * Requirements:
 * - Invisible by default (v3)
 * - Never appears on first interaction
 * - Shows challenge only after threshold exceeded
 * - Clear copy explaining why it appeared
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Script from 'next/script';

// reCAPTCHA site key from environment
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export interface CaptchaProps {
  /**
   * Action name for reCAPTCHA v3 analytics
   */
  action?: string;
  /**
   * Callback when CAPTCHA is solved
   */
  onVerify: (token: string) => void;
  /**
   * Show visible CAPTCHA challenge (v2 style)
   * Only set to true after repeated failures
   */
  showChallenge?: boolean;
  /**
   * Reason for showing CAPTCHA (displayed to user)
   */
  challengeReason?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * S-15.3: Hook to track failed attempts and determine if CAPTCHA should show
 */
export function useCaptchaThreshold(key: string, threshold: number = 3) {
  const [attempts, setAttempts] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);

  // Load attempts from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(`captcha_attempts_${key}`);
    if (stored) {
      const count = parseInt(stored, 10);
      setAttempts(count);
      setShowChallenge(count >= threshold);
    }
  }, [key, threshold]);

  const incrementAttempts = useCallback(() => {
    setAttempts(prev => {
      const newCount = prev + 1;
      sessionStorage.setItem(`captcha_attempts_${key}`, String(newCount));
      if (newCount >= threshold) {
        setShowChallenge(true);
      }
      return newCount;
    });
  }, [key, threshold]);

  const resetAttempts = useCallback(() => {
    setAttempts(0);
    setShowChallenge(false);
    sessionStorage.removeItem(`captcha_attempts_${key}`);
  }, [key]);

  return { attempts, showChallenge, incrementAttempts, resetAttempts };
}

/**
 * S-15.3: Invisible reCAPTCHA Component
 * 
 * By default, runs reCAPTCHA v3 invisibly.
 * When showChallenge is true, displays a visible challenge box.
 */
export function InvisibleCaptcha({
  action = 'submit',
  onVerify,
  showChallenge = false,
  challengeReason,
  className = '',
}: CaptchaProps) {
  const captchaRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Execute invisible reCAPTCHA v3
  const executeV3 = useCallback(async () => {
    if (!RECAPTCHA_SITE_KEY) {
      // Development mode - provide dummy token
      if (process.env.NODE_ENV === 'development') {
        onVerify('dev_token_' + Date.now());
        return;
      }
      console.warn('reCAPTCHA: Site key not configured');
      onVerify('');
      return;
    }

    try {
      // @ts-expect-error - grecaptcha is loaded from script
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      onVerify(token);
    } catch (err) {
      console.error('reCAPTCHA execution failed:', err);
      setError('Verification failed. Please try again.');
    }
  }, [action, onVerify]);

  // Auto-execute v3 when loaded and not showing challenge
  useEffect(() => {
    if (isLoaded && !showChallenge) {
      executeV3();
    }
  }, [isLoaded, showChallenge, executeV3]);

  // Render v2 checkbox when showing challenge
  useEffect(() => {
    if (showChallenge && isLoaded && captchaRef.current && RECAPTCHA_SITE_KEY) {
      try {
        // Clear previous widget
        captchaRef.current.innerHTML = '';
        
        // @ts-expect-error - grecaptcha is loaded from script
        window.grecaptcha.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => {
            onVerify(token);
            setError(null);
          },
          'error-callback': () => {
            setError('Verification failed. Please try again.');
          },
        });
      } catch (err) {
        console.error('reCAPTCHA render failed:', err);
      }
    }
  }, [showChallenge, isLoaded, onVerify]);

  // Handle script load
  const handleScriptLoad = useCallback(() => {
    // @ts-expect-error - grecaptcha is loaded from script
    if (window.grecaptcha) {
      // @ts-expect-error - grecaptcha is loaded from script
      window.grecaptcha.ready(() => {
        setIsLoaded(true);
      });
    }
  }, []);

  // Development mode - skip CAPTCHA
  if (process.env.NODE_ENV === 'development' && !RECAPTCHA_SITE_KEY) {
    return null;
  }

  // Only render visible elements when showing challenge
  if (!showChallenge) {
    return (
      <>
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          onLoad={handleScriptLoad}
          strategy="lazyOnload"
        />
      </>
    );
  }

  return (
    <div className={`captcha-container ${className}`}>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=explicit`}
        onLoad={handleScriptLoad}
        strategy="lazyOnload"
      />
      
      {/* S-15.4: Clear copy explaining why CAPTCHA appeared */}
      {challengeReason && (
        <p className="text-sm text-text-secondary mb-3">
          {challengeReason}
        </p>
      )}
      
      {/* reCAPTCHA widget container */}
      <div ref={captchaRef} className="g-recaptcha mb-3" />
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-status-error mt-2">{error}</p>
      )}
    </div>
  );
}

/**
 * S-15.3: Challenge reason messages
 */
export const CAPTCHA_REASONS = {
  REPEATED_LOGIN_FAILURES: 'Please verify you\'re not a robot to continue signing in.',
  REPEATED_SUBMISSIONS: 'Please verify you\'re not a robot to send your message.',
  SUSPICIOUS_ACTIVITY: 'Please complete this quick verification to continue.',
} as const;

export default InvisibleCaptcha;
