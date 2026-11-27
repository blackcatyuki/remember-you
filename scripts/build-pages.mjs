import './build-cloudflare.mjs';
import {writeFile} from 'node:fs/promises';
await writeFile('dist/client/_routes.json', JSON.stringify({version:1,include:['/api','/api/*'],exclude:[]},null,2));
