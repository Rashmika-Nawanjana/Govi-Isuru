const test = require('node:test');
const assert = require('node:assert');

const {
  detectLanguage,
  formatMarketPrices,
  formatListings,
  formatAlerts,
  formatCredits
} = require('../src/text');

test('detectLanguage picks Sinhala from the script actually typed', () => {
  assert.strictEqual(detectLanguage('කොහොමද මගේ වී වගාව'), 'si');
});

test('detectLanguage picks Tamil from the script actually typed', () => {
  assert.strictEqual(detectLanguage('என் நெல் பயிர்'), 'ta');
});

test('detectLanguage falls back to the stored preference for Latin script', () => {
  assert.strictEqual(detectLanguage('what is wrong with my rice', 'si'), 'si');
  assert.strictEqual(detectLanguage('hello'), 'en');
});

test('detectLanguage falls back when there is no input at all', () => {
  assert.strictEqual(detectLanguage('', 'si'), 'si');
  assert.strictEqual(detectLanguage(null), 'en');
});

test('formatMarketPrices lists every district and omits the district key from the values', () => {
  const out = formatMarketPrices('en', [
    { district: 'Dambulla', Rice: 220, Chili: 800 },
    { district: 'Kandy', Rice: 245, Chili: 920 }
  ]);

  assert.match(out, /Dambulla/);
  assert.match(out, /Kandy/);
  assert.match(out, /Rice 220/);
  assert.doesNotMatch(out, /district Dambulla/);
});

test('formatListings truncates and reports how many were left out', () => {
  const items = Array.from({ length: 12 }, (_, i) => ({
    cropType: `Crop${i}`,
    farmerName: 'Kamal',
    quantity: '100kg',
    price: '250'
  }));

  const out = formatListings('en', items, 8);
  assert.match(out, /Crop0/);
  assert.match(out, /\+4 more/);
  assert.doesNotMatch(out, /Crop9/);
});

test('formatListings handles an empty marketplace without throwing', () => {
  assert.match(formatListings('en', []), /No active listings/);
  assert.match(formatListings('si', []), /ලැයිස්තු නොමැත/u);
});

test('formatAlerts reports a clear area rather than an empty list', () => {
  assert.match(formatAlerts('en', [], 'Medawachchiya'), /No active disease alerts/);
});

test('formatAlerts marks high severity distinctly from low', () => {
  const high = formatAlerts('en', [
    { disease: 'Blast', crop: 'Rice', gnDivision: 'GN1', reportCount: 4, severity: 'high' }
  ], 'GN1');
  const low = formatAlerts('en', [
    { disease: 'Blast', crop: 'Rice', gnDivision: 'GN1', reportCount: 1, severity: 'low' }
  ], 'GN1');

  assert.match(high, /🔴/u);
  assert.match(low, /🟡/u);
});

test('formatCredits shows the balance against the daily limit', () => {
  const out = formatCredits('en', { credits: 175, dailyLimit: 200, isPremium: false });
  assert.match(out, /175/);
  assert.match(out, /200/);
  assert.match(out, /Resets at midnight/);
});

// --- diagnosis card -------------------------------------------------------
// The model service returns `prediction` / `si_name`, not `disease`. Reading
// the wrong field printed "Unknown" for every diagnosis, so pin the contract.

const { formatDiagnosis } = require('../src/text');

const MODEL_RESPONSE = {
  success: true,
  crop_type: 'rice',
  prediction: 'Narrow Brown Leaf Spot',
  confidence: 0.8550950567470876,
  si_name: 'පටු දුඹුරු පත්‍ර ලප රෝගය',
  description: 'Linear brown lesions caused by Cercospora janseana.',
  treatment: ['Apply propiconazole', 'Avoid excess nitrogen'],
  severity: 'medium'
};

test('the diagnosis reads the model service field names, never "Unknown"', () => {
  const out = formatDiagnosis('en', MODEL_RESPONSE, 'Rice');
  assert.match(out, /Narrow Brown Leaf Spot/);
  assert.doesNotMatch(out, /Unknown/);
});

test('a Sinhala diagnosis leads with the Sinhala disease name', () => {
  const out = formatDiagnosis('si', MODEL_RESPONSE, 'වී');
  const siIndex = out.indexOf('පටු දුඹුරු');
  const enIndex = out.indexOf('Narrow Brown Leaf Spot');
  assert.ok(siIndex > -1, 'Sinhala name must be present');
  assert.ok(enIndex > siIndex, 'English name stays underneath for the officer');
});

test('treatment arrives as an array and is numbered, not printed as [object]', () => {
  const out = formatDiagnosis('en', MODEL_RESPONSE, 'Rice');
  assert.match(out, /1\.\s+Apply propiconazole/);
  assert.match(out, /2\.\s+Avoid excess nitrogen/);
  assert.doesNotMatch(out, /\[object/);
});

test('confidence is rounded and severity is shown with a colour cue', () => {
  const out = formatDiagnosis('en', MODEL_RESPONSE, 'Rice');
  assert.match(out, /86%/);
  assert.match(out, /🟠/u);
});

test('severity is translated for a Sinhala reply', () => {
  const out = formatDiagnosis('si', { ...MODEL_RESPONSE, severity: 'high' }, 'වී');
  assert.match(out, /ඉහළ/u);
  assert.match(out, /🔴/u);
});

test('a sparse response still produces a readable card', () => {
  const out = formatDiagnosis('en', { prediction: 'Leaf Blast', confidence: 0.5 }, 'Rice');
  assert.match(out, /Leaf Blast/);
  assert.match(out, /50%/);
  assert.doesNotMatch(out, /undefined/);
  assert.doesNotMatch(out, /\n\n\n/);
});

test('severity "unknown" is omitted rather than shown to the farmer', () => {
  const out = formatDiagnosis('en', { ...MODEL_RESPONSE, severity: 'unknown' }, 'Rice');
  assert.doesNotMatch(out, /unknown/i);
});
