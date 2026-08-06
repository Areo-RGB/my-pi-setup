# Windows child-process fix

## What was broken

- The setup instructions ran `npm install` only at the repository root, but the
  Effect-based extensions keep their runtime dependencies in nested
  `extensions/*/package.json` files. Those dependencies were therefore missing
  in a clean installation.
- The Codex subagent resolved the npm launcher `codex.cmd` and passed it directly
  to `node:child_process.spawn()`. Windows batch files are not native
  executables, so direct spawning can fail with `EINVAL`, `ENOENT`, `UNKNOWN`,
  or an app-server initialization timeout.
- The background-terminal manager manually assembled `cmd.exe /d /s /c` argv.
  That is fragile for executable paths with spaces and commands containing
  nested quotes.
- The Claude backend required a PATH-installed CLI even though the Agent SDK
  ships its own native platform binary, and it could override that native
  binary with `claude.cmd` on Windows.

## Changes

- Root `npm install` now installs runtime dependencies for all nested extensions.
- A shared Windows spawn compatibility layer uses `cross-spawn` for npm
  `.cmd`/`.bat` shims and converts manual `cmd.exe /c` launches into Node's
  native shell handling.
- The existing background-terminal and subagent implementations are preserved
  behind thin compatibility entry points rather than duplicated or rewritten.
- Codex prioritizes a usable npm `codex.cmd` directory over WindowsApps aliases.
- Claude uses the SDK-bundled native binary by default and ignores a batch-only
  `claude.cmd` override.

## Install

From the repository root:

```powershell
npm install
```

Restart Pi after installation.

## Useful checks on Windows

```powershell
npm run check
node --experimental-strip-types --check .\extensions\shared\windows-spawn-patch.ts
node --experimental-strip-types --check .\extensions\background-terminals\src\manager.ts
node --experimental-strip-types --check .\extensions\subagents\src\backends\codex.ts
node --experimental-strip-types --check .\extensions\subagents\src\backends\claude.ts
```

The live Codex and Claude checks require working authentication and may perform
real agent activity. The repository still contains some historical tests that
invoke POSIX shell commands; run those specific cases in WSL until they are
made shell-neutral.

For the complete installation and troubleshooting procedure, see
[WINDOWS-SETUP.md](WINDOWS-SETUP.md).
