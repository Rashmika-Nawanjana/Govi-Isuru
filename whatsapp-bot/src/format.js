/**
 * Rewrites assistant output for WhatsApp.
 *
 * The chatbot's system prompt is written for the React app: it emits Markdown
 * and in-app links like [AI Crop Doctor](govi-nav://doctor). Pasted into a
 * chat those read as broken syntax, so every answer is translated here into
 * WhatsApp's own formatting - and a navigation link becomes the thing the
 * farmer can actually do from the thread.
 */

// Where a web view maps onto something the bot can do right now.
const NAV_TO_ACTION = {
  doctor: { en: 'send me a photo of the leaf', si: 'කොළයේ ඡායාරූපයක් එවන්න' },
  cropCareHub: { en: 'send me a photo of the leaf', si: 'කොළයේ ඡායාරූපයක් එවන්න' },
  market: { en: 'reply *4*', si: '*4* එවන්න' },
  marketHub: { en: 'reply *4*', si: '*4* එවන්න' },
  trends: { en: 'reply *2*', si: '*2* එවන්න' },
  weather: { en: 'reply *3*', si: '*3* එවන්න' },
  alerts: { en: 'reply *5*', si: '*5* එවන්න' },
  suitability: { en: 'reply *6*', si: '*6* එවන්න' },
  yield: { en: 'reply *7*', si: '*7* එවන්න' },
  manualBooking: { en: 'reply *8*', si: '*8* එවන්න' },
  consultationHub: { en: 'reply *8*', si: '*8* එවන්න' },
  news: { en: 'send *news*', si: '*news* එවන්න' }
};

function navAction(viewId, lang) {
  const entry = NAV_TO_ACTION[viewId];
  if (!entry) return null;
  return entry[lang] || entry.en;
}

/**
 * Converts one assistant answer into a WhatsApp-ready message.
 * Safe on empty input and never throws - a formatting bug must not cost the
 * farmer their answer.
 */
function toWhatsApp(input, lang = 'en') {
  if (!input || typeof input !== 'string') return '';

  let out = input;

  try {
    // [Label](govi-nav://view) -> "Label (reply *2*)" so it is actionable here
    out = out.replace(/\[([^\]]+)\]\(govi-nav:\/\/([A-Za-z0-9_-]+)\)/g, (_m, label, view) => {
      const action = navAction(view, lang);
      return action ? `*${label.trim()}* — ${action}` : `*${label.trim()}*`;
    });

    // Any other markdown link: keep the words, keep a real URL if there is one
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1: $2');
    out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

    // Bare protocol leftovers
    out = out.replace(/govi-nav:\/\/[A-Za-z0-9_-]+/g, '').replace(/\(\s*\)/g, '');

    // Headings become bold lines
    out = out.replace(/^\s{0,3}#{1,6}\s*(.+?)\s*#*\s*$/gm, (_m, h) => `*${h.trim()}*`);

    // Fenced code is meaningless in farmer advice; keep the contents
    out = out.replace(/```[a-zA-Z]*\n?/g, '');

    // Markdown bold/italic -> WhatsApp. Bold first so ** is consumed before *.
    out = out.replace(/\*\*\*(.+?)\*\*\*/gs, '*$1*');
    out = out.replace(/\*\*(.+?)\*\*/gs, '*$1*');
    out = out.replace(/__(.+?)__/gs, '*$1*');
    // A single _italic_ already matches WhatsApp, leave it alone.

    // Bullets: -, *, • at the start of a line become a single clean bullet
    out = out.replace(/^\s*[-*•]\s+/gm, '• ');

    // Numbered lists: normalise indentation, keep the numbers
    out = out.replace(/^\s*(\d+)[.)]\s+/gm, '$1. ');

    // Tables and rules do not survive a chat bubble
    out = out.replace(/^\s*\|.*\|\s*$/gm, '');
    out = out.replace(/^\s*[-=_*]{3,}\s*$/gm, '');

    // Tidy whitespace: no trailing spaces, at most one blank line
    out = out.replace(/[ \t]+$/gm, '');
    out = out.replace(/\n{3,}/g, '\n\n');
    out = out.trim();

    // WhatsApp starts truncating very long bubbles; keep answers readable.
    const LIMIT = 1400;
    if (out.length > LIMIT) {
      const cut = out.lastIndexOf('\n', LIMIT);
      out = out.slice(0, cut > LIMIT * 0.6 ? cut : LIMIT).trim() + '…';
    }
  } catch {
    return String(input).trim();
  }

  return out;
}

/** Plain text for text-to-speech: no bullets, no asterisks, no emoji noise. */
function toSpeech(input) {
  if (!input) return '';
  return String(input)
    .replace(/[*_~`]/g, '')
    .replace(/^\s*•\s*/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

module.exports = { toWhatsApp, toSpeech, NAV_TO_ACTION };
