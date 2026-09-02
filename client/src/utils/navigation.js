export const cropCareViews = ['doctor', 'weather', 'alerts', 'suitability', 'yield'];
export const marketViews = ['market', 'trends', 'news', 'riceVarieties'];
export const consultationViews = ['manualBooking', 'myReports'];

export function getHomeView(role) {
  if (role === 'admin') return 'adminDashboard';
  if (role === 'officer') return 'officerDashboard';
  if (role === 'buyer') return 'buyerDashboard';
  return 'farmerHub';
}

export function getParentView(view, role) {
  if (cropCareViews.includes(view)) return 'cropCareHub';
  if (marketViews.includes(view)) return 'marketHub';
  if (consultationViews.includes(view)) return 'consultationHub';
  if (['cropCareHub', 'marketHub', 'consultationHub'].includes(view)) return getHomeView(role);
  if (role === 'buyer' && ['marketplace', 'savedListings', 'news', 'riceVarieties'].includes(view)) {
    return 'buyerDashboard';
  }
  if (role === 'officer' && ['reportVerification', 'instructorBookings', 'alerts', 'news', 'riceVarieties'].includes(view)) {
    return 'officerDashboard';
  }
  if (role === 'admin' && view === 'news') return 'adminDashboard';
  if (view === 'profile') return getHomeView(role);
  return null;
}

export function canGoBack(view, role) {
  return getParentView(view, role) !== null;
}

const titlesEn = {
  farmerHub: 'Farmer Hub',
  cropCareHub: 'Crop Care',
  marketHub: 'Market Hub',
  consultationHub: 'Consultation',
  doctor: 'AI Doctor',
  weather: 'Weather',
  alerts: 'Disease Alerts',
  suitability: 'Crop Suitability',
  yield: 'Yield Forecast',
  market: 'Marketplace',
  trends: 'Market Trends',
  news: 'Agri News',
  riceVarieties: 'Rice Varieties',
  manualBooking: 'Manual Booking',
  myReports: 'My Reports',
  profile: 'Profile',
  buyerDashboard: 'Buyer Dashboard',
  marketplace: 'Marketplace',
  savedListings: 'Saved Listings',
  officerDashboard: 'Area Dashboard',
  reportVerification: 'Verify Reports',
  instructorBookings: 'Bookings',
  adminDashboard: 'Admin Dashboard',
};

const titlesSi = {
  farmerHub: 'ගොවි හබ්',
  cropCareHub: 'බෝග හබ්',
  marketHub: 'වෙළඳ හබ්',
  consultationHub: 'උපදෙස්',
  doctor: 'AI වෛද්‍ය',
  weather: 'කාලගුණය',
  alerts: 'රෝග අනතුරු',
  suitability: 'බෝග සුදුසුකම',
  yield: 'අස්වැන්න',
  market: 'වෙළඳසැල',
  trends: 'මිල ප්‍රවණතා',
  news: 'ප්‍රවෘත්ති',
  riceVarieties: 'සහල් වර්ග',
  manualBooking: 'වෙන්කරවා ගැනීම',
  myReports: 'මගේ වාර්තා',
  profile: 'පැතිකඩ',
  buyerDashboard: 'ගැණුම්කරු',
  marketplace: 'වෙළඳසැල',
  savedListings: 'සුරක්ෂිත',
  officerDashboard: 'ප්‍රදේශ උපකරණ පුවරුව',
  reportVerification: 'වාර්තා සත්‍යාපනය',
  instructorBookings: 'වෙන්කරවා ගැනීම',
  adminDashboard: 'පරිපාලක',
};

export function getViewTitle(view, lang) {
  const map = lang === 'si' ? titlesSi : titlesEn;
  return map[view] || (lang === 'si' ? 'උපකරණ පුවරුව' : 'Dashboard');
}

export function isNavItemActive(itemId, view) {
  if (view === itemId) return true;
  if (itemId === 'cropCareHub' && cropCareViews.includes(view)) return true;
  if (itemId === 'marketHub' && marketViews.includes(view)) return true;
  if (itemId === 'consultationHub' && consultationViews.includes(view)) return true;
  return false;
}
