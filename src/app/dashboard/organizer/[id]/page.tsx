'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Event } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

interface Guest {
  id: number;
  utorid: string;
  name: string;
}

/**
 * Organizer Event Detail page
 * Allows event organizers to view event details, guest list, and award points
 */
export default function OrganizerEventDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Award points form state
  const [awardMode, setAwardMode] = useState<'all' | 'individual'>('all');
  const [selectedUtorid, setSelectedUtorid] = useState('');
  const [pointsToAward, setPointsToAward] = useState('');
  const [awardRemark, setAwardRemark] = useState('');

  // Fetch event and guests on mount
  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // Fetch event details and guest list
  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<Event>(`/events/${eventId}`);
      setEvent(response.data);
      
      // Fetch guest list
      try {
        const guestsResponse = await api.get<Guest[]>(`/events/${eventId}/guests`);
        setGuests(guestsResponse.data);
      } catch (err) {
        setGuests([]);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Event not found or you do not have permission to view it');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch event');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle awarding points to guests
  const handleAwardPoints = async () => {
    if (!event) return;

    const points = parseInt(pointsToAward);
    if (isNaN(points) || points <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid point amount' });
      return;
    }

    const pointsRemaining = event.pointsRemain ?? 0;
    const totalCost = awardMode === 'all' ? points * guests.length : points;

    // Validate sufficient points
    if (totalCost > pointsRemaining) {
      setMessage({ 
        type: 'error', 
        text: `Insufficient points. Need ${totalCost} but only ${pointsRemaining} remaining.` 
      });
      return;
    }

    // Validate guest selection for individual mode
    if (awardMode === 'individual' && !selectedUtorid) {
      setMessage({ type: 'error', text: 'Please select a guest' });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const body: any = {
        type: 'event',
        amount: points,
        remark: awardRemark,
      };

      if (awardMode === 'individual') {
        body.utorid = selectedUtorid;
      }

      await api.post(`/events/${event.id}/transactions`, body);

      setMessage({ 
        type: 'success', 
        text: awardMode === 'all' 
          ? `Successfully awarded ${points} points to all guests!`
          : `Successfully awarded ${points} points to ${selectedUtorid}!`
      });

      // Reset form
      setPointsToAward('');
      setAwardRemark('');
      setSelectedUtorid('');
      
      // Refresh event data to show updated points
      await fetchEvent();

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to award points' 
      });
    } finally {
      setActionLoading(false);
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

  if (!user) return null;

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
              onClick={() => router.push('/dashboard/organizer')}
              className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
            >
              ← Back to My Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const status = getEventStatus(event);
  const pointsRemaining = event.pointsRemain ?? 0;
  const pointsTotal = pointsRemaining + (event.pointsAwarded || 0);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/organizer')}
          className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to My Events
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

        {/* Event Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with name and status */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <span className={`ml-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">{event.description}</p>

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Event Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Location</dt>
                    <dd className="text-sm font-medium text-gray-900">{event.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Date</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {format(new Date(event.startTime), 'EEEE, MMMM dd, yyyy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Time</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Capacity</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {guests.length}{event.capacity ? ` / ${event.capacity}` : ''} attendees
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Points Budget */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Points Budget</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-gray-500">Total Budget</dt>
                    <dd className="text-sm font-medium text-gray-900">{pointsTotal} points</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Awarded</dt>
                    <dd className="text-sm font-medium text-gray-900">{event.pointsAwarded || 0} points</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Remaining</dt>
                    <dd className={`text-lg font-bold ${pointsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pointsRemaining} points
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Guests List Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Guest List ({guests.length})
            </h2>

            {guests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No guests have RSVPed yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UTORid
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {guests.map((guest) => (
                      <tr key={guest.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {guest.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {guest.utorid}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Award Points Card (only show if points available and guests exist) */}
        {pointsRemaining > 0 && guests.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Award Points</h2>

              <div className="space-y-4">
                {/* Award Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Award To
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="all"
                        checked={awardMode === 'all'}
                        onChange={(e) => setAwardMode(e.target.value as 'all')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Guests</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="individual"
                        checked={awardMode === 'individual'}
                        onChange={(e) => setAwardMode(e.target.value as 'individual')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Individual Guest</span>
                    </label>
                  </div>
                </div>

                {/* Guest Selection (shown only in individual mode) */}
                {awardMode === 'individual' && (
                  <div>
                    <label htmlFor="guest" className="block text-sm font-medium text-gray-700">
                      Select Guest
                    </label>
                    <select
                      id="guest"
                      value={selectedUtorid}
                      onChange={(e) => setSelectedUtorid(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    >
                      <option value="">Choose a guest...</option>
                      {guests.map((guest) => (
                        <option key={guest.id} value={guest.utorid}>
                          {guest.name} ({guest.utorid})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Points Amount Input */}
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                    Points per {awardMode === 'all' ? 'Guest' : 'Person'}
                  </label>
                  <input
                    type="number"
                    id="points"
                    value={pointsToAward}
                    onChange={(e) => setPointsToAward(e.target.value)}
                    placeholder="e.g., 100"
                    min="1"
                    max={awardMode === 'all' ? Math.floor(pointsRemaining / guests.length) : pointsRemaining}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                  {awardMode === 'all' && pointsToAward && (
                    <p className="mt-1 text-xs text-gray-500">
                      Total cost: {parseInt(pointsToAward) * guests.length} points
                    </p>
                  )}
                </div>

                {/* Optional Remark */}
                <div>
                  <label htmlFor="remark" className="block text-sm font-medium text-gray-700">
                    Note (Optional)
                  </label>
                  <textarea
                    id="remark"
                    value={awardRemark}
                    onChange={(e) => setAwardRemark(e.target.value)}
                    placeholder="e.g., Attendance reward"
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleAwardPoints}
                  disabled={actionLoading}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Awarding...' : 'Award Points'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}