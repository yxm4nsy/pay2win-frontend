'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

type ResetPasswordClientProps = {
  initialToken: string;
};

/**
 * Password Reset page UI & logic (client component)
 * Uses an initial token passed from the server page
 */
export default function ResetPasswordClient({ initialToken }: ResetPasswordClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false); 
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    resetToken: initialToken || '',
    utorid: '',
    password: '',
    confirmPassword: '',
  });

  // Password requirements
  const passwordRequirements = [
    { text: '8-20 characters long', regex: /^.{8,20}$/ },
    { text: 'At least one uppercase letter', regex: /[A-Z]/ },
    { text: 'At least one lowercase letter', regex: /[a-z]/ },
    { text: 'At least one number', regex: /\d/ },
    { text: 'At least one special character (@$!%*?&)', regex: /[@$!%*?&]/ },
  ];

  // Check which requirements are met
  const getPasswordValidation = (password: string) => {
    return passwordRequirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }));
  };

  const passwordValidation = getPasswordValidation(formData.password);
  const allRequirementsMet = passwordValidation.every((req) => req.met);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate all requirements met
    if (!allRequirementsMet) {
      setMessage({ type: 'error', text: 'Password does not meet all requirements' });
      setLoading(false);
      return;
    }

    // Validate reset token provided
    if (!formData.resetToken.trim()) {
      setMessage({ type: 'error', text: 'Reset token is required' });
      setLoading(false);
      return;
    }

    try {
      await api.post(`/auth/resets/${formData.resetToken}`, {
        utorid: formData.utorid.trim(),
        password: formData.password,
      });

      setMessage({
        type: 'success',
        text: 'Password set successfully! Redirecting to login...',
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to reset password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your UTORid and create a new password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Success/Error Message */}
          {message && (
            <div
              className={`mb-6 rounded-md p-4 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reset Token Input */}
            <div>
              <label htmlFor="resetToken" className="block text-sm font-medium text-gray-700">
                Reset Token <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="resetToken"
                value={formData.resetToken}
                onChange={(e) => setFormData({ ...formData, resetToken: e.target.value })}
                placeholder="Enter your reset token"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Token provided by the cashier or sent to your email
              </p>
            </div>

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
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                required
              />
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="rounded-md bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h4>
                <ul className="space-y-1">
                  {passwordValidation.map((req, index) => (
                    <li key={index} className="flex items-center text-sm">
                      {req.met ? (
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allRequirementsMet}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
