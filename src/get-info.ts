import { PLUGIN_ID } from "./common";

export function buildPluginInfo() {
  return {
    name: "再漫画",
    uuid: PLUGIN_ID,
    iconUrl: "",
    creator: {
      name: "",
      describe: "",
    },
    describe: "再漫画插件",
    version: "0.1.0",
    home: "https://example.com",
    updateUrl: "https://httpstat.us/404",
    function: [],
  };
}

export function buildManifestInfo() {
  return buildPluginInfo();
}
