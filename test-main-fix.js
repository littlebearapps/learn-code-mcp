#!/usr/bin/env node

console.log('Testing main execution fix...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);
console.log('new URL(process.argv[1], "file:").href:', new URL(process.argv[1], 'file:').href);
console.log('Match?', import.meta.url === new URL(process.argv[1], 'file:').href);

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  console.log('✅ Main execution block would run');
} else {
  console.log('❌ Main execution block would be skipped');
}