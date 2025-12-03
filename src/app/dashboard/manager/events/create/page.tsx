'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

/**
 * Create Event page
 * Allows managers to create new events with details and points budget
 * Events are unpublished by default, and the creator is added as an organizer
 */
export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [capacity, setCapacity] = useState('');
  const [points, setPoints] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!name.trim() || !description.trim() || !location.trim() || !startTime || !endTime || !points) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Validate points budget
    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid points budget' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setError('');

    try {
      const body: any = {
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        points: pointsValue,
      };

      if (capacity) {
        body.capacity = parseInt(capacity);
      }

      await api.post('/events', body);

      setMessage({ type: 'success', text: 'Event created successfully!' });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/manager/events');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create event' });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/manager/events')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Events
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

        {/* Form Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Event</h1>
            <p className="text-sm text-gray-600 mb-6">
              Create a new event. The event will be unpublished by default and you will be added as an organizer.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Welcome Week Social"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the event..."
                  rows={4}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Bahen Centre BA2185"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              {/* Capacity (Optional) */}
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity (Optional)
                </label>
                <input
                  type="number"
                  id="capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 50"
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of attendees. Leave blank for unlimited capacity.
                </p>
              </div>

              {/* Points Budget */}
              <div>
                <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                  Points Budget <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="points"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="e.g., 1000"
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Total points available to award to attendees
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/manager/events')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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