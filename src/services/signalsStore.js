import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "../data/signals.json");
const signals = JSON.parse(readFileSync(filePath, "utf-8"));

export const getAllSignals = () => signals;

export const getSignalById = (itstId) =>
  signals.find((s) => s.itstId === itstId) ?? null;

export const addSignal = ({ name, lat, lng }) => {
  const signal = { itstId: `custom-${Date.now()}`, name, lat, lng };
  signals.push(signal);
  writeFileSync(filePath, JSON.stringify(signals, null, 2), "utf-8");
  return signal;
};

export const removeSignal = (itstId) => {
  const idx = signals.findIndex((s) => s.itstId === itstId);
  if (idx === -1) return false;
  signals.splice(idx, 1);
  writeFileSync(filePath, JSON.stringify(signals, null, 2), "utf-8");
  return true;
};
