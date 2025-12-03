'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Event, PaginatedResponse } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Manager Event Management page
 * Displays all events with filtering and allows creation/editing
 */
export default function ManagerEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(20);

  // Filter state
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');

  // Fetch events when page or filters change
  useEffect(() => {
    fetchEvents();
  }, [currentPage, nameFilter, locationFilter, publishedFilter]);

  // Fetch events from API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        page: currentPage,
        limit: limit,
      };

      if (nameFilter) {
        params.name = nameFilter;
      }

      if (locationFilter) {
        params.location = locationFilter;
      }

      if (publishedFilter) {
        params.published = publishedFilter === 'true';
      }

      const response = await api.get<PaginatedResponse<Event>>('/events', { params });

      setEvents(response.data.results);
      setTotalCount(response.data.count);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Determine event status based on time
  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= start && now <= end) {
      return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Past', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  if (!user) return null;

  // Restrict access to manager and superuser roles
  if (user.role !== 'manager' && user.role !== 'superuser') {
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create, edit, and manage events
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/manager/events/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Event
          </Link>
          <Link
            href="/dashboard/manager"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
          >
            ← Back to Manager Dashboard
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Name Search */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              id="name"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Location Search */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by location"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Published Status Filter */}
          <div>
            <label htmlFor="published" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="published"
              value={publishedFilter}
              onChange={(e) => {
                setPublishedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setNameFilter('');
                setLocationFilter('');
                setPublishedFilter('');
                setCurrentPage(1);
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No events found</p>
        </div>
      ) : (
        <>
          {/* Events Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => {
                    const status = getEventStatus(event);

                    return (
                      <tr key={event.id} className="hover:bg-gray-50">
                        {/* Event Name */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{event.name}</div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.location}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(event.startTime), 'MMM dd, yyyy')}
                        </td>

                        {/* Guest Count */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {event.numGuests || 0}{event.capacity ? ` / ${event.capacity}` : ''}
                        </td>

                        {/* Status Badges */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1 items-start">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                              {status.label}
                            </span>
                            {event.published ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Published
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Unpublished
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Manage Link */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/dashboard/manager/events/${event.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * limit, totalCount)}
                </span>{' '}
                of <span className="font-medium">{totalCount}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}