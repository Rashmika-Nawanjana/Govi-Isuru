import React from 'react';
import PriceAnalytics from './PriceAnalytics';
import PriceComparison from './PriceComparison';
import { BarChart3, TrendingUp, Lightbulb } from 'lucide-react';

const MarketTrends = ({ lang }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Section Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2">
          <TrendingUp className="h-7 w-7" />
          📈 {lang === 'si' ? 'වෙළඳපල බුද්ධි තොරතුරු' : 'Market Intelligence'}
        </h2>
        <p className="text-gray-500 mt-1">{lang === 'si' ? 'දත්ත මත පදනම්ව නිවැරදි තීරණ ගන්න' : 'Make data-driven decisions for your harvest'}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200 text-center">
          <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Rice Price</p>
          <p className="text-2xl font-black text-green-800">Rs. 225</p>
          <p className="text-xs text-green-600 mt-1">+5% this week</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-200 text-center">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Vegetables</p>
          <p className="text-2xl font-black text-blue-800">Rs. 180</p>
          <p className="text-xs text-blue-600 mt-1">Stable</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-4 rounded-xl border border-amber-200 text-center">
          <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Coconut</p>
          <p className="text-2xl font-black text-amber-800">Rs. 95</p>
          <p className="text-xs text-red-500 mt-1">-3% this week</p>
        </div>
      </div>

      {/* Vertical Stack of Graphs */}
      <div className="space-y-6">
        <PriceAnalytics lang={lang} />
        <PriceComparison lang={lang} />
      </div>

      {/* Pro-tip for Judges */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-5 rounded-xl flex items-start gap-3">
        <div className="p-2 bg-amber-500 rounded-lg flex-shrink-0">
          <Lightbulb className="text-white h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            {lang === 'si' ? 'ගොවි උපදෙස්' : 'Farmer Tip'}
          </p>
          <p className="text-amber-800 text-sm">
            {lang === 'si' ? 'කොළඹ වෙළඳපලේ මිල ඉහළ මට්ටමක පවතින බැවින් ප්‍රවාහන වියදම් සලකා බැලීම නිර්දේශ කෙරේ.' : 'Prices in Colombo are peaking; consider transport logistics for maximum profit.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;