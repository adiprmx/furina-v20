'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const sharp = require('sharp');
const axios = require('axios');
const { execSync } = require('child_process');

const {
  extractYouTubeId,
  savetubeResolve,
  invidiousResolve,
  scrapeYtmp3,
  scrapeYtmp4,
  enhanceHD,
  enhanceUHD,
  searchTikTok,
  enhanceHDVideo,
  generateBananoAI,
  editImagePrompt,
  FFMPEG_BIN
} = require('../scrape/repaired_scrapers');

const { ytmp3, ytmp4 } = require('../fitur/youtubedl');

// Helper to create synthetic test image
async function createTestImage(width = 120, height = 120, color = { r: 60, g: 120, b: 240 }) {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color
    }
  }).jpeg().toBuffer();
}

// Helper to create synthetic test video
function createTestVideo(outputPath, durationSec = 1) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  execSync(`"${FFMPEG_BIN}" -y -f lavfi -i testsrc=duration=${durationSec}:size=160x120:rate=15 -c:v libx264 -pix_fmt yuv420p "${outputPath}" 2>/dev/null`);
  return outputPath;
}

const testResults = [];

function recordTest(feature, testName, status, details = '') {
  testResults.push({ feature, testName, status, details });
  const icon = status === 'PASS' ? '✅' : (status === 'FAIL' ? '❌' : '⚠️');
  console.log(`${icon} [${feature}] ${testName} -> ${status}${details ? ` (${details})` : ''}`);
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE AUDIT & RESTORATION TEST SUITE');
  console.log('====================================================\n');

  /* --------------------------------------------------------
   * 1. PLAY2
   * -------------------------------------------------------- */
  console.log('--- 1. Testing Play2 (Media Search, Metadata, Stream) ---');
  try {
    const yts = require('yt-search');
    const searchRes = await yts('Silhouette KANA-BOON');
    assert(searchRes.videos && searchRes.videos.length > 0, 'YouTube search returned no results');
    const top = searchRes.videos[0];
    assert(top.title, 'Track title is missing');
    assert(top.videoId, 'Video ID is missing');

    const audioRes = await scrapeYtmp3(`https://www.youtube.com/watch?v=${top.videoId}`);
    assert(audioRes.downloadUrl, 'Audio stream URL is empty');
    recordTest('Play2', 'Search, Metadata & Stream Resolution (Positive)', 'PASS', `Title: "${top.title.slice(0, 30)}..."`);
  } catch (err) {
    recordTest('Play2', 'Search, Metadata & Stream Resolution (Positive)', 'FAIL', err.message);
  }

  // Play2 Negative: Empty query
  try {
    const { scrapeYtmp3: failMp3 } = require('../scrape/repaired_scrapers');
    await failMp3('');
    recordTest('Play2', 'Empty Query Handling (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('Play2', 'Empty Query Handling (Negative)', 'PASS', 'Correctly rejected empty input');
  }

  /* --------------------------------------------------------
   * 2. YTMP3
   * -------------------------------------------------------- */
  console.log('\n--- 2. Testing YTMP3 (YouTube Audio Extractor & Validation) ---');
  try {
    const res = await scrapeYtmp3('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '128');
    assert(res.status === 'success', 'Status is not success');
    assert(res.downloadUrl && res.downloadUrl.startsWith('http'), 'Download URL invalid');
    assert(res.title, 'Title is empty');

    // Validate headers
    const headRes = await axios.head(res.downloadUrl, { timeout: 10000 });
    assert(headRes.status === 200, `Head status not 200 (${headRes.status})`);
    recordTest('YTMP3', 'Audio Extract & Playable Stream Validation (Positive)', 'PASS', `URL: ${res.downloadUrl.slice(0, 45)}...`);
  } catch (err) {
    recordTest('YTMP3', 'Audio Extract & Playable Stream Validation (Positive)', 'FAIL', err.message);
  }

  // YTMP3 Negative: Invalid URL
  try {
    await scrapeYtmp3('https://invalid-domain.xyz/not-youtube');
    recordTest('YTMP3', 'Invalid URL Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('YTMP3', 'Invalid URL Rejection (Negative)', 'PASS', 'Correctly rejected invalid URL');
  }

  /* --------------------------------------------------------
   * 3. YTMP4
   * -------------------------------------------------------- */
  console.log('\n--- 3. Testing YTMP4 (YouTube Video Extractor & Resolution) ---');
  try {
    const res = await scrapeYtmp4('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '720');
    assert(res.status === 'success', 'Status is not success');
    assert(res.downloadUrl && res.downloadUrl.startsWith('http'), 'Download URL invalid');
    assert(res.quality === '720', 'Quality not matching');

    // Validate video head
    const headRes = await axios.head(res.downloadUrl, { timeout: 10000 });
    assert(headRes.status === 200, `Head status not 200 (${headRes.status})`);
    recordTest('YTMP4', 'Video Extract 720p Stream Validation (Positive)', 'PASS', `URL: ${res.downloadUrl.slice(0, 45)}...`);
  } catch (err) {
    recordTest('YTMP4', 'Video Extract 720p Stream Validation (Positive)', 'FAIL', err.message);
  }

  // YTMP4 Feature Export Test (fitur/youtubedl.js)
  try {
    const vRes = await ytmp4('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '360');
    assert(vRes.downloadUrl, 'Exported ytmp4 failed');
    recordTest('YTMP4', 'fitur/youtubedl Integration (Positive)', 'PASS', `Quality: ${vRes.quality}`);
  } catch (err) {
    recordTest('YTMP4', 'fitur/youtubedl Integration (Positive)', 'FAIL', err.message);
  }

  // YTMP4 Negative: Empty input
  try {
    await scrapeYtmp4('');
    recordTest('YTMP4', 'Empty Input Handling (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('YTMP4', 'Empty Input Handling (Negative)', 'PASS', 'Correctly rejected empty input');
  }

  /* --------------------------------------------------------
   * 4. HD (Image Enhancement)
   * -------------------------------------------------------- */
  console.log('\n--- 4. Testing HD (Image Enhancement) ---');
  try {
    const testImg = await createTestImage(150, 150);
    const hdRes = await enhanceHD(testImg);
    assert(hdRes.buffer && hdRes.buffer.length > 0, 'Output buffer empty');
    assert(hdRes.width === 150 && hdRes.height === 150, 'Output dimensions corrupted');
    recordTest('HD', 'CLAHE + Unsharp Image Enhancement (Positive)', 'PASS', `Size: ${hdRes.size} bytes`);
  } catch (err) {
    recordTest('HD', 'CLAHE + Unsharp Image Enhancement (Positive)', 'FAIL', err.message);
  }

  // HD Negative: Corrupt buffer
  try {
    await enhanceHD(Buffer.from('not an image'));
    recordTest('HD', 'Corrupt Buffer Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('HD', 'Corrupt Buffer Rejection (Negative)', 'PASS', 'Correctly rejected corrupt buffer');
  }

  /* --------------------------------------------------------
   * 5. UHD (Ultra HD Super-Resolution Upscaling)
   * -------------------------------------------------------- */
  console.log('\n--- 5. Testing UHD (Super-Resolution 2x Upscaling) ---');
  try {
    const testImg = await createTestImage(100, 100);
    const uhdRes = await enhanceUHD(testImg, 2);
    assert(uhdRes.width === 200, `Expected width 200, got ${uhdRes.width}`);
    assert(uhdRes.height === 200, `Expected height 200, got ${uhdRes.height}`);
    assert(uhdRes.scale === 2, `Expected scale 2, got ${uhdRes.scale}`);
    assert(uhdRes.size > 0, 'Buffer empty');
    recordTest('UHD', 'Genuine 2x Super-Resolution Upscale (Positive)', 'PASS', `Upscaled 100x100 -> ${uhdRes.width}x${uhdRes.height}`);
  } catch (err) {
    recordTest('UHD', 'Genuine 2x Super-Resolution Upscale (Positive)', 'FAIL', err.message);
  }

  // UHD Negative: Empty buffer
  try {
    await enhanceUHD(Buffer.alloc(0));
    recordTest('UHD', 'Zero-byte Buffer Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('UHD', 'Zero-byte Buffer Rejection (Negative)', 'PASS', 'Correctly rejected zero-byte buffer');
  }

  /* --------------------------------------------------------
   * 6. SEARCHTT (TikTok Video Search & Metadata)
   * -------------------------------------------------------- */
  console.log('\n--- 6. Testing Searchtt (TikTok Video Search) ---');
  try {
    const results = await searchTikTok('furina genshin', 5);
    assert(Array.isArray(results) && results.length > 0, 'No videos found');
    const first = results[0];
    assert(first.title, 'Video title is missing');
    assert(first.author?.nickname, 'Author nickname is missing');
    assert(first.url, 'Video url is missing');
    recordTest('Searchtt', 'TikTok Query & Metadata Parser (Positive)', 'PASS', `Found ${results.length} videos; Top: "${first.title.slice(0, 30)}..."`);
  } catch (err) {
    recordTest('Searchtt', 'TikTok Query & Metadata Parser (Positive)', 'FAIL', err.message);
  }

  // Searchtt Negative: Empty query
  try {
    await searchTikTok('');
    recordTest('Searchtt', 'Empty Query Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('Searchtt', 'Empty Query Rejection (Negative)', 'PASS', 'Correctly rejected empty query');
  }

  /* --------------------------------------------------------
   * 7. HDVID (HD Video Upscaling & Processing)
   * -------------------------------------------------------- */
  console.log('\n--- 7. Testing HDVID (Video Enhancement & FFmpeg) ---');
  try {
    const inputVid = path.resolve('./temp/test_input.mp4');
    createTestVideo(inputVid, 1);
    const hdVidRes = await enhanceHDVideo(inputVid, '1080');
    assert(fs.existsSync(hdVidRes.outputPath), 'Output video does not exist');
    assert(hdVidRes.size > 0, 'Output video size is 0');
    recordTest('HDVID', 'Lanczos FFmpeg 1080p Video Upscaler (Positive)', 'PASS', `Resolution: ${hdVidRes.resolution}, Size: ${hdVidRes.size} bytes`);
    if (fs.existsSync(inputVid)) fs.unlinkSync(inputVid);
    if (fs.existsSync(hdVidRes.outputPath)) fs.unlinkSync(hdVidRes.outputPath);
  } catch (err) {
    recordTest('HDVID', 'Lanczos FFmpeg 1080p Video Upscaler (Positive)', 'FAIL', err.message);
  }

  // HDVID Negative: Missing file
  try {
    await enhanceHDVideo('/nonexistent/video.mp4');
    recordTest('HDVID', 'Missing File Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('HDVID', 'Missing File Rejection (Negative)', 'PASS', 'Correctly rejected nonexistent file');
  }

  /* --------------------------------------------------------
   * 8. EDITIMAGE2 (AI Image Processing & Transformation)
   * -------------------------------------------------------- */
  console.log('\n--- 8. Testing Editimage2 (AI Image Processing) ---');
  await new Promise(r => setTimeout(r, 2000));
  try {
    const testImg = await createTestImage(100, 100);
    const res = await editImagePrompt(testImg, 'cyberpunk neon style');
    assert(res.buffer || res.url, 'No image buffer or URL returned');
    recordTest('Editimage2', 'AI Image Processing & Style Transform (Positive)', 'PASS', `Output: ${res.provider || 'AI Studio'}`);
  } catch (err) {
    recordTest('Editimage2', 'AI Image Processing & Style Transform (Positive)', 'FAIL', err.message);
  }

  // Editimage2 Negative: Empty prompt
  try {
    const testImg = await createTestImage(100, 100);
    await editImagePrompt(testImg, '');
    recordTest('Editimage2', 'Empty Prompt Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('Editimage2', 'Empty Prompt Rejection (Negative)', 'PASS', 'Correctly rejected empty prompt');
  }

  /* --------------------------------------------------------
   * 9. EDITIMAGE (AI Image Prompt Engine)
   * -------------------------------------------------------- */
  console.log('\n--- 9. Testing Editimage (AI Image Prompt Engine) ---');
  await new Promise(r => setTimeout(r, 2000));
  try {
    const testImg = await createTestImage(100, 100);
    const res = await editImagePrompt(testImg, 'vintage watercolor');
    assert(res.buffer || res.url, 'No output returned');
    recordTest('Editimage', 'Image Prompt Guided Transformation (Positive)', 'PASS', `Result: ${res.provider || 'AI Studio'}`);
  } catch (err) {
    recordTest('Editimage', 'Image Prompt Guided Transformation (Positive)', 'FAIL', err.message);
  }

  // Editimage Negative: Null image input
  try {
    await editImagePrompt(null, 'test');
    recordTest('Editimage', 'Null Image Input Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('Editimage', 'Null Image Input Rejection (Negative)', 'PASS', 'Correctly rejected null image');
  }

  /* --------------------------------------------------------
   * 10. BANANOAI (AI Generation Engine)
   * -------------------------------------------------------- */
  console.log('\n--- 10. Testing BananoAI (AI Image Generation) ---');
  await new Promise(r => setTimeout(r, 2000));
  try {
    const res = await generateBananoAI('futuristic anime warrior');
    assert(res.buffer && res.buffer.length > 0, 'Generated buffer is empty');
    assert(res.width > 0 && res.height > 0, 'Image dimensions invalid');
    recordTest('BananoAI', 'AI Image Generation & Validation (Positive)', 'PASS', `Provider: ${res.provider}, Dimensions: ${res.width}x${res.height}`);
  } catch (err) {
    recordTest('BananoAI', 'AI Image Generation & Validation (Positive)', 'FAIL', err.message);
  }

  // BananoAI Negative: Empty prompt
  try {
    await generateBananoAI('   ');
    recordTest('BananoAI', 'Empty Prompt Rejection (Negative)', 'FAIL', 'Should have thrown error');
  } catch (err) {
    recordTest('BananoAI', 'Empty Prompt Rejection (Negative)', 'PASS', 'Correctly rejected whitespace prompt');
  }

  console.log('\n====================================================');
  console.log('📊 TEST SUMMARY RESULTS');
  console.log('====================================================');
  const passes = testResults.filter(r => r.status === 'PASS').length;
  const fails = testResults.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${testResults.length} | PASS: ${passes} | FAIL: ${fails}\n`);

  if (fails > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL 10 PRIORITY FEATURES SUCCESSFULLY TESTED AND VERIFIED!');
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
