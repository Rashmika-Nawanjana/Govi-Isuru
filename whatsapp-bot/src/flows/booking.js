const api = require('../api');
const { t, pick } = require('../text');

/**
 * Book an agricultural instructor.
 *
 * The booking lifecycle itself is a State pattern on the server; this only
 * creates the request. Accept / reject / complete arrive back here as
 * EventBus-driven push messages, never as polling.
 */

function formatInstructors(lang, list) {
  const head = pick(lang, {
    en: '👨‍🌾 *Agricultural instructors*\n\nReply with a number to see their open slots.',
    si: '👨‍🌾 *කෘෂිකර්ම උපදේශකයින්*\n\nඅංකයක් එවා විවෘත කාලයන් බලන්න.'
  });

  const body = list.slice(0, 8).map((o, i) => {
    const where = [o.dsDivision, o.district].filter(Boolean).join(', ');
    return `*${i + 1}. ${o.fullName || o.username}*${o.designation ? `\n  ${o.designation}` : ''}${where ? `\n  ${where}` : ''}`;
  }).join('\n\n');

  return `${head}\n\n${body}`;
}

function formatSlots(lang, slots) {
  if (!slots.length) {
    return pick(lang, {
      en: 'No open slots for this instructor. Send *8* to pick another.',
      si: 'මෙම උපදේශකයාට විවෘත කාලයන් නොමැත. තවත් අයෙකු සඳහා *8* එවන්න.'
    });
  }

  const head = pick(lang, { en: '📅 *Open slots*', si: '📅 *විවෘත කාලයන්*' });
  const body = slots.slice(0, 8).map((s, i) => {
    const when = new Date(s.startTime || s.date);
    const stamp = Number.isNaN(when.getTime())
      ? (s.date || '')
      : when.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' });
    return `*${i + 1}.* ${stamp}${s.mode ? ` · ${s.mode}` : ''}`;
  }).join('\n');

  return `${head}\n\n${body}\n\n${pick(lang, { en: 'Reply with a number.', si: 'අංකයක් එවන්න.' })}`;
}

const booking = {
  async start(ctx) {
    if (ctx.isGuest) {
      await ctx.reply(t.notLinkedForThis(ctx.lang));
      return;
    }

    await ctx.typing();

    try {
      const token = await ctx.token();
      const res = await api.instructors(token);
      const list = res.instructors || res.data || res || [];

      if (!list.length) {
        return ctx.reply(pick(ctx.lang, {
          en: 'No instructors are available right now.',
          si: 'දැනට උපදේශකයින් නොමැත.'
        }));
      }

      await api.setSession(ctx.jid, 'booking', 1, {
        instructors: list.slice(0, 8).map((o) => ({
          id: o._id || o.id,
          name: o.fullName || o.username
        }))
      });

      return ctx.reply(formatInstructors(ctx.lang, list));
    } catch (err) {
      console.warn('Instructor list failed:', err.message);
      return ctx.reply(t.error(ctx.lang));
    }
  },

  async handle(ctx, session) {
    const draft = session.draft || {};
    const index = parseInt(ctx.body.trim(), 10) - 1;

    if (session.step === 1) {
      const chosen = (draft.instructors || [])[index];
      if (!chosen) {
        return ctx.reply(pick(ctx.lang, {
          en: 'Please reply with one of the numbers listed.',
          si: 'ලැයිස්තුගත අංකයක් එවන්න.'
        }));
      }

      await ctx.typing();

      try {
        const token = await ctx.token();
        const res = await api.instructorSlots(token, chosen.id);
        const slots = res.slots || res.data || res || [];

        if (!slots.length) {
          await api.clearSession(ctx.jid);
          return ctx.reply(formatSlots(ctx.lang, []));
        }

        await api.setSession(ctx.jid, 'booking', 2, {
          instructor: chosen,
          slots: slots.slice(0, 8).map((s) => ({
            id: s._id || s.id,
            startTime: s.startTime || s.date
          }))
        });

        return ctx.reply(formatSlots(ctx.lang, slots));
      } catch (err) {
        console.warn('Slot list failed:', err.message);
        await api.clearSession(ctx.jid);
        return ctx.reply(t.error(ctx.lang));
      }
    }

    if (session.step === 2) {
      const slot = (draft.slots || [])[index];
      if (!slot) {
        return ctx.reply(pick(ctx.lang, {
          en: 'Please reply with one of the numbers listed.',
          si: 'ලැයිස්තුගත අංකයක් එවන්න.'
        }));
      }

      await api.setSession(ctx.jid, 'booking', 3, { ...draft, slot });
      return ctx.reply(pick(ctx.lang, {
        en: 'What do you need advice about? (one line)',
        si: 'ඔබට කුමක් ගැන උපදෙස් අවශ්‍යද? (එක් පේළියක්)'
      }));
    }

    if (session.step === 3) {
      const topic = ctx.body.trim();
      await api.clearSession(ctx.jid);
      await ctx.typing();

      try {
        const token = await ctx.token();
        await api.createBooking(token, {
          instructorId: draft.instructor.id,
          slotId: draft.slot.id,
          topic
        });

        return ctx.reply(pick(ctx.lang, {
          en: `✅ Request sent to *${draft.instructor.name}*.\n\nI will message you here as soon as they accept or decline.`,
          si: `✅ ඉල්ලීම *${draft.instructor.name}* වෙත යවා ඇත.\n\nපිළිතුර ලැබුණු විට මම මෙහි දන්වන්නම්.`
        }));
      } catch (err) {
        console.warn('Booking failed:', err.message);
        return ctx.reply(pick(ctx.lang, {
          en: `⚠️ ${err.body?.error || err.body?.msg || 'That slot could not be booked.'}\n\nSend *8* to try another.`,
          si: `⚠️ එම කාලය වෙන් කළ නොහැකි විය.\n\nතවත් අයෙකු සඳහා *8* එවන්න.`
        }));
      }
    }

    return api.clearSession(ctx.jid);
  }
};

module.exports = { booking };
