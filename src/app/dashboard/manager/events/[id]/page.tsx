'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Event, User } from '@/types';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Manager Event Detail page
 * Allows managers to view, edit, publish, delete events and manage organizers/guests
 */
export default function EventDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    points: '',
  });

  // Add organizer state
  const [showAddOrganizer, setShowAddOrganizer] = useState(false);
  const [newOrganizerUtorid, setNewOrganizerUtorid] = useState('');

  // Add guest state
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuestUtorid, setNewGuestUtorid] = useState('');

  // Helper function to format date for datetime-local input (preserves local timezone)
  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch event on mount
  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  // Fetch event details from API
  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get<any>(`/events/${eventId}`);
      setEvent(response.data);

      // Format dates for datetime-local input (preserves local timezone)
      const startTimeFormatted = response.data.startTime
        ? formatDateTimeLocal(response.data.startTime)
        : '';
      const endTimeFormatted = response.data.endTime
        ? formatDateTimeLocal(response.data.endTime)
        : '';

      setEditData({
        name: response.data.name,
        description: response.data.description,
        location: response.data.location,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        capacity: response.data.capacity?.toString() || '',
        points: response.data.pointsTotal?.toString() || response.data.pointsRemain?.toString() || '',
      });

      // Set organizers from response
      if (response.data.organizers) {
        setOrganizers(response.data.organizers);
      }
      
      // Fetch full guest details
      await fetchGuests();
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Event not found');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch event');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch guest list
  const fetchGuests = async () => {
    try {
      const response = await api.get<any[]>(`/events/${eventId}/guests`);
      setGuests(response.data);
    } catch (err: any) {
      setGuests([]);
    }
  };

  // Update event details
  const handleUpdateEvent = async () => {
    if (!event) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const body: any = {
        name: editData.name,
        description: editData.description,
        location: editData.location,
        startTime: new Date(editData.startTime).toISOString(),
        endTime: new Date(editData.endTime).toISOString(),
        points: parseInt(editData.points),
      };

      if (editData.capacity) {
        body.capacity = parseInt(editData.capacity);
      }

      await api.patch(`/events/${event.id}`, body);

      setMessage({ type: 'success', text: 'Event updated successfully!' });
      setEditMode(false);
      await fetchEvent();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to update event',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Publish event
  const handlePublishEvent = async () => {
    if (!event) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.patch(`/events/${event.id}`, {
        published: true,
      });

      setMessage({
        type: 'success',
        text: 'Event published!',
      });
      await fetchEvent();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to publish event',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete event (unpublished only)
  const handleDeleteEvent = async () => {
    if (!event) return;

    if (event.published) {
      setMessage({ type: 'error', text: 'Cannot delete a published event. Unpublish it first.' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the event "${event.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.delete(`/events/${event.id}`);
      setMessage({ type: 'success', text: 'Event deleted successfully!' });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/manager/events');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to delete event',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Add organizer by UTORid
  const handleAddOrganizer = async () => {
    if (!event || !newOrganizerUtorid.trim()) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post(`/events/${event.id}/organizers`, {
        utorid: newOrganizerUtorid.trim(),
      });

      setMessage({ type: 'success', text: 'Organizer added successfully!' });
      setNewOrganizerUtorid('');
      setShowAddOrganizer(false);
      await fetchEvent();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to add organizer',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove organizer
  const handleRemoveOrganizer = async (userId: number) => {
    if (!event) return;

    const organizer = organizers.find(o => o.id === userId);
    if (!organizer) return;

    if (!window.confirm(`Are you sure you want to remove ${organizer.utorid} as an organizer?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.delete(`/events/${event.id}/organizers/${userId}`);

      setMessage({ type: 'success', text: 'Organizer removed successfully!' });
      await fetchEvent();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to remove organizer',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Add guest by UTORid
  const handleAddGuest = async () => {
    if (!event || !newGuestUtorid.trim()) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post(`/events/${event.id}/guests`, {
        utorid: newGuestUtorid.trim(),
      });

      setMessage({ type: 'success', text: 'Guest added successfully!' });
      setNewGuestUtorid('');
      setShowAddGuest(false);
      await fetchGuests();
      await fetchEvent();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to add guest',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Remove guest by user ID
  const handleRemoveGuest = async (userId: number, utorid: string) => {
    if (!event) return;

    if (!window.confirm(`Are you sure you want to remove ${utorid} from the guest list?`)) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      await api.delete(`/events/${event.id}/guests/${userId}`);

      setMessage({ type: 'success', text: 'Guest removed successfully!' });
      await fetchGuests();
      await fetchEvent();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to remove guest',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Determine event status based on time
  const getEventStatus = (evt: Event) => {
    const now = new Date();
    const start = new Date(evt.startTime);
    const end = new Date(evt.endTime);

    if (now < start) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= start && now <= end) {
      return { label: 'Ongoing', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Past', color: 'bg-gray-100 text-gray-800' };
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
              onClick={() => router.push('/dashboard/manager/events')}
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-5xl mx-auto">
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

        {/* Event Details Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            {/* Header with name and badges */}
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <div className="flex space-x-2">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${status.color}`}>
                  {status.label}
                </span>
                {event.published ? (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Published
                  </span>
                ) : (
                  <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Unpublished
                  </span>
                )}
              </div>
            </div>

            {/* Edit Mode or View Mode */}
            {editMode ? (
              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Location Input */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Start Time Input */}
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={editData.startTime}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* End Time Input */}
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={editData.endTime}
                    onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Capacity Input */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Capacity
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    value={editData.capacity}
                    onChange={(e) => setEditData({ ...editData, capacity: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Points Budget Input */}
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                    Points Budget
                  </label>
                  <input
                    type="number"
                    id="points"
                    value={editData.points}
                    onChange={(e) => setEditData({ ...editData, points: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdateEvent}
                    disabled={actionLoading}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      fetchEvent();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Description */}
                <p className="text-gray-700 mb-6">{event.description}</p>

                {/* Event Details Grid */}
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{event.location}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {guests.length}{event.capacity ? ` / ${event.capacity}` : ' / Unlimited'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(event.startTime), 'EEEE, MMMM dd, yyyy h:mm a')}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(event.endTime), 'EEEE, MMMM dd, yyyy h:mm a')}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Points Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className="font-bold text-indigo-600">
                        {event.pointsRemain || 0} / {event.pointsTotal || 0}
                      </span>
                      <span className="text-gray-500 ml-2">
                        ({event.pointsAwarded || 0} awarded)
                      </span>
                    </dd>
                  </div>
                </dl>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Event
                  </button>
                  {!event.published && (
                    <>
                      <button
                        onClick={handlePublishEvent}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        Publish Event
                      </button>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={actionLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        Delete Event
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Organizers Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Organizers ({organizers.length})</h2>
              <button
                onClick={() => setShowAddOrganizer(!showAddOrganizer)}
                className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
              >
                Add Organizer
              </button>
            </div>

            {/* Add Organizer Form */}
            {showAddOrganizer && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newOrganizerUtorid}
                    onChange={(e) => setNewOrganizerUtorid(e.target.value)}
                    placeholder="Enter UTORid"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                  <button
                    onClick={handleAddOrganizer}
                    disabled={actionLoading || !newOrganizerUtorid.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddOrganizer(false);
                      setNewOrganizerUtorid('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Organizers List */}
            {organizers.length === 0 ? (
              <p className="text-sm text-gray-500">No organizers yet</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {organizers.map((org) => (
                  <li key={org.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      {org.avatarUrl ? (
                        <img className="h-8 w-8 rounded-full" src={org.avatarUrl} alt="" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-500">{org.utorid}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveOrganizer(org.id)}
                      disabled={actionLoading}
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Guests Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Guests ({guests.length})</h2>
              <button
                onClick={() => setShowAddGuest(!showAddGuest)}
                className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
              >
                Add Guest
              </button>
            </div>

            {/* Add Guest Form */}
            {showAddGuest && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newGuestUtorid}
                    onChange={(e) => setNewGuestUtorid(e.target.value)}
                    placeholder="Enter UTORid"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  />
                  <button
                    onClick={handleAddGuest}
                    disabled={actionLoading || !newGuestUtorid.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddGuest(false);
                      setNewGuestUtorid('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Guests List */}
            {guests.length === 0 ? (
              <p className="text-sm text-gray-500">No guests yet</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {guests.map((guest) => (
                  <li key={guest.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {guest.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{guest.name}</p>
                        <p className="text-xs text-gray-500">{guest.utorid}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuest(guest.id, guest.utorid)}
                      disabled={actionLoading}
                      className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}