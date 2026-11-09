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

// One substitution pass keeps quotes and placeholder-like text as literal data.
const config = require('./config.json');
const css = fs.readFileSync(__dirname + '/welcome.css', 'utf8');
const code = fs.readFileSync(__dirname + '/welcome.js', 'utf8');
const placeholder = /__CODE_STATION_(CONFIG|CSS)__/g;
const configuredCode = code.replace(placeholder, (_, kind) => {
  const value = kind === 'CONFIG' ? config : css;
  return JSON.stringify(value);
});

js += '\n' + configuredCode;

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
