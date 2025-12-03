'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * Main dashboard page for authenticated users
 * Displays user info, points balance, QR code, and quick action links
 */
export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Info Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Welcome, {user.name}!
            </h3>
            <div className="mt-5 border-t border-gray-200 pt-5">
              <dl className="divide-y divide-gray-200">
                {/* UTORid */}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">UTORid</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.utorid}
                  </dd>
                </div>

                {/* Email */}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.email}
                  </dd>
                </div>

                {/* Role */}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user.role}
                    </span>
                  </dd>
                </div>

                {/* Verification Status */}
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Verified</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.verified ? (
                      <span className="text-green-600">✓ Verified</span>
                    ) : (
                      <span className="text-yellow-600">⚠ Not Verified</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Edit Profile Button */}
            <div className="mt-5">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Your Points
            </h3>

            {/* Points Display */}
            <div className="mt-5 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-indigo-600">{user.points}</p>
                <p className="mt-2 text-sm text-gray-500">Available Points</p>
              </div>
            </div>

            {/* Points Action Buttons */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link
                href="/dashboard/transfer"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Transfer Points
              </Link>
              <Link
                href="/dashboard/redeem"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Redeem Points
              </Link>
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your QR Code
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Show this QR code to cashiers for purchases and point transfers
            </p>
            
            {/* QR Code Display */}
            <div className="flex justify-center">
              <QRCodeCanvas value={user.utorid} size={200} />
            </div>
            
            <p className="mt-4 text-center text-sm text-gray-500">
              UTORid: {user.utorid}
            </p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/transactions"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Transaction History
              </Link>
              <Link
                href="/dashboard/events"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse Events
              </Link>
              <Link
                href="/dashboard/promotions"
                className="block w-full text-left px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Promotions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}