import React from 'react';

/**
 * Fixed bottom tab bar for mobile — Instagram / YouTube style.
 * Uses the existing green theme colors.
 */
const MobileBottomNav = ({ items, view, onNavigate }) => {
  if (!items?.length) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-green-700/40 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
      style={{
        background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.activeWhen
            ? item.activeWhen.includes(view)
            : view === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-95 ${
                active ? 'text-white' : 'text-green-200/70'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  active ? 'bg-white/20' : ''
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'}`}>
                {item.shortLabel || item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
