/**
 * THE RAIL EXCHANGE™ — Account Settings
 * 
 * User profile settings, notifications, and account management.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();

  // Profile State
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState({
    inquiries: true,
    listingUpdates: true,
    marketing: false,
    weeklyDigest: true,
  });

  // Initialize profile from session
  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        company: '',
      });
    }
  }, [session]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          company: profile.company,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update session
      await update({ name: profile.name });
      setProfileSuccess('Profile updated successfully!');
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
    setPasswordSuccess('');

    // Validate
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
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your listings will be removed.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }

    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete account');
      }

      await signOut({ callbackUrl: '/' });
    } catch {
      alert('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="heading-xl mb-2">Settings</h1>
        <p className="text-body-md text-text-secondary">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Settings */}
      <section className="bg-white rounded-2xl border border-surface-border p-6 mb-8">
        <h2 className="heading-md mb-6">Profile Information</h2>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {profileSuccess && (
            <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-status-success font-medium">{profileSuccess}</p>
            </div>
          )}

          {profileError && (
            <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-status-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-status-error">{profileError}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-body-sm font-medium text-navy-900 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-body-sm font-medium text-navy-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="input-field bg-surface-secondary cursor-not-allowed"
              />
              <p className="text-caption text-text-tertiary mt-1">
                Contact support to change your email
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-body-sm font-medium text-navy-900 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="input-field"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-body-sm font-medium text-navy-900 mb-2">
                Company Name
              </label>
              <input
                id="company"
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="input-field"
                placeholder="Your company"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="btn-primary min-w-[140px]"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Password Settings */}
      <section className="bg-white rounded-2xl border border-surface-border p-6 mb-8">
        <h2 className="heading-md mb-6">Change Password</h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          {passwordSuccess && (
            <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-status-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-status-success font-medium">{passwordSuccess}</p>
            </div>
          )}

          {passwordError && (
            <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-status-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-status-error">{passwordError}</p>
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-body-sm font-medium text-navy-900 mb-2">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field max-w-md"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label htmlFor="newPassword" className="block text-body-sm font-medium text-navy-900 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-body-sm font-medium text-navy-900 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="btn-primary min-w-[160px]"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Email Notifications */}
      <section className="bg-white rounded-2xl border border-surface-border p-6 mb-8">
        <h2 className="heading-md mb-6">Email Notifications</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-surface-tertiary cursor-pointer transition-colors">
            <div>
              <span className="text-body-md font-medium text-navy-900">Inquiry Notifications</span>
              <p className="text-caption text-text-secondary mt-1">
                Get notified when buyers send inquiries about your listings
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications.inquiries}
              onChange={(e) =>
                setEmailNotifications({ ...emailNotifications, inquiries: e.target.checked })
              }
              className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-surface-tertiary cursor-pointer transition-colors">
            <div>
              <span className="text-body-md font-medium text-navy-900">Listing Updates</span>
              <p className="text-caption text-text-secondary mt-1">
                Get notified when your listings are approved, expire, or need attention
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications.listingUpdates}
              onChange={(e) =>
                setEmailNotifications({ ...emailNotifications, listingUpdates: e.target.checked })
              }
              className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-surface-tertiary cursor-pointer transition-colors">
            <div>
              <span className="text-body-md font-medium text-navy-900">Weekly Digest</span>
              <p className="text-caption text-text-secondary mt-1">
                Receive a weekly summary of your account activity and marketplace insights
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications.weeklyDigest}
              onChange={(e) =>
                setEmailNotifications({ ...emailNotifications, weeklyDigest: e.target.checked })
              }
              className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl border border-surface-border hover:border-surface-tertiary cursor-pointer transition-colors">
            <div>
              <span className="text-body-md font-medium text-navy-900">Marketing & Promotions</span>
              <p className="text-caption text-text-secondary mt-1">
                Receive news about new features, promotions, and marketplace updates
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications.marketing}
              onChange={(e) =>
                setEmailNotifications({ ...emailNotifications, marketing: e.target.checked })
              }
              className="w-5 h-5 rounded border-surface-border text-rail-orange focus:ring-rail-orange/20"
            />
          </label>
        </div>

        <div className="flex justify-end mt-6">
          <button className="btn-secondary">
            Save Preferences
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl border border-status-error/30 p-6">
        <h2 className="heading-md text-status-error mb-4">Danger Zone</h2>
        <p className="text-body-md text-text-secondary mb-6">
          Deleting your account is permanent and cannot be undone. All your listings, inquiries, and account data will be permanently removed.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-6 py-3 bg-status-error/10 text-status-error font-medium rounded-xl hover:bg-status-error/20 transition-colors"
        >
          Delete Account
        </button>
      </section>
    </div>
  );
}
