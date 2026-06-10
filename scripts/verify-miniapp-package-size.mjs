/* global console, process */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const outputDir = "apps/miniapp/dist/build/mp-weixin";
const maxPackageBytes = 3.75 * 1024 * 1024;

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(fullPath);
    }

    return [fullPath];
  });
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

if (!existsSync(outputDir)) {
  console.error(`Missing miniapp build output: ${outputDir}`);
  process.exitCode = 1;
} else {
  const files = collectFiles(outputDir).map((path) => ({
    path,
    size: statSync(path).size
  }));
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const topFiles = files.toSorted((left, right) => right.size - left.size).slice(0, 10);

  console.log(`miniapp mp-weixin package size: ${formatMb(totalBytes)} / 3.75MB`);

  if (totalBytes > maxPackageBytes) {
    console.error("Miniapp package exceeds the conservative WeChat real-device debug size budget.");
    for (const file of topFiles) {
      console.error(`${formatMb(file.size)}\t${relative(".", file.path)}`);
    }
    process.exitCode = 1;
  } else {
    console.log("miniapp package size verification passed");
  }
}
