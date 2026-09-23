import type {
  CapabilitiesBundleContract,
  ChapterContentContract,
  ComicDetailContract,
  ComicPagedListContract,
  CommentFeedContract,
  CommentFeedPayload,
  CommentItem,
  FilterBundleContract,
  FunctionPageActionGridItem,
  FunctionPageContract,
  InfoContract,
  MetadataListItem,
  ReadSnapshotContract,
  SearchResultContract,
  SettingsBundleContract,
  ToggleFavoritePayload,
  ToggleFavoriteResult,
} from 'breeze-plugin-kit';
import { flutterTools, pluginConfig } from 'breeze-plugin-kit';
import {
  APP_BUILD_NUMBER,
  APP_CHANNEL,
  APP_VERSION,
  createApiClient,
  type ApiResponse,
} from './api';
import {
  NOT_FOUND_IMAGE_URL,
  PLACEHOLDER_IMAGE_PATH,
  PLUGIN_ID,
  createActionItem,
  createBasicMetadata,
  createImage,
  toStringMap,
} from './common';
import { buildPluginInfo } from './get-info';

type BasePayload = {
  extern?: Record<string, unknown>;
  core?: Record<string, unknown>;
  params?: Record<string, unknown>;
};

type SearchPayload = BasePayload & {
  keyword?: string;
  page?: number;
};

type ComicDetailPayload = BasePayload & {
  comicId?: string;
};

type ChapterPayload = BasePayload & {
  comicId?: string;
  chapterId?: string;
};

type ReadSnapshotPayload = {
  comicId?: string;
  chapterId?: string;
  extern?: Record<string, unknown>;
};

type FetchImagePayload = {
  url?: string;
  timeoutMs?: number;
};

type LoginPayload = {
  account?: string;
  password?: string;
  reason?: string;
  persistCredentials?: boolean;
};

type BookshelfPayload = BasePayload & {
  page?: number;
  size?: number;
};

type UpdatePayload = BasePayload & {
  page?: number;
  size?: number;
};

type CategoryPayload = BasePayload & {
  page?: number;
  sortType?: number | string;
  sort?: number | string;
  theme?: number | string;
  cate?: number | string;
  status?: number | string;
  zone?: number | string;
};

type RankingPayload = BasePayload & {
  page?: number;
  tagId?: number | string;
  byTime?: number | string;
  rankType?: number | string;
  rankingType?: string;
};

type FunctionPagePayload = BasePayload & {
  id?: string;
};

type FavoriteWorkflowAction = 'add' | 'removeAll' | 'removeFromTarget' | 'move';

type FavoriteWorkflowStartPayload = BasePayload & {
  comicId: string;
  action: FavoriteWorkflowAction;
  currentFavorite?: boolean;
};

type FavoriteWorkflowContinuePayload = BasePayload & {
  comicId: string;
  action: FavoriteWorkflowAction;
  continuationToken: string;
  input: {
    cancelled?: boolean;
    key?: string;
    value?: unknown;
    created?: string;
    values?: Record<string, unknown>;
  };
};

type FavoriteWorkflowResult = {
  status: 'completed' | 'awaitingInput' | 'partial' | 'failed' | 'cancelled';
  favorited?: boolean;
  committed?: boolean;
  message?: string;
  errorCode?: string;
  continuationToken?: string;
  input?: Record<string, unknown>;
};

type SearchApiComic = {
  id?: number | string;
  comic_id?: number | string;
  title?: string;
  coverUrl?: string;
  authors?: string | string[];
  cover?: string;
  status?: string;
  types?: string | string[];
  lastUpdatedAt?: string;
  hot_hits?: number;
  last_updatetime?: number;
  last_update_chapter_name?: string;
  lastUpdateChapterId?: number | string;
  lastUpdateChapterName?: string;
  subCount?: number | string;
  viewCount?: number | string;
  favoriteCount?: number | string;
  commentCount?: number | string;
  comic_py?: string;
};

type SearchApiData = {
  list?: SearchApiComic[];
  page?: number;
  size?: number;
  total?: number;
};

type DetailApiTag = {
  tag_id?: number;
  tag_name?: string;
};

type DetailApiChapter = {
  chapter_id?: number;
  chapter_title?: string;
  chapter_order?: number;
  updatetime?: number;
  is_fee?: boolean;
  canRead?: boolean;
};

type DetailApiChapterGroup = {
  title?: string;
  data?: DetailApiChapter[];
};

type DetailApiComicInfo = {
  id?: number;
  title?: string;
  cover?: string;
  description?: string;
  comic_py?: string;
  last_updatetime?: number;
  last_update_chapter_name?: string;
  hit_num?: number;
  hot_num?: number;
  subscribe_num?: number;
  authors?: DetailApiTag[];
  status?: DetailApiTag[];
  types?: DetailApiTag[];
  chapters?: DetailApiChapterGroup[];
};

type ChapterApiInfo = {
  chapter_id?: number;
  comic_id?: number;
  title?: string;
  chapter_order?: number;
  page_url?: string[];
  page_url_hd?: string[];
  canRead?: boolean;
};

type ChapterApiData = {
  data?: ChapterApiInfo;
};

type CatalogApiComic = {
  id?: number | string;
  comic_id?: number | string;
  title?: string;
  name?: string;
  cover?: string;
  coverUrl?: string;
  authors?: string | string[];
  status?: string | number;
  types?: string | string[];
  hot_hits?: number | string;
  hot_num?: number | string;
  hotNum?: number | string;
  hit_num?: number | string;
  viewCount?: number | string;
  favoriteCount?: number | string;
  subCount?: number | string;
  num?: number | string;
  last_update_chapter_id?: number | string;
  last_update_chapter_name?: string;
  chapter_name?: string;
  last_updatetime?: number | string;
  lastUpdatedAt?: string;
  lastUpdateChapterId?: number | string;
  lastUpdateChapterName?: string;
  comic_py?: string;
  is_sub?: boolean | number | string;
  [key: string]: unknown;
};

type UnifiedRankingApiData = {
  list?: CatalogApiComic[];
  total?: number | string;
};

type CategoryApiData = {
  comicList?: CatalogApiComic[];
  totalNum?: number | string;
};

type CategoryEntryApiItem = {
  tagId?: number | string;
  tagType?: number | string;
  title?: string;
  cover?: string;
  [key: string]: unknown;
};

type CategoryEntryApiData = {
  cateList?: CategoryEntryApiItem[];
};

type BookshelfListApiData = {
  subList?: unknown[];
  total?: number | string;
  totalNum?: number | string;
  hasNext?: boolean | number | string;
  hasMore?: boolean | number | string;
  pageCount?: number | string;
  pages?: number | string;
};

type ClassifyApiOption = {
  tagId?: number | string;
  tagName?: string;
};

type ClassifyApiGroup = {
  title?: string;
  list?: ClassifyApiOption[];
};

type ClassifyApiData = {
  classifyList?: ClassifyApiGroup[];
};

type RankTypeApiOption = {
  tag_id?: number | string;
  tag_name?: string;
};

type RankTypeApiData = {
  list?: RankTypeApiOption[];
};

type CommentApiItem = {
  id?: number | string;
  obj_id?: number | string;
  content?: string;
  sender_uid?: number | string;
  reply_amount?: number | string;
  create_time?: number | string;
  photo?: string;
  nickname?: string;
  author?: {
    uid?: number | string;
    nickname?: string;
    photo?: string;
    [key: string]: unknown;
  };
  replyList?: unknown[];
  replies?: unknown[];
  topStatus?: number | string;
  [key: string]: unknown;
};

type CommentApiData = {
  commentIdList?: Array<number | string>;
  commentList?: Record<string, CommentApiItem> | CommentApiItem[];
  total?: number | string;
};

type TaskListApiData = {
  signInfo?: {
    current_sign?: unknown;
    currentSign?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const USER_AGENT_CONFIG_KEY = 'network.userAgent';
const CLIENT_ID_CONFIG_KEY = 'network.clientId';
const AUTH_ACCOUNT_CONFIG_KEY = 'auth.account';
const AUTH_PASSWORD_CONFIG_KEY = 'auth.password';
const AUTH_TOKEN_CONFIG_KEY = 'auth.token';
const AUTH_CREDENTIALS_REQUIRED_ERROR =
  '[AUTH_CREDENTIALS_REQUIRED] 账号或密码不能为空，请先在设置中填写';
const AUTH_PERMISSION_INSUFFICIENT_ERROR =
  '权限不足，请前往快漫画官方app中提升权限等级（如绑定手机号）';
const COMIC_SOURCE = '1';
const UPDATE_PAGE_SIZE = 100;
const CATEGORY_PAGE_SIZE = 18;
const SEARCH_PAGE_SIZE = 24;
const CLASSIC_RANKING_PAGE_SIZE = 10;
const UNIFIED_RANKING_PAGE_SIZE = 20;
const COMMENT_PAGE_SIZE = 10;
const BOOKSHELF_DEFAULT_PAGE_SIZE = 100;
const RANKING_MODE_OPTIONS = [
  { label: '总排行', value: 'classic' },
  { label: '热门榜', value: 'hot' },
  { label: '新作榜', value: 'new' },
  { label: '收藏榜', value: 'collection' },
  { label: '推荐榜', value: 'recommend' },
  { label: '完结榜', value: 'finished' },
  { label: '飙升榜', value: 'rising' },
] as const;
const UNIFIED_RANKING_TYPES: ReadonlySet<string> = new Set(
  RANKING_MODE_OPTIONS.filter((option) => option.value !== 'classic').map((option) => option.value)
);
const RANKING_TIME_OPTIONS = [
  { label: '日排行', value: 0 },
  { label: '周排行', value: 2 },
  { label: '月排行', value: 4 },
  { label: '总排行', value: 6 },
] as const;
const RANKING_TYPE_OPTIONS = [
  { label: '人气排行', value: 0 },
  { label: '吐槽排行', value: 2 },
  { label: '订阅排行', value: 4 },
] as const;
const AUTO_SIGN_IN_RETRY_DELAY_MS = 60_000;

let userAgentCache: string | null = null;
let userAgentInitPromise: Promise<string> | null = null;
let authTokenCache: string | null = null;
let authTokenInitPromise: Promise<string> | null = null;
let loginInFlight: Promise<string> | null = null;
let clientIdCache: string | null = null;
let clientIdInitPromise: Promise<string> | null = null;
let autoSignInPromise: Promise<void> | null = null;
let zmhInitStarted = false;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)];
}

function randomToken(length = 6) {
  const source = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += source[randomInt(0, source.length - 1)];
  }
  return result;
}

function randomAndroidDevice() {
  const profile = pickOne([
    {
      brand: 'Xiaomi',
      modelPrefix: '230',
      modelSuffixes: ['1C', '1A', '2B', '3D', '3G', '4R'],
    },
    {
      brand: 'samsung',
      modelPrefix: 'SM-',
      modelSuffixes: ['S9180', 'S9260', 'A5560', 'A7360', 'S9210'],
    },
    {
      brand: 'OnePlus',
      modelPrefix: 'CPH',
      modelSuffixes: ['2581', '2609', '2451', '2449', '2493'],
    },
    {
      brand: 'vivo',
      modelPrefix: 'V',
      modelSuffixes: ['2337A', '2366A', '2358A', '2318A', '2407A'],
    },
    {
      brand: 'HUAWEI',
      modelPrefix: 'NOH-',
      modelSuffixes: ['AN00', 'AL10', 'NX9', 'LX9', 'TL00'],
    },
  ] as const);

  return `${profile.modelPrefix}${pickOne(profile.modelSuffixes)} ${profile.brand}`;
}

function buildRandomUserAgent() {
  const androidVersion = pickOne(['10', '11', '12', '13', '14', '15'] as const);
  const device = randomAndroidDevice();
  const webKitVersion = `537.${randomInt(30, 38)}`;
  const chromeMajor = randomInt(108, 136);
  const chromeBuildA = randomInt(0, 9);
  const chromeBuildB = randomInt(1000, 6999);
  const chromeBuildC = randomInt(50, 199);
  const buildId = `${pickOne(['QP1A', 'SP1A', 'TP1A', 'UP1A', 'AP1A'] as const)}.${randomInt(200000, 999999)}.${randomInt(1, 99)}`;
  const optionalTail = pickOne([
    '',
    `; wv`,
    `; ${randomToken(2)}-${randomToken(2)}`,
    `; zh-cn`,
  ] as const);

  return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${device}; Build/${buildId}${optionalTail}) AppleWebKit/${webKitVersion} (KHTML, like Gecko) Chrome/${chromeMajor}.${chromeBuildA}.${chromeBuildB}.${chromeBuildC} Mobile Safari/${webKitVersion}`;
}

async function getPersistedUserAgent() {
  if (userAgentCache) {
    return userAgentCache;
  }
  if (userAgentInitPromise) {
    return userAgentInitPromise;
  }

  userAgentInitPromise = (async () => {
    try {
      const saved = await loadAndNormalizeConfigString(USER_AGENT_CONFIG_KEY, '');
      if (saved) {
        userAgentCache = saved;
        return saved;
      }
    } catch {
      // ignore and fallback to generate
    }

    const ua = buildRandomUserAgent();
    userAgentCache = ua;
    try {
      await pluginConfig.save(USER_AGENT_CONFIG_KEY, ua);
    } catch {
      // ignore save failure; keep in-memory UA
    }
    return ua;
  })();

  try {
    return await userAgentInitPromise;
  } finally {
    userAgentInitPromise = null;
  }
}

function decodeConfigString(raw: unknown, fallback = '') {
  if (raw === undefined || raw === null) {
    return fallback;
  }

  if (typeof raw === 'object') {
    const map = raw as Record<string, unknown>;
    if (map.ok === true && 'value' in map) {
      return decodeConfigString(map.value, fallback);
    }
    return fallback;
  }

  const text = String(raw);
  if (!text.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text.trim());
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as Record<string, unknown>).ok === true &&
      'value' in (parsed as Record<string, unknown>)
    ) {
      return decodeConfigString((parsed as Record<string, unknown>).value, fallback);
    }
    if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
      return String(parsed);
    }
  } catch {
    // use raw text
  }
  return text;
}

async function saveConfigString(key: string, value: string) {
  const normalized = decodeConfigString(value, '');
  await pluginConfig.save(key, normalized);
}

async function loadAndNormalizeConfigString(key: string, fallback = '') {
  const raw = await pluginConfig.load(key, fallback);
  const normalized = decodeConfigString(raw, fallback);
  const currentRawText = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
  if (currentRawText !== normalized) {
    try {
      await saveConfigString(key, normalized);
    } catch {
      // ignore normalize-write errors
    }
  }
  return normalized;
}

async function loadAuthAccount() {
  return (await loadAndNormalizeConfigString(AUTH_ACCOUNT_CONFIG_KEY, '')).trim();
}

async function loadAuthPassword() {
  return await loadAndNormalizeConfigString(AUTH_PASSWORD_CONFIG_KEY, '');
}

async function loadLoginCredentials() {
  const [configuredAccount, configuredPassword] = await Promise.all([
    loadAuthAccount(),
    loadAuthPassword(),
  ]);
  return {
    account: configuredAccount,
    password: configuredPassword,
  };
}

async function loadAuthToken() {
  if (authTokenCache !== null) {
    return authTokenCache;
  }
  if (authTokenInitPromise) {
    return authTokenInitPromise;
  }
  authTokenInitPromise = (async () => {
    const token = (await loadAndNormalizeConfigString(AUTH_TOKEN_CONFIG_KEY, '')).trim();
    authTokenCache = token;
    return token;
  })();
  try {
    return await authTokenInitPromise;
  } finally {
    authTokenInitPromise = null;
  }
}

async function saveAuthToken(token: string) {
  const normalized = String(token ?? '').trim();
  authTokenCache = normalized;
  await saveConfigString(AUTH_TOKEN_CONFIG_KEY, normalized);
}

async function md5Hex(input: string) {
  const hash = await bridge.call('crypto.md5_hex', input);
  return String(hash ?? '').trim();
}

async function getClientId() {
  if (clientIdCache !== null) {
    return clientIdCache;
  }
  if (clientIdInitPromise) {
    return clientIdInitPromise;
  }

  clientIdInitPromise = (async () => {
    const persisted = (await loadAndNormalizeConfigString(CLIENT_ID_CONFIG_KEY, '')).trim();
    if (persisted) {
      clientIdCache = persisted;
      return persisted;
    }

    const seed = `${Date.now()}-${randomToken(32)}`;
    let clientId = '';
    try {
      clientId = await md5Hex(seed);
    } catch {
      // 纯测试环境可能没有 crypto bridge，随机值仍能满足客户端标识要求。
    }
    clientId = clientId || `${Date.now()}${randomToken(24)}`;
    clientIdCache = clientId;
    try {
      await saveConfigString(CLIENT_ID_CONFIG_KEY, clientId);
    } catch {
      // ignore client id persistence errors
    }
    return clientId;
  })();

  try {
    return await clientIdInitPromise;
  } finally {
    clientIdInitPromise = null;
  }
}

function requireCredentials(account: string, password: string) {
  if (!account.trim() || !String(password ?? '').trim()) {
    throw new Error(AUTH_CREDENTIALS_REQUIRED_ERROR);
  }
}

async function loginWithPassword(payload: LoginPayload = {}) {
  const account = String(payload.account ?? '').trim();
  const password = String(payload.password ?? '');
  requireCredentials(account, password);

  if (loginInFlight) {
    const token = await loginInFlight;
    return {
      source: PLUGIN_ID,
      data: {
        account,
        password,
        jwtToken: token,
      },
    };
  }

  loginInFlight = (async () => {
    const encryptedPwd = await md5Hex(password);
    const formData = new URLSearchParams();
    formData.append('username', account);
    formData.append('passwd', encryptedPwd);

    let json;
    try {
      json = await zmhApi.requestAccountApi<Record<string, unknown>>('/login/passwd', {
        method: 'POST',
        body: formData.toString(),
        includeAuth: false,
        contentType: 'application/x-www-form-urlencoded;charset=utf-8',
        checkErrno: false,
        errorPrefix: '登录请求失败',
      });
    } catch (error) {
      const message = getErrorMessage(error, '登录请求失败');
      flutterTools.showToast({
        message,
        level: 'error',
      });
      throw error;
    }
    if (json.errno !== 0) {
      flutterTools.showToast({
        message: json.errmsg || '登录失败',
        level: 'error',
      });
      throw new Error(json.errmsg || '登录失败');
    }
    const user = toStringMap(toStringMap(json.data).user);
    const token = String(user.token ?? '').trim();
    if (!token) {
      flutterTools.showToast({
        message: '登录成功但未返回 token',
        level: 'error',
      });
      throw new Error('登录成功但未返回 token');
    }

    if (payload.persistCredentials !== false) {
      await Promise.all([
        saveConfigString(AUTH_ACCOUNT_CONFIG_KEY, account),
        saveConfigString(AUTH_PASSWORD_CONFIG_KEY, password),
      ]);
    }
    await saveAuthToken(token);
    schedulePostLoginTasks('login');
    return token;
  })();

  try {
    const token = await loginInFlight;
    return {
      source: PLUGIN_ID,
      data: {
        account,
        password,
        jwtToken: token,
      },
    };
  } finally {
    loginInFlight = null;
  }
}

async function loginWithStoredCredentials(reason = 'unknown') {
  const { account, password } = await loadLoginCredentials();
  try {
    return await loginWithPassword({
      account,
      password,
      reason,
      persistCredentials: true,
    });
  } catch (error) {
    console.error('[zmh.login] failed', {
      reason,
      hasAccount: Boolean(account),
      hasPassword: Boolean(String(password).trim()),
      message: String((error as { message?: string } | null)?.message ?? error),
    });
    throw error;
  }
}

function readSettingPayloadValue(payload: Record<string, unknown>, key: string) {
  const direct = payload.value;
  if (direct !== undefined && direct !== null) {
    return decodeConfigString(direct, '');
  }
  if (payload[key] !== undefined && payload[key] !== null) {
    return decodeConfigString(payload[key], '');
  }
  const data = toStringMap(payload.data);
  if (data[key] !== undefined && data[key] !== null) {
    return decodeConfigString(data[key], '');
  }
  if (data.value !== undefined && data.value !== null) {
    return decodeConfigString(data.value, '');
  }
  return '';
}

async function setAccountAndLogin(payload: Record<string, unknown> = {}) {
  const account = readSettingPayloadValue(payload, AUTH_ACCOUNT_CONFIG_KEY).trim();
  await saveConfigString(AUTH_ACCOUNT_CONFIG_KEY, account);
  const password = await loadAuthPassword();
  const result = await loginWithPassword({
    account,
    password,
    reason: 'settings.account.changed',
    persistCredentials: true,
  });
  flutterTools.showToast({
    message: '登录成功',
    level: 'success',
  });
  return {
    source: PLUGIN_ID,
    data: {
      account,
      jwtToken: String(toStringMap(result.data).jwtToken ?? ''),
    },
  };
}

async function setPasswordAndLogin(payload: Record<string, unknown> = {}) {
  const password = readSettingPayloadValue(payload, AUTH_PASSWORD_CONFIG_KEY);
  await saveConfigString(AUTH_PASSWORD_CONFIG_KEY, password);
  const account = await loadAuthAccount();
  const result = await loginWithPassword({
    account,
    password,
    reason: 'settings.password.changed',
    persistCredentials: true,
  });
  flutterTools.showToast({
    message: '登录成功',
    level: 'success',
  });
  return {
    source: PLUGIN_ID,
    data: {
      account,
      jwtToken: String(toStringMap(result.data).jwtToken ?? ''),
    },
  };
}

async function getDefaultHeaders(
  options: {
    includeAuth?: boolean;
    token?: string;
  } = {}
) {
  const [userAgent, clientId] = await Promise.all([getPersistedUserAgent(), getClientId()]);
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
    Platform: 'android',
    'X-Client-ID': clientId,
    AppVersion: APP_VERSION,
    BuildNumber: APP_BUILD_NUMBER,
    Channel: APP_CHANNEL,
  };
  if (options.includeAuth !== false) {
    const token = String(options.token ?? '').trim() || (await loadAuthToken());
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

function getErrorMessage(error: unknown, fallback = '请求失败') {
  const message = String((error as { message?: unknown } | null)?.message ?? '').trim();
  return message || fallback;
}

function isAuthError(errno: unknown, errmsg: unknown) {
  const code = Number(errno);
  const message = String(errmsg ?? '').toLowerCase();
  return (
    [401, 403, 1001, 1002, 1003, 1004].includes(code) ||
    /登录|令牌|token|授权|认证|未登录|过期|unauthorized|forbidden/.test(message)
  );
}

async function ensureAuthenticated(reason: string) {
  const currentToken = await loadAuthToken();
  if (currentToken) {
    return currentToken;
  }

  await loginWithStoredCredentials(reason);
  const token = await loadAuthToken();
  if (!token) {
    throw new Error('登录成功但未保存 token');
  }
  return token;
}

const zmhApi = createApiClient({
  getDefaultHeaders,
  ensureAuthenticated,
  loginWithStoredCredentials,
  isAuthError,
});

function toDetailTagList(values: unknown): DetailApiTag[] {
  const list = Array.isArray(values) ? values : [];
  return list
    .map((item) => toStringMap(item))
    .map((item) => ({
      tag_id: toNumber(item.tag_id, 0),
      tag_name: String(item.tag_name ?? '').trim(),
    }))
    .filter((item) => item.tag_name);
}

function toTagNameList(values: unknown): string[] {
  return toDetailTagList(values)
    .map((item) => item.tag_name ?? '')
    .filter(Boolean);
}

function createDetailMetadataActionList(
  type: string,
  name: string,
  tags: DetailApiTag[],
  createOnTap: (tagName: string, tag: DetailApiTag) => Record<string, unknown>
): MetadataListItem | null {
  const value = tags
    .map((tag) => {
      const tagName = String(tag.tag_name ?? '').trim();
      return tagName ? createActionItem(tagName, createOnTap(tagName, tag)) : null;
    })
    .filter((item): item is ReturnType<typeof createActionItem> => item !== null);

  return value.length ? { type, name, value } : null;
}

function createCategoryMetadataAction(tagName: string, tag: DetailApiTag) {
  const tagId = toNumber(tag.tag_id, 0);
  if (!tagId) {
    return {
      type: 'openSearch',
      payload: {
        source: PLUGIN_ID,
        keyword: tagName,
      },
    };
  }

  const categoryExtern = {
    source: 'category',
    theme: tagId,
  };
  return {
    type: 'openComicList',
    payload: {
      scene: {
        title: tagName,
        source: PLUGIN_ID,
        body: {
          type: 'pluginPagedComicList',
          request: {
            fnPath: 'getCategoriesData',
            core: {},
            extern: categoryExtern,
          },
        },
        filter: {
          fnPath: 'getCategoryFilterBundle',
          core: {},
          extern: categoryExtern,
        },
      },
    },
  };
}

function createAuthorMetadataAction(tagName: string) {
  return {
    type: 'openSearch',
    payload: {
      source: PLUGIN_ID,
      keyword: tagName,
      extern: { mode: 'author' },
    },
  };
}

function splitTypeValues(value: unknown): string[] {
  return String(value ?? '')
    .split(/[/,，]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTextValues(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item ?? '').split(/[/,，]/g))
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatUnixSeconds(value: unknown): string {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }
  return new Date(seconds * 1000).toISOString().slice(0, 19).replace('T', ' ');
}

function formatApiDate(value: unknown): string {
  const numeric = Number(value);
  if (String(value ?? '').trim() && Number.isFinite(numeric) && numeric > 0) {
    return formatUnixSeconds(numeric);
  }

  const text = String(value ?? '').trim();
  if (!text) {
    return '';
  }

  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ')
    : text;
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return /^(1|true|yes|y|是)$/i.test(String(value ?? '').trim());
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function createPagingInfo(page: number, pages: number, total: number) {
  return {
    page,
    pages: Math.max(1, pages),
    total,
    hasReachedMax: page >= Math.max(1, pages),
  };
}

function createSearchResultResponse(
  payload: SearchPayload,
  page: number,
  items: SearchResultContract['items'],
  total: number,
  hasReachedMax?: boolean
): SearchResultContract {
  const pageCount = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const paging = {
    ...createPagingInfo(page, pageCount, total),
    ...(hasReachedMax === undefined ? {} : { hasReachedMax }),
  };

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    scheme: {
      version: '1.0.0',
      type: 'searchResult',
      source: PLUGIN_ID,
      list: 'comicGrid',
    },
    data: {
      paging,
      items,
    },
    paging,
    items,
  };
}

async function fetchUnifiedSearchPage(keyword: string, page: number) {
  const response = await zmhApi.fetchApiResponse<SearchApiData>('/search/unified', {
    keyword,
    type: 'comic',
    page,
    pageSize: SEARCH_PAGE_SIZE,
  });
  const data = toStringMap(getApiDataOrThrow(response, '搜索'));
  const list = (Array.isArray(data.list) ? data.list : []) as SearchApiComic[];
  return {
    list,
    total: toNumber(data.total, list.length),
  };
}

function pickDetailComicId(item: SearchApiComic): string {
  const rawId = String(item.comic_id ?? item.id ?? '').trim();
  const match = /^M_(\d+)$/i.exec(rawId);
  return match?.[1] ?? rawId;
}

function mapSearchItemToComicGrid(item: SearchApiComic) {
  const comicId = pickDetailComicId(item);
  const title = String(item.title ?? '').trim() || `漫画 ${comicId}`;
  const authors = splitTextValues(item.authors);
  const statusText = String(item.status ?? '').trim();
  const latestChapter = String(
    item.lastUpdateChapterName ?? item.last_update_chapter_name ?? ''
  ).trim();
  const subtitle = [authors.join(' / '), statusText, latestChapter].filter(Boolean).join(' · ');
  const coverUrl = String(item.coverUrl ?? item.cover ?? '').trim();
  const typeValues = splitTypeValues(item.types);
  const path = `comic/${comicId}/cover.jpg`;
  const updatedAt = formatApiDate(item.lastUpdatedAt ?? item.last_updatetime);
  const hotHits = toNumber(
    item.viewCount ?? item.subCount ?? item.favoriteCount ?? item.hot_hits,
    0
  );

  return {
    source: PLUGIN_ID,
    id: comicId,
    title,
    subtitle,
    finished: /完结|短篇/.test(statusText),
    likesCount: toNumber(item.favoriteCount ?? item.subCount, hotHits),
    viewsCount: toNumber(item.viewCount, hotHits),
    updatedAt,
    cover: {
      id: comicId,
      url: coverUrl || NOT_FOUND_IMAGE_URL,
      path,
      name: `${comicId}.jpg`,
      extern: {
        path,
        comicPy: String(item.comic_py ?? '').trim(),
      },
    },
    metadata: [
      createBasicMetadata('author', '作者', authors),
      createBasicMetadata('categories', '分类', typeValues),
      createBasicMetadata('status', '状态', statusText ? [statusText] : []),
      createBasicMetadata('latest', '更新', latestChapter ? [latestChapter] : []),
      createBasicMetadata('works', '作品', []),
      createBasicMetadata('actors', '角色', []),
    ],
    raw: item,
    extern: {
      comicId,
      comicPy: String(item.comic_py ?? '').trim(),
      lastUpdateChapterId: String(item.lastUpdateChapterId ?? '').trim(),
    },
  };
}

function pickCatalogComicId(item: CatalogApiComic) {
  const comicId = String(item.comic_id ?? item.id ?? '').trim();
  const match = /^M_(\d+)$/i.exec(comicId);
  return match?.[1] ?? comicId;
}

function mapCatalogItemToComicGrid(item: CatalogApiComic) {
  const comicId = pickCatalogComicId(item);
  const title = String(item.title ?? item.name ?? '').trim() || `漫画 ${comicId}`;
  const authorValues = splitTextValues(item.authors);
  const typeValues = splitTypeValues(item.types);
  const statusText = String(item.status ?? '').trim();
  const latestChapter = String(item.last_update_chapter_name ?? item.chapter_name ?? '').trim();
  const subtitle = [authorValues.join(' / '), statusText, latestChapter]
    .filter(Boolean)
    .join(' · ');
  const coverUrl = String(item.cover ?? item.coverUrl ?? '').trim();
  const path = `comic/${comicId}/cover.jpg`;
  const hotHits = toNumber(
    item.hotNum ?? item.hot_num ?? item.hot_hits ?? item.subCount ?? item.favoriteCount ?? item.num,
    0
  );
  const views = toNumber(item.hit_num ?? item.viewCount ?? item.num, 0);

  return {
    source: PLUGIN_ID,
    id: comicId,
    title,
    subtitle,
    finished: /完结|已完结|短篇/.test(statusText),
    likesCount: hotHits,
    viewsCount: views,
    updatedAt: formatApiDate(item.last_updatetime),
    cover: {
      id: comicId,
      url: coverUrl || NOT_FOUND_IMAGE_URL,
      path,
      name: `${comicId}.jpg`,
      extern: {
        path,
        comicPy: String(item.comic_py ?? '').trim(),
      },
    },
    metadata: [
      createBasicMetadata('author', '作者', authorValues),
      createBasicMetadata('categories', '分类', typeValues),
      createBasicMetadata('status', '状态', statusText ? [statusText] : []),
      createBasicMetadata('latest', '更新', latestChapter ? [latestChapter] : []),
      createBasicMetadata('works', '作品', []),
      createBasicMetadata('actors', '角色', []),
    ],
    raw: item,
    extern: {
      comicId,
      comicPy: String(item.comic_py ?? '').trim(),
      lastUpdateChapterId: String(item.last_update_chapter_id ?? '').trim(),
      isSubscribed: toBoolean(item.is_sub),
    },
  };
}

function createComicPagedListResponse(
  payload: BasePayload,
  items: ComicPagedListContract['data']['items'],
  hasReachedMax: boolean,
  type: string
): ComicPagedListContract {
  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    scheme: {
      version: '1.0.0',
      type,
      card: 'comic',
    },
    data: {
      items,
      hasReachedMax,
    },
  };
}

function getApiDataOrThrow<T>(response: ApiResponse<T>, operation: string) {
  const errno = Number(response.errno);
  if (
    response.errno !== undefined &&
    response.errno !== null &&
    Number.isFinite(errno) &&
    errno !== 0
  ) {
    throw new Error(response.errmsg || `${operation}失败(${response.errno})`);
  }
  return response.data;
}

function getCategoryFilterValues(tagType: number, tagId: number) {
  switch (tagType) {
    case 4:
      return { zone: tagId };
    case 5:
      return { status: tagId };
    case 6:
      return { cate: tagId };
    case 1:
    default:
      return { theme: tagId };
  }
}

function buildFunctionActionGridPage(
  title: string,
  items: FunctionPageActionGridItem[]
): FunctionPageContract {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: '1.0.0',
      type: 'page',
      title,
      body: {
        type: 'list',
        children: [{ type: 'action-grid', key: 'items' }],
      },
    },
    data: {
      items,
      hasReachedMax: true,
    },
  };
}

function buildCategoriesFunctionPage(items: FunctionPageActionGridItem[]): FunctionPageContract {
  return buildFunctionActionGridPage('分类', items);
}

async function getFunctionPage(payload: FunctionPagePayload = {}): Promise<FunctionPageContract> {
  const extern = toStringMap(payload.extern);
  const id = String(payload.id ?? extern.id ?? 'categories').trim();

  if (id !== 'categories') {
    throw new Error(`不支持的功能页面：${id || '未指定'}`);
  }

  const response = await zmhApi.fetchApiResponse<CategoryEntryApiData>('/comic/filter/category', {
    source: 1,
  });
  const data = getApiDataOrThrow(response, '加载分类入口');
  const categoryList = Array.isArray(data?.cateList) ? data.cateList : [];
  const items = categoryList
    .map((category): FunctionPageActionGridItem | null => {
      const tagId = toNumber(category.tagId, 0);
      const tagType = toNumber(category.tagType, 1);
      const title = String(category.title ?? '').trim();
      if (!tagId || !title) {
        return null;
      }

      const coverUrl = String(category.cover ?? '').trim();
      const categoryFilter = getCategoryFilterValues(tagType, tagId);
      const requestExtern = {
        source: 'category',
        ...categoryFilter,
      };

      return {
        title,
        cover: {
          url: coverUrl || NOT_FOUND_IMAGE_URL,
          path: coverUrl ? `category/${tagId}.jpg` : PLACEHOLDER_IMAGE_PATH,
          extern: {
            tagId,
            tagType,
          },
        },
        action: {
          type: 'openComicList',
          payload: {
            scene: {
              title,
              source: PLUGIN_ID,
              body: {
                type: 'pluginPagedComicList',
                request: {
                  fnPath: 'getCategoriesData',
                  core: {},
                  extern: requestExtern,
                },
              },
              filter: {
                fnPath: 'getCategoryFilterBundle',
                core: {},
                extern: requestExtern,
              },
            },
          },
        },
        raw: category,
      };
    })
    .filter((item): item is FunctionPageActionGridItem => item !== null);

  return buildCategoriesFunctionPage(items);
}

async function getUpdatesData(payload: UpdatePayload = {}): Promise<ComicPagedListContract> {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, toNumber(payload.page ?? extern.page, 1));
  const size = Math.max(
    1,
    Math.min(UPDATE_PAGE_SIZE, toNumber(payload.size ?? extern.size, UPDATE_PAGE_SIZE))
  );
  const response = await zmhApi.fetchApiResponse<CatalogApiComic[]>(
    `/comic/update/list/${size}/${page}`
  );
  const list = getApiDataOrThrow(response, '加载更新列表');
  const items = (Array.isArray(list) ? list : [])
    .map((item) => mapCatalogItemToComicGrid(item))
    .filter((item) => item.id);

  return createComicPagedListResponse(payload, items, items.length < size, 'comicUpdateFeed');
}

async function getCategoriesData(payload: CategoryPayload = {}): Promise<ComicPagedListContract> {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, toNumber(payload.page ?? extern.page, 1));
  const sortType = toNumber(payload.sortType ?? payload.sort ?? extern.sortType ?? extern.sort, 2);
  const theme = toNumber(payload.theme ?? extern.theme, 0);
  const cate = toNumber(payload.cate ?? extern.cate, 0);
  const status = toNumber(payload.status ?? extern.status, 0);
  const zone = toNumber(payload.zone ?? extern.zone, 0);
  const response = await zmhApi.fetchApiResponse<CategoryApiData>('/comic/filter/list', {
    page,
    sortType,
    theme,
    cate,
    status,
    zone,
  });
  const data = toStringMap(getApiDataOrThrow(response, '加载分类列表'));
  const list = (Array.isArray(data.comicList) ? data.comicList : []) as CatalogApiComic[];
  const items = list.map((item) => mapCatalogItemToComicGrid(item)).filter((item) => item.id);
  const total = toNumber(data.totalNum, 0);
  const hasReachedMax =
    items.length < CATEGORY_PAGE_SIZE || (total > 0 && page * CATEGORY_PAGE_SIZE >= total);

  return createComicPagedListResponse(payload, items, hasReachedMax, 'comicCategoryFeed');
}

function createCoreChoiceField(
  key: string,
  label: string,
  options: Array<{ label: string; value: number | string }>
) {
  return {
    key,
    kind: 'choice' as const,
    label,
    options: options.map((option) => ({
      label: option.label,
      value: option.value,
      result: {
        core: { [key]: option.value },
        // 兼容仍只读取 extern 的旧宿主版本；当前宿主会优先使用 core。
        extern: { [key]: option.value },
      },
    })),
  };
}

function mapClassifyOptions(options: ClassifyApiOption[] | undefined) {
  const seen = new Set<number>();
  return (Array.isArray(options) ? options : [])
    .map((option) => ({
      label: String(option.tagName ?? '').trim(),
      value: toNumber(option.tagId, 0),
    }))
    .filter((option) => {
      if (!option.label || seen.has(option.value)) {
        return false;
      }
      seen.add(option.value);
      return true;
    });
}

function schedulePostLoginTasks(reason: string) {
  console.info(`[zmh.login] schedule background tasks (${reason})`);
  void runAutoSignInUntilSuccess().catch((error) => {
    console.warn('[zmh.signIn] background task stopped', error);
  });
}

async function getCategoryFilterBundle(payload: BasePayload = {}): Promise<FilterBundleContract> {
  const extern = toStringMap(payload.extern);
  const fieldKeyByTitle: Record<string, string> = {
    题材: 'theme',
    读者群: 'cate',
    进度: 'status',
    地域: 'zone',
  };
  const fields: FilterBundleContract['scheme']['fields'] = [
    createCoreChoiceField('sortType', '排序', [
      { label: '更新时间', value: 1 },
      { label: '人气', value: 2 },
    ]),
  ];
  const defaultOptions = [{ label: '全部', value: 0 }];

  try {
    const response = await zmhApi.fetchApiResponse<ClassifyApiData>('/comic/filter/classify');
    const data = getApiDataOrThrow(response, '加载分类筛选');
    const groups = Array.isArray(data?.classifyList) ? data.classifyList : [];
    for (const group of groups) {
      const title = String(group.title ?? '').trim();
      const key = fieldKeyByTitle[title];
      if (!key) {
        continue;
      }
      const options = mapClassifyOptions(group.list);
      fields.push(createCoreChoiceField(key, title, options.length ? options : defaultOptions));
    }
  } catch (error) {
    console.warn('[zmh.category] load filter failed', getErrorMessage(error));
  }

  for (const [title, key] of Object.entries(fieldKeyByTitle)) {
    if (!fields.some((field) => field.key === key)) {
      fields.push(createCoreChoiceField(key, title, defaultOptions));
    }
  }

  return {
    source: PLUGIN_ID,
    scheme: {
      version: '1.0.0',
      type: 'comicCategoryFilter',
      title: '分类筛选',
      fields,
    },
    data: {
      values: {
        sortType: toNumber(extern.sortType ?? extern.sort, 2),
        theme: toNumber(extern.theme, 0),
        cate: toNumber(extern.cate, 0),
        status: toNumber(extern.status, 0),
        zone: toNumber(extern.zone, 0),
      },
    },
  };
}

async function fetchUnifiedRanking(rankingType: string, page: number) {
  const response = await zmhApi.fetchApiResponse<UnifiedRankingApiData>('/search/rankings', {
    rankingType,
    type: 'comic',
    page,
    pageSize: UNIFIED_RANKING_PAGE_SIZE,
  });
  const data = toStringMap(getApiDataOrThrow(response, '加载新版排行榜'));
  const list = (Array.isArray(data.list) ? data.list : []) as CatalogApiComic[];
  return {
    list,
    total: toNumber(data.total, list.length),
  };
}

function createRankingFeedResponse(
  payload: RankingPayload,
  list: CatalogApiComic[],
  page: number,
  pageSize: number,
  total: number | null = null
) {
  const items = list.map((item) => mapCatalogItemToComicGrid(item)).filter((item) => item.id);
  const hasReachedMax =
    items.length < pageSize || (total !== null && total > 0 && page * pageSize >= total);
  return createComicPagedListResponse(payload, items, hasReachedMax, 'comicRankingFeed');
}

async function getRankingData(payload: RankingPayload = {}): Promise<ComicPagedListContract> {
  const extern = toStringMap(payload.extern);
  const core = toStringMap(payload.core);
  const params = toStringMap(payload.params);
  const page = Math.max(1, toNumber(payload.page ?? core.page ?? params.page ?? extern.page, 1));
  const unifiedRankingType = String(
    payload.rankingType ?? core.rankingType ?? params.rankingType ?? extern.rankingType ?? ''
  ).trim();

  if (UNIFIED_RANKING_TYPES.has(unifiedRankingType)) {
    const unified = await fetchUnifiedRanking(unifiedRankingType, page);
    return createRankingFeedResponse(
      payload,
      unified.list,
      page,
      UNIFIED_RANKING_PAGE_SIZE,
      unified.total
    );
  }

  const tagId = toNumber(payload.tagId ?? core.tagId ?? params.tagId ?? extern.tagId, 0);
  const byTime = toNumber(payload.byTime ?? core.byTime ?? params.byTime ?? extern.byTime, 0);
  const rankType = toNumber(
    payload.rankType ?? core.rankType ?? params.rankType ?? extern.rankType,
    0
  );

  // 经典订阅排行在当前服务端经常返回 data:null，新版收藏榜可以完整返回并支持分页。
  if (rankType === 4) {
    try {
      const unified = await fetchUnifiedRanking('collection', page);
      if (unified.list.length > 0 || unified.total > 0) {
        console.info('[zmh.ranking] use unified collection ranking');
        return createRankingFeedResponse(
          payload,
          unified.list,
          page,
          UNIFIED_RANKING_PAGE_SIZE,
          unified.total
        );
      }
    } catch (error) {
      console.warn('[zmh.ranking] unified collection ranking failed', getErrorMessage(error));
    }
  }

  const response = await zmhApi.fetchApiResponse<CatalogApiComic[]>('/comic/rank/list', {
    tag_id: tagId,
    by_time: byTime,
    rank_type: rankType,
    page,
  });
  const primaryData = getApiDataOrThrow(response, '加载排行榜');
  const list = Array.isArray(primaryData) ? primaryData : [];
  return createRankingFeedResponse(payload, list, page, CLASSIC_RANKING_PAGE_SIZE);
}

async function getRankingFilterBundle(payload: BasePayload = {}): Promise<FilterBundleContract> {
  const extern = toStringMap(payload.extern);
  const core = toStringMap(payload.core);
  const params = toStringMap(payload.params);
  let tagOptions = [{ label: '全部', value: 0 }];
  try {
    const response = await zmhApi.fetchApiResponse<RankTypeApiData>('/comic/rank/type_filter');
    const data = getApiDataOrThrow(response, '加载排行榜分类');
    const seen = new Set<number>();
    const remoteOptions = (Array.isArray(data?.list) ? data.list : [])
      .map((option) => ({
        label: String(option.tag_name ?? '').trim(),
        value: toNumber(option.tag_id, 0),
      }))
      .filter((option) => {
        if (!option.label || seen.has(option.value)) {
          return false;
        }
        seen.add(option.value);
        return true;
      });
    if (remoteOptions.length) {
      tagOptions = remoteOptions;
    }
  } catch (error) {
    console.warn('[zmh.ranking] load filter failed', getErrorMessage(error));
  }

  return {
    source: PLUGIN_ID,
    scheme: {
      version: '1.0.0',
      type: 'comicRankingFilter',
      title: '排行榜筛选',
      fields: [
        createCoreChoiceField('rankingType', '排行榜版本', [...RANKING_MODE_OPTIONS]),
        createCoreChoiceField('byTime', '排行时间', [...RANKING_TIME_OPTIONS]),
        createCoreChoiceField('rankType', '榜单类型', [...RANKING_TYPE_OPTIONS]),
        createCoreChoiceField('tagId', '分类', tagOptions),
      ],
    },
    data: {
      values: {
        rankingType: String(
          core.rankingType ?? params.rankingType ?? extern.rankingType ?? 'classic'
        ),
        byTime: toNumber(core.byTime ?? params.byTime ?? extern.byTime, 0),
        rankType: toNumber(core.rankType ?? params.rankType ?? extern.rankType, 0),
        tagId: toNumber(core.tagId ?? params.tagId ?? extern.tagId, 0),
      },
    },
  };
}

function buildTitleMeta(input: { statusText: string; updateText: string; chapterCount: number }) {
  return [
    createActionItem(`连载状态：${input.statusText || '未知'}`),
    createActionItem(`更新时间：${input.updateText || '未知'}`),
    createActionItem(`章节数：${input.chapterCount}`),
  ];
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function getTodaySignInStatus() {
  const response = await zmhApi.fetchAccountApi<TaskListApiData>('/task/list');
  const data = toStringMap(response.data);
  const signInfo = toStringMap(toStringMap(data.task).signInfo);
  const value = signInfo.current_sign ?? signInfo.currentSign;
  if (value === undefined || value === null) {
    throw new Error('签到状态响应缺少 current_sign');
  }
  return toBoolean(value);
}

async function executeSignInTask() {
  await zmhApi.fetchAccountApi<Record<string, unknown>>('/task/sign_in', 'POST');
}

async function notifyAutoSignInSuccess() {
  try {
    await flutterTools.showToast({
      message: '再漫画自动签到成功',
      level: 'success',
    });
  } catch (error) {
    console.warn('[zmh.signIn] success notification failed', error);
  }
}

async function runAutoSignInUntilSuccess() {
  if (autoSignInPromise) {
    return autoSignInPromise;
  }

  const task = (async () => {
    while (true) {
      try {
        const signedIn = await getTodaySignInStatus();
        if (signedIn) {
          await notifyAutoSignInSuccess();
          return;
        }

        await executeSignInTask();
        const confirmed = await getTodaySignInStatus();
        if (!confirmed) {
          throw new Error('签到请求成功但服务端状态未确认');
        }
        await notifyAutoSignInSuccess();
        console.info('[zmh.signIn] automatic sign-in success');
        return;
      } catch (error) {
        console.warn(`[zmh.signIn] failed, retry in ${AUTO_SIGN_IN_RETRY_DELAY_MS}ms`, error);
        await delay(AUTO_SIGN_IN_RETRY_DELAY_MS);
      }
    }
  })();

  autoSignInPromise = task;
  try {
    await task;
  } finally {
    if (autoSignInPromise === task) {
      autoSignInPromise = null;
    }
  }
}

async function checkSubscribeStatus(comicId: string) {
  const response = await zmhApi.fetchAuthenticatedApiResponse<Record<string, unknown>>(
    '/comic/sub/checkIsSub',
    {
      source: COMIC_SOURCE,
      objId: comicId,
    },
    'favorite.check'
  );
  return toBoolean(toStringMap(response.data).isSub);
}

async function getSubscribeStatusSafely(comicId: string) {
  try {
    const [account, password, token] = await Promise.all([
      loadAuthAccount(),
      loadAuthPassword(),
      loadAuthToken(),
    ]);
    if (!token && (!account || !password.trim())) {
      return false;
    }
    return await checkSubscribeStatus(comicId);
  } catch (error) {
    console.warn('[zmh.favorite] check status failed', {
      comicId,
      message: getErrorMessage(error),
    });
    return false;
  }
}

async function requestSubscribeChange(comicId: string, subscribed: boolean) {
  await zmhApi.fetchAuthenticatedApiResponse<Record<string, unknown>>(
    subscribed ? '/comic/sub/add' : '/comic/sub/del',
    { comic_id: comicId },
    subscribed ? 'favorite.add' : 'favorite.remove'
  );
}

async function setSubscribeStatus(comicId: string, subscribed: boolean) {
  const before = await checkSubscribeStatus(comicId);
  if (before === subscribed) {
    return {
      favorited: before,
      committed: false,
    };
  }

  await requestSubscribeChange(comicId, subscribed);
  const after = await checkSubscribeStatus(comicId);
  return {
    favorited: after,
    committed: true,
  };
}

function getSubscriptionResponseList(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  const map = toStringMap(data);
  return Array.isArray(map.subList) ? map.subList : [];
}

function mapBookshelfContentItem(item: Record<string, unknown>) {
  const rawId = String(item.id ?? item.comicId ?? item.comic_id ?? '').trim();
  const contentType = String(item.contentType ?? item.content_type ?? item.type ?? '').trim();
  if (!rawId || /^N_/i.test(rawId) || /小说|novel/i.test(contentType)) {
    return null;
  }

  const normalized: CatalogApiComic = {
    comic_id: rawId,
    title: String(item.title ?? item.name ?? '').trim(),
    cover: String(
      item.coverUrl ??
        item.cover ??
        item.cover_url ??
        (Array.isArray(item.coverUrls) ? item.coverUrls[0] : item.cover_urls) ??
        ''
    ).trim(),
    authors: item.authors as string | string[] | undefined,
    status: String(item.status ?? '').trim(),
    types: item.types as string | string[] | undefined,
    last_update_chapter_id: (item.lastUpdateChapterId ?? item.last_update_chapter_id) as
      | number
      | string
      | undefined,
    last_update_chapter_name: String(
      item.lastUpdateChapterName ?? item.last_update_chapter_name ?? ''
    ).trim(),
    last_updatetime: (item.lastUpdatedAt ?? item.last_updatetime) as number | string | undefined,
    hot_num: toNumber(item.hotNum ?? item.hot_num ?? item.subscribeNum, 0),
    hit_num: toNumber(item.hitNum ?? item.hit_num, 0),
    comic_py: String(item.comicPy ?? item.comic_py ?? '').trim(),
    is_sub: (item.isSubscribed ?? item.is_sub) as boolean | number | string | undefined,
  };
  const mapped = mapCatalogItemToComicGrid(normalized);
  return {
    ...mapped,
    raw: item,
    extern: {
      ...mapped.extern,
      contentType: contentType || 'comic',
      bookshelf: true,
    },
  };
}

function mapBookshelfContentList(list: unknown[]) {
  const seen = new Set<string>();
  const rawItems = list.flatMap((value) => {
    const group = toStringMap(value);
    const singleItem = group.singleItem ?? group.single_item;
    if (singleItem && typeof singleItem === 'object' && !Array.isArray(singleItem)) {
      return [toStringMap(singleItem)];
    }

    const collectionItems = group.collectionItems ?? group.collection_items;
    if (Array.isArray(collectionItems)) {
      return collectionItems.map((item) => toStringMap(item));
    }

    return [group];
  });

  return rawItems
    .map((item) => mapBookshelfContentItem(item))
    .filter((item): item is NonNullable<ReturnType<typeof mapBookshelfContentItem>> => {
      if (!item?.id || seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
}

function getBookshelfHasReachedMax(
  data: Record<string, unknown>,
  page: number,
  pageSize: number,
  rawItemCount: number
) {
  if (data.hasNext !== undefined || data.hasMore !== undefined) {
    return !toBoolean(data.hasNext ?? data.hasMore);
  }

  const pageCount = toNumber(data.pageCount ?? data.pages, 0);
  if (pageCount > 0) {
    return page >= pageCount;
  }

  const total = toNumber(data.total ?? data.totalNum, 0);
  if (total > 0) {
    return page * pageSize >= total;
  }

  return rawItemCount < pageSize;
}

async function getSubscriptionsData(
  payload: BookshelfPayload = {}
): Promise<ComicPagedListContract> {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, toNumber(payload.page ?? extern.page, 1));
  const pageSize = Math.max(
    1,
    Math.min(
      BOOKSHELF_DEFAULT_PAGE_SIZE,
      toNumber(payload.size ?? extern.size, BOOKSHELF_DEFAULT_PAGE_SIZE)
    )
  );
  const response = await zmhApi.fetchAuthenticatedApiResponse<BookshelfListApiData>(
    '/comic/sub/list',
    { page, size: pageSize },
    'subscriptions.list'
  );
  const data = toStringMap(response.data);
  const list = getSubscriptionResponseList(response.data);
  const items = mapBookshelfContentList(list);

  return createComicPagedListResponse(
    payload,
    items,
    getBookshelfHasReachedMax(data, page, pageSize, list.length),
    'comicSubscriptionsFeed'
  );
}

function getCommentApiItems(data: CommentApiData) {
  const rawList = data.commentList;
  if (Array.isArray(rawList)) {
    return rawList;
  }

  const commentMap = toStringMap(rawList);
  const orderedIds = Array.isArray(data.commentIdList)
    ? data.commentIdList.map((id) => String(id ?? '').trim()).filter(Boolean)
    : [];
  const orderedItems = orderedIds
    .map((id) => toStringMap(commentMap[id]) as CommentApiItem)
    .filter((item) => Object.keys(item).length > 0);
  if (orderedItems.length) {
    return orderedItems;
  }

  return Object.values(commentMap).map((item) => toStringMap(item) as CommentApiItem);
}

function mapCommentApiItem(item: CommentApiItem, comicId: string, fallbackId = ''): CommentItem {
  const author = toStringMap(item.author);
  const id = String(item.id ?? fallbackId).trim();
  const uid = String(item.sender_uid ?? author.uid ?? '').trim();
  const nickname = String(item.nickname ?? author.nickname ?? '').trim() || '匿名用户';
  const photo = String(item.photo ?? author.photo ?? '').trim();
  const nestedReplies = Array.isArray(item.replyList)
    ? item.replyList
    : Array.isArray(item.replies)
      ? item.replies
      : [];
  const replies = nestedReplies
    .map((reply, index) =>
      mapCommentApiItem(toStringMap(reply) as CommentApiItem, comicId, `${id}-reply-${index + 1}`)
    )
    .filter((reply) => reply.id);
  const stats = toStringMap(item.stats);

  return {
    id,
    author: {
      name: nickname,
      avatar: {
        url: photo,
        path: photo ? `avatar/${uid || id}.jpg` : '',
      },
    },
    content: String(item.content ?? '').trim(),
    createdAt: formatApiDate(item.create_time),
    replyCount: toNumber(item.reply_amount ?? stats.reply_amount, replies.length),
    replies,
    extern: {
      comicId,
      commentId: id,
      userId: uid,
      topStatus: toNumber(item.topStatus, 0),
    },
  };
}

async function getCommentFeed(payload: CommentFeedPayload = {}): Promise<CommentFeedContract> {
  const extern = toStringMap(payload.extern);
  const comicId = String(payload.comicId ?? extern.comicId ?? '').trim();
  if (!comicId) {
    throw new Error('comicId 不能为空');
  }

  const page = Math.max(1, toNumber(payload.page ?? extern.page, 1));
  const size = Math.max(1, Math.min(100, toNumber(extern.pageSize, COMMENT_PAGE_SIZE)));
  const sortBy = toNumber(extern.sortBy, 1);
  const response = await zmhApi.fetchApiResponse<CommentApiData>('/comment/list', {
    page,
    size,
    type: 4,
    objId: comicId,
    sortBy,
  });
  const data = getApiDataOrThrow(response, '加载评论');
  const mappedItems = getCommentApiItems(data ?? {}).map((item, index) =>
    mapCommentApiItem(item, comicId, `comment-${page}-${index + 1}`)
  );
  const topItems = mappedItems.filter((item) => toBoolean(item.extern.topStatus));
  const items = mappedItems.filter((item) => !toBoolean(item.extern.topStatus));
  const total = toNumber(data?.total, 0);

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    scheme: {
      version: '1.0.0',
      type: 'commentFeed',
    },
    data: {
      topItems,
      items,
      paging: {
        hasReachedMax: total > 0 ? page * size >= total : mappedItems.length < size,
      },
      replyMode: 'lazy',
      canComment: {
        comic: false,
        reply: false,
      },
    },
  };
}

async function getCommentCount(comicId: string) {
  const response = await zmhApi.fetchApiResponse<CommentApiData>('/comment/list', {
    page: 1,
    size: 1,
    type: 4,
    objId: comicId,
    sortBy: 1,
  });
  const data = getApiDataOrThrow(response, '加载评论数量');
  return toNumber(data?.total, 0);
}

async function startFavoriteAction(
  payload: FavoriteWorkflowStartPayload
): Promise<FavoriteWorkflowResult> {
  const comicId = String(payload.comicId ?? '').trim();
  if (!comicId) {
    return {
      status: 'failed',
      committed: false,
      message: 'comicId 不能为空',
      errorCode: 'INVALID_COMIC_ID',
    };
  }

  if (payload.action !== 'add' && payload.action !== 'removeAll') {
    return {
      status: 'failed',
      committed: false,
      message: '再漫画仅支持添加或取消追更',
      errorCode: 'UNSUPPORTED_ACTION',
    };
  }

  const result = await setSubscribeStatus(comicId, payload.action === 'add');
  return {
    status: 'completed',
    favorited: result.favorited,
    committed: result.committed,
  };
}

async function continueFavoriteAction(
  _payload: FavoriteWorkflowContinuePayload
): Promise<FavoriteWorkflowResult> {
  return {
    status: 'failed',
    committed: false,
    message: '该追更操作不需要继续',
    errorCode: 'INVALID_CONTINUATION_TOKEN',
  };
}

async function toggleFavorite(payload: ToggleFavoritePayload = {}): Promise<ToggleFavoriteResult> {
  const comicId = String(payload.comicId ?? '').trim();
  if (!comicId) {
    throw new Error('comicId 不能为空');
  }

  const current = await checkSubscribeStatus(comicId);
  const result = await startFavoriteAction({
    comicId,
    action: current ? 'removeAll' : 'add',
    currentFavorite: payload.currentFavorite,
    extern: payload.extern,
  });
  if (result.status !== 'completed') {
    throw new Error(result.message || '追更操作失败');
  }
  return {
    favorited: Boolean(result.favorited),
    nextStep: 'none',
  };
}

function pickChapterFromEps(
  eps: Array<{
    id: string;
    name: string;
    order: number;
    extern: Record<string, unknown>;
  }>,
  payload: ReadSnapshotPayload
) {
  const chapterIdInput = String(payload.chapterId ?? '').trim();
  const externInput = toStringMap(payload.extern);
  const orderFromExtern = toNumber(externInput.order, 0);

  const byId = eps.find((item) => String(item.id) === chapterIdInput);
  const byOrder =
    orderFromExtern > 0
      ? eps.find((item) => toNumber(item.order, 0) === orderFromExtern)
      : undefined;

  return byId ?? byOrder ?? eps[0];
}

function sanitizeFileName(name: string) {
  const sanitized = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return sanitized || 'image.jpg';
}

function extractImageName(imageUrl: string, index: number) {
  const fallback = `page-${String(index + 1).padStart(3, '0')}.jpg`;
  try {
    const parsed = new URL(imageUrl);
    const segment = parsed.pathname.split('/').filter(Boolean).pop();
    if (!segment) return fallback;
    const decoded = decodeURIComponent(segment);
    return sanitizeFileName(decoded);
  } catch {
    return fallback;
  }
}

async function getChapterData(comicId: string, chapterId: string, retryAfterLogin = true) {
  const path = `/comic/chapter/${encodeURIComponent(comicId)}/${encodeURIComponent(chapterId)}`;
  const apiUrl = zmhApi.buildApiUrl(path);
  const response = await zmhApi.fetchApiResponse<ChapterApiData>(path);
  if (response.errno !== 0) {
    console.error('[zmh] chapter api failed', {
      apiUrl,
      comicId,
      chapterId,
      errno: response.errno,
      errmsg: response.errmsg,
      data: response.data,
    });
    throw new Error(`加载章节失败(${response.errno}): ${response.errmsg || '未知错误'}`);
  }
  const node = toStringMap(toStringMap(response.data).data) as ChapterApiInfo;
  const images = (
    Array.isArray(node.page_url_hd) && node.page_url_hd.length > 0
      ? node.page_url_hd
      : Array.isArray(node.page_url)
        ? node.page_url
        : []
  ) as string[];
  const readable = node.canRead !== false && images.length > 0;
  if (!readable) {
    const token = await loadAuthToken();
    if (token) {
      console.error('[zmh] chapter permission insufficient', {
        apiUrl,
        comicId,
        chapterId,
        hasToken: true,
        chapterData: node,
      });
      throw new Error(AUTH_PERMISSION_INSUFFICIENT_ERROR);
    }

    if (retryAfterLogin) {
      await loginWithStoredCredentials('chapter.need_permission');
      return getChapterData(comicId, chapterId, false);
    }

    console.error('[zmh] chapter images empty', {
      apiUrl,
      comicId,
      chapterId,
      chapterData: node,
      rawResponseData: response.data,
    });
    throw new Error(AUTH_PERMISSION_INSUFFICIENT_ERROR);
  }
  return {
    chapterId: String(node.chapter_id ?? chapterId),
    chapterName: String(node.title ?? '').trim(),
    chapterOrder: toNumber(node.chapter_order, 0),
    imageUrls: images.map((url) => String(url ?? '').trim()).filter(Boolean),
  };
}

async function getInfo(): Promise<InfoContract> {
  return buildPluginInfo();
}

async function searchComic(payload: SearchPayload = {}): Promise<SearchResultContract> {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, toNumber(payload.page, 1));
  const keyword = String(payload.keyword ?? extern.keyword ?? '').trim();
  if (!keyword) {
    throw new Error('keyword 不能为空');
  }

  const result = await fetchUnifiedSearchPage(keyword, page);
  const items = result.list.map((item) => mapSearchItemToComicGrid(item)).filter((item) => item.id);
  const total = result.total;
  return createSearchResultResponse(payload, page, items, total);
}

async function getComicDetail(payload: ComicDetailPayload = {}): Promise<ComicDetailContract> {
  const comicId = String(payload.comicId ?? '').trim();
  if (!comicId) {
    throw new Error('comicId 不能为空');
  }
  const path = `/comic/detail/${encodeURIComponent(comicId)}`;
  const response = await zmhApi.fetchApiResponse<Record<string, unknown>>(path);
  if (response.errno !== 0) {
    throw new Error(response.errmsg || '加载漫画详情失败');
  }

  const rootData = toStringMap(response.data);
  const dataNode = toStringMap(rootData.data);
  const detail = dataNode as DetailApiComicInfo;
  const [isFavourite, totalComments] = await Promise.all([
    getSubscribeStatusSafely(comicId),
    getCommentCount(comicId).catch(() => 0),
  ]);
  const authorTags = toDetailTagList(detail.authors);
  const typeTags = toDetailTagList(detail.types);
  const statusNames = toTagNameList(detail.status);
  const chapterGroups = (
    Array.isArray(detail.chapters) ? detail.chapters : []
  ) as DetailApiChapterGroup[];
  let sortCount = 1;

  const eps = chapterGroups
    .flatMap((group, groupIndex) => {
      const groupTitle = String(group.title ?? '').trim() || `分组${groupIndex + 1}`;
      const chapters = Array.isArray(group.data) ? group.data : [];

      return chapters
        .map((item, chapterIndex) => {
          const id = String(item.chapter_id ?? '').trim();
          if (!id) return null;

          const sort = toNumber(sortCount++, chapterIndex + 1);
          const chapterTitle = String(item.chapter_title ?? '').trim() || `第${chapterIndex + 1}话`;

          return {
            id,
            requestId: id,
            logicalKey: id,
            storageChapterId: id,
            name: `${groupTitle}—${chapterTitle}`,
            order: sort,
            extern: {
              sort,
              groupTitle,
              isFee: Boolean(item.is_fee),
              canRead: item.canRead !== false,
              updatetime: toNumber(item.updatetime, 0),
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    })
    .map((item, index, items) => ({
      ...item,
      order: items.length - index,
    }));
  const title = String(detail.title ?? '').trim() || `漫画 #${comicId}`;
  const coverUrl = String(detail.cover ?? '').trim();
  const comicPy = String(detail.comic_py ?? '').trim();
  const statusText = statusNames.join(' / ');
  const updateText = formatUnixSeconds(detail.last_updatetime);

  const normal = {
    comicInfo: {
      id: String(detail.id ?? comicId),
      title,
      titleMeta: buildTitleMeta({
        statusText,
        updateText,
        chapterCount: eps.length,
      }),
      creator: {
        id: '',
        name: '',
        avatar: createImage({
          id: '',
          url: '',
          name: '',
          path: '',
          extern: {},
        }),
        onTap: {},
        extern: {},
      },
      description: String(detail.description ?? ''),
      cover: createImage({
        id: String(detail.id ?? comicId),
        url: coverUrl || NOT_FOUND_IMAGE_URL,
        name: `${String(detail.id ?? comicId)}.jpg`,
        path: `comic/${String(detail.id ?? comicId)}/cover.jpg`,
        extern: { comicPy },
      }),
      metadata: [
        createDetailMetadataActionList('types', '分类', typeTags, createCategoryMetadataAction),
        createDetailMetadataActionList('authors', '作者', authorTags, (tagName) =>
          createAuthorMetadataAction(tagName)
        ),
      ].filter((item): item is MetadataListItem => item != null),
      extern: {
        comicPy,
      },
    },
    eps,
    recommend: [],
    totalViews: toNumber(detail.hit_num, 0),
    totalLikes: toNumber(detail.hot_num, 0),
    totalComments,
    isFavourite,
    isLiked: false,
    allowComments: true,
    allowLike: false,
    allowCollected: true,
    allowDownload: true,
    extern: {
      comicPy,
      subscribeNum: toNumber(detail.subscribe_num, 0),
    },
  };

  const scheme = {
    version: '1.0.0' as const,
    type: 'comicDetail' as const,
    source: PLUGIN_ID,
  };

  const data = {
    normal,
    raw: {
      comicInfo: detail,
      series: chapterGroups,
    },
  };

  // console.log(data);

  return {
    source: PLUGIN_ID,
    comicId,
    extern: payload.extern ?? null,
    scheme,
    data,
  };
}

async function getChapter(payload: ChapterPayload = {}): Promise<ChapterContentContract> {
  const extern = toStringMap(payload.extern);
  const comicId = String(payload.comicId ?? extern.comicId ?? '').trim();
  const chapterId = String(payload.chapterId ?? extern.chapterId ?? '').trim();
  if (!comicId) {
    throw new Error('comicId 不能为空');
  }
  if (!chapterId) {
    throw new Error('chapterId 不能为空');
  }

  const chapterData = await getChapterData(comicId, chapterId);
  const currentChapterId = String(chapterData.chapterId ?? chapterId).trim();
  const docs = chapterData.imageUrls.map((imageUrl, index) => {
    const name = extractImageName(imageUrl, index);
    const path = `comic/${comicId}/${currentChapterId}/${name}`;
    return {
      id: `${currentChapterId}-${index + 1}`,
      name,
      path,
      url: imageUrl,
      extern: {
        index: index + 1,
      },
    };
  });

  return {
    source: PLUGIN_ID,
    comicId,
    chapterId: currentChapterId,
    extern: payload.extern ?? null,
    scheme: {
      version: '1.0.0' as const,
      type: 'chapterContent' as const,
      source: PLUGIN_ID,
    },
    data: {
      comic: {
        id: comicId,
        source: PLUGIN_ID,
        title: chapterData.chapterName || `章节 ${currentChapterId}`,
        extern: {},
      },
      chapter: {
        id: currentChapterId,
        requestId: '',
        logicalKey: '',
        storageChapterId: '',
        name: chapterData.chapterName || `章节 ${currentChapterId}`,
        order: chapterData.chapterOrder,
        pages: docs,
        extern: {},
      },
      chapters: [],
    },
  };
}

async function getReadSnapshot(payload: ReadSnapshotPayload = {}): Promise<ReadSnapshotContract> {
  const comicId = String(payload.comicId ?? '').trim();
  if (!comicId) {
    throw new Error('comicId 不能为空');
  }

  const detail = await getComicDetail({ comicId, extern: payload.extern });
  const normal = toStringMap(toStringMap(detail.data).normal);
  const comicInfo = toStringMap(normal.comicInfo);
  const eps = (Array.isArray(normal.eps) ? normal.eps : [])
    .map((item) => toStringMap(item))
    .map((item) => ({
      id: String(item.id ?? '').trim(),
      name: String(item.name ?? '').trim(),
      order: toNumber(item.order, 0),
      extern: toStringMap(item.extern),
    }))
    .filter((item) => item.id);
  const targetChapter = pickChapterFromEps(eps, payload);
  if (!targetChapter) {
    throw new Error('未找到可阅读章节');
  }

  const chapterData = await getChapterData(comicId, targetChapter.id);
  const pages = chapterData.imageUrls.map((imageUrl, index) => {
    const name = extractImageName(imageUrl, index);
    const path = `comic/${comicId}/${targetChapter.id}/${name}`;
    return {
      id: `${targetChapter.id}-${index + 1}`,
      name,
      path,
      url: imageUrl,
      extern: {
        index: index + 1,
      },
    };
  });
  const chapters = eps.map((item) => ({
    id: item.id,
    name: item.name || `章节 ${item.id}`,
    order: item.order,
    extern: item.extern,
  }));

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    data: {
      comic: {
        id: String(comicInfo.id ?? comicId),
        source: PLUGIN_ID,
        title: String(comicInfo.title ?? ''),
        extern: toStringMap(comicInfo.extern),
      },
      chapter: {
        id: chapterData.chapterId,
        requestId: '',
        logicalKey: '',
        storageChapterId: '',
        name: chapterData.chapterName || targetChapter.name,
        order: chapterData.chapterOrder || targetChapter.order,
        pages,
        extern: { source: 'v4api' },
      },
      chapters,
    },
  };
}

async function fetchImageBytes({ url = '', timeoutMs = 30000 }: FetchImagePayload = {}) {
  const targetUrl = String(url).trim();
  if (!targetUrl) {
    throw new Error('url 不能为空');
  }

  const requestHeaders = await getDefaultHeaders();
  const resolvedTimeout = Math.max(0, Number(timeoutMs) || 30000);
  return zmhApi.fetchBytes(targetUrl, {
    headers: {
      ...requestHeaders,
      Referer: 'https://www.zaimanhua.com/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    timeoutMs: resolvedTimeout,
  });
}

async function getSettingsBundle(): Promise<SettingsBundleContract> {
  const [account, password] = await Promise.all([loadAuthAccount(), loadAuthPassword()]);

  return {
    source: PLUGIN_ID,
    scheme: {
      version: '1.0.0',
      type: 'settings',
      sections: [
        {
          id: 'account',
          title: '账号',
          fields: [
            {
              key: AUTH_ACCOUNT_CONFIG_KEY,
              kind: 'text',
              label: '用户名',
              fnPath: 'setAccountAndLogin',
            },
            {
              key: AUTH_PASSWORD_CONFIG_KEY,
              kind: 'password',
              label: '密码',
              fnPath: 'setPasswordAndLogin',
            },
          ],
        },
      ],
    },
    data: {
      canShowUserInfo: false,
      values: {
        [AUTH_ACCOUNT_CONFIG_KEY]: account,
        [AUTH_PASSWORD_CONFIG_KEY]: password,
      },
    },
  };
}

async function init() {
  if (!zmhInitStarted) {
    zmhInitStarted = true;
    try {
      const { account, password } = await loadLoginCredentials();
      if (account && String(password).trim()) {
        await loginWithPassword({
          account,
          password,
          reason: 'init',
          persistCredentials: true,
        });
        console.info('[zmh.init] login success');
      } else {
        console.info('[zmh.init] skip login: no credentials');
      }
    } catch (error) {
      console.warn('[zmh.init] login failed', error);
    }
  }

  if (await loadAuthToken()) {
    schedulePostLoginTasks('init');
  }

  return {
    source: PLUGIN_ID,
    data: {
      ok: true,
      started: true,
      hasToken: Boolean(await loadAuthToken()),
    },
  };
}

export async function getCapabilitiesBundle(): Promise<CapabilitiesBundleContract> {
  return {
    source: PLUGIN_ID,
    scheme: {
      version: '1.0.0' as const,
      type: 'capabilities' as const,
      actions: [],
    },
    data: {},
  };
}

export default {
  init,
  getInfo,
  getFunctionPage,
  loginWithPassword,
  setAccountAndLogin,
  setPasswordAndLogin,
  searchComic,
  getUpdatesData,
  getCategoriesData,
  getCategoryFilterBundle,
  getRankingData,
  getRankingFilterBundle,
  getSubscriptionsData,
  getCommentFeed,
  getComicDetail,
  getChapter,
  getReadSnapshot,
  fetchImageBytes,
  getSettingsBundle,
  getCapabilitiesBundle,
  startFavoriteAction,
  continueFavoriteAction,
  toggleFavorite,
};
