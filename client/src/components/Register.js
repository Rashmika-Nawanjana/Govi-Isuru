import React, { useState } from 'react';
import axios from 'axios';
import { User, MapPin, Lock, ArrowRight, Loader2, Sprout, Globe, KeyRound, Leaf, CheckCircle } from 'lucide-react';
import { administrativeData } from '../data/sriLankaData'; 

const Register = ({ onRegisterSuccess, switchToLogin, lang }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', district: '', dsDivision: '', gnDivision: ''
  });

  const districts = Object.keys(administrativeData);
  const dsDivisions = formData.district ? Object.keys(administrativeData[formData.district]) : [];
  const gnDivisions = (formData.district && formData.dsDivision) 
    ? administrativeData[formData.district][formData.dsDivision] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'district') setFormData({ ...formData, district: value, dsDivision: '', gnDivision: '' });
    else if (name === 'dsDivision') setFormData({ ...formData, dsDivision: value, gnDivision: '' });
    else setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/register', formData);
      
      // AUTO-LOGGING LOGIC: Save the token and user object immediately
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Notify the parent component (App.js) that registration/login was successful
      onRegisterSuccess(res.data.user); 
    } catch (err) {
      alert(lang === 'si' ? "ලියාපදිංචි වීම අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න." : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const getProgress = () => {
    let filled = 0;
    if (formData.username) filled++;
    if (formData.password) filled++;
    if (formData.district) filled++;
    if (formData.dsDivision) filled++;
    if (formData.gnDivision) filled++;
    return (filled / 5) * 100;
  };

  return (
    <div className="w-full max-w-xl p-1 animate-in fade-in zoom-in duration-500">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNhKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50"></div>
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
              {lang === 'si' ? 'ගොවි ගිණුම සාදන්න' : 'Create Farmer Profile'}
            </h2>
            <p className="text-green-200 text-sm">
              {lang === 'si' ? 'ශ්‍රී ලාංකීය ගොවි ප්‍රජාවට එකතු වන්න' : 'Join the Sri Lankan Farming Community'}
            </p>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6 mx-auto max-w-xs">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-200 mt-2">{Math.round(getProgress())}% complete</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider flex items-center gap-1">
                <User size={12} /> {lang === 'si' ? 'සම්පූර්ණ නම' : 'Full Name'}
              </label>
              <input 
                type="text" 
                name="username" 
                required 
                placeholder="Ex: Namal Perera" 
                onChange={handleChange} 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:bg-white rounded-xl transition-all outline-none text-gray-700 font-medium" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider flex items-center gap-1">
                <Lock size={12} /> {lang === 'si' ? 'මුරපදය' : 'Password'}
              </label>
              <input 
                type="password" 
                name="password" 
                required 
                placeholder="••••••••" 
                onChange={handleChange} 
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:bg-white rounded-xl transition-all outline-none text-gray-700" 
              />
            </div>
          </div>

          <hr className="border-gray-100 my-2" />

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Globe className="text-green-600" size={14} />
              </div>
              <span className="text-sm font-bold text-gray-600">{lang === 'si' ? 'ඔබේ ස්ථානය' : 'Your Location'}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 ml-1">District</label>
                <select 
                  name="district" 
                  required 
                  value={formData.district} 
                  onChange={handleChange} 
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 outline-none font-medium text-gray-600 text-sm cursor-pointer transition-all"
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 ml-1">DS Division</label>
                <select 
                  name="dsDivision" 
                  required 
                  value={formData.dsDivision} 
                  onChange={handleChange} 
                  disabled={!formData.district}
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 outline-none font-medium text-gray-600 text-sm disabled:opacity-40 cursor-pointer transition-all"
                >
                  <option value="">Select DS Division</option>
                  {dsDivisions.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 ml-1">GN Division</label>
                <select 
                  name="gnDivision" 
                  required 
                  value={formData.gnDivision} 
                  onChange={handleChange} 
                  disabled={!formData.dsDivision}
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 outline-none font-medium text-gray-600 text-sm disabled:opacity-40 cursor-pointer transition-all"
                >
                  <option value="">Select GN Division</option>
                  {gnDivisions.map(gn => <option key={gn} value={gn}>{gn}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs font-bold text-green-700 mb-2">What you'll get:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <span className="flex items-center gap-1"><CheckCircle size={12} /> AI Disease Detection</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Market Price Alerts</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Weather Advisories</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Community Network</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 hover:-translate-y-0.5 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <span>{lang === 'si' ? 'ලියාපදිංචිය අවසන් කරන්න' : 'Create My Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">or</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={switchToLogin}
            className="w-full p-3.5 border-2 border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <KeyRound size={16} />
            {lang === 'si' ? 'දැනටමත් ගිණුමක් තිබේද? ඇතුළු වන්න' : 'Already have an account? Login'}
          </button>
        </form>
      </div>
      
      <p className="text-center mt-6 text-green-100/60 text-xs font-medium">
        🔒 Safe & Secure Digital Farming Ecosystem
      </p>
    </div>
  );
};

export default Register;