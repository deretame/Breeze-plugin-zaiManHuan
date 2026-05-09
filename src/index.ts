import wretch from 'wretch';
import {
  NOT_FOUND_IMAGE_URL,
  PLUGIN_ID,
  createActionItem,
  createBasicMetadata,
  createImage,
  createMetadataActionList,
  toStringMap,
} from './common';
import { buildPluginInfo } from './get-info';
import { flutterTools, pluginConfig } from './tools';

type BasePayload = {
  extern?: Record<string, unknown>;
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

type ApiResponse<T> = {
  errno: number;
  errmsg: string;
  data: T;
};

type SearchApiComic = {
  id?: number;
  comic_id?: number;
  title?: string;
  authors?: string;
  cover?: string;
  status?: string;
  types?: string;
  hot_hits?: number;
  last_updatetime?: number;
  last_update_chapter_name?: string;
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

const API_BASE = 'https://v4api.zaimanhua.com/app/v1';
const APP_VERSION = '2.3.4';
const APP_CHANNEL = '101_01_01_000';
const USER_AGENT_CONFIG_KEY = 'network.userAgent';
const AUTH_ACCOUNT_CONFIG_KEY = 'auth.account';
const AUTH_PASSWORD_CONFIG_KEY = 'auth.password';
const AUTH_TOKEN_CONFIG_KEY = 'auth.token';
const AUTH_CREDENTIALS_REQUIRED_ERROR =
  '[AUTH_CREDENTIALS_REQUIRED] 账号或密码不能为空，请先在设置中填写';
const AUTH_PERMISSION_INSUFFICIENT_ERROR =
  '权限不足，请前往快漫画官方app中提升权限等级（如绑定手机号）';

let userAgentCache: string | null = null;
let userAgentInitPromise: Promise<string> | null = null;
let authTokenCache: string | null = null;
let authTokenInitPromise: Promise<string> | null = null;
let loginInFlight: Promise<string> | null = null;
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
      const saved = String(await pluginConfig.load(USER_AGENT_CONFIG_KEY, '')).trim();
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

    const headers = await getDefaultHeaders({ includeAuth: false });
    const response = await wretch('https://account-api.zaimanhua.com/v1/login/passwd')
      .headers({
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      })
      .post(formData.toString())
      .res();
    if (!response.ok) {
      flutterTools.showToast({
        message: `登录请求失败(${response.status})`,
        level: 'error',
      });
      throw new Error(`登录请求失败(${response.status})`);
    }
    const json = (await response.json()) as ApiResponse<Record<string, unknown>>;
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
    flutterTools.showToast({
      message: '登录成功',
      level: 'success',
    });
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
  const [account, password] = await Promise.all([loadAuthAccount(), loadAuthPassword()]);
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
  const userAgent = await getPersistedUserAgent();
  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    Accept: 'application/json',
  };
  if (options.includeAuth !== false) {
    const token = String(options.token ?? '').trim() || (await loadAuthToken());
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  return headers;
}

function getDefaultParams() {
  return {
    platform: 'android',
    timestamp: String(Math.floor(Date.now() / 1000)),
    _v: APP_VERSION,
    _c: APP_CHANNEL,
  };
}

function toTagNameList(values: unknown): string[] {
  const list = Array.isArray(values) ? values : [];
  return list
    .map((item) => toStringMap(item))
    .map((item) => String(item.tag_name ?? '').trim())
    .filter(Boolean);
}

function splitTypeValues(value: unknown): string[] {
  return String(value ?? '')
    .split(/[/,，]/g)
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

function pickDetailComicId(item: SearchApiComic): string {
  const comicId = toNumber(item.comic_id, 0);
  if (comicId > 0) {
    return String(comicId);
  }
  return String(item.id ?? '').trim();
}

function mapSearchItemToComicGrid(item: SearchApiComic) {
  const comicId = pickDetailComicId(item);
  const title = String(item.title ?? '').trim() || `漫画 ${comicId}`;
  const subtitle = [item.authors, item.status, item.last_update_chapter_name]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .join(' · ');
  const coverUrl = String(item.cover ?? '').trim();
  const statusText = String(item.status ?? '').trim();
  const typeValues = splitTypeValues(item.types);
  const authorValues = String(item.authors ?? '')
    .split(/[/,，]/g)
    .map((value) => value.trim())
    .filter(Boolean);
  const path = `comic/${comicId}/cover.jpg`;
  const updatedAt = formatUnixSeconds(item.last_updatetime);
  const hotHits = toNumber(item.hot_hits, 0);

  return {
    source: PLUGIN_ID,
    id: comicId,
    title,
    subtitle,
    finished: /完结|短篇/.test(statusText),
    likesCount: hotHits,
    viewsCount: hotHits,
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
      createBasicMetadata('author', '作者', authorValues),
      createBasicMetadata('categories', '分类', typeValues),
      createBasicMetadata('status', '状态', statusText ? [statusText] : []),
      createBasicMetadata(
        'latest',
        '更新',
        item.last_update_chapter_name ? [item.last_update_chapter_name] : []
      ),
      createBasicMetadata('works', '作品', []),
      createBasicMetadata('actors', '角色', []),
    ],
    raw: item,
    extern: {
      comicId,
      comicPy: String(item.comic_py ?? '').trim(),
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

async function fetchJsonOrThrow<T>(url: string) {
  const headers = await getDefaultHeaders();
  const res = await wretch(url).headers(headers).get().res();
  if (!res.ok) {
    throw new Error(`请求失败(${res.status})`);
  }
  return (await res.json()) as T;
}

function pickChapterFromEps(
  eps: Array<{
    id: string;
    name: string;
    order: number;
    extension: Record<string, unknown>;
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

function mapActionForSnapshot(item: unknown) {
  const row = toStringMap(item);
  return {
    name: String(row.name ?? ''),
    onTap: toStringMap(row.onTap),
    extern: toStringMap(row.extension),
  };
}

function mapMetadataForSnapshot(meta: unknown) {
  const row = toStringMap(meta);
  const values = Array.isArray(row.value) ? row.value : [];
  return {
    type: String(row.type ?? ''),
    name: String(row.name ?? ''),
    value: values.map((item) => mapActionForSnapshot(item)),
  };
}

async function getChapterData(comicId: string, chapterId: string, retryAfterLogin = true) {
  const params = new URLSearchParams(getDefaultParams());
  const apiUrl = `${API_BASE}/comic/chapter/${encodeURIComponent(comicId)}/${encodeURIComponent(chapterId)}?${params.toString()}`;
  const response = await fetchJsonOrThrow<ApiResponse<ChapterApiData>>(apiUrl);
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

async function getInfo() {
  return buildPluginInfo();
}

async function searchComic(payload: SearchPayload = {}) {
  const extern = toStringMap(payload.extern);
  const page = Math.max(1, Number(payload.page ?? 1) || 1);
  const keyword = String(payload.keyword ?? extern.keyword ?? '').trim();
  if (!keyword) {
    throw new Error('keyword 不能为空');
  }
  const params = new URLSearchParams({
    keyword,
    page: String(page),
    sort: '0',
    size: '20',
    ...getDefaultParams(),
  });
  const apiUrl = `${API_BASE}/search/index?${params.toString()}`;
  const response = await fetchJsonOrThrow<ApiResponse<SearchApiData>>(apiUrl);
  if (response.errno !== 0) {
    throw new Error(response.errmsg || '搜索失败');
  }
  const apiData = toStringMap(response.data);
  const list = (Array.isArray(apiData.list) ? apiData.list : []) as SearchApiComic[];
  const items = list.map((item) => mapSearchItemToComicGrid(item)).filter((item) => item.id);
  const total = toNumber(apiData.total, items.length);
  const pageSize = Math.max(1, toNumber(apiData.size, 20));
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const paging = createPagingInfo(page, pageCount, total);

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

async function getComicDetail(payload: ComicDetailPayload = {}) {
  const comicId = String(payload.comicId ?? '').trim();
  if (!comicId) {
    throw new Error('comicId 不能为空');
  }
  const params = new URLSearchParams(getDefaultParams());
  const detailUrl = `${API_BASE}/comic/detail/${encodeURIComponent(comicId)}?${params.toString()}`;
  const response = await fetchJsonOrThrow<ApiResponse<Record<string, unknown>>>(detailUrl);
  if (response.errno !== 0) {
    throw new Error(response.errmsg || '加载漫画详情失败');
  }

  const rootData = toStringMap(response.data);
  const dataNode = toStringMap(rootData.data);
  const detail = dataNode as DetailApiComicInfo;
  const authorNames = toTagNameList(detail.authors);
  const statusNames = toTagNameList(detail.status);
  const typeNames = toTagNameList(detail.types);
  const chapterGroups = (
    Array.isArray(detail.chapters) ? detail.chapters : []
  ) as DetailApiChapterGroup[];
  let orderCount = 1;
  const eps = chapterGroups
    .flatMap((group, groupIndex) => {
      const groupTitle = String(group.title ?? '').trim() || `分组${groupIndex + 1}`;
      const chapters = Array.isArray(group.data) ? group.data : [];
      return chapters
        .map((item, chapterIndex) => {
          const id = String(item.chapter_id ?? '').trim();
          if (!id) return null;
          const order = toNumber(orderCount++, chapterIndex + 1);
          const chapterTitle = String(item.chapter_title ?? '').trim() || `第${chapterIndex + 1}话`;
          return {
            id,
            name: `${groupTitle}—${chapterTitle}`,
            order,
            extension: {
              sort: order,
              groupTitle,
              isFee: Boolean(item.is_fee),
              canRead: item.canRead !== false,
              updatetime: toNumber(item.updatetime, 0),
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
    })
    .reverse();
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
          extension: {},
        }),
        onTap: {},
        extension: {},
      },
      description: String(detail.description ?? ''),
      cover: createImage({
        id: String(detail.id ?? comicId),
        url: coverUrl || NOT_FOUND_IMAGE_URL,
        name: `${String(detail.id ?? comicId)}.jpg`,
        path: `comic/${String(detail.id ?? comicId)}/cover.jpg`,
        extension: {
          comicPy,
        },
      }),
      metadata: [
        createMetadataActionList('types', '分类', typeNames),
        createMetadataActionList('authors', '作者', authorNames),
      ].filter((meta) => {
        const value = toStringMap(meta).value;
        return Array.isArray(value) && value.length > 0;
      }),
      extension: {
        comicPy,
      },
    },
    eps,
    recommend: [],
    totalViews: toNumber(detail.hit_num, 0),
    totalLikes: toNumber(detail.hot_num, 0),
    totalComments: 0,
    isFavourite: false,
    isLiked: false,
    allowComments: false,
    allowLike: false,
    allowCollected: false,
    allowDownload: true,
    extension: {
      comicPy,
      subscribeNum: toNumber(detail.subscribe_num, 0),
    },
  };

  const scheme = {
    version: '1.0.0',
    type: 'comicDetail',
    source: PLUGIN_ID,
  };

  const data = {
    normal,
    raw: {
      comicInfo: detail,
      series: chapterGroups,
    },
  };

  console.log(eps);

  return {
    source: PLUGIN_ID,
    comicId,
    extern: payload.extern ?? null,
    scheme,
    data,
  };
}

async function getChapter(payload: ChapterPayload = {}) {
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

  const chapter = {
    epId: currentChapterId,
    epName: chapterData.chapterName || `章节 ${currentChapterId}`,
    length: docs.length,
    epPages: String(docs.length),
    docs,
    series: [],
  };

  return {
    source: PLUGIN_ID,
    comicId,
    chapterId: currentChapterId,
    extern: payload.extern ?? null,
    scheme: {
      version: '1.0.0',
      type: 'chapterContent',
      source: PLUGIN_ID,
    },
    data: {
      chapter,
    },
    chapter,
  };
}

async function getReadSnapshot(payload: ReadSnapshotPayload = {}) {
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
      extension: toStringMap(item.extension),
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
    extern: item.extension,
  }));

  return {
    source: PLUGIN_ID,
    extern: payload.extern ?? null,
    data: {
      comic: {
        id: String(comicInfo.id ?? comicId),
        source: PLUGIN_ID,
        title: String(comicInfo.title ?? ''),
        description: String(comicInfo.description ?? ''),
        cover: {
          ...toStringMap(comicInfo.cover),
          extern: toStringMap(toStringMap(comicInfo.cover).extension),
        },
        creator: {
          ...toStringMap(comicInfo.creator),
          avatar: {
            ...toStringMap(toStringMap(comicInfo.creator).avatar),
            extern: toStringMap(toStringMap(toStringMap(comicInfo.creator).avatar).extension),
          },
          extern: toStringMap(toStringMap(comicInfo.creator).extension),
        },
        titleMeta: (Array.isArray(comicInfo.titleMeta) ? comicInfo.titleMeta : []).map((item) =>
          mapActionForSnapshot(item)
        ),
        metadata: (Array.isArray(comicInfo.metadata) ? comicInfo.metadata : [])
          .map((meta) => mapMetadataForSnapshot(meta))
          .filter((meta) => meta.value.length > 0),
        extern: toStringMap(comicInfo.extension),
      },
      chapter: {
        id: chapterData.chapterId,
        name: chapterData.chapterName || targetChapter.name,
        order: chapterData.chapterOrder || targetChapter.order,
        pages,
        extern: {
          source: 'v4api',
        },
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
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  const resolvedTimeout = Math.max(0, Number(timeoutMs) || 30000);
  const timer = controller
    ? setTimeout(() => {
        controller.abort();
      }, resolvedTimeout)
    : undefined;

  let response: Response;
  try {
    response = await wretch(targetUrl)
      .headers({
        ...requestHeaders,
        Referer: 'https://www.zaimanhua.com/',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      })
      .options({
        signal: controller?.signal,
      })
      .get()
      .res();
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  if (!response.ok) {
    throw new Error(`图片请求失败(${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error('图片数据为空');
  }

  return bytes;
}

async function getSettingsBundle() {
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
      const [account, password] = await Promise.all([loadAuthAccount(), loadAuthPassword()]);
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

  return {
    source: PLUGIN_ID,
    data: {
      ok: true,
      started: true,
      hasToken: Boolean(await loadAuthToken()),
    },
  };
}

export default {
  init,
  getInfo,
  loginWithPassword,
  setAccountAndLogin,
  setPasswordAndLogin,
  searchComic,
  getComicDetail,
  getChapter,
  getReadSnapshot,
  fetchImageBytes,
  getSettingsBundle,
};
