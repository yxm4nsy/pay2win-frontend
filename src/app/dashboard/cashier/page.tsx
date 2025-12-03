'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

/**
 * Cashier Dashboard page
 * Provides access to cashier functions: creating purchases and processing redemptions
 */
export default function CashierPage() {
  const { user } = useAuth();

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage customer transactions and process redemptions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Register New Customer Card */}
        <Link href="/dashboard/cashier/register" className="h-full">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start">
                <div className="shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Register New Customer
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      Create a new account for a customer
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Create Purchase Transaction Card */}
        <Link href="/dashboard/cashier/purchase" className="h-full">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start">
                <div className="shrink-0 bg-green-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Create Purchase
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      Process customer purchases and award points
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Process Redemption Card */}
        <Link href="/dashboard/cashier/redemption" className="h-full">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start">
                <div className="shrink-0 bg-red-500 rounded-md p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Process Redemption
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      Redeem customer points for rewards
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}