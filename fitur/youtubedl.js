const { scrapeYtmp3, scrapeYtmp4, extractYouTubeId } = require('../scrape/repaired_scrapers');
const axios = require('axios');

async function getYoutubeTitle(url) {
  try {
    const { data } = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`, { timeout: 5000 });
    return data.title || 'YouTube Video';
  } catch {
    return 'YouTube Video';
  }
}

async function ytmp3(url) {
  const result = await scrapeYtmp3(url, '128');
  return {
    title: result.title,
    downloadUrl: result.downloadUrl,
    thumbnail: result.thumbnail,
    duration: result.duration
  };
}

async function ytmp4(url, quality = '720') {
  const result = await scrapeYtmp4(url, quality);
  return {
    title: result.title,
    downloadUrl: result.downloadUrl,
    thumbnail: result.thumbnail,
    quality: result.quality,
    duration: result.duration
  };
}

module.exports = { ytmp3, ytmp4, extractVideoId: extractYouTubeId, getYoutubeTitle };
