# Windows setup guide

This guide installs the repository as the active Pi agent configuration on
Windows 10 or Windows 11. Commands are written for PowerShell 7 (`pwsh`) and
also work in modern Windows PowerShell unless a step says otherwise.

## What this installs

The repository is loaded directly from `%USERPROFILE%\.pi\agent` and provides:

- background terminal tools and their `/ps` UI
- Pi, Codex, and Claude subagents
- `fd` and `rg` model tools
- Firecrawl web tools when an API key is configured
- workflows, summaries, ask-user, copy-all, and UI/status extensions
- the GitHub Dark Default theme
- optional image/PDF parsing through `custom-ocr`

The root `npm install` runs a post-install helper that installs runtime
packages for every nested extension. Do not install only the root dependencies
with scripts disabled; the subagent and Effect extensions need their own
`node_modules` directories.

## 1. Prerequisites

Install these before cloning:

1. **Git for Windows** with `git.exe` available on `PATH`.
2. **Node.js 24 LTS or a newer supported Node release**, including npm.
3. **Pi**, already able to start from the same PowerShell environment.
4. **PowerShell 7** is recommended for the commands and JSON editing examples.

Check the environment:

```powershell
$PSVersionTable.PSVersion
git --version
node --version
npm --version
pi --version
```

If `node`, `npm`, or `pi` works in one terminal but not another, fix `PATH`
before continuing. Pi and its child processes inherit the environment of the
terminal that launched Pi.

### Optional prerequisites

- **Codex subagents:** install Codex CLI using the current Windows installer:

  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
  codex --version
  ```

  The npm installation (`npm install -g @openai/codex`) is also supported, but
  this repository deliberately handles the resulting `codex.cmd` shim through
  `cross-spawn` instead of trying to execute the batch file directly.

- **OCR/PDF parsing:** install `uv`:

  ```powershell
  winget install --id=astral-sh.uv -e
  uv --version
  ```

  The official standalone alternative is:

  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

- **Firecrawl:** obtain an API key only if the Firecrawl tools are wanted.

## 2. Back up an existing Pi configuration

Pi's agent directory is:

```text
%USERPROFILE%\.pi\agent
```

Create a timestamped backup before replacing a customized setup:

```powershell
$PiRoot = Join-Path $HOME ".pi"
$PiAgent = Join-Path $PiRoot "agent"
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (Test-Path $PiAgent) {
  Copy-Item $PiAgent "$PiAgent.backup-$Stamp" -Recurse -Force
}
```

The backup includes settings and `.env`, so treat it as private if it contains
API keys.

## 3. Install or update the repository

### Fresh install

Use this when `%USERPROFILE%\.pi\agent` does not exist:

```powershell
$PiRoot = Join-Path $HOME ".pi"
$PiAgent = Join-Path $PiRoot "agent"

New-Item -ItemType Directory -Path $PiRoot -Force | Out-Null
git clone https://github.com/Areo-RGB/my-pi-setup.git $PiAgent
Set-Location $PiAgent
npm install
```

### Update an existing checkout

Use this when the directory already contains this repository:

```powershell
$PiAgent = Join-Path $HOME ".pi\agent"

git -C $PiAgent status --short
git -C $PiAgent pull --ff-only
Set-Location $PiAgent
npm install
```

`git status --short` should be reviewed before pulling. Commit, stash, or back
up local edits instead of discarding them.

### Existing non-Git directory

When the directory was copied manually rather than cloned, clone to a temporary
folder and then copy only the desired configuration:

```powershell
$TempSetup = Join-Path $env:TEMP "my-pi-setup"
Remove-Item $TempSetup -Recurse -Force -ErrorAction SilentlyContinue
git clone https://github.com/Areo-RGB/my-pi-setup.git $TempSetup
```

Compare it with the current agent folder before replacing files:

```powershell
$PiAgent = Join-Path $HOME ".pi\agent"
git diff --no-index -- $PiAgent $TempSetup
```

A non-zero exit code from `git diff --no-index` normally just means differences
were found.

## 4. Verify dependency installation

From `%USERPROFILE%\.pi\agent`:

```powershell
npm install
```

The output should include messages similar to:

```text
Installing runtime dependencies for background-terminals...
Installing runtime dependencies for custom-ocr...
Installing runtime dependencies for subagents...
```

Confirm the critical packages exist:

```powershell
Test-Path .\extensions\background-terminals\node_modules\effect
Test-Path .\extensions\subagents\node_modules\effect
Test-Path .\extensions\subagents\node_modules\cross-spawn
Test-Path .\extensions\custom-ocr\node_modules\effect
```

Each command should print `True`.

If nested packages are missing, rerun the helper directly:

```powershell
node .\scripts\install-extension-deps.mjs
```

Do not use `npm install --ignore-scripts` for the root setup unless you then run
that helper manually.

## 5. Configure the theme without overwriting settings

The theme file is already included. Merge the theme name into
`settings.json`:

```powershell
$SettingsPath = Join-Path $HOME ".pi\agent\settings.json"

if (Test-Path $SettingsPath) {
  $Settings = Get-Content $SettingsPath -Raw | ConvertFrom-Json -AsHashtable
} else {
  $Settings = @{}
}

$Settings["theme"] = "github-dark-default"
$Settings | ConvertTo-Json -Depth 30 | Set-Content $SettingsPath -Encoding utf8
```

Review the result:

```powershell
Get-Content $SettingsPath
```

For Windows PowerShell 5.1, which lacks `ConvertFrom-Json -AsHashtable`, edit the
file manually and preserve all existing properties:

```json
{
  "theme": "github-dark-default"
}
```

## 6. Configure Firecrawl or disable it

Firecrawl is optional.

### Enable it

```powershell
$PiAgent = Join-Path $HOME ".pi\agent"
Copy-Item "$PiAgent\.env.example" "$PiAgent\.env" -Force
notepad "$PiAgent\.env"
```

Replace:

```text
FIRECRAWL_API_KEY=fc-YOUR-API-KEY
```

with the real key. Do not commit `.env`.

### Disable it

Move the extension outside the auto-loaded `extensions` directory:

```powershell
$PiAgent = Join-Path $HOME ".pi\agent"
$Disabled = Join-Path $PiAgent "disabled-extensions"
New-Item -ItemType Directory -Path $Disabled -Force | Out-Null
Move-Item "$PiAgent\extensions\firecrawl-search" $Disabled
```

Running `git pull` later may restore the tracked directory. Reapply the move or
keep the extension installed and simply avoid the Firecrawl tools.

## 7. `fd` and `rg`

No manual installation is normally required. The `file-search` extension:

1. prefers `fd.exe` and `rg.exe` already on `PATH`;
2. otherwise uses binaries under `%USERPROFILE%\.pi\agent\bin`;
3. otherwise downloads supported official release binaries on first use.

Check what Windows resolves:

```powershell
Get-Command fd -ErrorAction SilentlyContinue
Get-Command rg -ErrorAction SilentlyContinue
```

After installing either command or changing `PATH`, restart the terminal and
Pi.

## 8. Configure and test subagents

### Pi backend

The Pi backend needs no separate executable. Start Pi and invoke a subagent from
a normal project directory.

### Codex backend

Check all Windows command shims and the resolved command:

```powershell
Get-Command codex -All
where.exe codex
codex --version
```

The extension prefers an npm `codex.cmd` shim over a potentially unusable
WindowsApps alias and starts it through `cross-spawn`.

Authenticate Codex in the same Windows user account used to run Pi:

```powershell
codex
```

Complete the login flow, exit Codex, then restart Pi.

### Claude backend

The `@anthropic-ai/claude-agent-sdk` dependency ships its platform runtime. A
separate `claude.cmd` is not required for the backend to appear. When a native
`claude.exe` exists on `PATH`, it may be used as an override; batch shims are
ignored on Windows.

If the SDK reports authentication problems, configure the SDK/Claude login for
the same user and terminal environment, then restart Pi.

## 9. Background terminals on Windows

Background commands are passed as one command string to Node's Windows shell
handling. This avoids fragile hand-built `cmd.exe /s /c` quoting and supports
paths containing spaces and nested quotes.

Useful smoke tests inside Pi include:

```text
node -e "console.log('background-ok')"
node -e "setTimeout(() => console.log('done'), 1000)"
powershell -NoProfile -Command "Write-Output 'powershell-ok'"
```

Use the background-terminal UI or `/ps` to inspect output and stop processes.
Process termination uses `taskkill /T` so descendants are included.

## 10. Optional image and PDF parsing

The `custom-ocr` extension registers `parse-file`.

### Windows-supported default mode

Install and verify `uv`:

```powershell
uv --version
```

The first parse runs the locked Python project under
`extensions\custom-ocr\python` with `uv run`. `uv` creates the environment and
installs PyMuPDF/Pillow dependencies from the lockfile. PDF pages and images
are rasterized locally, then the normal Luna backend uses Pi's existing Codex
OAuth/model configuration.

Examples inside Pi:

```text
parse-file C:\Users\you\Desktop\scan.pdf
parse-file C:\Users\you\Desktop\error.png question="What error is shown?"
```

Paths containing spaces should be supplied as one tool argument by the model;
manual prompts can quote them.

### Unsupported private mode on Windows

Do **not** enable `/private-image` on Windows. Its fully local DeepSeek-OCR and
Qwen pipeline uses MLX and Apple-silicon model builds. Keep the extension in its
default Luna mode on Windows.

## 11. Runtime verification

Restart Pi after installation, then confirm:

- the GitHub Dark Default theme loads;
- `/ps` opens the background terminal UI;
- a short background Node command exits and reports output;
- the subagent selector shows the expected backends;
- `fd` and `rg` tools can search a small test project;
- `parse-file` works after `uv` is installed, when OCR is wanted;
- Firecrawl tools are used only when `.env` contains a valid key.

Repository-level checks:

```powershell
Set-Location (Join-Path $HOME ".pi\agent")
npm run check
npm --prefix extensions/background-terminals test
```

For development checks that require nested dev dependencies:

```powershell
npm --prefix extensions/subagents install
npm --prefix extensions/subagents run check
npm --prefix extensions/subagents test

npm --prefix extensions/custom-ocr install
npm --prefix extensions/custom-ocr run check
npm --prefix extensions/custom-ocr test
```

The live Codex/Claude tests require working authentication and may perform real
agent activity:

```powershell
npm --prefix extensions/subagents run test:live
```

## 12. Updating later

```powershell
$PiAgent = Join-Path $HOME ".pi\agent"
git -C $PiAgent status --short
git -C $PiAgent pull --ff-only
Set-Location $PiAgent
npm install
```

Restart Pi after every update that changes extensions or dependencies.

## Troubleshooting

### `EINVAL`, `ENOENT`, `UNKNOWN`, or Codex initialization timeout

```powershell
Get-Command codex -All
where.exe codex
Test-Path .\extensions\subagents\node_modules\cross-spawn
npm install
```

Avoid copying only `extensions\subagents` without its dependency installation.
The Windows launcher fix requires `cross-spawn`.

### `Cannot find package 'effect'`

Run the root install with scripts enabled:

```powershell
Set-Location (Join-Path $HOME ".pi\agent")
npm install
node .\scripts\install-extension-deps.mjs
```

### Background command works interactively but not in Pi

Pi inherits `PATH`, environment variables, drive mappings, and credentials from
the process that launched it. Close Pi, open the exact PowerShell session where
the command succeeds, and launch Pi from that terminal.

### PowerShell blocks a `.ps1` command shim

The extension's Codex launcher uses `codex.cmd`, not `codex.ps1`. For commands
you run manually, either call the `.cmd` shim explicitly or review the user's
PowerShell execution policy:

```powershell
Get-ExecutionPolicy -List
```

Do not weaken machine-wide policy merely to run this setup.

### OCR says `uv` was not found

Install `uv`, close all terminals, open a new PowerShell window, and verify:

```powershell
where.exe uv
uv --version
```

### Clean reinstall of nested runtime dependencies

```powershell
$PiAgent = Join-Path $HOME ".pi\agent"
Get-ChildItem "$PiAgent\extensions" -Directory | ForEach-Object {
  $Modules = Join-Path $_.FullName "node_modules"
  if (Test-Path $Modules) { Remove-Item $Modules -Recurse -Force }
}
Set-Location $PiAgent
npm install
```

This leaves source files and lockfiles intact and recreates extension runtime
packages.
