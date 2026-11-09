# Maintenance rules

## Keep features independent

The chosen design favors small standalone scripts over deduplication:

1. Each feature folder must be usable after being copied alone elsewhere.
2. Keep its `apply.cjs`, replacements and browser assets in that folder.
   Keep the URL and page texts directly in JavaScript. Do not add separate config
   files, a central launcher or a shared runtime helper.
3. Duplicating the short replacement/cache sequence is acceptable. Keep
   the code explicit and readable; avoid building a general patch framework.
4. A script may inspect and modify only its own intervention points. It must not
   need to understand other features or regenerate their browser code.
5. Keep one maintained implementation per feature. Historical variants belong
   in an inert recovery archive, not alongside active alternative scripts.
6. Document purpose, local files, exact edits, limits, configuration and rebuilding
   in the feature README. Explain why code exists, not just what each line says.
7. Keep tests separate and optional. They may compare features together but
   are never an installation dependency.
8. Application happens in a Dockerfile at image build time. Keep scripts limited
   to file edits; do not add server lifecycle management or runtime detection.
9. Do not add version checks, backups, check/remove modes or migration handling.
   Apply once to the base image's files. Rebuild from that base to change or remove a patch.
10. Keep JavaScript readable: use braces for conditions, separate logical steps
    with blank lines, and split long expressions into named intermediate values.
    Do not compress code to minimize its line count or add helpers just for formatting.

## Change the smallest relevant file

| Change | File |
| --- | --- |
| Logout URL | `logoutUrl` in `patches/logout/logout.js` |
| Welcome text | `brand` in `patches/welcome/welcome.js` |
| Welcome layout/colors | `patches/welcome/welcome.css` |
| Welcome behavior | `patches/welcome/welcome.js` |
| Gear-menu behavior | `patches/logout/logout.js` |
| Bundle intervention point | The affected folder's `patch.json` |

Rebuild and deploy the image after editing; the feature's `COPY` / `RUN` steps
apply its updated sources. Do not edit or distribute a generated 22 MB bundle
as maintained source. Keep the exact replacements in each local `patch.json`.

## Upstream reference for the current scripts

All three currently target the official **code-server 4.145.2** release:

- code-server commit: `302bc77436721f5a474e06d1fe34cf8f86195d5e`
- VS Code commit: `c4453f8ea430795f941c1b2ff6c9321135a74a02`
- Original browser-bundle SHA-256:
  `71c94e00e4b0b5586d0351692b3a814f025822a2420390c541ebfce656a5869a`

The macOS ARM64 and Linux AMD64 original browser files matched. The scripts
do not read version metadata; they check only their own replacements and the loader.
The hash above is documentary and used by tests, not a cross-feature runtime check.

## Upgrade process

1. Extract the intended official release into a disposable installation.
2. Read the owning upstream source identified in the affected feature README.
   Find the new exact anchors and any changed minified registry aliases.
3. Update that feature's manifest, code and documentation together. There is no
   version allowlist to update; matching text alone does not prove compatibility.
4. Test the folder in isolation, reject repeat application, and combine it with
   the other supported patches. They must retain each other's code.
5. Check the actual UI: Chat variants/restoration, Logout against a local endpoint,
   Welcome actions and its absent footer, light/dark rendering.
6. Build the image from the new official release and check the running container's
   UI. Do not inherit files already modified by these or earlier patch scripts.

The maintained source is published at [thomas-illiet/coder-server](https://github.com/thomas-illiet/coder-server).
`.gitignore` excludes local recovery archives, disposable test data and Finder metadata.
