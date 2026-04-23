import { PLUGIN_ID } from "./common";

export function buildPluginInfo() {
  return {
    name: "再漫画",
    uuid: PLUGIN_ID,
    iconUrl:
      "https://raw.githubusercontent.com/deretame/Breeze-plugin-zaiManHuan/refs/heads/main/assets/FS.png",
    creator: {
      name: "",
      describe: "",
    },
    describe: "再漫画插件",
    version: "0.0.1",
    home: "https://github.com/deretame/Breeze-plugin-zaiManHuan",
    updateUrl:
      "https://api.github.com/repos/deretame/Breeze-plugin-zaiManHuan/releases/latest",
    function: [],
  };
}

export function buildManifestInfo() {
  return buildPluginInfo();
}
