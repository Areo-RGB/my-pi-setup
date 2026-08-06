# my pi setup

An opinionated Pi configuration with:

- GitHub Dark Default theme
- Firecrawl search, scrape, and crawl tools
- customized status and model information
- background terminals with a management UI
- Pi, Codex, and Claude subagents
- reusable workflows and an ask-user tool
- first-class `fd` file discovery and `rg` content search
- summaries and “by the way” follow-up delivery
- local file/image/PDF parsing through the optional `custom-ocr` extension

![Pi setup interface](assets/pi-setup.jpeg)

## Setup

- **Windows 10/11:** follow [WINDOWS-SETUP.md](WINDOWS-SETUP.md).
- **Other platforms or automated setup:** follow [SETUP.md](SETUP.md).
- **Windows process implementation notes:** see
  [WINDOWS-PROCESS-FIX.md](WINDOWS-PROCESS-FIX.md).

> Agent note: installation instructions for configuring a user's Pi live in
> `SETUP.md`; use the Windows guide when `process.platform === "win32"`.
