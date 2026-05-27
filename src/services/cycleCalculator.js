import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
let cycles = JSON.parse(
  readFileSync(join(__dirname, "../data/cycles.json"), "utf-8")
);

export const calculateRemaining = (itstId) => {
  const cycle = cycles[itstId];
  if (!cycle) return null;

  const now = new Date();
  const kstH = now.getUTCHours() + 9;
  const kstSeconds =
    (kstH % 24) * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();

  const [rh, rm, rs] = cycle.referenceGreenStartKST.split(":").map(Number);
  const refSeconds = rh * 3600 + rm * 60 + rs;

  let elapsed = (kstSeconds - refSeconds) % cycle.cycleSeconds;
  if (elapsed < 0) elapsed += cycle.cycleSeconds;

  const isGreen = elapsed < cycle.greenSeconds;
  const remainingSeconds = isGreen
    ? cycle.greenSeconds - elapsed
    : cycle.cycleSeconds - elapsed;

  return {
    status: isGreen ? "green" : "red",
    remainingSeconds,
    cycleSeconds: cycle.cycleSeconds,
    greenSeconds: cycle.greenSeconds
  };
};

export const updateCycle = (itstId, data) => {
  if (!cycles[itstId]) cycles[itstId] = { cycleSeconds: 170, greenSeconds: 40, referenceGreenStartKST: "00:00:00" };
  Object.assign(cycles[itstId], data);
};
