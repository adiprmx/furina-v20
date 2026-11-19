/**
 * Furina MD - Advanced Sticker Utilities & Services
 * Migrated from VanxOne Sticker Suite
 */

const axios = require('axios');
const fetch = require('node-fetch');
const { writeExif, writeExifImg, writeExifVid, imageToWebp } = require('./exif.js');

const DEFAULT_AVATAR = 'https://i.ibb.co/3Fh9V6p/avatar-contact.png';

// 1. Quote Chat Sticker (Quotly)
async function createQuoteChat(text, name, avatarUrl) {
  try {
    const payload = {
      type: "quote",
      format: "webp",
      backgroundColor: "#1b1429",
      width: 512,
      height: 768,
      scale: 2,
      messages: [{
        entities: [],
        avatar: true,
        from: {
          id: 1,
          name: name || "User",
          photo: { url: avatarUrl || DEFAULT_AVATAR }
        },
        text: text,
        replyMessage: {}
      }]
    };
    const res = await axios.post("https://bot.lyo.su/quote/generate", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    });
    if (res.data && res.data.result && res.data.result.image) {
      return Buffer.from(res.data.result.image, "base64");
    }
    throw new Error("Gagal merender quote sticker");
  } catch (err) {
    // Fallback using public API
    const encoded = encodeURIComponent(text);
    const encName = encodeURIComponent(name || "User");
    const encAvatar = encodeURIComponent(avatarUrl || DEFAULT_AVATAR);
    const fallbackUrl = `https://api.siputzx.my.id/api/m/qc?text=${encoded}&name=${encName}&avatar=${encAvatar}`;
    const fbRes = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(fbRes.data);
  }
}

// 2. EmojiMix (Google Kitchen Emoji)
async function mixEmoji(e1, e2) {
  try {
    const url = `https://api.siputzx.my.id/api/s/emojimix?emoji1=${encodeURIComponent(e1)}&emoji2=${encodeURIComponent(e2)}`;
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    return Buffer.from(res.data);
  } catch (err) {
    throw new Error(`Kombinasi emoji ${e1} + ${e2} tidak didukung`);
  }
}

// 3. ATTP (Animated Text to Webp)
async function createATTP(text) {
  const enc = encodeURIComponent(text);
  const endpoints = [
    `https://api.siputzx.my.id/api/m/attp?text=${enc}`,
    `https://api.lolhuman.xyz/api/attp?apikey=GataDios&text=${enc}`
  ];
  for (const ep of endpoints) {
    try {
      const res = await axios.get(ep, { responseType: 'arraybuffer', timeout: 12000 });
      if (res.data && res.data.length > 500) return Buffer.from(res.data);
    } catch (_) {}
  }
  throw new Error("Gagal membuat stiker ATTP");
}

// 4. TTP (Text to Sticker Static)
async function createTTP(text) {
  const enc = encodeURIComponent(text);
  const endpoints = [
    `https://api.siputzx.my.id/api/m/ttp?text=${enc}`,
    `https://api.lolhuman.xyz/api/ttp?apikey=GataDios&text=${enc}`
  ];
  for (const ep of endpoints) {
    try {
      const res = await axios.get(ep, { responseType: 'arraybuffer', timeout: 12000 });
      if (res.data && res.data.length > 500) return Buffer.from(res.data);
    } catch (_) {}
  }
  throw new Error("Gagal membuat stiker TTP");
}

// 5. SMeme (Meme Sticker Text Top & Bottom)
async function createSMeme(imgBuffer, topText, bottomText) {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imgBuffer, 'image.jpg');
    form.append('top', topText || '');
    form.append('bottom', bottomText || '');

    // Upload to Catbox or temporary host
    const uploadRes = await axios.post('https://catbox.moe/user/api.php', {
      reqtype: 'fileupload',
      fileToUpload: form
    }, {
      headers: form.getHeaders(),
      timeout: 20000
    }).catch(() => null);

    let imageUrl = typeof uploadRes?.data === 'string' && uploadRes.data.startsWith('http') ? uploadRes.data.trim() : null;

    if (!imageUrl) {
      // Direct API meme generator fallback
      const topEnc = encodeURIComponent(topText || '_');
      const botEnc = encodeURIComponent(bottomText || '_');
      const apiMeme = `https://api.memegen.link/images/custom/${topEnc}/${botEnc}.png?background=https://i.ibb.co/3Fh9V6p/avatar-contact.png`;
      const res = await axios.get(apiMeme, { responseType: 'arraybuffer' });
      return Buffer.from(res.data);
    }

    const memeUrl = `https://api.memegen.link/images/custom/${encodeURIComponent(topText || '_')}/${encodeURIComponent(bottomText || '_')}.png?background=${encodeURIComponent(imageUrl)}`;
    const res = await axios.get(memeUrl, { responseType: 'arraybuffer', timeout: 15000 });
    return Buffer.from(res.data);
  } catch (err) {
    throw new Error(`Gagal membuat stiker meme: ${err.message}`);
  }
}

// 6. Telegram Sticker Pack Downloader
async function getTelegramStickers(url) {
  try {
    const packName = url.split('/').pop().replace(/addstickers\//, '');
    const api = `https://api.siputzx.my.id/api/d/telesticker?url=${encodeURIComponent(url)}`;
    const res = await axios.get(api, { timeout: 15000 });
    if (res.data && res.data.status && res.data.data) {
      return res.data.data;
    }
    throw new Error("Paket stiker Telegram tidak ditemukan");
  } catch (err) {
    throw new Error(`Gagal download stiker Telegram: ${err.message}`);
  }
}

// 7. Sticker.ly Search & Download
async function searchStickerly(query) {
  try {
    const api = `https://api.siputzx.my.id/api/s/stickerly?query=${encodeURIComponent(query)}`;
    const res = await axios.get(api, { timeout: 15000 });
    if (res.data && res.data.status && res.data.data) {
      return res.data.data;
    }
    throw new Error("Stiker tidak ditemukan di Sticker.ly");
  } catch (err) {
    throw new Error(`Gagal mencari Sticker.ly: ${err.message}`);
  }
}

module.exports = {
  createQuoteChat,
  mixEmoji,
  createATTP,
  createTTP,
  createSMeme,
  getTelegramStickers,
  searchStickerly
};
