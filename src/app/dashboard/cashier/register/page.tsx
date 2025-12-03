'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

/**
 * Cashier Register User page
 * Allows cashiers to create new user accounts for customers
 */
export default function CashierRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    utorid: '',
    name: '',
    email: '',
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setResetToken(null);

    // Validate UTORid format (7-8 alphanumeric characters)
    const utoridRegex = /^[a-zA-Z0-9]{7,8}$/;
    if (!utoridRegex.test(formData.utorid)) {
      setMessage({ type: 'error', text: 'UTORid must be 7-8 alphanumeric characters' });
      setLoading(false);
      return;
    }

    // Validate email format (must end with @utoronto.ca or @mail.utoronto.ca)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(mail\.)?utoronto\.ca$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({ type: 'error', text: 'Email must be a valid @utoronto.ca or @mail.utoronto.ca address' });
      setLoading(false);
      return;
    }

    // Validate name length
    if (formData.name.trim().length < 1 || formData.name.trim().length > 50) {
      setMessage({ type: 'error', text: 'Name must be 1-50 characters' });
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/users', {
        utorid: formData.utorid.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
      });

      setResetToken(response.data.resetToken);
      setMessage({
        type: 'success',
        text: `Account created successfully for ${formData.utorid}! The customer will need to use the reset token below to set their password.`,
      });

      // Reset form
      setFormData({
        utorid: '',
        name: '',
        email: '',
      });
    } catch (error: any) {
      if (error.response?.status === 409) {
        setMessage({ type: 'error', text: error.response?.data?.error || 'User already exists' });
      } else if (error.response?.status === 400) {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Invalid input' });
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.error || 'Failed to create account',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Copy reset token to clipboard
  const copyToClipboard = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      setMessage({
        type: 'success',
        text: 'Reset token copied to clipboard!',
      });
    }
  };

  if (!user) return null;

  // Restrict access to cashier, manager, and superuser roles
  if (user.role !== 'cashier' && user.role !== 'manager' && user.role !== 'superuser') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-red-800 mb-2">Access Denied</h2>
            <p className="text-sm text-red-700">
              You must be a cashier or higher to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Register New Customer</h1>
        <p className="text-sm text-gray-600 mb-6">
          Create a new account for a customer at the point of sale
        </p>

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

        {/* Reset Token Display */}
        {resetToken && (
          <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Password Reset Token</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Give this token to the customer so they can set their password. This token expires in 7 days.
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-yellow-300 text-sm font-mono break-all">
                    {resetToken}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="shrink-0 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* UTORid Input */}
              <div>
                <label htmlFor="utorid" className="block text-sm font-medium text-gray-700">
                  UTORid <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="utorid"
                  value={formData.utorid}
                  onChange={(e) => setFormData({ ...formData, utorid: e.target.value })}
                  placeholder="e.g., jsmith01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                  pattern="[a-zA-Z0-9]{7,8}"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be 7-8 alphanumeric characters
                </p>
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-gray-500">
                  1-50 characters
                </p>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john.smith@mail.utoronto.ca"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be @utoronto.ca or @mail.utoronto.ca
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Account Details</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>New accounts start with 0 points</li>
                        <li>Account will be created as "regular" user</li>
                        <li>Customer receives a reset token to set their password</li>
                        <li>Reset token expires in 7 days</li>
                        <li>Customer can reset password at any time using their email</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/cashier')}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}