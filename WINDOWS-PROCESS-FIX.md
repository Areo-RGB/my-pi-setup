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
- Codex app-server startup uses `cross-spawn`, which handles Windows npm command
  shims, `PATHEXT`, and argument escaping.
- Background terminals pass the command string to Node's `shell` option and let
  Node construct the correct platform shell invocation.
- Claude uses the SDK-bundled native binary by default and only accepts
  `claude.exe` as a Windows PATH override.
- Process tests now use shell-portable Node commands instead of POSIX-only
  quoting, `true`, or `sleep`.

## Install

From the repository root:

```powershell
npm install
```

Restart Pi after installation.

## Useful checks on Windows

```powershell
npm --prefix extensions/background-terminals test
npm --prefix extensions/subagents run check
npm --prefix extensions/subagents run test:live
```

The live subagent tests require authenticated Codex and Claude installations or
SDK credentials as applicable.

For the complete installation and troubleshooting procedure, see
[WINDOWS-SETUP.md](WINDOWS-SETUP.md).
