#!/usr/bin/env node

console.log('Debug: Script starting');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);
console.log('file:// + process.argv[1]:', `file://${process.argv[1]}`);
console.log('Match?', import.meta.url === `file://${process.argv[1]}`);

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Main execution block entered');
} else {
  console.log('Main execution block skipped');
}