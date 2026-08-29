import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJsonPath = resolve("apps/usagent/package.json");
const tauriConfPath = resolve("apps/usagent/src-tauri/tauri.conf.json");

const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf8"));

tauriConf.version = pkg.version;

writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`);
console.log(`Synced tauri.conf.json version -> ${pkg.version}`);
