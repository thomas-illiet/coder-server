# Testing the minimal independent scripts

## Reproduce

Extract a pristine official code-server 4.145.2 release, then run:

```sh
node tests/verify.cjs /path/to/code-server-4.145.2-linux-amd64
```

Several reference directories can be supplied. Input releases are read-only;
tests modify disposable installations and separate copies of the feature folders.
No npm packages or running server are needed. Tests are never an application dependency.

The test suite checks the original browser-bundle checksum to identify its fixture.
The application scripts do not check a checksum or read installation version metadata.

## What is verified

There are 25 cases per reference release:

- Independent application without installation `package.json` and without backups.
- Repeated application fails without modifying files.
- Missing or duplicate replacement text and HTML loaders fail before writes.
- Unrelated bundle edits and file permissions survive; the loader query is refreshed.
- All seven feature combinations produce syntactically valid JavaScript with only
  the selected replacements present.
- All six application orders retain the same behavior and a matching cache hash.
- Invalid Logout JSON does not block the other features.
- Welcome quotes, `$&` and placeholder-like text remain literal data.
- Logout registers in the gear menu and passes its exact configured URL to navigation.
  This is checked with stubs, without contacting the destination.

The temporary tools tree contains only copied feature folders. There is no root
applicator, configuration or shared helper. Tests invoke the scripts from another
working directory to verify local-file resolution.

## Results — 9 November 2026

**50 cases passed** after the JavaScript readability pass on the independent scripts.
Both official Linux AMD64 and macOS ARM64 browser-file references were tested on
macOS. No Linux product process or Docker image build was run.

The browser JavaScript was reformatted without changing its behavior; CSS is unchanged. Earlier
macOS browser checks covered hidden Chat controls, gear-menu Logout with Accounts
hidden, and Code Station Welcome without its footer. Those checks included the
Welcome actions, recent-project navigation, light/dark themes and a local Logout
target. The production Logout endpoint was not contacted.

Dockerfile examples follow the upstream image layout and runtime UID. File-level
tests do not validate a custom base image, its permissions or its entrypoint.

## Future checks

After editing an applicator or replacement, run the suite against the intended
release files. For browser-code or CSS changes, also inspect the affected UI.
Check each feature alone and with the others, then build and exercise the target
image. A successful text replacement is not proof of compatibility with new APIs.
