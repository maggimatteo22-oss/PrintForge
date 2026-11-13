const fs = require('fs');
const path = require('path');

const root = __dirname;
const indexHtmlContent = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// List of file destinations to mirror index.html
const mirrorHtmlPaths = [
  path.join(root, 'public', 'index.html'),
  path.join(root, 'printforge-github-vercel', 'index.html'),
  path.join(root, 'printforge-github-vercel', 'public', 'index.html')
];

mirrorHtmlPaths.forEach(dst => {
  if (fs.existsSync(path.dirname(dst))) {
    fs.writeFileSync(dst, indexHtmlContent, 'utf8');
    console.log(`Synced HTML -> ${dst}`);
  } else {
    console.warn(`Dir does not exist for: ${dst}`);
  }
});

// Update lib/indexHtml.ts and printforge-github-vercel/lib/indexHtml.ts if they exist
const tsFiles = [
  path.join(root, 'lib', 'indexHtml.ts'),
  path.join(root, 'printforge-github-vercel', 'lib', 'indexHtml.ts')
];

const tsContent = `export const indexHtml = ${JSON.stringify(indexHtmlContent)};\nexport const fallbackHtml = indexHtml;\nexport default indexHtml;\n`;

tsFiles.forEach(dst => {
  if (fs.existsSync(path.dirname(dst))) {
    fs.writeFileSync(dst, tsContent, 'utf8');
    console.log(`Synced TS -> ${dst}`);
  } else {
    console.warn(`Dir does not exist for: ${dst}`);
  }
});

console.log('All mirrors successfully synced!');
