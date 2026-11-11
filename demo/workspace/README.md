# Code Station window demo

Select **Code Station** in the activity bar, or use the two status-bar buttons:

1. **Terminal ↗** opens a shell in its own browser window. Run `pwd` or
   `opencode --version` to try it.
2. **OpenCode ↗** opens OpenCode's interactive terminal interface in another
   window. Select a provider/model inside OpenCode before sending a prompt.

If the browser blocks a popup, allow popups for this site and click **Retry**.
Keep the main editor window open while using the detached terminals.
New windows use compact mode, hiding editor tabs and the status bar.

This folder is mounted from `demo/workspace` on the host. Changes here persist.
The demo does not mount your home directory or reuse your existing AI credentials.
