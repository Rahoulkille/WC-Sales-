// MEDIA = { key: url }, one file per key in assets/media (named by key).
// In dev/build these are plain file URLs, so nothing is inlined. In build:single
// they're inlined as data: URIs, and the app turns video ones into blob URLs
// exactly as the checkpoint did.
const files = import.meta.glob('/assets/media/*', { eager: true, query: '?url', import: 'default' });
const MEDIA = {};
for (const p in files) MEDIA[p.split('/').pop().replace(/\.[^.]+$/, '')] = files[p];
export default MEDIA;
