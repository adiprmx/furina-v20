const { enhanceHD, enhanceUHD } = require('../scrape/repaired_scrapers');

async function imgupscale(image, { scale = 4 } = {}) {
  const result = await enhanceUHD(image, scale);
  return result.buffer;
}

async function imgenhance(image) {
  const result = await enhanceHD(image);
  return result.buffer;
}

module.exports = {
  imgupscale,
  imgenhance,
  enhanceHD,
  enhanceUHD
};
