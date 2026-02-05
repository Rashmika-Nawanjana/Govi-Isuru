import React from 'react';
import PriceAnalytics from './PriceAnalytics';
import PriceComparison from './PriceComparison';
import { BarChart3, TrendingUp, Lightbulb } from 'lucide-react';

const MarketTrends = ({ lang }) => {
  return (
    <div className="space-y-2 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Section Header - Compact Mobile */}
      <div className="mb-1 md:mb-2">
        <h2 className="text-sm md:text-2xl font-bold text-green-800 flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 md:h-7 md:w-7" />
          📈 {lang === 'si' ? 'වෙළඳපල බුද්ධි තොරතුරු' : 'Market Intelligence'}
        </h2>
        <p className="text-[9px] md:text-sm text-gray-500 mt-0.5 md:mt-1">{lang === 'si' ? 'දත්ත මත පදනම්ව නිවැරදි තීරණ ගන්න' : 'Make data-driven decisions for your harvest'}</p>
      </div>

      {/* Summary Cards - Compact Grid */}
      <div className="grid grid-cols-3 gap-1.5 md:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-1.5 md:p-4 rounded-lg md:rounded-xl border border-green-200 text-center">
          <p className="text-[8px] md:text-xs text-green-600 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Rice Price</p>
          <p className="text-sm md:text-2xl font-black text-green-800">Rs. 225</p>
          <p className="text-[8px] md:text-xs text-green-600 mt-0.5 md:mt-1">+5% week</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-1.5 md:p-4 rounded-lg md:rounded-xl border border-blue-200 text-center">
          <p className="text-[8px] md:text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Vegetables</p>
          <p className="text-sm md:text-2xl font-black text-blue-800">Rs. 180</p>
          <p className="text-[8px] md:text-xs text-blue-600 mt-0.5 md:mt-1">Stable</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-1.5 md:p-4 rounded-lg md:rounded-xl border border-amber-200 text-center">
          <p className="text-[8px] md:text-xs text-amber-600 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Coconut</p>
          <p className="text-sm md:text-2xl font-black text-amber-800">Rs. 95</p>
          <p className="text-[8px] md:text-xs text-red-500 mt-0.5 md:mt-1">-3% week</p>
        </div>
      </div>

      {/* Vertical Stack of Graphs */}
      <div className="space-y-2 md:space-y-6">
        <PriceAnalytics lang={lang} />
        <PriceComparison lang={lang} />
      </div>

      {/* Pro-tip - Compact Mobile */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-2 md:p-5 rounded-lg md:rounded-xl flex items-start gap-1.5 md:gap-3">
        <div className="p-1 md:p-2 bg-amber-500 rounded-lg flex-shrink-0">
          <Lightbulb className="text-white h-3.5 w-3.5 md:h-5 md:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[8px] md:text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5 md:mb-1">
            {lang === 'si' ? 'ගොවි උපදෙස්' : 'Farmer Tip'}
          </p>
          <p className="text-amber-800 text-[9px] md:text-sm">
            {lang === 'si' ? 'කොළඹ වෙළඳපලේ මිල ඉහළ මට්ටමක පවතින බැවින් ප්‍රවාහන වියදම් සලකා බැලීම නිර්දේශ කෙරේ.' : 'Prices in Colombo are peaking; consider transport logistics for maximum profit.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;