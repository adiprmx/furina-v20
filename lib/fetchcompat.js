// lib/fetchcompat.js — pengganti require('node-fetch') untuk file CommonJS.
// node-fetch v3 ESM-only: require() mengembalikan namespace, bukan fungsi, sehingga fetch(...) error.
// Shim ini memakai fetch bawaan Node (>=18) + menambahkan r.buffer() seperti node-fetch v2.
'use strict'
function wrap(res) {
  if (res && typeof res.buffer !== 'function') {
    Object.defineProperty(res, 'buffer', { value: () => res.arrayBuffer().then((b) => Buffer.from(b)), configurable: true })
  }
  return res
}
function fetchCompat(url, opts) {
  if (opts && opts.agent) { opts = { ...opts }; delete opts.agent }
  if (opts && opts.timeout && !opts.signal) { opts = { ...opts, signal: AbortSignal.timeout(opts.timeout) } }
  return globalThis.fetch(url, opts).then(wrap)
}
fetchCompat.default = fetchCompat
fetchCompat.Headers = globalThis.Headers
fetchCompat.Request = globalThis.Request
fetchCompat.Response = globalThis.Response
fetchCompat.FormData = globalThis.FormData
fetchCompat.isRedirect = (c) => [301, 302, 303, 307, 308].includes(c)
module.exports = fetchCompat
