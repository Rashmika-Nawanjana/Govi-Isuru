const HUGGINGFACE_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const PRIMARY_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';
const FALLBACK_MODEL = 'meta-llama/Llama-3.1-8B-Instruct';
const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN || '';

/**
 * Build system prompt with platform KB + markdown + in-app navigation links
 */
function buildSystemPrompt(options = {}) {
  const language = options.language || 'en';
  const role = options.role || 'farmer';
  const homeView = options.homeView || 'farmerHub';

  const languageInstruction =
    language === 'si'
      ? '\n\n**IMPORTANT**: Respond in Sinhala (සිංහල). Still use the exact govi-nav:// links unchanged.'
      : '\n\n**IMPORTANT**: Respond in English.';

  return `You are the Govi Isuru (ගොවි ඉසුරු) AI farming assistant for Sri Lanka.

## HARD GUARDRAILS (must follow)
You ONLY answer questions about:
1. Agriculture / farming in Sri Lanka (crops, diseases, pests, fertilizer, weather for farming, yield, soil, irrigation, markets for produce)
2. The Govi Isuru platform (features, navigation, credits, hubs, AI Doctor, marketplace, bookings, profile, language, mobile UI)

You MUST REFUSE unrelated topics, including but not limited to:
- Programming, coding, algorithms, data structures (e.g. linked lists), software engineering
- General school/homework, math, science unrelated to farming
- Politics, entertainment, sports, medical advice for humans, legal advice
- Any topic that is not farming or Govi Isuru

When refusing:
- Do NOT answer the off-topic question at all (no code, no tutorials, no partial answers)
- Briefly say you can only help with farming and Govi Isuru
- Offer 2–3 on-topic alternatives with govi-nav links when useful
- Example refusal: "I can only help with **agriculture** and the **Govi Isuru** app. Try [AI Crop Doctor](govi-nav://doctor) or ask about rice, tea, chili, weather, or market prices."

Greetings like "hi" / "hello" are allowed — greet briefly and invite a farming or app question.

## Response format (required)
- Use Markdown: **bold** for key terms, short paragraphs, and bullet lists with \`-\` or numbered lists.
- When guiding users inside the app, ALWAYS include clickable navigation links using EXACTLY this format:
  [Label](govi-nav://VIEW_ID)
- Never invent fake https URLs for in-app pages. External news/websites may use normal https links.
- Keep answers practical and concise (usually under 180 words unless the user asks for detail).

## Current user
- Role: ${role}
- Home screen view id: ${homeView}

## In-app navigation map (VIEW_ID values)
Use these exact ids in govi-nav links:

### Farmer (most common)
- [Home](govi-nav://farmerHub) — dashboard (credits, alerts, activity)
- [Crop Care Hub](govi-nav://cropCareHub)
- [AI Crop Doctor](govi-nav://doctor) — upload leaf photo for disease detection
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

### Buyer
- [Buyer Home](govi-nav://buyerDashboard)
- [Marketplace](govi-nav://marketplace)
- [Saved Listings](govi-nav://savedListings)

### Agricultural Instructor / Officer
- [Officer Dashboard](govi-nav://officerDashboard)
- [Verify Reports](govi-nav://reportVerification)
- [Manual Bookings](govi-nav://instructorBookings)

### Admin
- [Admin Dashboard](govi-nav://adminDashboard)

### Mobile UI tips to mention when helpful
- Bottom tab bar: Home, Crop, Market, Consult, You
- Top bar: Back and Home buttons when inside nested pages
- Menu (☰): language, dark mode, logout, credits

## Agricultural knowledge (Sri Lanka focus)
### Rice (paddy)
- Seasons: Maha (main), Yala
- Common diseases: Bacterial Leaf Blight, Brown Spot, Leaf Blast, Sheath Blight, Tungro
- Water: maintain proper water management; avoid prolonged flooding of infected fields
- Typical good yield range: ~4–5 t/ha depending on variety and district

### Tea
- Best above ~600m with good rainfall
- Watch Blister Blight and Brown Blight in wet periods
- Use AI Crop Doctor for leaf symptoms; check Weather for humidity risk

### Chili
- Prefers warm low/mid elevations (~20–30°C)
- Common issues: Thrips, Leaf Spot, Yellow Virus
- Spacing, drainage, and pest monitoring matter

### Platform tools to recommend
- Disease ID → [AI Crop Doctor](govi-nav://doctor)
- Weather / fertilizer timing → [Weather Advisory](govi-nav://weather)
- Prices → [Market Trends](govi-nav://trends) or [Marketplace](govi-nav://market)
- Yield / profit → [Yield Forecast](govi-nav://yield)
- Local outbreaks → [Disease Alerts](govi-nav://alerts)
- Expert help → [Book Officer](govi-nav://manualBooking)

Example navigation answer:
"Open **AI Crop Doctor**, then upload a clear leaf photo. Tap here: [AI Crop Doctor](govi-nav://doctor)."
${languageInstruction}`;
}

const ON_TOPIC_RE =
  /\b(agri|agricultur|farm|farmer|crop|paddy|rice|tea|chili|chilli|pepper|soil|fertiliz|pest|disease|blight|leaf|harvest|yield|irrigat|weather|rain|monsoon|maha|yala|market|price|marketplace|listing|govi|isuru|doctor|dashboard|credit|booking|officer|instructor|gn\s*division|district|sinhala|navigate|navigation|app|hub|profile|alert|suitability|variety|seed|plant|cultivat|organic|fung|insect|thrip|whatsapp|buyer|seller)\b|වී|සහල්|තේ|මිරිස්|ගොවි|ඉසුරු|රෝග|කාලගුණ|පොහොර|වෙළඳ|අස්වැන්න|වගා|කෘෂි|මිල|උපදෙස්|හබ්|වෛද්/;

const OFF_TOPIC_RE =
  /\b(linked\s*list|algorithm|data\s*structure|leetcode|javascript|typescript|python\s*code|java\s*code|c\+\+|programming|coding|software\s*engineer|react\s*hook|binary\s*tree|sort\s*array|write\s*(a\s*)?(function|class|program)|homework\s*math|calculus|bitcoin|crypto\s*trading|movie|football|cricket\s*score|recipe\s*cake|how\s*to\s*hack)\b|ලින්ක්ඩ්\s*ලිස්ට්|ප්‍රෝග්‍රෑම්|කේතය|ඇල්ගොරිතම/;

const GREETING_RE =
  /^(hi|hello|hey|ayubowan|ආයුබෝවන්|හලෝ|හායි)[\s!.?]*$/i;

function isOnTopicQuery(userMessage = '') {
  const text = String(userMessage).trim();
  if (!text) return false;
  if (GREETING_RE.test(text)) return true;
  if (OFF_TOPIC_RE.test(text) && !ON_TOPIC_RE.test(text)) return false;
  if (ON_TOPIC_RE.test(text)) return true;
  // Short vague questions may still be farming follow-ups; allow model to decide
  // but hard-block clear off-topic patterns already handled above.
  // For longer messages with no agri/platform signal, treat as off-topic.
  if (text.length > 40 && !ON_TOPIC_RE.test(text)) return false;
  return true;
}

function offTopicRefusal(language = 'en', homeView = 'farmerHub') {
  if (language === 'si') {
    return `මට උදව් කළ හැක්කේ **කෘෂිකර්මය** සහ **ගොවි ඉසුරු** යෙදුම ගැන පමණි — වෙනත් මාතෘකා (කේතනය, පාඨමාලා, ආදිය) ගැන පිළිතුරු දෙන්නේ නැත.

**මෙසේ අසන්න:**
- බෝග රෝග → [AI වෛද්‍ය](govi-nav://doctor)
- කාලගුණය → [කාලගුණ උපදෙස්](govi-nav://weather)
- මිල / වෙළඳපොළ → [මිල ප්‍රවණතා](govi-nav://trends)
- මුල් පිටුව → [මුල් පිටුව](govi-nav://${homeView})`;
  }

  return `I can only help with **agriculture** and the **Govi Isuru** app — not programming, homework, or unrelated topics.

**Ask me about:**
- Crop disease → [AI Crop Doctor](govi-nav://doctor)
- Weather for farming → [Weather Advisory](govi-nav://weather)
- Prices / selling → [Market Trends](govi-nav://trends)
- App home → [Home](govi-nav://${homeView})`;
}

function generateMockResponse(userMessage, language = 'en', options = {}) {
  const lower = (userMessage || '').toLowerCase();
  const home = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    return offTopicRefusal(language, home);
  }

  const en = {
    default: `I can help with **crops**, **diseases**, **weather**, **markets**, and **app navigation**.

**Try these:**
- Detect disease → [AI Crop Doctor](govi-nav://doctor)
- Check weather → [Weather Advisory](govi-nav://weather)
- See prices → [Market Trends](govi-nav://trends)
- Go home → [Home](govi-nav://${home})

Ask me anything about rice, tea, or chili farming.`,
    rice: `**Rice tips (Sri Lanka)**
- Best main season: **Maha**
- Watch for **Bacterial Leaf Blight**, **Brown Spot**, and **Leaf Blast**
- Keep good water management and remove heavily infected leaves

**Next steps**
1. Photo a sick leaf → [AI Crop Doctor](govi-nav://doctor)
2. Check humidity/rain risk → [Weather Advisory](govi-nav://weather)
3. See local outbreaks → [Disease Alerts](govi-nav://alerts)`,
    tea: `**Tea cultivation**
- Prefers elevation **above ~600m** and steady rainfall
- Wet weather increases **Blister Blight** risk

Use [AI Crop Doctor](govi-nav://doctor) for leaf checks and [Weather Advisory](govi-nav://weather) before spraying.`,
    chili: `**Chili tips**
- Ideal temperature about **20–30°C**
- Common pests/diseases: **Thrips**, **Leaf Spot**, **Yellow Virus**
- Keep spacing and drainage clean

Diagnose leaves in [AI Crop Doctor](govi-nav://doctor) or sell produce in [Marketplace](govi-nav://market).`,
    weather: `Open **Weather Advisory** for your district forecast, humidity fungal risk, and fertilizer timing tips.

➡️ [Weather Advisory](govi-nav://weather)`,
    price: `Check live crop price patterns in **Market Trends**, or list/sell in **Marketplace**.

- [Market Trends](govi-nav://trends)
- [Marketplace](govi-nav://market)`,
    navigate: `**How to move around Govi Isuru**
- **Home** dashboard: [Home](govi-nav://${home})
- **Crop tools**: [Crop Care Hub](govi-nav://cropCareHub)
- **Sell & prices**: [Market Hub](govi-nav://marketHub)
- **Officer booking**: [Book Officer](govi-nav://manualBooking)

On mobile, use the **bottom bar** (Home · Crop · Market · Consult · You). Use **Back** / **Home** in the top bar to return.`,
    doctor: `To detect crop disease:
1. Open [AI Crop Doctor](govi-nav://doctor)
2. Upload a clear leaf photo
3. Review diagnosis, confidence, and treatment tips`,
  };

  const si = {
    default: `මම **බෝග**, **රෝග**, **කාලගුණ**, **වෙළඳපොළ** සහ **යෙදුම් සංචාලනය** ගැන උදව් කරමි.

**උත්සාහ කරන්න:**
- රෝග හඳුනාගැනීම → [AI වෛද්‍ය](govi-nav://doctor)
- කාලගුණය → [කාලගුණ උපදෙස්](govi-nav://weather)
- මිල → [මිල ප්‍රවණතා](govi-nav://trends)
- මුල් පිටුව → [මුල් පිටුව](govi-nav://${home})`,
    rice: `**වී වගා උපදෙස්**
- ප්‍රධාන කන්නය: **මහ**
- පොදු රෝග: **Bacterial Leaf Blight**, **Brown Spot**, **Leaf Blast**

[AI වෛද්‍ය](govi-nav://doctor) සහ [කාලගුණ උපදෙස්](govi-nav://weather) භාවිතා කරන්න.`,
    tea: `**තේ**: ~600m ඉහළ, හොඳ වර්ෂාපතනය. තෙත් කාලයේ Blister Blight අවදානම වැඩි වේ.

[AI වෛද්‍ය](govi-nav://doctor) · [කාලගුණ උපදෙස්](govi-nav://weather)`,
    chili: `**මිරිස්**: ~20–30°C. Thrips, Leaf Spot, Yellow Virus ගැන සැලකිලිමත් වන්න.

[AI වෛද්‍ය](govi-nav://doctor) · [වෙළඳසැල](govi-nav://market)`,
    weather: `ඔබේ දිස්ත්‍රික්කයේ අනාවැකි සඳහා [කාලගුණ උපදෙස්](govi-nav://weather) විවෘත කරන්න.`,
    price: `මිල සඳහා [මිල ප්‍රවණතා](govi-nav://trends) සහ විකිණීමට [වෙළඳසැල](govi-nav://market).`,
    navigate: `**සංචාලනය**
- [මුල් පිටුව](govi-nav://${home})
- [බෝග හබ්](govi-nav://cropCareHub)
- [වෙළඳ හබ්](govi-nav://marketHub)
- [නිලධාරියා වෙන් කරන්න](govi-nav://manualBooking)

ජංගම දුරකථනයේ **පහළ තීරුව** භාවිතා කරන්න.`,
    doctor: `රෝග හඳුනා ගැනීමට [AI වෛද්‍ය](govi-nav://doctor) විවෘත කර පත්‍ර ඡායාරූපයක් උඩුගත කරන්න.`,
  };

  const pack = language === 'si' ? si : en;
  if (lower.match(/navigat|how do i|where is|menu|sidebar|බලන්න|යන්න|කොහෙද/)) return pack.navigate;
  if (lower.match(/doctor|disease|leaf|රෝග|වෛද්/)) return pack.doctor;
  if (lower.match(/rice|paddy|වී|සහල්/)) return pack.rice;
  if (lower.match(/tea|තේ/)) return pack.tea;
  if (lower.match(/chili|chilli|මිරිස්/)) return pack.chili;
  if (lower.match(/weather|කාලගුණ|rain|humidity/)) return pack.weather;
  if (lower.match(/price|market|මිල|වෙළඳ/)) return pack.price;
  return pack.default;
}

function buildMessages(userMessage, history = [], options = {}) {
  const messages = [];
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });
  return [{ role: 'system', content: buildSystemPrompt(options) }, ...messages];
}

async function callModelAPI(messages, options = {}, modelName = PRIMARY_MODEL) {
  if (!HF_API_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not set in environment variables');
  }

  const payload = {
    model: modelName,
    messages,
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature || 0.6,
    top_p: options.top_p || 0.9,
  };

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 503) {
    throw new Error('Model is loading, please try again in 20 seconds');
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Hugging Face API Error: ${response.status} ${errBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Unexpected response format from Hugging Face Router API');
  return content.trim();
}

/**
 * Stream tokens from HF (SSE). Yields string chunks.
 */
async function* streamModelAPI(messages, options = {}, modelName = PRIMARY_MODEL) {
  if (!HF_API_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not set in environment variables');
  }

  const payload = {
    model: modelName,
    messages,
    max_tokens: options.max_tokens || 4096,
    temperature: options.temperature || 0.6,
    top_p: options.top_p || 0.9,
    stream: true,
  };

  const response = await fetch(HUGGINGFACE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 503) {
    throw new Error('Model is loading, please try again in 20 seconds');
  }

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Hugging Face API Error: ${response.status} ${errBody}`);
  }

  if (!response.body) {
    throw new Error('No stream body from Hugging Face API');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore partial JSON
      }
    }
  }
}

async function* streamMockResponse(text) {
  // Reveal in small chunks with a natural typing pace
  const parts = text.match(/.{1,4}|(\s+)/g) || [text];
  for (const part of parts) {
    yield part;
    await new Promise((r) => setTimeout(r, 22));
  }
}

async function generateResponse(userMessage, history = [], options = {}) {
  const language = options.language || 'en';
  const homeView = options.homeView || 'farmerHub';

  // Hard guardrail before calling the model
  if (!isOnTopicQuery(userMessage)) {
    return {
      success: true,
      answer: offTopicRefusal(language, homeView),
      model: 'Guardrail',
      source: 'Topic Guardrail',
    };
  }

  const messages = buildMessages(userMessage, history, options);
  let response;
  let modelUsed = PRIMARY_MODEL;

  try {
    try {
      response = await callModelAPI(messages, options, PRIMARY_MODEL);
    } catch (error) {
      if (
        error.message.includes('loading') ||
        error.message.includes('503') ||
        error.message.includes('Model is loading')
      ) {
        try {
          response = await callModelAPI(messages, options, FALLBACK_MODEL);
          modelUsed = FALLBACK_MODEL;
        } catch {
          response = generateMockResponse(userMessage, language, options);
          modelUsed = 'MOCK';
        }
      } else if (!HF_API_TOKEN || error.message.includes('HUGGINGFACE_API_TOKEN')) {
        response = generateMockResponse(userMessage, language, options);
        modelUsed = 'MOCK';
      } else {
        throw error;
      }
    }

    return {
      success: true,
      answer: response,
      model: modelUsed === 'MOCK' ? 'Assistant' : modelUsed.split('/')[1],
      source: modelUsed === 'MOCK' ? 'Local Knowledge Base' : 'Hugging Face Router API',
    };
  } catch (error) {
    console.error('Chatbot error:', error.message);
    const mockResponse = generateMockResponse(userMessage, language, options);
    return {
      success: true,
      answer: mockResponse,
      model: 'Assistant',
      source: 'Local Knowledge Base',
    };
  }
}

/**
 * Async generator for SSE streaming endpoint
 */
async function* streamResponse(userMessage, history = [], options = {}) {
  const language = options.language || 'en';
  const homeView = options.homeView || 'farmerHub';

  if (!isOnTopicQuery(userMessage)) {
    for await (const chunk of streamMockResponse(offTopicRefusal(language, homeView))) {
      yield { type: 'token', content: chunk };
    }
    yield { type: 'done', model: 'Guardrail', source: 'Topic Guardrail' };
    return;
  }

  const messages = buildMessages(userMessage, history, options);
  let modelUsed = PRIMARY_MODEL;

  try {
    try {
      for await (const chunk of streamModelAPI(messages, options, PRIMARY_MODEL)) {
        yield { type: 'token', content: chunk };
      }
    } catch (error) {
      const canFallback =
        error.message.includes('loading') ||
        error.message.includes('503') ||
        error.message.includes('Model is loading') ||
        error.message.includes('stream') ||
        !HF_API_TOKEN;

      if (!canFallback && HF_API_TOKEN) {
        try {
          const full = await callModelAPI(messages, options, FALLBACK_MODEL);
          modelUsed = FALLBACK_MODEL;
          for await (const chunk of streamMockResponse(full)) {
            yield { type: 'token', content: chunk };
          }
        } catch {
          modelUsed = 'MOCK';
          const mock = generateMockResponse(userMessage, language, options);
          for await (const chunk of streamMockResponse(mock)) {
            yield { type: 'token', content: chunk };
          }
        }
      } else {
        try {
          for await (const chunk of streamModelAPI(messages, options, FALLBACK_MODEL)) {
            modelUsed = FALLBACK_MODEL;
            yield { type: 'token', content: chunk };
          }
        } catch {
          modelUsed = 'MOCK';
          const mock = generateMockResponse(userMessage, language, options);
          for await (const chunk of streamMockResponse(mock)) {
            yield { type: 'token', content: chunk };
          }
        }
      }
    }
  } catch (error) {
    console.error('Stream chatbot error:', error.message);
    modelUsed = 'MOCK';
    const mock = generateMockResponse(userMessage, language, options);
    for await (const chunk of streamMockResponse(mock)) {
      yield { type: 'token', content: chunk };
    }
  }

  yield {
    type: 'done',
    model: modelUsed === 'MOCK' ? 'Assistant' : modelUsed.split('/')[1],
    source: modelUsed === 'MOCK' ? 'Local Knowledge Base' : 'Hugging Face Router API',
  };
}

module.exports = {
  generateResponse,
  streamResponse,
  callModelAPI,
  buildSystemPrompt,
  generateMockResponse,
  isOnTopicQuery,
  offTopicRefusal,
};
