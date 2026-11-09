// Build-time patch: apply once to the image's installed files.
const fs = require('node:fs');
const { createHash } = require('node:crypto');

const installation = process.argv[2];

if (process.argv.length !== 3) {
  throw Error('Usage: node apply.cjs <installation>');
}

const directory = installation + '/lib/vscode/out/vs/code/browser/workbench';
const jsFile = directory + '/workbench.js';
const htmlFile = directory + '/workbench.html';
let js = fs.readFileSync(jsFile, 'utf8');

// Each exact replacement must match once; reject missing or already-patched text.
for (const { before, after, reason } of require('./patch.json').replacements) {
  if (js.includes(after) || js.split(before).length !== 2) {
    throw Error('Cannot apply: ' + reason);
  }

  js = js.replace(before, () => after);
}

// Embed the stylesheet as a JavaScript string; the page text lives in welcome.js.
const css = fs.readFileSync(__dirname + '/welcome.css', 'utf8');
const code = fs.readFileSync(__dirname + '/welcome.js', 'utf8');
const styledCode = code.replace('__CODE_STATION_CSS__', () => {
  return JSON.stringify(css);
});

js += '\n' + styledCode;

// Refresh the loader URL so the deployed image does not reuse old browser code.
const html = fs.readFileSync(htmlFile, 'utf8');
const loader = /workbench\.js(?:\?[^"\s]*)?"/g;

if ([...html.matchAll(loader)].length !== 1) {
  throw Error('Expected one workbench loader.');
}

const hash = createHash('sha256').update(js).digest('hex').slice(0, 16);
const updatedHtml = html.replace(
  loader,
  'workbench.js?code-station=' + hash + '"'
);

fs.writeFileSync(jsFile, js);
fs.writeFileSync(htmlFile, updatedHtml);
