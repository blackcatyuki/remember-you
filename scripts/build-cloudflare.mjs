import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
// Same React sources and public assets; no embedded base64 assets in this target.
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--outDir','dist/client'], {stdio:'inherit'});
await mkdir('dist/client',{recursive:true});
await writeFile('dist/client/_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: same-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/index.html
  Cache-Control: no-cache
`);
console.log('Cloudflare Static Assets build ready. No resources created, no deployment performed.');
