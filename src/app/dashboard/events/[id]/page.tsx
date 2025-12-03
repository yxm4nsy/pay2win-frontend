'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Event } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Event Detail page (User view)
 * Displays event details and allows users to RSVP or cancel their RSVP
 */
export default function EventDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch event and attendance status on mount
  useEffect(() => {
    fetchEvent();
    checkAttendance();
  }, [eventId]);

  // Fetch event details from API
  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<Event>(`/events/${eventId}`);
      setEvent(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Event not found or not published');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch event');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is attending
  const checkAttendance = async () => {
    try {
      await api.get(`/events/${eventId}/guests/me`);
      setIsAttending(true);
    } catch (err: any) {
      // 404 means not attending
      if (err.response?.status === 404) {
        setIsAttending(false);
      }
    }
  };

  // Handle RSVP to event
  const handleRSVP = async () => {
    if (!event) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post(`/events/${event.id}/guests/me`);
      setMessage({ type: 'success', text: 'Successfully RSVPed to the event!' });
      
      // Refresh data
      await fetchEvent();
      await checkAttendance();
    } catch (error: any) {
      if (error.response?.status === 410) {
        setMessage({ type: 'error', text: 'Event is full or has ended' });
      } else if (error.response?.status === 400) {
        setMessage({ type: 'error', text: 'You are already on the guest list' });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to RSVP' 
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel RSVP
  const handleCancelRSVP = async () => {
    if (!event) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.delete(`/events/${event.id}/guests/me`);
      setMessage({ type: 'success', text: 'RSVP cancelled successfully' });
      
      // Refresh data
      await fetchEvent();
      await checkAttendance();
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMessage({ type: 'error', text: 'You are not on the guest list' });
      } else if (error.response?.status === 410) {
        setMessage({ type: 'error', text: 'Event has ended, cannot cancel RSVP' });
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Failed to cancel RSVP' 
        });
      }
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

  // Check if event is at capacity
  const isEventFull = (event: Event) => {
    if (!event.capacity) return false;
    
    // Handle both numGuests (regular users) and guests array (managers)
    const guestCount = event.guests && Array.isArray(event.guests) 
      ? event.guests.length 
      : (event.numGuests || 0);
    
    return guestCount >= event.capacity;
  };

  // Check if event has ended
  const hasEventEnded = (event: Event) => {
    return new Date() > new Date(event.endTime);
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
              onClick={() => router.push('/dashboard/events')}
              className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
            >
              ← Back to Events
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
  const isFull = isEventFull(event);
  const hasEnded = hasEventEnded(event);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/events')}
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

        {/* Event Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with name and status badge */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <span className={`ml-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6">{event.description}</p>

            {/* Event Details Grid */}
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Location */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 ml-7">{event.location}</dd>
                </div>

                {/* Date */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 ml-7">
                    {format(new Date(event.startTime), 'EEEE, MMMM dd, yyyy')}
                  </dd>
                </div>

                {/* Time */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 ml-7">
                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                  </dd>
                </div>

                {/* Capacity */}
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Capacity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 ml-7">
                    {event.guests && Array.isArray(event.guests) ? event.guests.length : (event.numGuests || 0)}
                    {event.capacity ? ` / ${event.capacity}` : ''} attendees
                    {isFull && <span className="ml-2 text-red-600 font-medium">(Full)</span>}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Organizers */}
            {event.organizers && event.organizers.length > 0 && (
              <div className="border-t border-gray-200 mt-6 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Organizers</h3>
                <div className="flex flex-wrap gap-2">
                  {event.organizers.map((organizer) => (
                    <span
                      key={organizer.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                    >
                      {organizer.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attending Status Banner */}
            {isAttending && (
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        You are attending this event
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RSVP Action Button */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              {isAttending ? (
                <button
                  onClick={handleCancelRSVP}
                  disabled={actionLoading || hasEnded}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Cancelling...' : hasEnded ? 'Event Ended' : 'Cancel RSVP'}
                </button>
              ) : (
                <button
                  onClick={handleRSVP}
                  disabled={actionLoading || isFull || hasEnded}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading 
                    ? 'Processing...' 
                    : hasEnded 
                    ? 'Event Ended' 
                    : isFull 
                    ? 'Event Full' 
                    : 'RSVP to Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}