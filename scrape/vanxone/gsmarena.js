'use strict'
Object.defineProperty(exports, "__esModule", { value: true });
const __vxDef = (m) => (m && m.__esModule ? m.default : m);
const __vxExports = {};
const gsmarena = __vxDef(require("gsmarena-api"));

async function search(query) {
  return gsmarena.search.search(query);
}

async function detail(deviceId) {
  return gsmarena.catalog.getDevice(deviceId);
}

async function brands() {
  return gsmarena.catalog.getBrands();
}

async function brandDevices(brandId) {
  return gsmarena.catalog.getBrand(brandId);
}



Object.defineProperty(__vxExports, "search", { enumerable: true, get: () => search });
Object.defineProperty(__vxExports, "detail", { enumerable: true, get: () => detail });
Object.defineProperty(__vxExports, "brands", { enumerable: true, get: () => brands });
Object.defineProperty(__vxExports, "brandDevices", { enumerable: true, get: () => brandDevices });
Object.defineProperties(exports, Object.getOwnPropertyDescriptors(__vxExports));
