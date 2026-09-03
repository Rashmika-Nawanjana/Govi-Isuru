/**
 * Shared Govi Isuru chatbot knowledge, prompts, and topic guardrails
 */

function buildSystemPrompt(options = {}) {
  const language = options.language || 'en';
  const role = options.role || 'farmer';
  const homeView = options.homeView || 'farmerHub';

  let languageInstruction = '\n\n**IMPORTANT**: Respond in English.';
  if (language === 'si') {
    languageInstruction =
      '\n\n**IMPORTANT**: Respond in Sinhala (සිංහල). Still use the exact govi-nav:// links unchanged.';
  } else if (language === 'ta') {
    languageInstruction =
      '\n\n**IMPORTANT**: Respond in Tamil (தமிழ்). Still use the exact govi-nav:// links unchanged.';
  }

  return `You are the Govi Isuru (ගොවි ඉසුරු) AI farming assistant for Sri Lanka.

## HARD GUARDRAILS (must follow)
You ONLY answer questions about:
1. Agriculture / farming in Sri Lanka (crops, diseases, pests, fertilizer, weather for farming, yield, soil, irrigation, markets for produce)
2. The Govi Isuru platform (features, navigation, credits, hubs, AI Doctor, marketplace, bookings, profile, language, mobile/voice UI)

You MUST REFUSE unrelated topics, including programming, algorithms, homework, politics, entertainment, and non-farming medical/legal advice.

When refusing:
- Do NOT answer the off-topic question
- Briefly say you only help with farming and Govi Isuru
- Offer 2–3 on-topic alternatives with govi-nav links

Greetings (hi / ஆயுபோவன் / வணக்கம்) are allowed — greet briefly and invite a farming or app question.

## Response format (required)
- Use Markdown: **bold**, short paragraphs, bullet lists
- In-app links MUST use: [Label](govi-nav://VIEW_ID)
- Keep answers concise and practical for non-technical farmers
- For voice replies, prefer short clear sentences

## Current user
- Role: ${role}
- Home screen view id: ${homeView}

## In-app navigation map
- [Home](govi-nav://farmerHub)
- [Crop Care Hub](govi-nav://cropCareHub)
- [AI Crop Doctor](govi-nav://doctor)
- [Weather Advisory](govi-nav://weather)
- [Disease Alerts](govi-nav://alerts)
- [Crop Suitability](govi-nav://suitability)
- [Yield Forecast](govi-nav://yield)
- [Market Hub](govi-nav://marketHub)
- [Marketplace](govi-nav://market)
- [Market Trends](govi-nav://trends)
- [Agri News](govi-nav://news)
- [Rice Varieties](govi-nav://riceVarieties)
- [Consultation Hub](govi-nav://consultationHub)
- [Book Officer](govi-nav://manualBooking)
- [My Reports](govi-nav://myReports)
- [Profile](govi-nav://profile)
- Buyer: [Buyer Home](govi-nav://buyerDashboard), [Marketplace](govi-nav://marketplace), [Saved Listings](govi-nav://savedListings)
- Officer: [Officer Dashboard](govi-nav://officerDashboard), [Verify Reports](govi-nav://reportVerification), [Manual Bookings](govi-nav://instructorBookings)
- Admin: [Admin Dashboard](govi-nav://adminDashboard)

## Agricultural knowledge (Sri Lanka)
### Rice
- Seasons: Maha, Yala
- Diseases: Bacterial Leaf Blight, Brown Spot, Leaf Blast, Sheath Blight, Tungro
- Typical yield ~4–5 t/ha in good conditions

### Tea
- Prefer elevation above ~600m
- Watch Blister Blight / Brown Blight in wet periods

### Chili
- About 20–30°C
- Thrips, Leaf Spot, Yellow Virus common

Recommend platform tools with govi-nav links when helpful.
${languageInstruction}`;
}

const ON_TOPIC_RE =
  /\b(agri|agricultur|farm|farmer|crop|paddy|rice|tea|chili|chilli|pepper|soil|fertiliz|pest|disease|blight|leaf|harvest|yield|irrigat|weather|rain|monsoon|maha|yala|market|price|marketplace|listing|govi|isuru|doctor|dashboard|credit|booking|officer|instructor|gn\s*division|district|sinhala|tamil|navigate|navigation|app|hub|profile|alert|suitability|variety|seed|plant|cultivat|organic|fung|insect|thrip|whatsapp|buyer|seller|voice)\b|වී|සහල්|තේ|මිරිස්|ගොවි|ඉසුරු|රෝග|කාලගුණ|පොහොර|වෙළඳ|අස්වැන්න|වගා|කෘෂි|මිල|උපදෙස්|හබ්|වෛද්|நெல்|விவசாய|பயிர்|நோய்|வானிலை|சந்தை|விலை|கோவி|இசுரு/;

const OFF_TOPIC_RE =
  /\b(linked\s*list|algorithm|data\s*structure|leetcode|javascript|typescript|python\s*code|java\s*code|c\+\+|programming|coding|software\s*engineer|react\s*hook|binary\s*tree|sort\s*array|write\s*(a\s*)?(function|class|program)|homework\s*math|calculus|bitcoin|crypto\s*trading|movie|football|cricket\s*score|recipe\s*cake|how\s*to\s*hack)\b/;

const GREETING_RE =
  /^(hi|hello|hey|ayubowan|vanakkam|ආයුබෝවන්|හලෝ|හායි|வணக்கம்)[\s!.?]*$/i;

function isOnTopicQuery(userMessage = '') {
  const text = String(userMessage).trim();
  if (!text) return false;
  if (GREETING_RE.test(text)) return true;
  if (OFF_TOPIC_RE.test(text) && !ON_TOPIC_RE.test(text)) return false;
  if (ON_TOPIC_RE.test(text)) return true;
  if (text.length > 40 && !ON_TOPIC_RE.test(text)) return false;
  return true;
}

function offTopicRefusal(language = 'en', homeView = 'farmerHub') {
  if (language === 'si') {
    return `මට උදව් කළ හැක්කේ **කෘෂිකර්මය** සහ **ගොවි ඉසුරු** යෙදුම ගැන පමණි.

**මෙසේ අසන්න:**
- බෝග රෝග → [AI වෛද්‍ය](govi-nav://doctor)
- කාලගුණය → [කාලගුණ උපදෙස්](govi-nav://weather)
- මිල → [මිල ප්‍රවණතා](govi-nav://trends)
- මුල් පිටුව → [මුල් පිටුව](govi-nav://${homeView})`;
  }
  if (language === 'ta') {
    return `நான் **விவசாயம்** மற்றும் **Govi Isuru** செயலியைப் பற்றியே உதவ முடியும்.

**இவற்றைக் கேளுங்கள்:**
- பயிர் நோய் → [AI மருத்துவர்](govi-nav://doctor)
- வானிலை → [வானிலை ஆலோசனை](govi-nav://weather)
- விலை → [சந்தை போக்குகள்](govi-nav://trends)
- முகப்பு → [முகப்பு](govi-nav://${homeView})`;
  }
  return `I can only help with **agriculture** and the **Govi Isuru** app — not programming or unrelated topics.

**Ask me about:**
- Crop disease → [AI Crop Doctor](govi-nav://doctor)
- Weather → [Weather Advisory](govi-nav://weather)
- Prices → [Market Trends](govi-nav://trends)
- Home → [Home](govi-nav://${homeView})`;
}

function generateMockResponse(userMessage, language = 'en', options = {}) {
  const lower = (userMessage || '').toLowerCase();
  const home = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    return offTopicRefusal(language, home);
  }

  const packs = {
    en: {
      default: `I can help with **crops**, **diseases**, **weather**, **markets**, and **app navigation**.

- [AI Crop Doctor](govi-nav://doctor)
- [Weather Advisory](govi-nav://weather)
- [Market Trends](govi-nav://trends)
- [Home](govi-nav://${home})`,
      rice: `**Rice tips:** Maha season is main. Watch Leaf Blast and Brown Spot. Use [AI Crop Doctor](govi-nav://doctor) and [Weather Advisory](govi-nav://weather).`,
      weather: `Open [Weather Advisory](govi-nav://weather) for forecast and fertilizer timing tips.`,
      price: `Check [Market Trends](govi-nav://trends) or sell on [Marketplace](govi-nav://market).`,
      navigate: `Use [Home](govi-nav://${home}), [Crop Care Hub](govi-nav://cropCareHub), [Market Hub](govi-nav://marketHub). On mobile use the bottom bar.`,
      doctor: `Open [AI Crop Doctor](govi-nav://doctor), upload a clear leaf photo, then review treatment tips.`,
    },
    si: {
      default: `මම **බෝග**, **රෝග**, **කාලගුණ** සහ **යෙදුම** ගැන උදව් කරමි. [AI වෛද්‍ය](govi-nav://doctor) · [කාලගුණ උපදෙස්](govi-nav://weather) · [මුල් පිටුව](govi-nav://${home})`,
      rice: `**වී:** මහ කන්නය ප්‍රධානයි. [AI වෛද්‍ය](govi-nav://doctor) භාවිතා කරන්න.`,
      weather: `[කාලගුණ උපදෙස්](govi-nav://weather) විවෘත කරන්න.`,
      price: `[මිල ප්‍රවණතා](govi-nav://trends) බලන්න.`,
      navigate: `[මුල් පිටුව](govi-nav://${home}) සහ පහළ තීරුව භාවිතා කරන්න.`,
      doctor: `[AI වෛද්‍ය](govi-nav://doctor) විවෘත කර පත්‍ර ඡායාරූපයක් උඩුගත කරන්න.`,
    },
    ta: {
      default: `நான் **பயிர்**, **நோய்**, **வானிலை**, **சந்தை** மற்றும் **செயலி வழிகாட்டலில்** உதவுவேன். [AI மருத்துவர்](govi-nav://doctor) · [வானிலை](govi-nav://weather) · [முகப்பு](govi-nav://${home})`,
      rice: `**நெல்:** மகா பருவம் முக்கியம். [AI மருத்துவர்](govi-nav://doctor) பயன்படுத்துங்கள்.`,
      weather: `[வானிலை ஆலோசனை](govi-nav://weather) திறக்கவும்.`,
      price: `[சந்தை போக்குகள்](govi-nav://trends) பாருங்கள்.`,
      navigate: `[முகப்பு](govi-nav://${home}) மற்றும் கீழ் பட்டியைப் பயன்படுத்துங்கள்.`,
      doctor: `[AI மருத்துவர்](govi-nav://doctor) திறந்து இலைப் படம் பதிவேற்றவும்.`,
    },
  };

  const pack = packs[language] || packs.en;
  if (lower.match(/navigat|how do i|where is|menu|sidebar|බලන්න|කොහෙද|எங்கே/)) return pack.navigate;
  if (lower.match(/doctor|disease|leaf|රෝග|වෛද්|நோய்/)) return pack.doctor;
  if (lower.match(/rice|paddy|වී|සහල්|நெல்/)) return pack.rice;
  if (lower.match(/weather|කාලගුණ|rain|humidity|வானிலை/)) return pack.weather;
  if (lower.match(/price|market|මිල|වෙළඳ|விலை|சந்தை/)) return pack.price;
  return pack.default;
}

module.exports = {
  buildSystemPrompt,
  isOnTopicQuery,
  offTopicRefusal,
  generateMockResponse,
};
