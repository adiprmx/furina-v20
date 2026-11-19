const { enhanceHDVideo } = require('../scrape/repaired_scrapers');

async function videoenhancer(videoPath, resolution = '1080') {
  if (!videoPath) throw new Error('Video harus diberikan');
  const result = await enhanceHDVideo(videoPath, resolution);
  return {
    job_id: `local_${Date.now()}`,
    input_url: videoPath,
    output_url: result.outputPath,
    resolution: result.resolution,
    size: result.size
  };
}

module.exports = {
  videoenhancer,
  enhanceHDVideo
};
