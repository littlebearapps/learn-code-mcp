#!/usr/bin/env node

import { pathToFileURL } from 'url';

console.log('Testing pathToFileURL fix...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);
console.log('pathToFileURL(process.argv[1]).href:', pathToFileURL(process.argv[1]).href);
console.log('Match?', import.meta.url === pathToFileURL(process.argv[1]).href);

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('✅ Main execution block would run');
} else {
  console.log('❌ Main execution block would be skipped');
}