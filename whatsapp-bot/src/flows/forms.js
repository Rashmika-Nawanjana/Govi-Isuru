const api = require('../api');
const { t, pick, formatSuitability, formatYield } = require('../text');

/**
 * Multi-step forms. Each step asks one short question, because a farmer on a
 * feature phone keyboard will not fill in a paragraph. The cursor lives
 * server-side so a bot restart mid-form does not strand anyone.
 */

const SEASONS = { 1: 'Maha', 2: 'Yala' };

const SOILS = { 1: 'Loam', 2: 'Clay', 3: 'Sandy' };

function askSeason(lang) {
  return pick(lang, {
    en: 'Which season?\n\n*1* Maha (Oct–Mar)\n*2* Yala (Apr–Sep)',
    si: 'කුමන කන්නයද?\n\n*1* මහ (ඔක්–මාර්)\n*2* යල (අප්‍රේ–සැප්)'
  });
}

// --------------------------------------------------------------- suitability

const suitability = {
  async start(ctx) {
    await api.setSession(ctx.jid, 'suitability', 1, {});
    await ctx.reply(pick(ctx.lang, {
      en: '🌱 *Which crop suits my land*\n\nFour quick questions.\n\nWhich district is your land in?',
      si: '🌱 *මගේ ඉඩමට සුදුසු බෝග*\n\nප්‍රශ්න හතරක්.\n\nඔබේ ඉඩම කුමන දිස්ත්‍රික්කයේද?'
    }));
  },

  async handle(ctx, session) {
    const draft = session.draft || {};
    const answer = ctx.body.trim();

    if (session.step === 1) {
      draft.district = answer;
      await api.setSession(ctx.jid, 'suitability', 2, draft);
      return ctx.reply(askSeason(ctx.lang));
    }

    if (session.step === 2) {
      draft.season = SEASONS[answer] || 'Maha';
      await api.setSession(ctx.jid, 'suitability', 3, draft);
      return ctx.reply(pick(ctx.lang, {
        en: 'What is your soil like?\n\n*1* Loam\n*2* Clay\n*3* Sandy',
        si: 'ඔබේ පස කෙබඳුද?\n\n*1* ලෝම්\n*2* මැටි\n*3* වැලි'
      }));
    }

    if (session.step === 3) {
      draft.soilType = SOILS[answer] || 'Loam';
      await api.setSession(ctx.jid, 'suitability', 4, draft);
      return ctx.reply(pick(ctx.lang, {
        en: 'Do you have irrigation?\n\n*1* Yes\n*2* No (rain-fed)',
        si: 'ඔබට වාරිමාර්ග තිබේද?\n\n*1* ඔව්\n*2* නැත (වර්ෂාව මත)'
      }));
    }

    if (session.step === 4) {
      draft.irrigation = answer !== '2';
      await api.clearSession(ctx.jid);
      await ctx.typing();

      try {
        const token = await ctx.token();
        const res = await api.suitability(token, {
          district: draft.district,
          season: draft.season,
          soilType: draft.soilType,
          irrigation: draft.irrigation
        });
        return ctx.reply(formatSuitability(ctx.lang, res.recommendations, res.source));
      } catch (err) {
        if (err.status === 403) {
          return ctx.reply(t.insufficientCredits(ctx.lang, err.body?.credits ?? 0, 20));
        }
        console.warn('Suitability failed:', err.message);
        return ctx.reply(t.error(ctx.lang));
      }
    }

    return api.clearSession(ctx.jid);
  }
};

// --------------------------------------------------------------------- yield

const yieldFlow = {
  async start(ctx) {
    const district = ctx.user?.district;

    if (district) {
      // We already know where they farm - skip straight to the season
      await api.setSession(ctx.jid, 'yield', 2, { district });
      return ctx.reply(pick(ctx.lang, {
        en: `📊 *Yield & profit* for *${district}*.\n\n${askSeason(ctx.lang)}`,
        si: `📊 *${district}* සඳහා *අස්වැන්න සහ ලාභය*.\n\n${askSeason(ctx.lang)}`
      }));
    }

    await api.setSession(ctx.jid, 'yield', 1, {});
    return ctx.reply(pick(ctx.lang, {
      en: '📊 *Yield & profit*\n\nWhich district?',
      si: '📊 *අස්වැන්න සහ ලාභය*\n\nකුමන දිස්ත්‍රික්කයද?'
    }));
  },

  async handle(ctx, session) {
    const draft = session.draft || {};
    const answer = ctx.body.trim();

    if (session.step === 1) {
      draft.district = answer;
      await api.setSession(ctx.jid, 'yield', 2, draft);
      return ctx.reply(askSeason(ctx.lang));
    }

    if (session.step === 2) {
      draft.season = SEASONS[answer] || 'Maha';
      await api.setSession(ctx.jid, 'yield', 3, draft);
      return ctx.reply(pick(ctx.lang, {
        en: 'How many hectares? (e.g. 1.5)',
        si: 'හෙක්ටයාර කීයද? (උදා: 1.5)'
      }));
    }

    if (session.step === 3) {
      const area = parseFloat(answer.replace(',', '.'));
      if (!Number.isFinite(area) || area <= 0) {
        return ctx.reply(pick(ctx.lang, {
          en: 'Please send a number, for example *1.5*',
          si: 'කරුණාකර අංකයක් එවන්න, උදා: *1.5*'
        }));
      }

      await api.clearSession(ctx.jid);
      await ctx.typing();

      try {
        const token = await ctx.token();
        const res = await api.predictYield(token, {
          district: draft.district,
          season: draft.season,
          area_ha: area,
          year: new Date().getFullYear()
        });
        return ctx.reply(formatYield(ctx.lang, res));
      } catch (err) {
        if (err.status === 403) {
          return ctx.reply(t.insufficientCredits(ctx.lang, err.body?.credits ?? 0, 20));
        }
        console.warn('Yield failed:', err.message);
        return ctx.reply(t.error(ctx.lang));
      }
    }

    return api.clearSession(ctx.jid);
  }
};

module.exports = { suitability, yield: yieldFlow };
