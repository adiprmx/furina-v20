'use strict'
Object.defineProperty(exports, "__esModule", { value: true });
const __vxDef = (m) => (m && m.__esModule ? m.default : m);
const __vxExports = {};
const axios = __vxDef(require("axios"));

async function fbdown(url) {
  try {
    const res = await axios.get(`https://api.azbry.com/api/download/facebook?url=${encodeURIComponent(url)}`);
    if (res.data && res.data.status) {
      return res.data;
    }
    return { status: false, message: "Gagal mengambil data dari API" };
  } catch (err) {
    return { status: false, message: err.message };
  }
}



Object.defineProperty(__vxExports, "fbdown", { enumerable: true, get: () => fbdown });
Object.defineProperties(exports, Object.getOwnPropertyDescriptors(__vxExports));
