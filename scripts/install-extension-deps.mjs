import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionsDir = path.join(root, "extensions");

const packageDirs = fs
  .readdirSync(extensionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(extensionsDir, entry.name))
  .filter((directory) => fs.existsSync(path.join(directory, "package.json")))
  .filter((directory) => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(directory, "package.json"), "utf8"),
    );
    return (
      Object.keys(pkg.dependencies ?? {}).length > 0 ||
      Object.keys(pkg.optionalDependencies ?? {}).length > 0
    );
  });

const npmExecPath = process.env.npm_execpath;
const command = npmExecPath
  ? process.execPath
  : process.platform === "win32"
    ? "npm.cmd"
    : "npm";
const baseArgs = npmExecPath ? [npmExecPath] : [];

for (const directory of packageDirs) {
  const name = path.basename(directory);
  process.stdout.write(`Installing runtime dependencies for ${name}...\n`);
  const result = spawnSync(
    command,
    [
      ...baseArgs,
      "install",
      "--omit=dev",
      "--include=optional",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ],
    {
      cwd: directory,
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Dependency installation failed for ${name} (exit ${result.status ?? "unknown"}).`,
    );
  }
}
