# Applying independent patches during a Docker build

Each `patches/<feature>/apply.cjs` modifies the installed workbench files directly.
It needs only Node's built-in filesystem and crypto modules. There is no common
applicator, version check, backup, check/remove mode or migration mechanism.

## Usage

Each feature README includes its own `COPY` / `RUN` example. The root
[README](../README.md) shows all three. Apply each selected patch once, in sequence,
starting from the unpatched base image. The normal entrypoint starts code-server
later; no running server or browser is involved in patch application.

The only argument is the installation directory. Use its bundled `lib/node`
executable if `node` is not on the image's `PATH`. Wrong arguments or a file/content
error cause a nonzero exit, which fails the Docker build step.

## Files read and written

Every script reads and writes these two installation files:

```text
lib/vscode/out/vs/code/browser/workbench/workbench.js
lib/vscode/out/vs/code/browser/workbench/workbench.html
```

Each script reads only its own `patch.json`. Logout also reads its `config.json`
and `logout.js`; Welcome reads its `config.json`, `welcome.js` and `welcome.css`.
These paths are relative to the script, so a feature folder can be copied alone.
The installation's `package.json` is never read.

## Script walkthrough

1. Read the installation path and the current JavaScript bundle.
2. For every local replacement, require exactly one `before` string and no `after`
   string. Missing, ambiguous or already-applied text causes an error before writes.
   Checking `after` matters for Welcome because its hook contains the original prefix.
3. Replace the exact text in memory. The manifest's `reason` identifies a failed edit.
   A replacement callback keeps literal `$&` sequences from being interpreted.
4. For Logout and Welcome, append the browser code with JSON-encoded configuration.
   Welcome also embeds its CSS. Its single substitution pass leaves placeholder-like
   text inside configuration untouched. There is no configuration schema validator.
5. Read HTML and require one workbench loader. Compute a short SHA-256 of the final
   JavaScript and replace the loader's query with `?code-station=<hash>`.
6. Write the JavaScript and HTML. No backup, temporary file or extra generated asset
   is created. There is no two-file transaction; a write failure fails the Docker
   `RUN` step, so fix the error and rebuild.

## Why keep the cache update?

The upstream resource path stays the same when only a local patch changes. A new
query string lets an existing browser load the new code after deployment and a
reload. Each script computes the hash from the bundle including earlier patches.
Other loader query parameters are replaced; the examples assume the standard
workbench loader, without a custom query-based routing scheme.

## Independence and rebuilds

The scripts do not inspect other features or generate their code. A malformed
Logout config cannot affect Chat or Welcome. All six application orders are
supported, although the appended code order and resulting hash may differ.
Always run scripts sequentially because they write the same files.

After editing a feature's configuration, JS or CSS, rebuild the image. Docker
reruns its `COPY` and `RUN` steps using the preceding layer. To remove a feature,
remove its steps and rebuild from the unpatched base. Do not apply a script a
second time to an already-patched installation or inherit an old patched image.

## Compatibility

The tested reference is code-server 4.145.2. No version metadata is checked.
Unique text matches prevent silent missed replacements; they do not establish
compatibility with another release's internal browser APIs. Review those APIs and
run the tests on an upgrade. The test suite checks its reference bundle checksum;
that check is not part of the application scripts.
