const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Div balance
const opens = (html.match(/<div(\s|>)/gi) || []).length;
const closes = (html.match(/<\/div>/gi) || []).length;
const balance = opens - closes;
console.log(`Div balance: ${balance} (opens: ${opens}, closes: ${closes})`);

// 2. Script syntax
const scriptRegex = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
let errors = 0;
while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const attrs = match[1];
  const code = match[2];
  if (attrs.includes('application/ld+json')) {
    try {
      JSON.parse(code);
    } catch(err) {
      errors++;
      console.error(`Script #${count} (JSON-LD) error:`, err.message);
    }
  } else {
    try {
      new vm.Script(code);
    } catch (err) {
      errors++;
      console.error(`Script #${count} (JS) syntax error:`, err.message);
    }
  }
}
console.log(`Validated ${count} inline scripts, errors: ${errors}`);
if (balance !== -5 || errors > 0) {
  process.exit(1);
}
