import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, RefreshCw, PlusCircle, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const MODE_OPTIONS = [
  { value: 'in_person', label: 'In Person' },
  { value: 'phone', label: 'Phone' },
  { value: 'video', label: 'Video' }
];

export default function InstructorBookingManager({ lang = 'en', onInteraction }) {
  const [loading, setLoading] = useState(true);
  const [submittingSlot, setSubmittingSlot] = useState(false);
  const [submittingAdviceId, setSubmittingAdviceId] = useState('');
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [responseNotes, setResponseNotes] = useState({});
  const [adviceInputs, setAdviceInputs] = useState({});
  const [slotForm, setSlotForm] = useState({
    startAt: '',
    endAt: '',
    mode: 'in_person',
    locationText: '',
    notes: ''
  });

  const t = useMemo(() => ({
    title: lang === 'si' ? 'වෙන්කරවා ගැනීම් කළමනාකරණය' : 'Instructor Booking Manager',
    subtitle: lang === 'si' ? 'කාල විවෘත කර ගොවි වෙන්කරවා ගැනීම් කළමනාකරණය කරන්න' : 'Publish slots and handle farmer manual bookings',
    newSlot: lang === 'si' ? 'නව කාලයක්' : 'Publish New Slot',
    mySlots: lang === 'si' ? 'මගේ විවෘත කාල' : 'My Slots',
    myBookings: lang === 'si' ? 'මට පැවරුණු වෙන්කරවා ගැනීම්' : 'My Booking Requests',
    refresh: lang === 'si' ? 'යාවත්කාල' : 'Refresh',
    create: lang === 'si' ? 'ප්‍රකාශය' : 'Publish Slot',
    accept: lang === 'si' ? 'අනුමත' : 'Accept',
    reject: lang === 'si' ? 'ප්‍රතික්ෂේප' : 'Reject',
    complete: lang === 'si' ? 'සම්පූර්ණ' : 'Complete + Submit Advice',
    noSlots: lang === 'si' ? 'කාල ප්‍රකාශ නොමැත' : 'No slots published',
    noBookings: lang === 'si' ? 'වෙන්කරවා ගැනීම් නොමැත' : 'No booking requests yet'
  }), [lang]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

  const fetchData = async () => {
    const [slotRes, bookingRes] = await Promise.all([
      axios.get(`${API_BASE}/api/manual-bookings/slots/mine`, { headers }),
      axios.get(`${API_BASE}/api/manual-bookings/bookings/instructor/mine`, { headers })
    ]);

    setSlots(slotRes.data?.slots || []);
    setBookings(bookingRes.data?.bookings || []);
  };

  const refresh = async () => {
    try {
      setLoading(true);
      await fetchData();
    } catch (err) {
      console.error('Failed to load instructor booking data', err);
      alert(err.response?.data?.msg || 'Failed to load booking manager data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publishSlot = async (e) => {
    e.preventDefault();
    if (!slotForm.startAt || !slotForm.endAt) {
      alert('Start and end time are required');
      return;
    }

    try {
      setSubmittingSlot(true);
      await axios.post(
        `${API_BASE}/api/manual-bookings/slots`,
        {
          startAt: new Date(slotForm.startAt).toISOString(),
          endAt: new Date(slotForm.endAt).toISOString(),
          mode: slotForm.mode,
          locationText: slotForm.locationText,
          notes: slotForm.notes
        },
        { headers }
      );
      setSlotForm({ startAt: '', endAt: '', mode: 'in_person', locationText: '', notes: '' });
      await fetchData();
    } catch (err) {
      console.error('Failed to publish slot', err);
      alert(err.response?.data?.msg || 'Failed to publish slot');
    } finally {
      setSubmittingSlot(false);
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await axios.delete(`${API_BASE}/api/manual-bookings/slots/${slotId}`, { headers });
      await fetchData();
    } catch (err) {
      console.error('Failed to remove slot', err);
      alert(err.response?.data?.msg || 'Failed to remove slot');
    }
  };

  const respondBooking = async (bookingId, action) => {
    try {
      await axios.put(
        `${API_BASE}/api/manual-bookings/bookings/${bookingId}/respond`,
        { action, note: responseNotes[bookingId] || '' },
        { headers }
      );
      await fetchData();
    } catch (err) {
      console.error('Failed to respond booking', err);
      alert(err.response?.data?.msg || 'Failed to update booking');
    }
  };

  const completeBooking = async (bookingId) => {
    const adviceText = (adviceInputs[bookingId] || '').trim();
    if (!adviceText) {
      alert('Advice text is required');
      return;
    }

    try {
      setSubmittingAdviceId(bookingId);
      await axios.put(
        `${API_BASE}/api/manual-bookings/bookings/${bookingId}/complete`,
        { adviceText },
        { headers }
      );
      setAdviceInputs((prev) => ({ ...prev, [bookingId]: '' }));
      await fetchData();
      onInteraction?.();
    } catch (err) {
      console.error('Failed to complete booking', err);
      alert(err.response?.data?.msg || 'Failed to complete booking');
    } finally {
      setSubmittingAdviceId('');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-green-700" />
        <p className="text-gray-600">Loading booking manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-700 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6" /> {t.title}
            </h2>
            <p className="text-sky-100 text-sm mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold"
          >
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h3 className="font-bold text-gray-800">{t.newSlot}</h3>
          <form className="space-y-3" onSubmit={publishSlot}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="datetime-local"
                value={slotForm.startAt}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, startAt: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
                required
              />
              <input
                type="datetime-local"
                value={slotForm.endAt}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, endAt: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={slotForm.mode}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, mode: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {MODE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                value={slotForm.locationText}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, locationText: e.target.value }))}
                placeholder="Location or meeting details"
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={slotForm.notes}
              onChange={(e) => setSlotForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              rows={2}
            />
            <button
              type="submit"
              disabled={submittingSlot}
              className="w-full py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submittingSlot ? 'Publishing...' : t.create}
            </button>
          </form>

          <h3 className="font-bold text-gray-800 pt-2">{t.mySlots}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {slots.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noSlots}</p>
            ) : (
              slots.map((slot) => (
                <div key={slot._id} className="border border-gray-200 rounded-xl p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(slot.startAt).toLocaleString()} - {new Date(slot.endAt).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{MODE_OPTIONS.find((m) => m.value === slot.mode)?.label || slot.mode}</p>
                    <p className="text-xs text-gray-500 mt-1">Status: {slot.status}</p>
                  </div>
                  {slot.status === 'open' ? (
                    <button
                      onClick={() => deleteSlot(slot._id)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h3 className="font-bold text-gray-800">{t.myBookings}</h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noBookings}</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-800">{booking.topic}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold">
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Farmer: {booking.farmerName}</p>
                <p className="text-xs text-gray-600">
                  {new Date(booking.scheduledStartAt).toLocaleString()} - {new Date(booking.scheduledEndAt).toLocaleTimeString()}
                </p>
                {booking.description ? <p className="text-xs text-gray-700">{booking.description}</p> : null}
                {booking.instructorResponseNote ? (
                  <p className="text-xs text-gray-700"><strong>Response note:</strong> {booking.instructorResponseNote}</p>
                ) : null}
                {booking.adviceText ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                    <p className="text-xs font-semibold text-emerald-800">Advice submitted</p>
                    <p className="text-xs text-emerald-700 mt-1">{booking.adviceText}</p>
                  </div>
                ) : null}

                {booking.status === 'pending' ? (
                  <div className="space-y-2">
                    <textarea
                      value={responseNotes[booking._id] || ''}
                      onChange={(e) => setResponseNotes((prev) => ({ ...prev, [booking._id]: e.target.value }))}
                      placeholder="Optional response note"
                      className="w-full border rounded-lg px-2.5 py-2 text-xs resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondBooking(booking._id, 'accept')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-4 h-4" /> {t.accept}
                      </button>
                      <button
                        onClick={() => respondBooking(booking._id, 'reject')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                      >
                        <XCircle className="w-4 h-4" /> {t.reject}
                      </button>
                    </div>
                  </div>
                ) : null}

                {booking.status === 'accepted' ? (
                  <div className="space-y-2">
                    <textarea
                      value={adviceInputs[booking._id] || ''}
                      onChange={(e) => setAdviceInputs((prev) => ({ ...prev, [booking._id]: e.target.value }))}
                      placeholder="Enter full advice for farmer"
                      className="w-full border rounded-lg px-2.5 py-2 text-xs resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => completeBooking(booking._id)}
                      disabled={submittingAdviceId === booking._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                    >
                      <PlusCircle className="w-4 h-4" />
                      {submittingAdviceId === booking._id ? 'Submitting...' : t.complete}
                    </button>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
