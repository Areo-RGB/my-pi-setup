import * as fs from "node:fs";
import * as path from "node:path";
import { Effect } from "effect";
import "../../../shared/windows-spawn-patch.ts";

// The Agent SDK bundles a native platform binary. During implementation load,
// hide Windows directories that expose only claude.cmd so the private resolver
// caches either claude.exe or no override. Restore PATH immediately afterward
// so unrelated npm CLIs (including codex.cmd) remain available.
const originalPath = process.env.PATH;
if (process.platform === "win32") {
  process.env.PATH = (originalPath ?? "")
    .split(path.delimiter)
    .map((directory) => directory.replace(/^"|"$/g, ""))
    .filter((directory) => {
      try {
        return !(
          fs.existsSync(path.join(directory, "claude.cmd")) &&
          !fs.existsSync(path.join(directory, "claude.exe"))
        );
      } catch {
        return true;
      }
    })
    .join(path.delimiter);
}

const implementation = await import("./claude-base.ts");
if (process.platform === "win32") {
  try {
    // Force the implementation's one-time binary lookup while PATH is filtered.
    Effect.runSync(implementation.claudeBackend.available);
  } finally {
    process.env.PATH = originalPath;
  }
}

export const contextOccupancyTokens = implementation.contextOccupancyTokens;
export const claudeBackend = {
  ...implementation.claudeBackend,
  available: Effect.succeed(true),
};
