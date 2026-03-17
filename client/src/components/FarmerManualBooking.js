import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CalendarDays, RefreshCw, User, Clock, MapPin, ClipboardList, XCircle, Bell, Check } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-blue-100 text-blue-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-gray-100 text-gray-700',
  completed: 'bg-emerald-100 text-emerald-800'
};

const MODE_LABELS = {
  in_person: 'In Person',
  phone: 'Phone',
  video: 'Video'
};

export default function FarmerManualBooking({ lang = 'en', onInteraction }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [form, setForm] = useState({ topic: '', description: '', slotId: '' });

  const t = useMemo(() => ({
    title: lang === 'si' ? 'අතින් වෙන්කරවා ගැනීම්' : 'Manual Instructor Booking',
    subtitle: lang === 'si' ? 'කාලය තෝරාගනිමින් උපදේශනය වෙන්කරවා ගන්න' : 'Choose an instructor slot and request consultation',
    chooseInstructor: lang === 'si' ? 'උපදේශක තෝරන්න' : 'Choose Instructor',
    availableSlots: lang === 'si' ? 'ලබාගත හැකි කාල' : 'Available Slots',
    myBookings: lang === 'si' ? 'මගේ වෙන්කරවා ගැනීම්' : 'My Bookings',
    notifications: lang === 'si' ? 'දැනුම්දීම්' : 'Notifications',
    createBooking: lang === 'si' ? 'වෙන්කරවා ගැනීම කරන්න' : 'Create Booking Request',
    topic: lang === 'si' ? 'විෂයය' : 'Topic',
    description: lang === 'si' ? 'විස්තර' : 'Description',
    slot: lang === 'si' ? 'කාලය' : 'Slot',
    refresh: lang === 'si' ? 'යාවත්කාල' : 'Refresh',
    noInstructors: lang === 'si' ? 'අනුමත උපදේශකයින් නොමැත' : 'No approved instructors found',
    noSlots: lang === 'si' ? 'තෝරාගත් උපදේශකයාට විවෘත කාල නොමැත' : 'No open slots for this instructor',
    noBookings: lang === 'si' ? 'තවම වෙන්කරවා ගැනීම් නැත' : 'No bookings yet',
    noNotifications: lang === 'si' ? 'නව දැනුම්දීම් නොමැත' : 'No booking notifications yet',
    markRead: lang === 'si' ? 'කියවූ ලෙස ලකුණු කරන්න' : 'Mark as read',
    cancel: lang === 'si' ? 'අවලංගු කරන්න' : 'Cancel',
    pendingOnly: lang === 'si' ? 'බලාපොරොත්තු තත්වයේදී පමණක් අවලංගු කළ හැක' : 'Only pending bookings can be cancelled',
    advice: lang === 'si' ? 'උපදෙස්' : 'Advice',
    fee: lang === 'si' ? 'ගාස්තුව' : 'Fee',
    status: lang === 'si' ? 'තත්වය' : 'Status'
  }), [lang]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

  const fetchInstructors = async () => {
    const res = await axios.get(`${API_BASE}/api/manual-bookings/instructors`, { headers });
    const list = res.data?.instructors || [];
    setInstructors(list);
    if (!selectedInstructorId && list.length > 0) {
      setSelectedInstructorId(list[0]._id);
    }
  };

  const fetchSlots = async (instructorId) => {
    if (!instructorId) {
      setSlots([]);
      return;
    }
    const res = await axios.get(`${API_BASE}/api/manual-bookings/instructors/${instructorId}/slots`, { headers });
    setSlots(res.data?.slots || []);
  };

  const fetchBookings = async () => {
    const res = await axios.get(`${API_BASE}/api/manual-bookings/bookings/farmer/mine`, { headers });
    setBookings(res.data?.bookings || []);
  };

  const fetchNotifications = async () => {
    const res = await axios.get(`${API_BASE}/api/manual-bookings/notifications/farmer`, { headers });
    const list = res.data?.notifications || [];
    setNotifications(list);
    setUnreadCount(typeof res.data?.unreadCount === 'number' ? res.data.unreadCount : 0);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchInstructors(), fetchBookings(), fetchNotifications()]);
    } catch (err) {
      console.error('Failed to refresh booking data', err);
      alert(err.response?.data?.msg || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSlots(selectedInstructorId).catch((err) => {
      console.error('Failed to fetch slots', err);
      alert(err.response?.data?.msg || 'Failed to load slots');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstructorId]);

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.slotId) {
      alert('Please select slot and enter topic');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE}/api/manual-bookings/bookings`,
        { slotId: form.slotId, topic: form.topic.trim(), description: form.description.trim() },
        { headers }
      );
      setForm({ topic: '', description: '', slotId: '' });
      await Promise.all([fetchBookings(), fetchSlots(selectedInstructorId), fetchNotifications()]);
      onInteraction?.();
    } catch (err) {
      console.error('Failed to create booking', err);
      alert(err.response?.data?.msg || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBooking = async (bookingId, status) => {
    if (status !== 'pending') {
      alert(t.pendingOnly);
      return;
    }

    try {
      await axios.put(`${API_BASE}/api/manual-bookings/bookings/${bookingId}/cancel`, {}, { headers });
      await Promise.all([fetchBookings(), fetchSlots(selectedInstructorId), fetchNotifications()]);
    } catch (err) {
      console.error('Failed to cancel booking', err);
      alert(err.response?.data?.msg || 'Failed to cancel booking');
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.put(`${API_BASE}/api/manual-bookings/notifications/farmer/${notificationId}/read`, {}, { headers });
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      alert(err.response?.data?.msg || 'Failed to update notification');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-green-700" />
        <p className="text-gray-600">Loading booking flow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="w-6 h-6" />
              {t.title}
            </h2>
            <p className="text-emerald-100 mt-1 text-sm">{t.subtitle}</p>
          </div>
          <button
            onClick={refreshAll}
            className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold"
          >
            {t.refresh}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-green-700" />
            {t.chooseInstructor}
          </h3>

          {instructors.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noInstructors}</p>
          ) : (
            <select
              value={selectedInstructorId}
              onChange={(e) => {
                setSelectedInstructorId(e.target.value);
                setForm((prev) => ({ ...prev, slotId: '' }));
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {instructors.map((instructor) => (
                <option key={instructor._id} value={instructor._id}>
                  {(instructor.fullName || instructor.username)} - {instructor.district}
                </option>
              ))}
            </select>
          )}

          <h4 className="font-semibold text-gray-700 mt-4">{t.availableSlots}</h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {slots.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noSlots}</p>
            ) : (
              slots.map((slot) => {
                const selected = form.slotId === slot._id;
                return (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, slotId: slot._id }))}
                    className={`w-full text-left border rounded-xl p-3 transition ${selected ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                  >
                    <p className="font-semibold text-sm text-gray-800">
                      {new Date(slot.startAt).toLocaleString()} - {new Date(slot.endAt).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {MODE_LABELS[slot.mode] || slot.mode}
                    </p>
                    {slot.locationText ? (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {slot.locationText}
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <form className="space-y-3" onSubmit={submitBooking}>
            <h4 className="font-semibold text-gray-700">{t.createBooking}</h4>
            <input
              value={form.topic}
              onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
              placeholder={t.topic}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              maxLength={120}
              required
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t.description}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : t.createBooking}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-700" />
            {t.notifications}
            {unreadCount > 0 ? (
              <span className="ml-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                {unreadCount}
              </span>
            ) : null}
          </h3>

          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noNotifications}</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {notifications.map((item) => (
                <div
                  key={item._id}
                  className={`border rounded-xl p-3 ${item.read ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.title?.[lang] || item.title?.en || 'Notification'}</p>
                      <p className="text-xs text-gray-600 mt-1">{item.message?.[lang] || item.message?.en || ''}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    {!item.read ? (
                      <button
                        onClick={() => markNotificationRead(item._id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-green-300 text-green-700 text-xs font-semibold hover:bg-green-100"
                      >
                        <Check className="w-3.5 h-3.5" /> {t.markRead}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-green-700" />
            {t.myBookings}
          </h3>

          {bookings.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noBookings}</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-sm text-gray-800">{booking.topic}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Instructor: {booking.instructorName}</p>
                <p className="text-xs text-gray-600">
                  {new Date(booking.scheduledStartAt).toLocaleString()} - {new Date(booking.scheduledEndAt).toLocaleTimeString()}
                </p>
                <p className="text-xs text-gray-600">{t.fee}: {booking.feeCredits} credits</p>
                {booking.description ? <p className="text-xs text-gray-600">{booking.description}</p> : null}
                {booking.instructorResponseNote ? (
                  <p className="text-xs text-gray-700"><strong>Response:</strong> {booking.instructorResponseNote}</p>
                ) : null}
                {booking.adviceText ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                    <p className="text-xs font-semibold text-emerald-800">{t.advice}</p>
                    <p className="text-xs text-emerald-700 mt-1">{booking.adviceText}</p>
                  </div>
                ) : null}
                {booking.status === 'pending' ? (
                  <button
                    onClick={() => cancelBooking(booking._id, booking.status)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200"
                  >
                    <XCircle className="w-4 h-4" /> {t.cancel}
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
