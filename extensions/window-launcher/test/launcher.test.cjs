const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { findExecutable, workspaceDirectory } = require('../launcher.cjs');

test('finds an executable with spaces without treating it as a shell command', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'window-launcher-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'open code');
  await fs.writeFile(file, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  assert.equal(await findExecutable(file), file);
  assert.equal(await findExecutable('open code', { PATH: dir }), file);
  await assert.rejects(findExecutable('opencode; echo unexpected', { PATH: dir }), /not found/);
});

test('does not accept a directory or non-executable file as OpenCode', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'window-launcher-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'opencode');
  await fs.writeFile(file, 'not executable', { mode: 0o644 });
  await assert.rejects(findExecutable(file), /not found/);
  await assert.rejects(findExecutable(dir), /not found/);
  await assert.rejects(findExecutable('./opencode'), /not found/);
});

test('selects the active workspace folder in a multi-root workspace', () => {
  const first = { uri: { fsPath: '/project/one' } };
  const active = { uri: { fsPath: '/project/two' } };
  const vscode = {
    window: { activeTextEditor: { document: { uri: { fsPath: '/project/two/file.txt' } } } },
    workspace: { workspaceFolders: [first, active], getWorkspaceFolder: () => active },
  };
  assert.equal(workspaceDirectory(vscode), active.uri);
  vscode.window.activeTextEditor = undefined;
  assert.equal(workspaceDirectory(vscode), first.uri);
  vscode.workspace.workspaceFolders = undefined;
  assert.equal(workspaceDirectory(vscode), undefined);
});

