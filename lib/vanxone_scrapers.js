/**
 * Standardized Unified Scraper Interface for Migrated VanxOne Features
 */

const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// 1. DeepSeek R1
async function chatDeepSeek(prompt) {
  try {
    const { DeepSeekThinking } = require('../scrape/vanxone/deepseek.js');
    const res = await DeepSeekThinking(prompt);
    if (res && (res.answer || res.reply || res.reasoning)) {
      return {
        status: true,
        reply: res.answer || res.reply || '',
        reasoning: res.reasoning || ''
      };
    }
    throw new Error(res?.error || 'Tidak ada balasan dari DeepSeek');
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 2. Claude Haiku
async function chatClaude(prompt) {
  try {
    const { ClaudeHaiku } = require('../scrape/vanxone/claudehaiku.js');
    const res = await ClaudeHaiku(prompt);
    const text = typeof res === 'string' ? res : (res?.reply || res?.text || res?.choices?.[0]?.message?.content || JSON.stringify(res));
    return { status: true, reply: text };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 3. Qwen 2.5
async function chatQwen(prompt) {
  try {
    const { Qwen3 } = require('../scrape/vanxone/qwen3.js');
    const res = await Qwen3(prompt);
    const text = typeof res === 'string' ? res : (res?.reply || res?.text || res?.result || JSON.stringify(res));
    return { status: true, reply: text };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 4. ChatGot
async function chatChatGot(prompt) {
  try {
    const chatgot = require('../scrape/vanxone/chatgot.js');
    const fn = typeof chatgot === 'function' ? chatgot : (chatgot.chatgot || chatgot.default);
    const res = await fn(prompt);
    const text = typeof res === 'string' ? res : (res?.reply || res?.text || JSON.stringify(res));
    return { status: true, reply: text };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 5. Unlimited AI
async function chatUnlimitedAI(prompt) {
  try {
    const { UnlimitedAI } = require('../scrape/vanxone/unlimitedai.js');
    const res = await UnlimitedAI(prompt);
    const text = typeof res === 'string' ? res : (res?.reply || res?.text || JSON.stringify(res));
    return { status: true, reply: text };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 6. Universal AIO Downloader
async function downloadAIO(url) {
  try {
    const aio = require('../scrape/vanxone/aio.js');
    const res = await aio.aiodl(url);
    if (!res) throw new Error('Gagal mengekstrak media');
    return { status: true, data: res, url: res.url || res.download || res.medias?.[0]?.url };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 7. SnapInsta (Instagram)
async function downloadSnapInsta(url) {
  try {
    const { snapinsta } = require('../scrape/vanxone/snapinsta.js');
    const res = await snapinsta(url);
    if (res && (res.length || res.url || res.data)) {
      return { status: true, media: Array.isArray(res) ? res : [res.url || res] };
    }
    throw new Error('Media Instagram tidak ditemukan');
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 8. FBDown (Facebook)
async function downloadFBDowm(url) {
  try {
    const { fbdown } = require('../scrape/vanxone/fbdown.js');
    const res = await fbdown(url);
    if (res && (res.hd || res.sd || res.url)) {
      return { status: true, hd: res.hd, sd: res.sd, url: res.hd || res.sd || res.url, duration: res.duration };
    }
    throw new Error('Video Facebook tidak ditemukan');
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 9. Twitter / X
async function downloadTwitter(url) {
  try {
    const twMod = require('../scrape/vanxone/twitter.js');
    const fn = typeof twMod === 'function' ? twMod : (twMod.default || twMod.twitter);
    const res = await fn(url);
    if (res && (res.url || res.media || res.video)) {
      return { status: true, url: res.url || res.media?.[0]?.url || res.video, caption: res.caption || res.title };
    }
    throw new Error('Tweet media tidak ditemukan');
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 10. TeraBox
async function downloadTeraBox(url) {
  try {
    const { TeraBoxDL } = require('../scrape/vanxone/terabox.js');
    const res = await TeraBoxDL(url);
    if (res && (res.files || res.dlink || res.url)) {
      return { status: true, files: res.files || [res] };
    }
    throw new Error('File TeraBox tidak ditemukan');
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 11. Videy.co
async function downloadVidey(url) {
  try {
    const videy = require('../scrape/vanxone/videy.js');
    const fn = typeof videy === 'function' ? videy : videy.default;
    const res = await fn(url);
    return { status: true, url: typeof res === 'string' ? res : (res.url || res.video) };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 12. RedNote
async function downloadRedNote(url) {
  try {
    const { RedNoteDL } = require('../scrape/vanxone/rednote.js');
    const res = await RedNoteDL(url);
    return { status: true, ...res };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 13. Likee
async function downloadLikee(url) {
  try {
    const likee = require('../scrape/vanxone/likee.js');
    const fn = typeof likee === 'function' ? likee : likee.default;
    const res = await fn(url);
    return { status: true, url: typeof res === 'string' ? res : (res.url || res.video_url), title: res.title };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 14. DramaBox
async function searchDramaBox(query) {
  try {
    const dbx = require('../scrape/vanxone/dramabox.js');
    const fn = typeof dbx === 'function' ? dbx : dbx.default;
    const res = await fn(query);
    const results = Array.isArray(res) ? res : (res.results || res.data || []);
    return { status: true, results };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 15. Google News
async function searchGoogleNews(query) {
  try {
    const { GoogleSearch } = require('../scrape/vanxone/google.js');
    const res = await GoogleSearch(query);
    const articles = Array.isArray(res) ? res : (res.results || res.articles || []);
    return { status: true, articles };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 16. DaFont
async function searchDaFont(query) {
  try {
    const { DaFont } = require('../scrape/vanxone/dafont.js');
    const res = await DaFont(query);
    const results = Array.isArray(res) ? res : (res.results || res.data || []);
    return { status: true, results };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 17. NPM Search
async function searchNpm(query) {
  try {
    const { npmsearch } = require('../scrape/vanxone/npmsearch.js');
    const res = await npmsearch(query);
    const packages = Array.isArray(res) ? res : (res.packages || res.results || []);
    return { status: true, packages };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 18. Honor of Kings Hero Info
async function getHoKHero(hero) {
  try {
    const hok = require('../scrape/vanxone/hokinfo.js');
    const fn = typeof hok === 'function' ? hok : hok.default;
    const res = await fn(hero);
    return { status: true, ...res };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 19. Wuthering Waves Resonator
async function getWuWaResonator(name) {
  try {
    const ww = require('../scrape/vanxone/wwchar.js');
    const fn = typeof ww === 'function' ? ww : ww.default;
    const res = await fn(name);
    return { status: true, ...res };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

// 20. Konachan
async function searchKonachan(query) {
  try {
    const kc = require('../scrape/vanxone/konachan.js');
    const fn = typeof kc === 'function' ? kc : kc.default;
    const res = await fn(query);
    const images = Array.isArray(res) ? res : (res.images || res.posts || []);
    return { status: true, images };
  } catch (e) {
    return { status: false, error: e.message };
  }
}

module.exports = {
  chatDeepSeek,
  chatClaude,
  chatQwen,
  chatChatGot,
  chatUnlimitedAI,
  downloadAIO,
  downloadSnapInsta,
  downloadFBDowm,
  downloadTwitter,
  downloadTeraBox,
  downloadVidey,
  downloadRedNote,
  downloadLikee,
  searchDramaBox,
  searchGoogleNews,
  searchDaFont,
  searchNpm,
  getHoKHero,
  getWuWaResonator,
  searchKonachan
};
