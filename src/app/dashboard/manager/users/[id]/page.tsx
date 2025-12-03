'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { User } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Manager User Detail page
 * Allows managers to view and edit individual user details, verify users, and change roles
 */
export default function ManagerUserDetailPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    email: '',
  });

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, [userId]);

  // Fetch user details from API
  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch basic user data
      const response = await api.get<User>(`/users/${userId}`);
      const userData = response.data;

      // Fetch suspicious status separately
      try {
        const suspiciousResponse = await api.get<{ suspicious: boolean }>(`/users/${userId}/suspicious`);
        userData.suspicious = suspiciousResponse.data.suspicious;
      } catch (err) {
        userData.suspicious = false;
      }

      setUser(userData);
      setEditData({
        email: userData.email,
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch user');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update user email
  const handleUpdateUser = async () => {
    if (!user) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.patch(`/users/${user.id}`, {
        email: editData.email,
      });

      setMessage({ type: 'success', text: 'User updated successfully!' });
      setEditMode(false);
      await fetchUser();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update user',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user verification status
  const handleToggleVerified = async () => {
    if (!user) return;

    setActionLoading(true);
    setMessage(null);

    try {
      if (user.verified) {
        // Users cannot be unverified
        setMessage({ 
          type: 'error', 
          text: 'Cannot unverify users. Users can only be verified, not unverified.' 
        });
      } else {
        await api.patch(`/users/${user.id}`, {
          verified: true,
        });
        setMessage({ type: 'success', text: 'User verified successfully!' });
        await fetchUser();
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update verification status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Change user role
  const handlePromoteUser = async (newRole: string) => {
    if (!user) return;

    if (!window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.patch(`/users/${user.id}`, {
        role: newRole,
      });

      setMessage({ type: 'success', text: `User role changed to ${newRole} successfully!` });
      await fetchUser();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to change user role',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle suspicious status (for cashiers/managers)
  const handleToggleSuspicious = async () => {
    if (!user) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.patch(`/users/${user.id}`, {
        suspicious: !user.suspicious,
      });

      setMessage({ 
        type: 'success', 
        text: user.suspicious ? 'User unmarked as suspicious!' : 'User marked as suspicious!' 
      });
      await fetchUser();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update suspicious status',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get badge color based on role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superuser':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'cashier':
        return 'bg-blue-100 text-blue-800';
      case 'regular':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if current user can promote target user to specific role
  const canPromoteTo = (role: string) => {
    if (!user || !currentUser) return false;

    // Cannot promote yourself
    if (user.id === currentUser.id) return false;

    // Superusers can promote anyone to any role (except same role)
    if (currentUser.role === 'superuser') {
      return role !== user.role;
    }

    // Managers can only promote between regular and cashier
    if (currentUser.role === 'manager') {
      return (user.role === 'regular' && role === 'cashier') || 
             (user.role === 'cashier' && role === 'regular');
    }

    return false;
  };

  if (!currentUser) return null;

  // Restrict access to manager and superuser roles
  if (currentUser.role !== 'manager' && currentUser.role !== 'superuser') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Access Denied</h2>
            <p className="text-sm text-red-700">
              You must be a manager or higher to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => router.push('/dashboard/manager/users')}
              className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
            >
              ← Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/manager/users')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Users
        </button>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mb-6 rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* User Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with Avatar and Badges */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                {user.avatarUrl ? (
                  <img className="h-20 w-20 rounded-full" src={user.avatarUrl} alt="" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-indigo-600 flex items-center justify-center">
                    <span className="text-white font-medium text-3xl">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-sm text-gray-500">{user.utorid}</p>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                {user.verified ? (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Verified
                  </span>
                ) : (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Unverified
                  </span>
                )}
                {user.suspicious && (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                    Suspicious
                  </span>
                )}
              </div>
            </div>

            {/* User Information - Edit Mode or View Mode */}
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateUser}
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditData({
                        email: user.email,
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Birthday</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.birthday ? format(new Date(user.birthday), 'MMMM dd, yyyy') : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Points</dt>
                    <dd className="mt-1 text-sm font-bold text-indigo-600">{user.points}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'MMMM dd, yyyy h:mm a') : 'Never'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Actions Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Actions</h2>

            <div className="space-y-4">
              {/* Verify User Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Verification Status</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {user.verified 
                    ? 'This user is verified and can transfer/redeem points. Note: Users cannot be unverified once verified.'
                    : 'Verified users can transfer and redeem points.'}
                </p>
                {!user.verified && (
                  <button
                    onClick={handleToggleVerified}
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Verify User
                  </button>
                )}
              </div>

              {/* Mark as Suspicious Section (only for cashiers and above) */}
              {(user.role === 'cashier' || user.role === 'manager' || user.role === 'superuser') && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Suspicious Status</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Mark this user as suspicious if their transactions should not award points automatically.
                    {user.suspicious && " Currently marked as suspicious - their transactions won't award points."}
                  </p>
                  <button
                    onClick={handleToggleSuspicious}
                    disabled={actionLoading}
                    className={`${
                      user.suspicious 
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                        : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                    } text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                  >
                    {user.suspicious ? 'Unmark as Suspicious' : 'Mark as Suspicious'}
                  </button>
                </div>
              )}

              {/* Change User Role Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Change User Role</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Change the user's role to grant or revoke permissions.
                </p>
                <div className="flex flex-wrap gap-2">
                  {canPromoteTo('regular') && (
                    <button
                      onClick={() => handlePromoteUser('regular')}
                      disabled={actionLoading}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Set to Regular
                    </button>
                  )}
                  {canPromoteTo('cashier') && (
                    <button
                      onClick={() => handlePromoteUser('cashier')}
                      disabled={actionLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Promote to Cashier
                    </button>
                  )}
                  {canPromoteTo('manager') && (
                    <button
                      onClick={() => handlePromoteUser('manager')}
                      disabled={actionLoading}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                      Promote to Manager
                    </button>
                  )}
                  {canPromoteTo('superuser') && (
                    <button
                      onClick={() => handlePromoteUser('superuser')}
                      disabled={actionLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Promote to Superuser
                    </button>
                  )}
                  {!canPromoteTo('regular') && !canPromoteTo('cashier') && !canPromoteTo('manager') && !canPromoteTo('superuser') && (
                    <p className="text-sm text-gray-500">
                      {user.id === currentUser.id
                        ? "You cannot change your own role."
                        : currentUser.role === 'manager'
                        ? "You can only manage regular and cashier roles."
                        : "No role change options available for this user."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}