import * as fs from "node:fs";
import * as path from "node:path";
import { Effect } from "effect";
import "../../../shared/windows-spawn-patch.ts";

// The Agent SDK bundles a native platform binary. Hide Windows npm batch-only
// PATH entries so the implementation does not override it with claude.cmd.
if (process.platform === "win32") {
  process.env.PATH = (process.env.PATH ?? "")
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
export const contextOccupancyTokens = implementation.contextOccupancyTokens;
export const claudeBackend = {
  ...implementation.claudeBackend,
  available: Effect.succeed(true),
};
