import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Leaf, ShoppingBag, TrendingUp, Newspaper, BookOpen,
  MapPin, Phone, User, PlusCircle, Sprout, MessageCircle,
  Star, CheckCircle, Award, ThumbsUp, MessageSquare, Trash2,
  Bookmark, Filter, ArrowUpDown, ChevronDown, Search,
  Shield, Camera, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import ReputationBadge, { MiniReputationBadge } from '../components/ReputationBadge';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import MarketTrends from '../components/MarketTrends';
import AgriNews from '../components/AgriNews';
import TraditionalRice from '../components/TraditionalRice';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

// Image carousel for listing cards
const ImageGallery = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="relative w-full h-48 bg-gray-100 overflow-hidden rounded-t-2xl">
      <img src={images[idx]} alt="harvest" className="w-full h-full object-cover"
        onError={e => { e.target.style.display = 'none'; }} />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
        {idx + 1}/{images.length}
      </div>
    </div>
  );
};

const tabs = [
  { id: 'market', label: 'Marketplace', icon: ShoppingBag, emoji: '🛒' },
  { id: 'trends', label: 'Market Trends', icon: TrendingUp, emoji: '📈' },
  { id: 'news', label: 'Agri News', icon: Newspaper, emoji: '📰' },
  { id: 'riceVarieties', label: 'Rice Varieties', icon: BookOpen, emoji: '🌾' },
];

// ── Marketplace panel ──────────────────────────────────────────────
function MarketplacePanel({ currentUser, lang }) {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ cropType: '', quantity: '', price: '', location: '', phone: '' });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [feedbackListing, setFeedbackListing] = useState(null);
  const [viewFeedbackListing, setViewFeedbackListing] = useState(null);
  const [topFarmers, setTopFarmers] = useState([]);
  const [savedListingIds, setSavedListingIds] = useState([]);
  const [filterCrop, setFilterCrop] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [search, setSearch] = useState('');

  const isBuyer = currentUser?.role === 'buyer';

  useEffect(() => {
    fetchListings();
    fetchTopFarmers();
    if (currentUser) fetchSavedListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/listings`);
      setListings(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTopFarmers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reputation/top-farmers?limit=5`);
      setTopFarmers(res.data.farmers || []);
    } catch (err) { console.error(err); }
  };

  const fetchSavedListings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${API_BASE}/api/saved-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedListingIds(res.data.listings.map(l => l._id));
    } catch (err) { console.error(err); }
  };

  const toggleSaveListing = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please log in to save listings'); return; }
      const res = await axios.post(`${API_BASE}/api/saved-listings/toggle/${listingId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSavedListingIds(prev =>
          res.data.isSaved ? [...prev, listingId] : prev.filter(id => id !== listingId)
        );
      }
    } catch (err) { console.error(err); }
  };

  const handleMarkSold = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axios.put(`${API_BASE}/api/reputation/listing/${listingId}/sold`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchListings();
      alert('Listing marked as sold! Your reputation has been updated.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark as sold');
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchListings();
    } catch (err) { console.error(err); }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { alert('Please log in as a farmer to post listings.'); return; }
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('farmerName', currentUser?.username || 'Anonymous');
      images.forEach(img => formData.append('images', img));

      await axios.post(`${API_BASE}/api/listings`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      fetchListings();
      setForm({ cropType: '', quantity: '', price: '', location: '', phone: '' });
      setImages([]);
      setImagePreviews([]);
      alert('Success! Your crop is listed.');
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Insufficient Credits!');
        window.dispatchEvent(new CustomEvent('open-credit-purchase'));
      } else {
        alert('Error listing crop.');
      }
    }
  };

  const filteredListings = listings
    .filter(item => {
      if (filterCrop === 'all') return true;
      const c = (item.cropType || '').toLowerCase();
      if (filterCrop === 'paddy') return c.includes('paddy') || c.includes('rice') || c.includes('වී');
      if (filterCrop === 'tea') return c.includes('tea') || c.includes('තේ');
      if (filterCrop === 'chili') return c.includes('chili') || c.includes('chilli') || c.includes('මිරිස්');
      return true;
    })
    .filter(item => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (item.cropType || '').toLowerCase().includes(s) ||
        (item.location || '').toLowerCase().includes(s) ||
        (item.farmerName || '').toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === 'priceLow') {
        return (parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0) -
          (parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0);
      }
      if (sortBy === 'priceHigh') {
        return (parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0) -
          (parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0);
      }
      return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
    });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 60%), radial-gradient(circle at 80% 20%, #86efac 0%, transparent 50%)' }} />
        <div className="relative px-8 py-10 md:py-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-500/30 text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-500/40">
                🌱 AgroLink Marketplace
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              Fresh Crops,<br />
              <span className="text-green-400">Direct from Farmers</span>
            </h1>
            <p className="text-green-200 text-base md:text-lg mb-6">
              Connect directly with verified Sri Lankan farmers. Best prices, trusted sellers.
            </p>
            {/* Search Bar */}
            <div className="relative max-w-lg">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search crops, location, farmer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Listings', value: listings.length, emoji: '📦' },
          { label: 'Verified Farmers', value: listings.filter(l => l.verified).length, emoji: '✅' },
          { label: 'Top Rated', value: topFarmers.length, emoji: '⭐' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{stat.emoji}</div>
            <div className="text-xl font-black text-green-700">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Top Rated Farmers */}
      {topFarmers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-2xl border border-amber-200">
          <h3 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
            <Award size={16} className="text-amber-600" /> Top Rated Farmers
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {topFarmers.map(farmer => (
              <div key={farmer._id}
                className="flex-shrink-0 bg-white px-4 py-3 rounded-xl shadow-sm border border-amber-100 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center">
                  <User size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{farmer.username}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MiniReputationBadge score={farmer.reputation_score} />
                    {farmer.is_verified_farmer && <CheckCircle size={12} className="text-blue-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Listing Form (farmers only) */}
      {!isBuyer && currentUser && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlusCircle className="h-5 w-5 text-green-600" />
            </div>
            Sell New Harvest
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">50 Credits</span>
          </h3>
          <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2">
            <div className="p-1.5 bg-green-500 rounded-full">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm text-gray-600">Posting as:</span>
            <span className="font-bold text-green-700">{currentUser?.username}</span>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'cropType', placeholder: 'Crop (e.g. Paddy)' },
              { name: 'quantity', placeholder: 'Qty (e.g. 500kg)' },
              { name: 'price', placeholder: 'Price (LKR)' },
              { name: 'location', placeholder: 'Location' },
              { name: 'phone', placeholder: 'Phone (e.g. 0771234567)' },
            ].map(field => (
              <input
                key={field.name}
                name={field.name}
                value={form[field.name]}
                onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                placeholder={field.placeholder}
                className="p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm"
                required
              />
            ))}
            {/* Image Upload */}
            <div className="md:col-span-2">
              <label htmlFor="hub-listing-images"
                className="border-2 border-dashed border-green-300 rounded-xl p-4 cursor-pointer hover:border-green-500 transition-colors text-center bg-green-50 block">
                <Camera size={22} className="mx-auto text-green-400 mb-1" />
                <p className="text-sm text-gray-500">Click to add harvest photos (up to 5)</p>
                <input id="hub-listing-images" ref={fileInputRef} type="file" accept="image/*"
                  multiple className="hidden" onChange={handleImageChange} />
              </label>
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {imagePreviews.map((src, idx) => (
                    <div key={src} className="relative">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button type="button" onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit"
              className="md:col-span-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg">
              Post Listing (50 Credits)
            </button>
          </form>
        </div>
      )}

      {isBuyer && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-700 font-medium text-sm flex items-center gap-2">
          <Shield size={16} /> Buyers can browse listings. Posting is for farmers only.
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
              <Filter size={12} /> Filter by Crop
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All', emoji: '🌱' },
                { key: 'paddy', label: 'Paddy', emoji: '🌾' },
                { key: 'tea', label: 'Tea', emoji: '🍵' },
                { key: 'chili', label: 'Chili', emoji: '🌶️' },
              ].map(crop => (
                <button key={crop.key} onClick={() => setFilterCrop(crop.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterCrop === crop.key
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'}`}>
                  {crop.emoji} {crop.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:w-52">
            <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort by
            </label>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none pr-8">
                <option value="latest">Latest First</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div>
        <p className="text-sm text-gray-500 mb-3 font-medium">
          {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''} found
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredListings.map(item => {
            const isOwnListing = currentUser &&
              (item.farmerName === currentUser.username || item.farmer_id?.username === currentUser.username);

            return (
              <div key={item._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group">
                {/* Image Gallery or accent bar */}
                {item.images && item.images.length > 0
                  ? <ImageGallery images={item.images} />
                  : <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #16a34a, #059669)' }} />
                }

                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <Sprout className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-gray-800">{item.cropType}</h4>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{item.quantity}</span>
                      </div>
                    </div>
                    {item.verified && (
                      <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-blue-100">
                        <CheckCircle size={11} /> Verified
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-2xl font-black text-green-700 mb-3">Rs. {item.price}
                    <span className="text-xs font-medium text-gray-400 ml-1">/ unit</span>
                  </p>

                  {/* Farmer Info */}
                  <div className="space-y-1.5 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2"><User size={13} /> {item.farmerName}</p>
                      {item.farmer_id && (
                        <ReputationBadge
                          score={item.farmer_id.reputation_score || 3.0}
                          isVerified={item.farmer_id.is_verified_farmer}
                          size="sm"
                          lang="en"
                        />
                      )}
                    </div>
                    <p className="flex items-center gap-2"><MapPin size={13} /> {item.location}</p>
                    <p className="flex items-center gap-2 font-bold text-gray-700"><Phone size={13} /> {item.phone}</p>
                  </div>

                  {/* Farmer Stats */}
                  {item.farmer_id && item.farmer_id.total_sales > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 grid grid-cols-2 gap-2 text-center">
                      <div>
                        <p className="font-black text-gray-800 text-lg">{item.farmer_id.total_sales}</p>
                        <p className="text-gray-500 text-xs">Sales</p>
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-lg">{item.farmer_id.reputation_score?.toFixed(1) || '3.0'}</p>
                        <p className="text-gray-500 text-xs">Rating</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2 mt-auto">
                    <div className={`grid gap-2 ${!isOwnListing && currentUser ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <a href={`https://wa.me/${item.phone.replace(/\s/g, '').startsWith('0') ? '94' + item.phone.replace(/\s/g, '').substring(1) : item.phone.replace(/\s/g, '')}?text=${encodeURIComponent(`Hello ${item.farmerName}, I am interested in your ${item.cropType} harvest posted on Govi Isuru.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-[#25D366] text-white py-2 rounded-xl font-bold text-xs hover:bg-[#128C7E] transition shadow-sm">
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                      <a href={`tel:${item.phone}`}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-sm">
                        <Phone size={14} /> Call
                      </a>
                      {!isOwnListing && currentUser && (
                        <button onClick={() => toggleSaveListing(item._id)}
                          className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition ${savedListingIds.includes(item._id)
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                          <Bookmark size={13} fill={savedListingIds.includes(item._id) ? 'currentColor' : 'none'} />
                          {savedListingIds.includes(item._id) ? 'Saved' : 'Save'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {!isOwnListing && currentUser && currentUser._id !== item.farmer_id?._id && (
                        <button onClick={() => setFeedbackListing(item)}
                          className="flex items-center justify-center gap-1 bg-amber-100 text-amber-700 py-2 rounded-xl font-bold text-xs hover:bg-amber-200 transition">
                          <Star size={13} /> Rate Seller
                        </button>
                      )}
                      <button onClick={() => setViewFeedbackListing(item)}
                        className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition bg-purple-100 text-purple-700 hover:bg-purple-200 ${isOwnListing ? 'col-span-2' : ''}`}>
                        <MessageSquare size={13} /> Reviews
                      </button>
                    </div>

                    {currentUser && item.farmerName === currentUser.username && item.status !== 'sold' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleMarkSold(item._id)}
                          className="flex items-center justify-center gap-1 bg-green-100 text-green-700 py-2 rounded-xl font-bold text-xs hover:bg-green-200 transition">
                          <ThumbsUp size={13} /> Mark Sold
                        </button>
                        <button onClick={() => handleDelete(item._id)}
                          className="flex items-center justify-center gap-1 bg-red-100 text-red-700 py-2 rounded-xl font-bold text-xs hover:bg-red-200 transition">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredListings.length === 0 && (
            <div className="col-span-full text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Filter size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No listings found.</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </div>

      {feedbackListing && (
        <FeedbackForm listing={feedbackListing} onClose={() => setFeedbackListing(null)}
          onSubmit={() => { setFeedbackListing(null); fetchListings(); }} lang="en" />
      )}
      {viewFeedbackListing && (
        <FeedbackList listing={viewFeedbackListing} onClose={() => setViewFeedbackListing(null)} lang="en" />
      )}
    </div>
  );
}

// ── Main MarketHubPage ─────────────────────────────────────────────
export default function MarketHubPage() {
  const [activeTab, setActiveTab] = useState('market');
  const [currentUser, setCurrentUser] = useState(null);
  const [lang] = useState('en');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <header style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 100%)' }}
        className="sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-xl border border-green-500/30">
              <Leaf className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tight">Govi Isuru</span>
              <span className="hidden md:block text-green-400 text-xs font-medium">Market Hub</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-2xl">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === tab.id
                    ? 'bg-white text-green-800 shadow-md'
                    : 'text-green-100 hover:bg-white/15'}`}>
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-white text-sm font-bold">{currentUser.username}</p>
                <p className="text-green-300 text-xs">🪙 {currentUser.credits ?? 0} credits</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow">
                {currentUser.username?.[0]?.toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-300 text-sm">
              <User size={16} /> Guest
            </div>
          )}
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden overflow-x-auto border-t border-green-700/40">
          <div className="flex gap-1 px-4 py-2 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                  ? 'bg-white text-green-800'
                  : 'text-green-200 hover:bg-white/10'}`}>
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {activeTab === 'market' && <MarketplacePanel currentUser={currentUser} lang={lang} />}
        {activeTab === 'trends' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <MarketTrends lang={lang} />
          </div>
        )}
        {activeTab === 'news' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <AgriNews lang={lang} user={currentUser} />
          </div>
        )}
        {activeTab === 'riceVarieties' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <TraditionalRice lang={lang} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12 py-6 text-center text-xs text-gray-400">
        © 2026 <span className="font-semibold text-green-600">Govi Isuru</span> — Empowering Sri Lankan Farmers
      </footer>
    </div>
  );
}
