import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const pnpmCli = process.env.npm_execpath;
if (!pnpmCli) {
  throw new Error("Run this generator through `pnpm licenses:report`.");
}

const result = spawnSync(process.execPath, [pnpmCli, "licenses", "list", "--prod", "--json"], {
  encoding: "utf8",
});

if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const grouped = JSON.parse(result.stdout);
const packages = Object.entries(grouped)
  .flatMap(([license, entries]) =>
    entries.map((entry) => ({
      name: entry.name,
      versions: [...entry.versions].sort(),
      license,
      ...(entry.author ? { author: entry.author } : {}),
      ...(entry.homepage ? { homepage: entry.homepage } : {}),
    })),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

const lockfile = readFileSync("pnpm-lock.yaml");
const report = {
  generated_from: "pnpm licenses list --prod --json",
  lockfile_sha256: createHash("sha256").update(lockfile).digest("hex"),
  package_count: packages.length,
  packages,
};

writeFileSync(
  "public/third-party-packages.json",
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

console.log(`Recorded ${packages.length} production packages.`);
