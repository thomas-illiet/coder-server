# Local window launcher demo

Requires Docker with Compose and Node.js 22 or newer for packaging the extension.

From the repository root:

```sh
cd extensions/window-launcher
npm ci
npm run check
npm test
mkdir -p ../../outputs
npm run package
cd ../..
docker compose -f demo/compose.yaml up --build -d --wait
```

Open **http://127.0.0.1:18880** in a regular browser (tested in Firefox).
Select **Code Station** in the activity bar and
click **Terminal ↗** or **OpenCode ↗**. Both buttons are also in the status bar.
The new windows use compact mode: editor tabs and the status bar are hidden.
The browser may retain its address bar. Native VS Code auxiliary windows use
`about:blank` as their address; their titles are **Code Station Terminal** or
**OpenCode**. This is expected and does not mean the application failed to load.
Embedded browsers may not expose these auxiliary windows properly.
If prompted, trust the included demo workspace. Allow popups for this local site
if your browser blocks the native detached window.

The demo uses code-server **4.145.2** and OpenCode **1.17.13**, pinned at build
time. It installs the packaged VSIX, plus this repository's existing Chat and
Welcome patches. The custom Logout destination is not included in the demo.

Only the local loopback address exposes port 18880. This local demo runs without
a code-server password; use your normal authentication before deploying remotely.
No AI provider credentials are supplied. OpenCode starts as a real application,
but generating an AI response requires a configured provider/model.
Its first launch can take several seconds while the application initializes.

The project is `demo/workspace`, mounted read/write. OpenCode data/configuration
persist in the two Compose volumes. Host credentials are never mounted.

Stop the demo, keeping its workspace and OpenCode data:

```sh
docker compose -f demo/compose.yaml down
```

Install the VSIX separately in another code-server instance:

```sh
code-server --install-extension outputs/code-station-window-launcher-0.1.0.vsix
```

Then reload the editor. OpenCode must be installed in that instance; configure
`codeStation.openCodePath` if it is not on the server's PATH.

## Validation — 11 November 2026

- VSIX packaged and installed in the pinned code-server Docker image.
- Docker build and HTTP health check passed on Linux ARM64.
- Three Node tests passed: literal executable paths, rejecting invalid
  executables, and selecting the active folder in a multi-root workspace.
- Packaging dependency audit: zero reported vulnerabilities.
- Firefox: sidebar buttons and status-bar buttons visible; native compact popup
  has no editor tab bar or status bar. Terminal input returned
  `/home/coder/project` and `Compact terminal OK`.
- OpenCode executable version checked inside the container; interactive CLI
  startup and its rendered home screen verified in a native compact Firefox
  popup, without supplying provider credentials. The title reads
  `OpenCode — project — code-server`; the address remains `about:blank`.

The AMD64 download is pinned but its image was not run in this session.
No AI prompt was sent and no provider authentication was performed.
