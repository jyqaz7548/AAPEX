import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const signals = JSON.parse(
  readFileSync(join(__dirname, "../data/signals.json"), "utf-8")
);

export const getAllSignals = () => signals;

export const getSignalById = (itstId) =>
  signals.find((s) => s.itstId === itstId) ?? null;
