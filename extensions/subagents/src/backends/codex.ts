import * as fs from "node:fs";
import * as path from "node:path";
import "../../../shared/windows-spawn-patch.ts";

// Put npm's codex.cmd directory ahead of WindowsApps aliases before the
// implementation caches its executable lookup.
if (process.platform === "win32") {
  const directories = (process.env.PATH ?? "")
    .split(path.delimiter)
    .map((directory) => directory.replace(/^"|"$/g, ""))
    .filter(Boolean);
  directories.sort((left, right) => {
    const score = (directory: string) => {
      try {
        if (fs.existsSync(path.join(directory, "codex.cmd"))) return 0;
        if (fs.existsSync(path.join(directory, "codex.exe"))) return 1;
      } catch {
        // Ignore inaccessible PATH entries.
      }
      return 2;
    };
    return score(left) - score(right);
  });
  process.env.PATH = directories.join(path.delimiter);
}

const implementation = await import("./codex-base.ts");
export const parseThreadTokenUsage = implementation.parseThreadTokenUsage;
export const codexBackend = implementation.codexBackend;
