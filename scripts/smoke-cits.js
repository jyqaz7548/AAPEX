import { config } from "../src/config.js";
import { CitsClient } from "../src/services/citsClient.js";
import { normalizePedestrianSignals } from "../src/services/citsNormalizer.js";

const itstId = process.env.CITS_TEST_ITST_ID ?? "1537";
const client = new CitsClient(config);

try {
  const raw = await client.fetchSignalPhaseTiming(itstId);
  const signals = normalizePedestrianSignals(raw);

  process.stdout.write(`C-ITS smoke test ok\n`);
  process.stdout.write(`itstId: ${itstId}\n`);
  process.stdout.write(`pedestrianSignals: ${signals.length}\n`);
  process.stdout.write(`${JSON.stringify({ sample: signals.slice(0, 3) }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`C-ITS smoke test failed: ${error.message}\n`);
  process.exitCode = 1;
}
