const fs = require('node:fs/promises');
const path = require('node:path');

// Resolve the executable on the extension host (the server for code-server).
// No shell is involved, so paths containing spaces are passed literally.
async function findExecutable(command, env = process.env, platform = process.platform) {
  if (!command || typeof command !== 'string' || command.includes('\0')) {
    throw new Error('Set Code Station: Open Code Path to an executable name or absolute path.');
  }
  const paths = path.isAbsolute(command)
    ? [command]
    : !command.includes('/') && !command.includes('\\')
      ? (env.PATH || '').split(path.delimiter).filter(Boolean).map(dir => path.join(dir, command))
      : [];
  const extensions = platform === 'win32'
    ? ['', ...(env.PATHEXT || '.EXE;.CMD;.BAT').split(';')]
    : [''];
  for (const candidate of paths) {
    for (const extension of extensions) {
      const executable = candidate + extension;
      try {
        const stat = await fs.stat(executable);
        if (!stat.isFile()) continue;
        await fs.access(executable, platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
        return executable;
      } catch {
        // Try the next PATH entry.
      }
    }
  }
  throw new Error('OpenCode was not found on the server. Install it there or set Code Station: Open Code Path.');
}

function workspaceDirectory(vscode) {
  const activeFile = vscode.window.activeTextEditor?.document.uri;
  const folder = activeFile && vscode.workspace.getWorkspaceFolder(activeFile);
  return (folder || vscode.workspace.workspaceFolders?.[0])?.uri;
}

module.exports = { findExecutable, workspaceDirectory };
