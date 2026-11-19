const { editImagePrompt, generateBananoAI } = require('./repaired_scrapers');

async function editimg(prompt, input) {
  if (!prompt && !input) throw new Error('Invalid image source or prompt');
  const result = await editImagePrompt(input, prompt);
  return result.url || result.buffer;
}

module.exports = editimg;
