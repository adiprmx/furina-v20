'use strict'
Object.defineProperty(exports, "__esModule", { value: true });
const __vxDef = (m) => (m && m.__esModule ? m.default : m);
const __vxExports = {};
const axios = __vxDef(require("axios"));
const fs = __vxDef(require("fs"));
async function imgtoprompt(media){
  try{
    const base64 = fs.readFileSync(media).toString('base64')

    const r = await axios.post(
      'https://imageprompt.org/api/ai/prompts/image',
      {
        base64Url: `data:image/webp;base64,${base64}`,
        imageModelId: 0,
        language: 'en'
      },
      {
        headers:{
          'User-Agent':'Mozilla/5.0 (Linux; Android 10)',
          'Content-Type':'application/json',
          origin:'https://imageprompt.org',
          referer:'https://imageprompt.org/image-to-prompt'
        }
      }
    )

    return {
      prompt: r.data.prompt,
      generatedAt: r.data.generatedAt
    }

  }catch(e){
    return { status:'eror', msg: e.message }
  }
}

const __vxDefault = imgtoprompt
Object.defineProperty(__vxExports, "default", { enumerable: true, get: () => __vxDefault });
Object.defineProperties(exports, Object.getOwnPropertyDescriptors(__vxExports));
