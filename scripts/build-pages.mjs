import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const repository =
  process.env.GITHUB_REPOSITORY ??
  "badtim2-gif/nthu-library-counter-english";
const [owner, repositoryName] = repository.split("/");
const isUserSite =
  repositoryName.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const basePath = isUserSite ? "" : `/${repositoryName}`;
const nextCli = path.resolve("node_modules", "next", "dist", "bin", "next");
const siteOrigin = `https://${owner}.github.io`;

console.log(`Building GitHub Pages site with base path: ${basePath || "/"}`);
const result = spawnSync(process.execPath, [nextCli, "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    GITHUB_PAGES: "true",
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_ORIGIN: siteOrigin,
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
