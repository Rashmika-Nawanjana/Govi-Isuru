const { spawn } = require('child_process');

/**
 * ffmpeg bridges WhatsApp's audio format and Google Speech's.
 *
 * In:  WhatsApp voice note - OGG/Opus, 48kHz          -> STT wants LINEAR16 WAV 16kHz mono
 * Out: Google TTS - MP3                               -> WhatsApp wants OGG/Opus for a push-to-talk bubble
 *
 * node:22-alpine ships without ffmpeg; the Dockerfile installs it. If that
 * step is ever dropped, voice fails silently, so probe() is called at boot.
 */

function run(args, input) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    const out = [];
    const err = [];

    proc.stdout.on('data', (d) => out.push(d));
    proc.stderr.on('data', (d) => err.push(d));

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) return resolve(Buffer.concat(out));
      reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(err).toString().slice(-400)}`));
    });

    proc.stdin.on('error', () => { /* closed early - the close handler reports it */ });
    proc.stdin.end(input);
  });
}

/** WhatsApp voice note -> 16kHz mono WAV that Google STT accepts. */
async function voiceNoteToWav(buffer) {
  return run(['-hide_banner', '-loglevel', 'error',
    '-i', 'pipe:0',
    '-ar', '16000', '-ac', '1',
    '-f', 'wav', 'pipe:1'], buffer);
}

/** Google TTS MP3 -> OGG/Opus so WhatsApp renders a real voice bubble. */
async function mp3ToVoiceNote(buffer) {
  return run(['-hide_banner', '-loglevel', 'error',
    '-i', 'pipe:0',
    '-c:a', 'libopus', '-b:a', '32k', '-ar', '48000', '-ac', '1',
    '-f', 'ogg', 'pipe:1'], buffer);
}

/** Fails loudly at boot rather than silently at the first voice note. */
function probe() {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

module.exports = { voiceNoteToWav, mp3ToVoiceNote, probe };
