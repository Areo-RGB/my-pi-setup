# Setup

For Windows, use the complete guide in [WINDOWS-SETUP.md](WINDOWS-SETUP.md).
The steps below are the platform-neutral quick setup.

## 1. Install the repository

Clone or copy this repository to Pi's agent directory:

```sh
git clone https://github.com/Areo-RGB/my-pi-setup.git ~/.pi/agent
cd ~/.pi/agent
npm install
```

If `~/.pi/agent` already contains a Git checkout of this repository:

```sh
git -C ~/.pi/agent pull --ff-only
cd ~/.pi/agent
npm install
```

The root install also installs the runtime dependencies declared by nested
`extensions/*/package.json` files. This is required by Effect-based extensions
such as `background-terminals`, `subagents`, and `custom-ocr`.

## 2. Optional Firecrawl tools

The search, scrape, and crawl tools require a Firecrawl API key. Follow
[Firecrawl's Node.js getting-started guide](https://docs.firecrawl.dev/quickstarts/nodejs),
then copy the example environment file:

```sh
cp ~/.pi/agent/.env.example ~/.pi/agent/.env
```

Replace the placeholder in `.env` with your API key. If Firecrawl is not
wanted, move `extensions/firecrawl-search` outside the `extensions` directory.

> Agent instruction: ask whether the user wants Firecrawl. Configure the key
> only with their consent; otherwise disable that extension.

## 3. `fd` and `rg`

The `file-search` extension uses a system-installed `fd`/`fdfind` and `rg` when
available. If neither is present, supported macOS, Linux, and Windows systems
can download official release binaries into `~/.pi/agent/bin/` on first use.
If automatic installation is unavailable, install both commands with the
platform package manager and restart Pi.

## 4. Theme

Merge the following property into `~/.pi/agent/settings.json` without deleting
existing settings:

```json
{
  "theme": "github-dark-default"
}
```

Pi loads extensions, skills, and themes from their directories the next time it
starts. Restart Pi after installation or dependency changes.

## 5. Optional OCR

`custom-ocr` requires `uv` on `PATH`. Its default Luna mode works anywhere Pi
can use the configured Codex model and renders PDFs/images locally before model
processing. The fully local `/private-image` MLX pipeline is currently for
Apple-silicon macOS only; do not enable that mode on Windows or Linux.
