import { PLUGIN_ID } from './common';

export function buildPluginInfo() {
  const updatesScene = {
    title: '更新',
    source: PLUGIN_ID,
    body: {
      type: 'pluginPagedComicList' as const,
      request: {
        fnPath: 'getUpdatesData',
        core: {},
        extern: {
          source: 'updates',
        },
      },
    },
  };

  const rankingScene = {
    title: '排行',
    source: PLUGIN_ID,
    body: {
      type: 'pluginPagedComicList' as const,
      request: {
        fnPath: 'getRankingData',
        core: {},
        extern: {
          source: 'ranking',
          rankingType: 'classic',
          tagId: 0,
          byTime: 0,
          rankType: 0,
        },
      },
    },
    filter: {
      fnPath: 'getRankingFilterBundle',
      extern: {
        source: 'ranking',
      },
    },
  };

  return {
    name: '再漫画',
    uuid: PLUGIN_ID,
    iconUrl:
      'https://raw.githubusercontent.com/deretame/Breeze-plugin-zaiManHuan/refs/heads/main/assets/FS.webp',
    creator: {
      name: '',
      describe: '',
    },
    describe: '再漫画插件',
    version: '0.0.6',
    home: 'https://github.com/deretame/Breeze-plugin-zaiManHuan',
    updateUrl: 'https://api.github.com/repos/deretame/Breeze-plugin-zaiManHuan/releases/latest',
    npmName: 'breeze-plugin-zai-man-hua',
    function: [
      {
        id: 'updates',
        title: '更新',
        action: {
          type: 'openComicList' as const,
          payload: {
            scene: updatesScene,
          },
        },
      },
      {
        id: 'categories',
        title: '分类',
        action: {
          type: 'openPluginFunction' as const,
          payload: {
            id: 'categories',
            title: '分类',
            presentation: 'page' as const,
          },
        },
      },
      {
        id: 'ranking',
        title: '排行榜',
        action: {
          type: 'openComicList' as const,
          payload: {
            scene: rankingScene,
          },
        },
      },
      {
        id: 'subscriptions',
        title: '追更',
        action: {
          type: 'openComicList' as const,
          payload: {
            scene: {
              title: '追更',
              source: PLUGIN_ID,
              body: {
                type: 'pluginPagedComicList' as const,
                request: {
                  fnPath: 'getSubscriptionsData',
                  core: {},
                  extern: {
                    source: 'subscriptions',
                  },
                },
              },
            },
          },
        },
      },
    ],
  };
}

export function buildManifestInfo() {
  return buildPluginInfo();
}
