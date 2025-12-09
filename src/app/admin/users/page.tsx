/**
 * THE RAIL EXCHANGE™ — Admin Users Page
 * 
 * User management with search, filtering, and actions.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'contractor' | 'admin';
  isActive: boolean;
  createdAt: string;
  listingsCount?: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data: UsersResponse = await res.json();

      if (data.users) {
        setUsers(data.users);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setUsers(users.map(u => 
          u._id === userId ? { ...u, isActive: !currentStatus } : u
        ));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const getRoleBadge = (role: User['role']) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      seller: 'bg-green-100 text-green-800',
      buyer: 'bg-blue-100 text-blue-800',
      contractor: 'bg-amber-100 text-amber-800',
    };
    return styles[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-xl text-navy-900">Users</h1>
          <p className="text-body-md text-text-secondary mt-2">
            Manage all registered users
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-border p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="input-field"
            />
          </div>
          <div className="w-48">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input-field"
            >
              <option value="">All Roles</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="contractor">Contractors</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-card border border-surface-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rail-orange mx-auto" />
            <p className="mt-4 text-text-secondary">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-secondary border-b border-surface-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">User</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Role</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Status</th>
                    <th className="text-left px-6 py-4 text-body-sm font-semibold text-text-secondary">Joined</th>
                    <th className="text-right px-6 py-4 text-body-sm font-semibold text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-surface-secondary/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-body-md font-semibold text-navy-900">{user.name}</p>
                          <p className="text-body-sm text-text-secondary">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-body-sm text-text-secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/users/${user._id}`}
                            className="px-3 py-1 text-body-sm font-medium text-rail-orange hover:text-rail-orange-dark"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => toggleUserStatus(user._id, user.isActive)}
                            className={`px-3 py-1 text-body-sm font-medium ${
                              user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-surface-border">
                <p className="text-body-sm text-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn-outline py-1 px-3 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-outline py-1 px-3 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
