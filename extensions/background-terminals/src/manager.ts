import "../../shared/windows-spawn-patch.ts";

export type {
  KillResult,
  StartOptions,
  TerminalManagerShape,
  TerminalReadModel,
} from "./manager-base.ts";

const implementation = await import("./manager-base.ts");

export const MAX_RUNNING = implementation.MAX_RUNNING;
export const MAX_TRACKED = implementation.MAX_TRACKED;
export const RETAINED_PER_STREAM = implementation.RETAINED_PER_STREAM;
export const MAX_SPILL_BYTES_PER_STREAM =
  implementation.MAX_SPILL_BYTES_PER_STREAM;
export const TerminalManager = implementation.TerminalManager;
export const TerminalManagerLive = implementation.TerminalManagerLive;
