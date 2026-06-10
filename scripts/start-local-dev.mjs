import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await run("node", ["scripts/sync-dev-ip.mjs"]);
await run("corepack", ["pnpm", "build:packages"]);

const services = [
  {
    name: "api",
    command: "corepack",
    args: ["pnpm", "--filter", "@moyuxia/api", "dev"]
  },
  {
    name: "admin",
    command: "corepack",
    args: ["pnpm", "--filter", "@moyuxia/admin", "dev"]
  },
  {
    name: "miniapp",
    command: "corepack",
    args: ["pnpm", "--filter", "@moyuxia/miniapp", "dev:mp-weixin"]
  }
];

let shuttingDown = false;
const children = services.map(startService);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(resolveCommand(command), args, {
      cwd: rootDir,
      stdio: "inherit"
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

function startService(service) {
  const child = spawn(resolveCommand(service.command), service.args, {
    cwd: rootDir,
    stdio: "inherit"
  });

  child.on("exit", (code) => {
    if (shuttingDown) {
      return;
    }

    console.error(`[${service.name}] 已退出，退出码：${code}`);
    shutdown();
  });

  return child;
}

function shutdown() {
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

function resolveCommand(command) {
  if (process.platform === "win32" && command === "corepack") {
    return "corepack.cmd";
  }

  return command;
}
