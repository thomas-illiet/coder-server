# Code Station — Window Launcher

A small VS Code extension for code-server: two buttons open a terminal or
OpenCode in a separate browser window. It uses VS Code's native floating
windows. The tested target is **code-server 4.145.2 / Code 1.145.2**.

## Use

Install the VSIX, reload the editor, and select **Code Station** in the activity
bar. The **Terminal ↗** and **OpenCode ↗** buttons are also in the status bar.

- **Terminal:** starts your default shell in a separate window.
- **OpenCode:** starts the real `opencode` executable in a separate terminal
  window. OpenCode must be installed on the server, not only your own computer.
- Both use the active file's workspace folder, or the first workspace folder.
- Each click creates a new terminal. Keep the main code-server window open.
- Windows open in **compact mode** by default: no editor tabs, breadcrumbs or
  status bar. The browser's own address bar cannot be hidden by an extension.
  Disable **Code Station: Compact Windows** for the normal layout, or run
  **View: Toggle Window Compact Mode** inside a detached window.
- If the browser blocks the popup, allow popups for this local site and use the
  native **Retry** button. Closing the editor can close its auxiliary windows.

This launches OpenCode's terminal interface. Configure a model/provider inside
OpenCode before asking it to perform AI work; this extension does not supply
credentials or copy them from your machine.

## Install

From the repository root, after building the VSIX:

```sh
code-server --install-extension outputs/code-station-window-launcher-0.1.0.vsix
```

Alternatively, use **Extensions: Install from VSIX…** in the command palette.

If OpenCode is not on the server's PATH, set **Code Station: Open Code Path** to
its absolute executable path. This is a machine setting, not a shell command;
do not include arguments or shell operators.

## Build

```sh
cd extensions/window-launcher
npm ci
npm run check
npm test
mkdir -p ../../outputs
npm run package
```

`@vscode/vsce` is used only for packaging; the extension has no runtime npm
dependencies. The repository's `demo/` directory contains a reproducible local
Docker demo with code-server and OpenCode installed.

## Implementation and limits

The extension runs on the workspace extension host. It invokes the built-in
`workbench.action.createTerminalEditor` command with a shell launch configuration
and `location: { viewColumn: -3, auxiliary: { compact: true } }`. VS Code's
`AUX_WINDOW_GROUP` is `-3`. This creates the terminal directly in a separate
compact window, without targeting an existing active terminal.

The argument structure is an **internal VS Code command contract**, checked
against Code 1.145.2. Re-test it before changing editor versions. It does not use
proposed extension APIs, manipulate the workbench DOM or change global editor
layout settings. The native command is checked before launching.

OpenCode is launched directly as the terminal executable, without sending a
command into an existing shell. Missing executables produce an actionable error.
Only one launch request runs at a time, and untrusted workspaces are unsupported.
OpenCode's terminal stays visible after exit so startup failures can be read.

The floating window belongs to the editor session. For an independent terminal
that outlives the browser, use a separate terminal service and session manager.

References: [VS Code terminal windows](https://code.visualstudio.com/docs/terminal/basics#_terminals-in-new-windows),
[VS Code API](https://code.visualstudio.com/api/references/vscode-api),
[OpenCode](https://opencode.ai).
