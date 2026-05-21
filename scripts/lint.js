import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ignoredDirectories = new Set(["node_modules", ".git", "coverage"]);
const files = collectJavaScriptFiles(".");
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const blockedCall = "console" + ".log";
  if (source.includes(blockedCall)) {
    violations.push(`${file}: contains ${blockedCall}`);
  }
}

if (violations.length > 0) {
  process.stderr.write(`${violations.join("\n")}\n`);
  process.exitCode = 1;
}

function collectJavaScriptFiles(directory) {
  const results = [];

  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.endsWith(".js")) {
      results.push(fullPath);
    }
  }

  return results;
}
