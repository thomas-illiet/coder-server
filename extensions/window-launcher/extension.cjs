const vscode = require('vscode');
const { findExecutable, workspaceDirectory } = require('./launcher.cjs');

// Native command contract checked against Code 1.145.2 / code-server 4.145.2.
// -3 is VS Code's AUX_WINDOW_GROUP; auxiliary.compact is local to this window.
const createCommand = 'workbench.action.createTerminalEditor';
const auxiliaryWindowGroup = -3;

function activate(context) {
  const output = vscode.window.createOutputChannel('Code Station');
  context.subscriptions.push(output);
  let launching = false;

  async function launch(kind) {
    if (!vscode.workspace.isTrusted) {
      await vscode.window.showWarningMessage('Trust this workspace before launching a terminal.');
      return;
    }
    if (launching) return;
    launching = true;
    try {
      const commands = await vscode.commands.getCommands(true);
      if (!commands.includes(createCommand)) {
        throw new Error('This editor does not support separate terminal windows. Use a recent version of code-server or VS Code.');
      }
      const configuration = vscode.workspace.getConfiguration('codeStation');
      const config = {
        name: kind === 'opencode' ? 'OpenCode' : 'Code Station Terminal',
      };
      const options = {
        config,
        cwd: workspaceDirectory(vscode),
        location: {
          viewColumn: auxiliaryWindowGroup,
          auxiliary: { compact: configuration.get('compactWindows', true) },
        },
      };
      if (kind === 'opencode') {
        config.executable = await findExecutable(configuration.get('openCodePath', 'opencode'));
        config.args = [];
        // Keep launch failures visible instead of immediately closing the popup.
        config.waitOnExit = true;
      }
      // Create directly in its own compact window. No active-terminal lookup,
      // focus race, global layout setting, injected DOM, or extra server.
      await vscode.commands.executeCommand(createCommand, options);
      output.appendLine(`Opened ${config.name} (compact: ${options.location.auxiliary.compact}).`);
    } catch (error) {
      output.appendLine(String(error));
      await vscode.window.showErrorMessage(`Code Station: ${error.message || error}`);
    } finally {
      launching = false;
    }
  }

  for (const [kind, command, label, icon, priority] of [
    ['terminal', 'codeStation.openTerminalWindow', 'Terminal', 'terminal', 101],
    ['opencode', 'codeStation.openOpenCodeWindow', 'OpenCode', 'sparkle', 100],
  ]) {
    context.subscriptions.push(vscode.commands.registerCommand(command, () => launch(kind)));
    const button = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
    button.text = `$(${icon}) ${label} $(link-external)`;
    button.name = `${label} window`;
    button.tooltip = `Open ${label} in a separate window`;
    button.command = command;
    button.show();
    context.subscriptions.push(button);
  }

  context.subscriptions.push(vscode.window.registerTreeDataProvider('codeStationLauncher.actions', {
    getTreeItem: item => item,
    getChildren: () => [],
  }));
}

module.exports = { activate };
