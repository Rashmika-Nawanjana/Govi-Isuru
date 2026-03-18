import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ShoppingBag, MapPin, Phone, User, PlusCircle, Sprout, MessageCircle,
  Star, CheckCircle, Award, ThumbsUp, MessageSquare, Trash2, Bookmark,
  Filter, ArrowUpDown, ChevronDown, Camera, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import ReputationBadge, { MiniReputationBadge } from './ReputationBadge';
import FeedbackForm from './FeedbackForm';
import FeedbackList from './FeedbackList';

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';

// Image carousel for listing cards
const ImageGallery = ({ images }) => {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="relative w-full h-44 bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <img
        src={images[idx]}
        alt="harvest"
        className="w-full h-full object-cover"
        onError={e => { e.target.style.display = 'none'; }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
              />
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

const Marketplace = ({ lang, currentUser, onInteraction }) => {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({
    cropType: '', quantity: '', price: '', location: '', phone: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [feedbackListing, setFeedbackListing] = useState(null);
  const [viewFeedbackListing, setViewFeedbackListing] = useState(null);
  const [topFarmers, setTopFarmers] = useState([]);
  const [savedListingIds, setSavedListingIds] = useState([]);
  const [filterCrop, setFilterCrop] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const t = {
    en: {
      header: "AgroLink Marketplace",
      sub: "Connect directly with buyers",
      formTitle: "Sell New Harvest",
      btn: "Post Listing (50 Credits)",
      contactWa: "WhatsApp",
      contactCall: "Call Now",
      rateSeller: "Rate Seller",
      viewReviews: "View Reviews",
      verified: "Verified",
      topFarmers: "Top Rated Farmers",
      soldOut: "Mark as Sold",
      active: "Active",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete this listing?",
      postingAs: "Posting as",
      buyerViewOnly: "Buyers can browse listings. Posting is for farmers only.",
      loginToPost: "Please log in as a farmer to post listings.",
      filterAll: "All Crops",
      filterPaddy: "Paddy",
      filterTea: "Tea",
      filterChili: "Chili",
      sortLatest: "Latest First",
      sortPriceLow: "Price: Low to High",
      sortPriceHigh: "Price: High to Low",
      sortLabel: "Sort by",
      filterLabel: "Filter by Crop",
      noListings: "No listings found for this filter."
    },
    si: {
      header: "අලෙවිසැල",
      sub: "ගැනුම්කරුවන් සමඟ සෘජුව සම්බන්ධ වන්න",
      formTitle: "අලුත් අස්වැන්න විකුණන්න",
      btn: "දැන්වීම පළ කරන්න (ණය 50)",
      contactWa: "WhatsApp",
      contactCall: "ඇමතුමක් ගන්න",
      rateSeller: "ශ්‍රේණිගත කරන්න",
      viewReviews: "සමාලෝචන බලන්න",
      verified: "සත්‍යාපිත",
      topFarmers: "ඉහළ ශ්‍රේණිගත ගොවීන්",
      soldOut: "විකුණන ලද ලෙස සලකුණු කරන්න",
      active: "ක්‍රියාකාරී",
      delete: "මකන්න",
      deleteConfirm: "මෙම දැන්වීම මැකීමට ඔබට විශ්වාසද?",
      postingAs: "ලෙස පළ කිරීම",
      buyerViewOnly: "ගැණුම්කරුවන්ට දැන්වීම් බැලීමට පමණක් හැකිය. දැන්වීම් පළ කරන්නේ ගොවියන් විසින් පමණි.",
      loginToPost: "දැන්වීම් පළ කිරීමට ගොවියෙකු ලෙස පුරනය වන්න.",
      filterAll: "සියලු බෝග",
      filterPaddy: "වී",
      filterTea: "තේ",
      filterChili: "මිරිස්",
      sortLatest: "අවසන් පළමුව",
      sortPriceLow: "මිල: අඩුවේ සිට ඉහළට",
      sortPriceHigh: "මිල: ඉහළේ සිට අඩුවට",
      sortLabel: "පෙල ගස්වන්න",
      filterLabel: "බෝග මගින් පෙරන්න",
      noListings: "මෙම පෙරනුම සඳහා දැන්වීම් හමු නොවීය."
    }
  };

  const isBuyer = currentUser?.role === 'buyer';

  useEffect(() => {
    fetchListings();
    fetchTopFarmers();
    if (currentUser) {
      fetchSavedListings();
    }
  }, [currentUser]);

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/listings`);
      setListings(res.data);
    } catch (err) {
      console.error("Failed to fetch market data", err);
    }
  };

  const fetchTopFarmers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/reputation/top-farmers?limit=5`);
      setTopFarmers(res.data.farmers || []);
    } catch (err) {
      console.error("Failed to fetch top farmers", err);
    }
  };

  const fetchSavedListings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/saved-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Extract just the IDs for quick lookup
      const savedIds = res.data.listings.map(listing => listing._id);
      setSavedListingIds(savedIds);
    } catch (err) {
      console.error("Failed to fetch saved listings", err);
    }
  };

  const toggleSaveListing = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(lang === 'en' ? 'Please log in to save listings' : 'දැන්වීම් සුරැකීමට කරුණාකර පුරනය වන්න');
        return;
      }

      const res = await axios.post(
        `${API_BASE}/api/saved-listings/toggle/${listingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Update saved listings state
        if (res.data.isSaved) {
          setSavedListingIds([...savedListingIds, listingId]);
        } else {
          setSavedListingIds(savedListingIds.filter(id => id !== listingId));
        }
      }
    } catch (err) {
      console.error("Failed to toggle saved listing", err);
      alert(lang === 'en' ? 'Failed to save listing' : 'දැන්වීම සුරැකීමට අසමත් විය');
    }
  };

  const handleMarkSold = async (listingId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert(lang === 'en' ? 'Please log in first' : 'කරුණාකර පළමුව පුරනය වන්න');
        return;
      }
      if (!listingId) {
        alert(lang === 'en' ? 'Invalid listing' : 'වලංගු නොවන දැන්වීම');
        return;
      }
      await axios.put(
        `${API_BASE}/api/reputation/listing/${listingId}/sold`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchListings();
      alert(lang === 'en' ? 'Listing marked as sold! Your reputation has been updated.' : 'විකුණන ලද ලෙස සලකුණු කරන ලදී! ඔබේ කීර්තිනාමය යාවත්කාලීන කර ඇත.');
    } catch (err) {
      console.error("Failed to mark as sold", err);
      const errorMsg = err.response?.data?.error || (lang === 'en' ? 'Failed to mark as sold' : 'විකුණන ලද ලෙස සලකුණු කිරීමට අසමත් විය');
      alert(errorMsg);
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm(t[lang].deleteConfirm)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_BASE}/api/listings/${listingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchListings();
      alert(lang === 'en' ? 'Listing deleted!' : 'දැන්වීම මකන ලදී!');
    } catch (err) {
      console.error("Failed to delete listing", err);
      alert(lang === 'en' ? 'Failed to delete listing' : 'දැන්වීම මැකීමට අසමත් විය');
    }
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
    if (isBuyer) { alert(t[lang].buyerViewOnly); return; }
    const token = localStorage.getItem('token');
    if (!token) { alert(t[lang].loginToPost); return; }

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
      alert(lang === 'en' ? "Success! Your crop is listed." : "සාර්ථකයි! දැන්වීම ඇතුළත් කරන ලදී.");
      if (onInteraction) onInteraction();
    } catch (err) {
      if (err.response?.status === 403) {
        alert(lang === 'si' ? "ප්‍රමාණවත් මුදල් නොමැත!" : "Insufficient Credits!");
        window.dispatchEvent(new CustomEvent('open-credit-purchase'));
        return;
      }
      alert("Error listing crop.");
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Section Header */}
      <div className="mb-3 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 md:h-7 md:w-7" />
          🛒 {t[lang].header}
        </h2>
        <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 mt-1">{t[lang].sub}</p>
      </div>

      {/* Top Rated Farmers Section */}
      {topFarmers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-3 md:p-5 rounded-xl md:rounded-2xl mb-4 md:mb-6 border border-amber-200 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-amber-500 rounded-lg">
              <Award size={14} className="text-white" />
            </div>
            {t[lang].topFarmers}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {topFarmers.map((farmer) => (
              <div
                key={farmer._id}
                className="flex-shrink-0 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-sm border border-amber-100 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center">
                  <User size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{farmer.username}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MiniReputationBadge score={farmer.reputation_score} />
                    {farmer.is_verified_farmer && (
                      <CheckCircle size={12} className="text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sell Form */}
      {!isBuyer ? (
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-4 md:mb-8">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <PlusCircle className="h-5 w-5 text-green-600" />
            </div>
            {t[lang].formTitle}
          </h3>
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 flex items-center gap-2">
            <div className="p-1.5 bg-green-500 rounded-full">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">{t[lang].postingAs}:</span>
            <span className="font-bold text-green-700">{currentUser?.username}</span>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="cropType" value={form.cropType} onChange={handleChange} placeholder="Crop (e.g. Paddy)" className="p-3.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" required />
            <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Qty (e.g. 500kg)" className="p-3.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" required />
            <input name="price" value={form.price} onChange={handleChange} placeholder="Price (LKR)" className="p-3.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" required />
            <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="p-3.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" required />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (e.g. 0771234567)" className="p-3.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all" required />
            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                <Camera size={15} className="text-green-600" />
                {lang === 'si' ? 'ඡායාරූප එකතු කරන්න (අවම. 5)' : 'Add Harvest Photos (up to 5)'}
              </label>
              <label
                htmlFor="listing-images"
                className="border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-4 cursor-pointer hover:border-green-500 transition-colors text-center bg-green-50 dark:bg-green-900/20 block"
              >
                <Camera size={24} className="mx-auto text-green-400 mb-1" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lang === 'si' ? 'ඡායාරූප තෝරන්න' : 'Click to select photos'}
                </p>
                <input
                  id="listing-images"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {imagePreviews.map((src, idx) => (
                    <div key={src} className="relative">
                      <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="md:col-span-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              {t[lang].btn}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-4 md:mb-8">
          <div className="flex items-center gap-3 text-amber-700 font-semibold">
            <PlusCircle className="h-5 w-5 text-amber-600" />
            <span>{t[lang].buyerViewOnly}</span>
          </div>
        </div>
      )}

      {/* Filter & Sort Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Crop Type Filter */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
              <Filter size={12} /> {t[lang].filterLabel}
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: 'all', label: t[lang].filterAll, emoji: '🌱' },
                { key: 'paddy', label: t[lang].filterPaddy, emoji: '🌾' },
                { key: 'tea', label: t[lang].filterTea, emoji: '🍵' },
                { key: 'chili', label: t[lang].filterChili, emoji: '🌶️' }
              ].map(crop => (
                <button
                  key={crop.key}
                  onClick={() => setFilterCrop(crop.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    filterCrop === crop.key
                      ? 'bg-green-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  {crop.emoji} {crop.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-52">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
              <ArrowUpDown size={12} /> {t[lang].sortLabel}
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none cursor-pointer pr-8"
              >
                <option value="latest">{t[lang].sortLatest}</option>
                <option value="priceLow">{t[lang].sortPriceLow}</option>
                <option value="priceHigh">{t[lang].sortPriceHigh}</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
        {listings
          .filter(item => {
            if (filterCrop === 'all') return true;
            const cropName = (item.cropType || '').toLowerCase();
            if (filterCrop === 'paddy') return cropName.includes('paddy') || cropName.includes('rice') || cropName.includes('වී') || cropName.includes('සහල්');
            if (filterCrop === 'tea') return cropName.includes('tea') || cropName.includes('තේ');
            if (filterCrop === 'chili') return cropName.includes('chili') || cropName.includes('chilli') || cropName.includes('මිරිස්');
            return true;
          })
          .sort((a, b) => {
            if (sortBy === 'priceLow') {
              const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
              const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
              return priceA - priceB;
            }
            if (sortBy === 'priceHigh') {
              const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
              const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
              return priceB - priceA;
            }
            // latest: sort by date descending (default from API)
            return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
          })
          .map((item) => {
          const isOwnListing =
            currentUser &&
            (item.farmerName === currentUser.username || item.farmer_id?.username === currentUser.username);

          return (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-md hover:shadow-xl transition-all border-l-4 border-green-500 flex flex-col justify-between overflow-hidden">
              {/* Image Gallery */}
              {item.images && item.images.length > 0 && (
                <ImageGallery images={item.images} />
              )}
              <div className="p-3 md:p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base md:text-xl font-bold text-gray-800 dark:text-white flex items-center gap-1.5 md:gap-2">
                    <Sprout className="h-4 w-4 md:h-5 md:w-5 text-green-500" /> {item.cropType}
                  </h4>
                  <div className="flex items-center gap-2">
                    {item.verified && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} /> {t[lang].verified}
                      </span>
                    )}
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{item.quantity}</span>
                  </div>
                </div>
                <p className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-400 mb-2 md:mb-3">Rs. {item.price}</p>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2"><User size={14} /> {item.farmerName}</p>
                    {/* Reputation Badge */}
                    {item.farmer_id && (
                      <ReputationBadge
                        score={item.farmer_id.reputation_score || 3.0}
                        isVerified={item.farmer_id.is_verified_farmer}
                        size="sm"
                        lang={lang}
                      />
                    )}
                  </div>
                  <p className="flex items-center gap-2"><MapPin size={14} /> {item.location}</p>
                  <p className="flex items-center gap-2 font-bold text-gray-800 dark:text-white"><Phone size={14} /> {item.phone}</p>
                </div>

                {/* Farmer Stats */}
                {item.farmer_id && item.farmer_id.total_sales > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 mb-4 flex items-center justify-around text-xs">
                    <div className="text-center">
                      <p className="font-bold text-gray-800 dark:text-white">{item.farmer_id.total_sales}</p>
                      <p className="text-gray-500 dark:text-gray-400">{lang === 'si' ? 'විකුණුම්' : 'Sales'}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="text-center">
                      <p className="font-bold text-gray-800 dark:text-white">{item.farmer_id.reputation_score?.toFixed(1) || '3.0'}</p>
                      <p className="text-gray-500 dark:text-gray-400">{lang === 'si' ? 'ශ්‍රේණිගත' : 'Rating'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Contact Actions */}
                <div className={`grid gap-2 ${!isOwnListing && currentUser ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* WhatsApp Button */}
                  <a
                    href={`https://wa.me/${item.phone.replace(/\s/g, '').startsWith('0')
                      ? '94' + item.phone.replace(/\s/g, '').substring(1)
                      : item.phone.replace(/\s/g, '')
                      }?text=${encodeURIComponent(
                        lang === 'si'
                          ? `ආයුබෝවන් ${item.farmerName}, මම ඔබේ ${item.cropType} අස්වැන්න ගැන විමසීමට කැමතියි (Govi Isuru හරහා).`
                          : `Hello ${item.farmerName}, I am interested in your ${item.cropType} harvest posted on Govi Isuru.`
                      )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2 rounded-xl font-bold text-xs hover:bg-[#128C7E] transition shadow-sm"
                  >
                    <MessageCircle size={16} /> {t[lang].contactWa}
                  </a>

                  {/* Direct Call Button */}
                  <a
                    href={`tel:${item.phone}`}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-sm"
                  >
                    <Phone size={16} /> {t[lang].contactCall}
                  </a>

                  {/* Save Button (for non-owner users) */}
                  {!isOwnListing && currentUser && (
                    <button
                      onClick={() => toggleSaveListing(item._id)}
                      className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition shadow-sm ${savedListingIds.includes(item._id)
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                    >
                      <Bookmark size={14} fill={savedListingIds.includes(item._id) ? 'currentColor' : 'none'} />
                      {savedListingIds.includes(item._id)
                        ? (lang === 'si' ? 'සුරකින ලදී' : 'Saved')
                        : (lang === 'si' ? 'සුරකින්න' : 'Save')
                      }
                    </button>
                  )}
                </div>

                {/* Rate Seller & Mark Sold Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {!isOwnListing && currentUser && currentUser._id !== item.farmer_id?._id && (
                    <button
                      onClick={() => setFeedbackListing(item)}
                      className="flex items-center justify-center gap-1 bg-amber-100 text-amber-700 py-2 rounded-xl font-bold text-xs hover:bg-amber-200 transition"
                    >
                      <Star size={14} /> {t[lang].rateSeller}
                    </button>
                  )}

                  <button
                    onClick={() => setViewFeedbackListing(item)}
                    className={`flex items-center justify-center gap-1 py-2 rounded-xl font-bold text-xs transition ${isOwnListing ? 'col-span-2 bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                  >
                    <MessageSquare size={14} /> {t[lang].viewReviews}
                  </button>
                </div>

                {/* Mark as Sold (only for own listings) */}
                {currentUser && item.farmerName === currentUser.username && item.status !== 'sold' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleMarkSold(item._id)}
                      className="flex items-center justify-center gap-1 bg-green-100 text-green-700 py-2 rounded-xl font-bold text-xs hover:bg-green-200 transition"
                    >
                      <ThumbsUp size={14} /> {t[lang].soldOut}
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="flex items-center justify-center gap-1 bg-red-100 text-red-700 py-2 rounded-xl font-bold text-xs hover:bg-red-200 transition"
                    >
                      <Trash2 size={14} /> {t[lang].delete}
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        })}
        {listings.filter(item => {
          if (filterCrop === 'all') return true;
          const cropName = (item.cropType || '').toLowerCase();
          if (filterCrop === 'paddy') return cropName.includes('paddy') || cropName.includes('rice') || cropName.includes('වී') || cropName.includes('සහල්');
          if (filterCrop === 'tea') return cropName.includes('tea') || cropName.includes('තේ');
          if (filterCrop === 'chili') return cropName.includes('chili') || cropName.includes('chilli') || cropName.includes('මිරිස්');
          return true;
        }).length === 0 && listings.length > 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Filter size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t[lang].noListings}</p>
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {feedbackListing && (
        <FeedbackForm
          listing={feedbackListing}
          onClose={() => setFeedbackListing(null)}
          onSubmit={() => {
            setFeedbackListing(null);
            fetchListings();
          }}
          lang={lang}
        />
      )}

      {/* View Feedbacks Modal */}
      {viewFeedbackListing && (
        <FeedbackList
          listing={viewFeedbackListing}
          onClose={() => setViewFeedbackListing(null)}
          lang={lang}
        />
      )}
    </div>
  );
};

export default Marketplace;