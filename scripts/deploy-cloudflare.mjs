import {readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8'));
if(config.d1_databases?.length!==1||config.d1_databases[0].binding!=='DB'||!config.d1_databases[0].database_id){console.error('Deployment paused: D1 must first be created/selected with your approval and bound to DB.');process.exit(1);}
const executable=process.platform==='win32'?'npx.cmd':'npx';
// Wrangler tracks applied migrations; the existing CREATE IF NOT EXISTS does not reset counters.
execFileSync(executable,['--yes','wrangler@4.161.0','d1','migrations','apply','remember-you-rate-limit','--remote'],{stdio:'inherit'});
execFileSync(executable,['--yes','wrangler@4.161.0','deploy'],{stdio:'inherit'});
