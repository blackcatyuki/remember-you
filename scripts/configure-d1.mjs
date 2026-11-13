import {readFileSync,writeFileSync} from 'node:fs';
const [id,...extra]=process.argv.slice(2);
if(extra.length||!id||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)){
  console.error('Provide the exact database UUID returned by your Cloudflare account. No database is created by this script.');process.exit(1);
}
const path='wrangler.jsonc';const config=JSON.parse(readFileSync(path,'utf8'));
if(config.d1_databases?.length&&config.d1_databases[0].database_id!==id){console.error('An existing binding differs. Preserve it and review before changing.');process.exit(1);}
config.d1_databases=[{binding:'DB',database_name:'remember-you-rate-limit',database_id:id,migrations_dir:'drizzle'}];
writeFileSync(path,JSON.stringify(config,null,2)+'\n');console.log('Existing D1 database bound locally. No remote operation performed.');
