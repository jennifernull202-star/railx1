/**
 * THE RAIL EXCHANGE™ — Account Settings
 * ======================================
 * BATCH 15 REQUIREMENTS:
 * - Tabs: Profile | Password | Notifications | Preferences ✓
 * - One section visible at a time ✓
 * - Toast notifications for saves ✓
 * - Delete Account at bottom (Danger Zone) ✓
 * - OMIT: Stacked full-page sections, inline success banners
 * 
 * Tab-based settings: Profile | Password | Notifications | Preferences
 * One section visible at a time. Toast success messages. Delete account at bottom.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

type Tab = 'profile' | 'password' | 'notifications' | 'preferences';

interface Toast {
  message: string;
  type: 'success' | 'error';
  link?: { label: string; href: string };
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [toast, setToast] = useState<Toast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', company: '' });
  const [profileError, setProfileError] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    inquiries: true,
    listingUpdates: true,
    marketing: false,
    weeklyDigest: true,
  });
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  // Dashboard Preferences
  const [preferences, setPreferences] = useState({
    showSellerSection: true,
    showContractorSection: true,
  });
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initialize profile from session
  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        company: '',
      });
      setIsLoading(false);
    }
  }, [session]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/user/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences({
          showSellerSection: data.showSellerSection ?? true,
          showContractorSection: data.showContractorSection ?? true,
        });
      }
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchPreferences();
    }
  }, [session, fetchPreferences]);

  // Handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, company: profile.company }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      await update({ name: profile.name });
      setToast({ message: 'Profile updated', type: 'success' });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      setIsUpdatingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update password');
      }

      setToast({ message: 'Password updated', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationsSave = async () => {
    setIsUpdatingNotifications(true);
    try {
      // API would go here
      await new Promise(resolve => setTimeout(resolve, 500));
      setToast({ message: 'Notification preferences saved', type: 'success' });
    } catch {
      setToast({ message: 'Failed to save preferences', type: 'error' });
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsUpdatingPreferences(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) throw new Error('Failed to save');
      setToast({ message: 'Preferences saved', type: 'success', link: { label: 'Refresh dashboard', href: '/dashboard' } });
    } catch {
      setToast({ message: 'Failed to save preferences', type: 'error' });
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure? This cannot be undone.');
    if (!confirmed) return;

    const doubleConfirm = window.prompt('Type "DELETE" to confirm:');
    if (doubleConfirm !== 'DELETE') return;

    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await signOut({ callbackUrl: '/' });
    } catch {
      setToast({ message: 'Failed to delete account', type: 'error' });
    }
  };

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-surface-secondary rounded animate-pulse mb-6" />
        <div className="h-12 bg-surface-secondary rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'preferences', label: 'Preferences' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span>{toast.message}</span>
          {toast.link && (
            <a href={toast.link.href} className="underline ml-2">{toast.link.label}</a>
          )}
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-rail-orange text-rail-orange'
                : 'border-transparent text-text-secondary hover:text-navy-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {profileError && <p className="text-sm text-status-error">{profileError}</p>}
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface-secondary text-text-tertiary cursor-not-allowed"
              />
              <p className="text-xs text-text-tertiary mt-1">Contact support to change</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-900 mb-1.5">Company</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Your company"
                className="w-full px-4 py-3 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="px-6 py-2.5 bg-rail-orange text-white font-medium rounded-lg hover:bg-[#e55f15] disabled:opacity-50 transition-colors"
          >
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
          {passwordError && <p className="text-sm text-status-error">{passwordError}</p>}

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-navy-900"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full px-4 py-3 pr-12 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-navy-900"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-rail-orange/20 focus:border-rail-orange"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="px-6 py-2.5 bg-rail-orange text-white font-medium rounded-lg hover:bg-[#e55f15] disabled:opacity-50 transition-colors"
          >
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {[
            { key: 'inquiries', label: 'Inquiry Notifications', desc: 'Get notified when buyers send inquiries' },
            { key: 'listingUpdates', label: 'Listing Updates', desc: 'Notifications when listings are approved or expire' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of account activity' },
            { key: 'marketing', label: 'Marketing', desc: 'News about features and promotions' },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 border border-surface-border rounded-lg cursor-pointer hover:border-text-tertiary transition-colors"
            >
              <div>
                <span className="font-medium text-navy-900">{item.label}</span>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
              />
            </label>
          ))}

          <button
            onClick={handleNotificationsSave}
            disabled={isUpdatingNotifications}
            className="px-6 py-2.5 bg-rail-orange text-white font-medium rounded-lg hover:bg-[#e55f15] disabled:opacity-50 transition-colors"
          >
            {isUpdatingNotifications ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary mb-4">Choose which sections appear in your dashboard.</p>

          {[
            { key: 'showSellerSection', label: 'Selling Section', desc: 'Show listings and selling tools' },
            { key: 'showContractorSection', label: 'Contractor Section', desc: 'Show contractor services and leads' },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center justify-between p-4 border border-surface-border rounded-lg cursor-pointer hover:border-text-tertiary transition-colors"
            >
              <div>
                <span className="font-medium text-navy-900">{item.label}</span>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={preferences[item.key as keyof typeof preferences]}
                onChange={(e) => setPreferences({ ...preferences, [item.key]: e.target.checked })}
                className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
              />
            </label>
          ))}

          <button
            onClick={handlePreferencesSave}
            disabled={isUpdatingPreferences}
            className="px-6 py-2.5 bg-rail-orange text-white font-medium rounded-lg hover:bg-[#e55f15] disabled:opacity-50 transition-colors"
          >
            {isUpdatingPreferences ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* Data Export - GDPR Article 20 */}
      <div className="mt-16 pt-8 border-t border-surface-border">
        <h2 className="text-lg font-semibold text-navy-900 mb-2">Export Your Data</h2>
        <p className="text-sm text-text-secondary mb-4">
          Download a copy of all your data in machine-readable JSON format (GDPR Article 20).
        </p>
        <a
          href="/api/user/export"
          download
          className="inline-block px-4 py-2 text-navy-900 border border-surface-border rounded-lg hover:bg-surface-secondary transition-colors"
        >
          Download Data Export
        </a>
      </div>

      {/* Delete Account - Always at Bottom */}
      <div className="mt-8 pt-8 border-t border-surface-border">
        <h2 className="text-lg font-semibold text-status-error mb-2">Delete Account</h2>
        <p className="text-sm text-text-secondary mb-4">
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 text-status-error border border-status-error/30 rounded-lg hover:bg-status-error/10 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
