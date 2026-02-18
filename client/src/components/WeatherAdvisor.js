import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wind, AlertCircle, MapPin, Calendar, CloudSun, Droplets } from 'lucide-react';

const WeatherAdvisor = ({ lat, lon, lang, user }) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:5000';
  
  // Use user's GN Division or weather.name as fallback
  const locationName = user?.gnDivision || weather?.name || 'Your Location';

  useEffect(() => {
    const fetchAllWeather = async () => {
      if (!lat || !lon) return;

      try {
        // 1. Fetch Current Weather
        const currentUrl = `${API_BASE}/api/weather/current?lat=${lat}&lon=${lon}&units=metric`;
        const currentRes = await axios.get(currentUrl);
        setWeather(currentRes.data);

        // 2. Fetch 5-Day Forecast
        const forecastUrl = `${API_BASE}/api/weather/forecast?lat=${lat}&lon=${lon}&units=metric`;
        const forecastRes = await axios.get(forecastUrl);
        
        // Filter to get midday (12:00) forecast for the next 5 days
        const dailyData = forecastRes.data.list.filter(item => item.dt_txt.includes("12:00:00"));
        setForecast(dailyData);
      } catch (err) {
        console.error("Weather data fetch failed", err);
      }
    };
    fetchAllWeather();
  }, [API_BASE, lat, lon]);

  if (!weather) return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
        <CloudSun className="h-6 w-6 text-blue-500" />
      </div>
      <p className="text-gray-500 font-medium">{lang === 'si' ? 'කාලගුණය පූරණය වෙමින්...' : 'Detecting local climate...'}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Section Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          <CloudSun className="h-7 w-7 text-blue-500" />
          🌤️ {lang === 'si' ? 'කාලගුණ උපදෙස්' : 'Weather Advisory'}
        </h2>
        <p className="text-gray-500 mt-1">{lang === 'si' ? 'ඔබේ ප්‍රදේශයේ කාලගුණ අනාවැකිය' : 'Local weather forecast for farming'}</p>
      </div>

      {/* SECTION 1: Current Weather & Agro-Advice */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 text-white">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
            <MapPin size={14} /> {locationName}
          </div>
          <h3 className="text-lg font-bold">{lang === 'si' ? 'වත්මන් තත්ත්වය' : 'Current Weather'}</h3>
        </div>
        
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <img 
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} 
                alt="weather" 
                className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0"
              />
              <div>
                <p className="text-4xl md:text-5xl font-black text-gray-800">{Math.round(weather.main.temp)}°C</p>
                <p className="text-xs md:text-sm text-gray-500 capitalize font-medium">{weather.weather[0].description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-orange-50 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-orange-100 text-center">
                <Droplets size={16} className="text-blue-500 mx-auto mb-1"/>
                <p className="text-[10px] md:text-xs text-gray-500">Humidity</p>
                <p className="text-base md:text-lg font-bold text-gray-800">{weather.main.humidity}%</p>
              </div>
              <div className="bg-blue-50 px-3 py-2 md:px-4 md:py-3 rounded-xl border border-blue-100 text-center">
                <Wind size={16} className="text-blue-400 mx-auto mb-1"/>
                <p className="text-[10px] md:text-xs text-gray-500">Wind</p>
                <p className="text-base md:text-lg font-bold text-gray-800">{weather.wind.speed} m/s</p>
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <AlertCircle className="text-white" size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                {lang === 'si' ? 'ගොවි උපදෙස්' : 'Farming Advice'}
              </p>
              <p className="text-gray-700 font-medium text-sm leading-relaxed">
                {weather.main.humidity > 80 
                  ? (lang === 'si' ? "අධික ආර්ද්‍රතාවය - දිලීර රෝග ගැන විමසිලිමත් වන්න. පොහොර යෙදීම වළක්වන්න." : "High humidity - watch for fungal diseases. Avoid applying fertilizers today.") 
                  : weather.main.temp > 35
                    ? (lang === 'si' ? "අධික උෂ්ණත්වය - බෝග වල ජල සැපයුම සහතික කරන්න." : "High temperature - ensure adequate irrigation for your crops.")
                    : (lang === 'si' ? "අද දින වගා කටයුතු සඳහා කාලගුණය යහපත්ය." : "Weather is suitable for cultivation activities today.")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 5-Day Forecast Grid */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-600 mb-4 flex items-center gap-2">
          <Calendar size={16} />
          {lang === 'si' ? '5 දින අනාවැකිය' : '5-Day Forecast'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {forecast.map((day, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200 text-center hover:shadow-md hover:scale-105 transition-all">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                {new Date(day.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}
              </p>
              <img 
                src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} 
                alt="weather icon" 
                className="w-14 h-14 mx-auto"
              />
              <p className="text-2xl font-black text-gray-800">{Math.round(day.main.temp)}°C</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase mt-0.5">{day.weather[0].main}</p>
              
              {/* Future Logic: Simple Recommendation per day */}
              {day.weather[0].main === 'Rain' && (
                <p className="text-[9px] text-red-500 font-bold mt-2 bg-red-50 rounded-full px-2 py-0.5">🌧️ {lang === 'si' ? 'පොහොර එපා' : 'No Fertilizer'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherAdvisor;