/**
 * Automated Verification & Testing Suite for Furina MD
 * Tests command dispatching, variable scopes, scrapers, sticker services, rich cards, and game logic.
 */

global.isOfflineTest = true;
process.chdir('/home/agent/workspace/FURINA UPDATE V19');
require('./settings');
const fs = require('fs');

// 1. Deterministic Network Mocks
const axios = require('axios');
const originalAxiosGet = axios.get;
const originalAxiosPost = axios.post;

axios.get = async (url, opts = {}) => {
  const strUrl = String(url);
  if (strUrl.includes('tinyurl.com/api-create.php') || strUrl.includes('is.gd/create.php')) {
    return { status: 200, data: 'https://tinyurl.com/mock-shortened' };
  }
  if (strUrl.includes('tinyurl.com/2p992aek')) {
    return {
      status: 200,
      config: { url: strUrl },
      request: { res: { responseUrl: 'https://destination-url.com/resolved' } }
    };
  }
  if (strUrl.includes('ip-api.com')) {
    return {
      status: 200,
      data: {
        status: 'success',
        country: 'United States',
        countryCode: 'US',
        regionName: 'California',
        city: 'San Jose',
        zip: '95141',
        lat: 37.3382,
        lon: -121.8863,
        timezone: 'America/Los_Angeles',
        isp: 'Cloudflare, Inc.',
        org: 'Cloudflare WARP',
        as: 'AS13335 Cloudflare, Inc.',
        query: '1.1.1.1'
      }
    };
  }
  if (strUrl.includes('/api/m/attp') || strUrl.includes('/api/m/ttp') || strUrl.includes('/api/s/emojimix') || strUrl.includes('lolhuman.xyz') || strUrl.includes('siputzx.my.id')) {
    return { status: 200, data: fs.readFileSync('./data/image/Furina1.png') };
  }
  return originalAxiosGet.call(axios, url, opts);
};

axios.post = async (url, data, opts = {}) => {
  const strUrl = String(url);
  if (strUrl.includes('bot.lyo.su/quote/generate')) {
    return {
      status: 200,
      data: {
        result: {
          image: fs.readFileSync('./data/image/Furina1.png').toString('base64')
        }
      }
    };
  }
  return originalAxiosPost.call(axios, url, data, opts);
};

// 2. Mock node-fetch
const fetch = require('node-fetch');
const originalFetch = fetch;
const mockFetch = async (url, opts = {}) => {
  const strUrl = String(url);
  if (strUrl.includes('siputzx.my.id') || strUrl.includes('carbonara.solopov.dev') || strUrl.includes('telegra.ph')) {
    return {
      ok: true,
      status: 200,
      buffer: async () => fs.readFileSync('./data/image/Furina1.png'),
      json: async () => ({ status: true, result: 'mocked' }),
      text: async () => 'mocked text'
    };
  }
  return originalFetch(url, opts);
};
require.cache[require.resolve('node-fetch')].exports = mockFetch;

// 3. Mock DNS
const dns = require('dns');
dns.promises.resolve4 = async () => ['104.16.132.229', '104.16.133.229'];
dns.promises.resolveMx = async () => [{ exchange: 'route1.mx.cloudflare.net', priority: 10 }];
dns.promises.resolveTxt = async () => [['v=spf1 include:_spf.mx.cloudflare.net ~all']];

// 4. Mock Scraper Service
const vanxScrapers = require('./lib/vanxone_scrapers.js');
vanxScrapers.chatDeepSeek = async (prompt) => ({
  status: true,
  reply: 'Bot WhatsApp adalah program berbasis sistem otomatis yang mampu beroperasi selama 24 jam nonstop.',
  reasoning: 'Normalized paraphrase.'
});

const furinaHandler = require('./Furina.js');

const sentMessages = [];
const relayedMessages = [];
const stickerMessages = [];

const mockFurina = {
  user: { id: '628999999999@s.whatsapp.net', name: 'Furina Bot' },
  ev: new (require('events').EventEmitter)(),

  decodeJid: (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const parts = jid.split(":");
      const server = parts[1].split("@")[1];
      return parts[0] + "@" + server;
    }
    return jid;
  },

  public: true,
  sendMessage: async (chat, content, opts = {}) => {
    sentMessages.push({ chat, content, opts });
    return { key: { remoteJid: chat, id: 'MOCK_SENT_' + Date.now(), fromMe: true } };
  },
  relayMessage: async (chat, content, opts = {}) => {
    relayedMessages.push({ chat, content, opts });
    return { key: { remoteJid: chat, id: 'MOCK_RELAY_' + Date.now(), fromMe: true } };
  },
  sendImageAsSticker: async (chat, media, quoted, opts = {}) => {
    stickerMessages.push({ type: 'image', chat, media, opts });
    return Buffer.from('mock_sticker_buffer');
  },
  sendVideoAsSticker: async (chat, media, quoted, opts = {}) => {
    stickerMessages.push({ type: 'video', chat, media, opts });
    return Buffer.from('mock_sticker_buffer');
  },
  profilePictureUrl: async (jid) => 'https://i.ibb.co/3Fh9V6p/avatar-contact.png',
  getName: (jid) => 'Tester User',
  sendPresenceUpdate: async () => {},
  readMessages: async () => {},
  groupMetadata: async (jid) => ({
    id: jid,
    subject: "Furina Testing Group",
    participants: [
      { id: "628123456789@s.whatsapp.net", admin: "admin" },
      { id: "628999999999@s.whatsapp.net", admin: "admin" }
    ]
  }),
};

function createMockMsg(commandWithPrefix, quoted = null) {
  const parts = commandWithPrefix.trim().split(/\s+/);
  const qText = parts.slice(1).join(' ');

  return {
    key: { remoteJid: '12036302@g.us', id: 'MSG_' + Math.random().toString(36).substring(7), fromMe: false },
    sender: '628123456789@s.whatsapp.net',
    chat: '12036302@g.us',
    isGroup: true,
    pushName: 'Tester User',
    pushname: 'Tester User',
    type: 'conversation',
    mtype: 'conversation',
    body: commandWithPrefix,
    budy: commandWithPrefix,
    text: commandWithPrefix,
    msg: { text: commandWithPrefix },
    message: { conversation: commandWithPrefix },
    quoted: quoted
  };
}

function hasText(messages, needle) {
  return messages.some(m => {
    const txt = m.content?.text || m.content?.caption || '';
    return txt.toLowerCase().includes(needle.toLowerCase());
  });
}

async function runTest(testName, cmdString, validator) {
  sentMessages.length = 0;
  relayedMessages.length = 0;
  stickerMessages.length = 0;

  if (!global.db) global.db = {};
  if (!global.db.users) global.db.users = {};
  global.db.users['628123456789@s.whatsapp.net'] = {
    limit: 1000,
    balance: 50000,
    registered: true,
    exp: 1000,
    level: 5,
    money: 100000,
    role: 'Master'
  };

  const m = createMockMsg(cmdString);
  let error = null;

  try {
    await furinaHandler(mockFurina, m, { messages: [m] }, {});
  } catch (err) {
    error = err;
  }

  const result = validator({ error, sentMessages, relayedMessages, stickerMessages, m });
  if (result.pass) {
    console.log(`✅ [PASS] ${testName}: ${result.detail}`);
    return true;
  } else {
    console.error(`❌ [FAIL] ${testName}: ${result.detail}`);
    if (error) console.error(error);
    return false;
  }
}

async function main() {
  console.log("==================================================");
  console.log("🚀 STARTING FURINA MD END-TO-END AUTOMATED TESTS");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name, cmd, val) {
    total++;
    const ok = await runTest(name, cmd, val);
    if (ok) passed++;
  }

  // 1. Network Utilities
  await test("URL Shortener (.shorturl)", ".shorturl https://google.com/test/url/very/long", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "URL SHORTENER RESULT") || hasText(sentMessages, "tinyurl.com");
    return { pass, detail: pass ? "Shortened URL successfully generated" : "No expected reply" };
  });

  await test("URL Unshorten (.unshorten)", ".unshorten https://tinyurl.com/2p992aek", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "URL RESOLVER") || hasText(sentMessages, "destination-url.com");
    return { pass, detail: pass ? "Resolved destination URL successfully" : "No expected reply" };
  });

  await test("DNS Records Inspector (.dnslookup)", ".dnslookup cloudflare.com", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "DNS RECORDS") || hasText(sentMessages, "104.16");
    return { pass, detail: pass ? "A & MX DNS records resolved" : "No expected reply" };
  });

  await test("IP Geolocation Stalker (.ipstalk)", ".ipstalk 1.1.1.1", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "IP GEOLOCATION INTEL") || hasText(sentMessages, "San Jose");
    return { pass, detail: pass ? "IP Geolocation resolved" : "No expected reply" };
  });

  // 2. Islamic Knowledge (100% Offline Database)
  await test("Ayat Kursi (.ayatkursi2)", ".ayatkursi2", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const hasAudio = sentMessages.some(m => m.content.audio);
    const hasTextResult = hasText(sentMessages, "AYAT KURSI");
    const pass = hasTextResult && hasAudio;
    return { pass, detail: pass ? "Ayat Kursi text and audio murottal delivered" : "Missing text or audio" };
  });

  await test("99 Asmaul Husna (.asmaulhusna2)", ".asmaulhusna2 1", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "Ar Rahman");
    return { pass, detail: pass ? "Asmaul Husna No. 1 retrieved" : "No expected reply" };
  });

  await test("25 Kisah Nabi (.kisahnabi2)", ".kisahnabi2 adam", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "ADAM");
    return { pass, detail: pass ? "Kisah Nabi Adam retrieved from local database" : "No expected reply" };
  });

  await test("Panduan Sholat (.bacaansholat2)", ".bacaansholat2 1", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "Subuh") || hasText(sentMessages, "BACAAN SHOLAT");
    return { pass, detail: pass ? "Bacaan Sholat Subuh delivered" : "No expected reply" };
  });

  // 3. Offline Games Sessions
  await test("Game Kimia Offline (.gamekimia)", ".gamekimia", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "GAME: GAMEKIMIA") || hasText(sentMessages, "Pertanyaan");
    return { pass, detail: pass ? "Interactive game session created" : "No game prompt sent" };
  });

  await test("Game Cak Lontong Offline (.gamelontong)", ".gamelontong", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "GAME: GAMELONTONG") || hasText(sentMessages, "Pertanyaan");
    return { pass, detail: pass ? "Lontong question prompted without network dependency" : "No prompt sent" };
  });

  // 4. Rich Interactive Cards
  await test("Live Cards Menu (.livemenu)", ".livemenu", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "KARTU HTML INTERAKTIF") || hasText(sentMessages, "flappylive");
    return { pass, detail: pass ? "Live Card menu delivered" : "No reply sent" };
  });

  await test("Flappy Bird Card (.flappylive)", ".flappylive", ({ relayedMessages, sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = relayedMessages.length > 0 || sentMessages.some(m => m.content?.react?.text === "🐦");
    return { pass, detail: pass ? "Flappy bird live card dispatched and reacted" : "No card relayed" };
  });

  await test("Dino Run Card (.dinolive)", ".dinolive", ({ relayedMessages, sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = relayedMessages.length > 0 || sentMessages.some(m => m.content?.react?.text === "🦖");
    return { pass, detail: pass ? "Dino run canvas live card dispatched and reacted" : "No card relayed" };
  });

  await test("Tetris Card (.tetrislive)", ".tetrislive", ({ relayedMessages, sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = relayedMessages.length > 0 || sentMessages.some(m => m.content?.react?.text === "🧱");
    return { pass, detail: pass ? "Tetris arcade live card dispatched and reacted" : "No card relayed" };
  });

  await test("Calculator Card (.calclive)", ".calclive", ({ relayedMessages, sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = relayedMessages.length > 0 || sentMessages.some(m => m.content?.react?.text === "🧮");
    return { pass, detail: pass ? "Interactive calculator HTML dispatched and reacted" : "No card relayed" };
  });

  await test("Piano Mini Card (.pianolive)", ".pianolive", ({ relayedMessages, sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = relayedMessages.length > 0 || sentMessages.some(m => m.content?.react?.text === "🎹");
    return { pass, detail: pass ? "Playable Web Audio piano HTML dispatched and reacted" : "No card relayed" };
  });

  // 5. Sticker Suite Services
  await test("ATTP Animation (.attp)", ".attp Test Furina", ({ stickerMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const hasSticker = stickerMessages.length > 0 || sentMessages.some(m => m.content && m.content.sticker);
    return { pass: hasSticker, detail: hasSticker ? "Rainbow animated sticker sent" : "Sticker service error" };
  });

  await test("EmojiMix Kitchen (.emix)", ".emix 😂🔥", ({ stickerMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const hasSticker = stickerMessages.length > 0 || sentMessages.some(m => m.content && m.content.sticker);
    return { pass: hasSticker, detail: hasSticker ? "Emoji combination sticker sent" : "EmojiMix error" };
  });

  await test("Brat Aesthetic Pink (.bratpink)", ".bratpink Halo Cantik", ({ stickerMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const hasSticker = stickerMessages.length > 0 || sentMessages.some(m => m.content && m.content.sticker);
    return { pass: hasSticker, detail: hasSticker ? "Brat pink sticker generated & sent" : "Brat error" };
  });

  // 6. AI Assistants
  await test("AI Text Rewriter (.paraphrase)", ".paraphrase Bot whatsapp adalah program otomatis yang berjalan 24 jam", ({ sentMessages, error }) => {
    if (error) return { pass: false, detail: error.message };
    const pass = hasText(sentMessages, "HASIL PARAFRASE AI") || hasText(sentMessages, "aplikasi berbasis sistem otomatis");
    return { pass, detail: pass ? "Paraphrased text returned by AI" : "No response" };
  });

  console.log("\n==================================================");
  console.log(`📊 TEST SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed/total)*100)}% SUCCESS RATE)`);
  console.log("==================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
