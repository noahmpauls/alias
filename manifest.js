import fs from "fs/promises";
import path from "path";
import process from "process";

const sharedManifest = {
  manifest_version: 3,
  name: "Alias",
  version: "1.0.0",
  description: "Browser extension for creating omnibox shortcuts.",

  icons: {
    "16": "ui/icons/icon_simple_16.png",
    "32": "ui/icons/icon_simple_32.png",
    "48": "ui/icons/icon_simple_48.png",
    "128": "ui/icons/icon_simple_128.png",
  },

  omnibox: {
    keyword: "!",
  },

  permissions: [
    "storage",
  ],
  
  action: {
    default_title: "Alias",
    default_icon: "ui/icons/icon_simple_128.png",
    default_popup: "ui/popup.html",
  },
}

const firefoxManifest = {
  ...sharedManifest,

  background: {
    scripts: ["scripts/background.js"],
  },

  browser_specific_settings: {
    gecko: {
      id: "alias@noahpauls.com",
    }
  },
}

const chromiumManifest = {
  ...sharedManifest,

  manifest_version: 3,

  background: {
    service_worker: "scripts/background.js",
  },
}

const generateManifest = async (manifest, targetDir) => {
  const manifestJson = JSON.stringify(manifest, null, 2);
  await fs.writeFile(path.resolve(targetDir, "manifest.json"), manifestJson);
}

const args = process.argv;
const target = args[2];

let manifest = undefined;
switch (target) {
  case "firefox": {
    manifest = firefoxManifest;
    break;
  }
  case "chromium": {
    manifest = chromiumManifest;
    break;
  }
  default: {
    console.error(target ? `[manifest] unknown target "${target}"` : "no target specified");
    process.exit(1);
  }
}

generateManifest(manifest, process.cwd());
console.log(`[manifest] generated ${target} manifest`);
