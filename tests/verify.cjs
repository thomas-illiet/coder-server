// Integration tests for the independent folders; no npm dependencies.
// Usage: node tests/verify.cjs <pristine official installation> [another ...]
// Only disposable copies are modified. Source installations are read-only.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const repository = path.resolve(__dirname, '..');
const features = ['chat', 'logout', 'welcome'];
const relative = 'lib/vscode/out/vs/code/browser/workbench';
const sources = process.argv.slice(2);

assert.ok(sources.length, 'Provide a pristine code-server 4.145.2 installation.');
let passed = 0;

// Compare appended payloads in a stable order; the two browser headers are unique.
function canonical(text) {
  const positions = ['\n// Runs in the browser,', '\n// Browser code,']
    .map(header => text.indexOf(header))
    .filter(index => index >= 0)
    .sort((a, b) => a - b);

  if (!positions.length) {
    return text;
  }

  const blocks = positions.map((start, index) => text.slice(start, positions[index + 1]));
  return text.slice(0, positions[0]) + blocks.sort().join('');
}

for (const source of sources) {
  const original = fs.readFileSync(path.join(source, relative, 'workbench.js'), 'utf8');
  const html = fs.readFileSync(path.join(source, relative, 'workbench.html'), 'utf8');
  assert.equal(
    createHash('sha256').update(original).digest('hex'),
    '71c94e00e4b0b5586d0351692b3a814f025822a2420390c541ebfce656a5869a'
  );

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'independent-patches-'));
  const installation = path.join(temporary, 'installation');
  const target = path.join(installation, relative);
  fs.mkdirSync(target, { recursive: true });

  // No root applicator, root config or shared helper is copied into this tree.
  for (const name of features) {
    fs.cpSync(
      path.join(repository, 'patches', name),
      path.join(temporary, name),
      { recursive: true }
    );
  }

  const read = name => fs.readFileSync(path.join(target, name), 'utf8');

  const reset = () => {
    // Deliberately no package.json: applicators must not read version metadata.
    fs.writeFileSync(path.join(target, 'workbench.js'), original);
    fs.writeFileSync(path.join(target, 'workbench.html'), html);
  };

  const run = name => {
    const args = [path.join(temporary, name, 'apply.cjs'), installation];
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', cwd: temporary });
    assert.equal(result.status, 0, result.stderr);
  };

  const reject = name => {
    const before = read('workbench.js');
    const beforeHtml = read('workbench.html');
    const args = [path.join(temporary, name, 'apply.cjs'), installation];
    const result = spawnSync(process.execPath, args, { encoding: 'utf8' });

    assert.notEqual(result.status, 0);
    assert.equal(read('workbench.js'), before);
    assert.equal(read('workbench.html'), beforeHtml);
  };

  const check = (title, test) => {
    reset();
    test();
    passed++;
    console.log(`PASS ${title}`);
  };

  try {
    console.log(`Reference: ${source}`);
    for (const name of features) {
      check(`${name}: standalone application without version metadata or backups`, () => {
        run(name);
        assert.notEqual(read('workbench.js'), original);
        const hash = createHash('sha256').update(read('workbench.js')).digest('hex').slice(0, 16);
        assert.ok(read('workbench.html').includes(`workbench.js?code-station=${hash}"`));
        assert.deepEqual(fs.readdirSync(target).sort(), ['workbench.html', 'workbench.js']);
        reject(name); // Apply once: repeating must fail without modifying files.
      });
      check(`${name}: missing/duplicate anchors and loaders fail before writes`, () => {
        const manifest = path.join(temporary, name, 'patch.json');
        const edit = JSON.parse(fs.readFileSync(manifest)).replacements[0];
        const unsupported = original.replace(edit.before, 'unsupported anchor');

        fs.writeFileSync(path.join(target, 'workbench.js'), unsupported);
        reject(name);

        fs.writeFileSync(path.join(target, 'workbench.js'), original + edit.before);
        reject(name);

        fs.writeFileSync(path.join(target, 'workbench.js'), original);
        fs.writeFileSync(path.join(target, 'workbench.html'), 'unsupported HTML');
        reject(name);

        fs.writeFileSync(path.join(target, 'workbench.html'), html + html);
        reject(name);
        assert.equal(fs.readdirSync(target).length, 2);
      });
      check(`${name}: unrelated edits/permissions survive; loader query is refreshed`, () => {
        fs.appendFileSync(path.join(target, 'workbench.js'), '\n// unrelated customization');
        fs.chmodSync(path.join(target, 'workbench.js'), 0o664);
        const customHtml = html.replace('workbench.js"', 'workbench.js?deployment=blue"');
        fs.writeFileSync(path.join(target, 'workbench.html'), customHtml);

        run(name);

        assert.ok(read('workbench.js').includes('// unrelated customization'));
        assert.ok(!read('workbench.html').includes('deployment=blue'));
        assert.ok(read('workbench.html').includes('?code-station='));
        assert.equal(fs.statSync(path.join(target, 'workbench.js')).mode & 0o777, 0o664);
      });
    }

    const combinations = new Map([['', original]]);

    for (let mask = 1; mask < 8; mask++) {
      const selected = features.filter((_, index) => mask & (1 << index));
      check(`combination ${selected.join('+')}`, () => {
        for (const name of selected) {
          run(name);
        }

        combinations.set(selected.join(','), canonical(read('workbench.js')));
        const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {
          input: read('workbench.js'),
          encoding: 'utf8',
        });
        assert.equal(syntax.status, 0, syntax.stderr);

        for (const name of features) {
          const edits = require(path.join(temporary, name, 'patch.json')).replacements;
          for (const edit of edits) {
            assert.equal(read('workbench.js').includes(edit.after), selected.includes(name));
          }
        }
      });
    }
    const applicationOrders = [
      ['chat', 'logout', 'welcome'],
      ['chat', 'welcome', 'logout'],
      ['logout', 'chat', 'welcome'],
      ['logout', 'welcome', 'chat'],
      ['welcome', 'chat', 'logout'],
      ['welcome', 'logout', 'chat'],
    ];

    for (const order of applicationOrders) {
      check(`independent order ${order.join(' > ')}`, () => {
        for (const name of order) {
          run(name);
        }

        assert.equal(canonical(read('workbench.js')), combinations.get(features.join(',')));
        const hash = createHash('sha256').update(read('workbench.js')).digest('hex').slice(0, 16);
        assert.ok(read('workbench.html').includes(`?code-station=${hash}"`));
      });
    }

    check('invalid Logout config does not block Chat or Welcome', () => {
      const file = path.join(temporary, 'logout', 'config.json');
      const saved = fs.readFileSync(file);
      fs.writeFileSync(file, '{invalid JSON');

      try {
        reject('logout');
        run('chat');
        run('welcome');
      } finally {
        fs.writeFileSync(file, saved);
      }
    });

    check('Welcome quotes and template-like text remain data', () => {
      const file = path.join(temporary, 'welcome', 'config.json');
      const saved = fs.readFileSync(file);
      const config = JSON.parse(saved);
      config.welcome.description = 'Literal "quotes", $& and __CODE_STATION_CSS__';
      fs.writeFileSync(file, JSON.stringify(config));

      try {
        run('welcome');
        assert.ok(read('workbench.js').includes(JSON.stringify(config)));
        const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {
          input: read('workbench.js'),
          encoding: 'utf8',
        });
        assert.equal(syntax.status, 0, syntax.stderr);
      } finally {
        fs.writeFileSync(file, saved);
      }
    });

    check('Logout config remains literal data and preserves the exact URL', () => {
      const file = path.join(temporary, 'logout', 'config.json');
      const saved = fs.readFileSync(file);
      const url = 'https://example.test/logout?quote="quoted"&value=$&';
      fs.writeFileSync(file, JSON.stringify({ logoutUrl: url }));

      try {
        run('logout');
        const bundle = read('workbench.js');
        const code = bundle.slice(bundle.indexOf('\n// Runs in the browser,'));
        let command;
        let destination;

        vm.runInNewContext(code, {
          Qe: {
            registerCommand: (_, fn) => {
              command = fn;
            },
          },
          Ae: {
            appendMenuItem: (menu, item) => {
              assert.equal(menu, 'gear');
              assert.equal(item.command.title, 'Logout');
            },
          },
          O: { GlobalActivity: 'gear' },
          window: {
            location: {
              assign: value => {
                destination = value;
              },
            },
          },
        });

        command();
        assert.equal(destination, url);
      } finally {
        fs.writeFileSync(file, saved);
      }
    });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

console.log(`${passed} integration cases passed.`);
