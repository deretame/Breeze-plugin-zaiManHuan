import type { ComicListScene, PluginInfo } from "breeze-plugin-kit";
import { PLUGIN_ID } from "./common";

export function buildUpdatesScene(): ComicListScene {
  return {
    title: "更新",
    source: PLUGIN_ID,
    body: {
      type: "pluginPagedComicList" as const,
      request: { fnPath: "getUpdatesData", core: {}, extern: { source: "updates" } },
    },
  };
}

export function buildRankingScene(): ComicListScene {
  return {
    title: "排行",
    source: PLUGIN_ID,
    body: {
      type: "pluginPagedComicList" as const,
      request: {
        fnPath: "getRankingData",
        core: {},
        extern: { source: "ranking", rankingType: "classic", tagId: 0, byTime: 0, rankType: 0 },
      },
    },
    filter: { fnPath: "getRankingFilterBundle", core: {}, extern: { source: "ranking" } },
  };
}

export function buildSubscriptionsScene(): ComicListScene {
  return {
    title: "追更",
    source: PLUGIN_ID,
    body: {
      type: "pluginPagedComicList" as const,
      request: { fnPath: "getSubscriptionsData", core: {}, extern: { source: "subscriptions" } },
    },
  };
}

export function buildPluginInfo(): PluginInfo {
  const updatesScene = buildUpdatesScene();
  const rankingScene = buildRankingScene();
  const subscriptionsScene = buildSubscriptionsScene();

  return {
    name: "再漫画",
    uuid: PLUGIN_ID,
    iconUrl:
      "https://raw.githubusercontent.com/deretame/Breeze-plugin-zaiManHuan/refs/heads/main/assets/FS.webp",
    describe: "再漫画插件",
    version: "0.1.0",
    home: "https://github.com/deretame/Breeze-plugin-zaiManHuan",
    updateUrl: "https://api.github.com/repos/deretame/Breeze-plugin-zaiManHuan/releases/latest",
    npmName: "breeze-plugin-zai-man-hua",
    haveHome: true,
    haveCloudFavorite: true,
    function: [
      {
        id: "updates",
        title: "更新",
        action: {
          type: "openComicList" as const,
          payload: {
            scene: updatesScene,
          },
        },
      },
      {
        id: "categories",
        title: "分类",
        action: {
          type: "openPluginFunction" as const,
          payload: {
            id: "categories",
            title: "分类",
            presentation: "page" as const,
          },
        },
      },
      {
        id: "ranking",
        title: "排行榜",
        action: {
          type: "openComicList" as const,
          payload: {
            scene: rankingScene,
          },
        },
      },
      {
        id: "subscriptions",
        title: "追更",
        action: {
          type: "openComicList" as const,
          payload: { scene: subscriptionsScene },
        },
      },
    ],
  };
}

export function buildManifestInfo() {
  return buildPluginInfo();
}
