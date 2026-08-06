/** Windows-safe child_process.spawn patch shared by process-owning extensions. */
import childProcess from "node:child_process";
import { createRequire, syncBuiltinESMExports } from "node:module";

const patchKey = Symbol.for("my-pi-setup/windows-spawn-patch");
const state = globalThis as typeof globalThis & { [patchKey]?: true };

if (process.platform === "win32" && !state[patchKey]) {
  const require = createRequire(import.meta.url);
  const crossSpawn = require("cross-spawn") as typeof childProcess.spawn;
  const nativeSpawn = childProcess.spawn.bind(childProcess);

  childProcess.spawn = ((
    command: string,
    argsOrOptions?: readonly string[] | childProcess.SpawnOptions,
    maybeOptions?: childProcess.SpawnOptions,
  ) => {
    const args = Array.isArray(argsOrOptions) ? [...argsOrOptions] : [];
    const options = (Array.isArray(argsOrOptions)
      ? maybeOptions
      : argsOrOptions) as childProcess.SpawnOptions | undefined;

    // Convert a hand-built `cmd.exe /d /s /c <command>` launch back into
    // Node's native shell mode so quoting and paths with spaces are handled by
    // Node rather than by extension code.
    if (
      args.length >= 4 &&
      args[0]?.toLowerCase() === "/d" &&
      args[1]?.toLowerCase() === "/s" &&
      args[2]?.toLowerCase() === "/c"
    ) {
      return nativeSpawn(args.slice(3).join(" "), {
        ...options,
        shell: command,
        windowsHide: true,
      });
    }

    // npm installs CLI shims as .cmd files on Windows. Node deliberately does
    // not execute those directly; cross-spawn resolves PATHEXT and quotes them.
    if (/\.(?:cmd|bat)$/i.test(command)) {
      return crossSpawn(command, args, options);
    }

    return Array.isArray(argsOrOptions)
      ? nativeSpawn(command, args, options)
      : nativeSpawn(command, options);
  }) as typeof childProcess.spawn;

  state[patchKey] = true;
  syncBuiltinESMExports();
}
