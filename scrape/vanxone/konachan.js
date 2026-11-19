'use strict'
Object.defineProperty(exports, "__esModule", { value: true });
const __vxDef = (m) => (m && m.__esModule ? m.default : m);
const __vxNs = (m) => (m && m.__esModule ? m : (m !== null && (typeof m === 'object' || typeof m === 'function') ? Object.assign(Object.create(null), m, { default: m }) : { default: m }));
const __vxExports = {};
const axios = __vxDef(require("axios"));
const cheerio = __vxNs(require("cheerio"));

async function searchKonachan(tags) {
  const url = `https://konachan.net/post?tags=${encodeURIComponent(tags)}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(data);
    const posts = [];

    $('#post-list-posts li').each((index, element) => {
      const id = $(element).attr('id')?.replace('p', '') || null;
      const previewUrl = $(element).find('img').attr('src') || null;
      const sourceUrl = $(element).find('.thumb').attr('href') || null;

      const titleAttr = $(element).find('.thumb img').attr('title') || '';
      
      let cleanTags = [];
      if (titleAttr.includes('Tags:')) {
        const rawTags = titleAttr.split('Tags:')[1]?.split('User:')[0]?.trim();
        if (rawTags) {
          cleanTags = rawTags.split(/\s+/);
        }
      } else {
     
        cleanTags = $(element).find('img').attr('alt')?.trim().split(/\s+/) || [];
      }

      if (id) {
        posts.push({
          id: parseInt(id),
          tags: cleanTags,
          details_page: sourceUrl ? `https://konachan.net${sourceUrl}` : null,
          images: {
            preview: previewUrl ? (previewUrl.startsWith('http') ? previewUrl : `https:${previewUrl}`) : null
          }
        });
      }
    });

    return posts;
  } catch (error) {
    return { error: true, message: error.message };
  }
}

const __vxDefault = searchKonachan;
Object.defineProperty(__vxExports, "default", { enumerable: true, get: () => __vxDefault });
Object.defineProperties(exports, Object.getOwnPropertyDescriptors(__vxExports));
