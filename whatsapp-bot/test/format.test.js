const test = require('node:test');
const assert = require('node:assert');

const { toWhatsApp, toSpeech } = require('../src/format');

test('in-app nav links become an action the farmer can take in the chat', () => {
  const out = toWhatsApp('Try the [AI Crop Doctor](govi-nav://doctor) for that.');
  assert.match(out, /\*AI Crop Doctor\*/);
  assert.match(out, /send me a photo of the leaf/);
  assert.doesNotMatch(out, /govi-nav/);
  assert.doesNotMatch(out, /\]\(/);
});

test('nav links map to the right menu digit', () => {
  assert.match(toWhatsApp('See [Market Trends](govi-nav://trends)'), /reply \*2\*/);
  assert.match(toWhatsApp('See [Weather](govi-nav://weather)'), /reply \*3\*/);
  assert.match(toWhatsApp('See [Book Officer](govi-nav://manualBooking)'), /reply \*8\*/);
});

test('an unknown nav target keeps the label and drops the syntax', () => {
  const out = toWhatsApp('Open [Rice Varieties](govi-nav://riceVarieties)');
  assert.match(out, /\*Rice Varieties\*/);
  assert.doesNotMatch(out, /govi-nav/);
});

test('nav actions are given in Sinhala when the reply is Sinhala', () => {
  const out = toWhatsApp('[කාලගුණය](govi-nav://weather) බලන්න', 'si');
  assert.match(out, /\*3\* එවන්න/u);
  assert.doesNotMatch(out, /reply/);
});

test('markdown bold becomes WhatsApp bold', () => {
  assert.strictEqual(toWhatsApp('**Brown spot** is common'), '*Brown spot* is common');
  assert.strictEqual(toWhatsApp('***urgent***'), '*urgent*');
});

test('headings become bold lines rather than stray hashes', () => {
  assert.strictEqual(toWhatsApp('## Treatment'), '*Treatment*');
  assert.strictEqual(toWhatsApp('### Step one ###'), '*Step one*');
});

test('mixed bullet characters collapse to one clean bullet', () => {
  const out = toWhatsApp('- first\n* second\n•  third');
  assert.strictEqual(out, '• first\n• second\n• third');
});

test('numbered lists keep their numbers and lose ragged indentation', () => {
  const out = toWhatsApp('   1.  Spray early\n  2)   Drain the field');
  assert.strictEqual(out, '1. Spray early\n2. Drain the field');
});

test('runs of blank lines collapse and trailing spaces go', () => {
  const out = toWhatsApp('One   \n\n\n\nTwo   ');
  assert.strictEqual(out, 'One\n\nTwo');
});

test('tables and horizontal rules are dropped, not rendered as noise', () => {
  const out = toWhatsApp('Advice\n\n| a | b |\n---\nMore');
  assert.doesNotMatch(out, /\|/);
  assert.doesNotMatch(out, /---/);
  assert.match(out, /Advice/);
  assert.match(out, /More/);
});

test('real http links survive so a farmer can still open them', () => {
  const out = toWhatsApp('See [the site](https://govi-isuru.rashmika.dev)');
  assert.match(out, /the site: https:\/\/govi-isuru\.rashmika\.dev/);
});

test('very long answers are trimmed at a line break, not mid-word', () => {
  const body = Array.from({ length: 200 }, (_, i) => `Line number ${i}`).join('\n');
  const out = toWhatsApp(body);
  assert.ok(out.length <= 1500, `expected trimmed, got ${out.length}`);
  assert.match(out, /…$/);
});

test('empty and non-string input never throws', () => {
  assert.strictEqual(toWhatsApp(''), '');
  assert.strictEqual(toWhatsApp(null), '');
  assert.strictEqual(toWhatsApp(undefined), '');
  assert.strictEqual(toWhatsApp(42), '');
});

test('Sinhala text passes through unharmed', () => {
  const si = 'වී ගොවිතැනට **හොඳම** කාලය මහ කන්නයයි';
  assert.strictEqual(toWhatsApp(si, 'si'), 'වී ගොවිතැනට *හොඳම* කාලය මහ කන්නයයි');
});

test('toSpeech strips formatting and emoji so TTS does not read symbols aloud', () => {
  const out = toSpeech('🌾 *Brown spot*\n• spray early\n_now_');
  assert.doesNotMatch(out, /[*_•🌾]/u);
  assert.match(out, /Brown spot/);
});
