'use strict'
Object.defineProperty(exports, "__esModule", { value: true });
const __vxDef = (m) => (m && m.__esModule ? m.default : m);
const __vxExports = {};
const axios = __vxDef(require("axios"));
async function dramaboxsearch(q){
  try{
    const r = await axios.get(`https://www.dramabox.com/search?searchValue=${encodeURIComponent(q)}`)

    const json = JSON.parse(
      r.data.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)[1]
    )
    const list = json.props.pageProps.bookList || []
    return {
      query: q,
      total: list.length,
      results: list.map(v => ({
        id: v.bookId,
        title: v.bookName,
        episodes: v.totalChapterNum,
        description: v.introduction,
        cover: v.coverCutWap || v.coverWap,
        play_url: `https://www.dramabox.com/video/${v.bookId}_${v.bookNameEn}/${v.chapterId}_Episode-1`
      }))
    }

  }catch(e){
    return { status:'eror', msg: e.message }
  }
}

const __vxDefault = dramaboxsearch
Object.defineProperty(__vxExports, "default", { enumerable: true, get: () => __vxDefault });
Object.defineProperties(exports, Object.getOwnPropertyDescriptors(__vxExports));
