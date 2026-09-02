import wretch from 'wretch';

export type ApiResponse<T> = {
  errno: number;
  errmsg: string;
  data: T;
};

export type AccountApiResponse<T> = {
  errno?: number | string;
  errmsg?: string;
  data?: T;
};

type HeaderOptions = {
  includeAuth?: boolean;
  token?: string;
};

type RequestMethod = 'GET' | 'POST';

type AccountRequestOptions = {
  method?: RequestMethod;
  body?: string;
  includeAuth?: boolean;
  contentType?: string;
  checkErrno?: boolean;
  errorPrefix?: string;
};

type ApiClientContext = {
  getDefaultHeaders: (options?: HeaderOptions) => Promise<Record<string, string>>;
  ensureAuthenticated: (reason: string) => Promise<string>;
  loginWithStoredCredentials: (reason: string) => Promise<unknown>;
  isAuthError: (errno: unknown, errmsg: unknown) => boolean;
};

const API_BASE = 'https://v4api.zaimanhua.com/app/v1';
const ACCOUNT_API_BASE = 'https://account-api.zaimanhua.com/v1';
export const APP_VERSION = '2.3.7';
export const APP_BUILD_NUMBER = '1502277';
export const APP_CHANNEL = '101_01_01_000';

function getDefaultParams() {
  return {
    platform: 'android',
    timestamp: String(Math.floor(Date.now() / 1000)),
    _v: APP_VERSION,
    _c: APP_CHANNEL,
  };
}

export function createApiClient(context: ApiClientContext) {
  function buildApiUrl(
    path: string,
    businessParams: Record<string, string | number | undefined> = {}
  ) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...getDefaultParams(), ...businessParams })) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    return `${API_BASE}${path}?${params.toString()}`;
  }

  function buildAccountApiUrl(path: string) {
    const params = new URLSearchParams(getDefaultParams());
    return `${ACCOUNT_API_BASE}${path}?${params.toString()}`;
  }

  async function requestJson<T>(
    url: string,
    options: {
      headers: Record<string, string>;
      method?: RequestMethod;
      body?: string;
      errorPrefix: string;
    }
  ) {
    const request = wretch(url).headers(options.headers);
    const response =
      options.method === 'POST'
        ? await request.post(options.body ?? '').res()
        : await request.get().res();
    if (!response.ok) {
      throw new Error(`${options.errorPrefix}(${response.status})`);
    }
    return (await response.json()) as T;
  }

  async function fetchJsonOrThrow<T>(url: string) {
    const headers = await context.getDefaultHeaders();
    return requestJson<T>(url, {
      headers,
      errorPrefix: '请求失败',
    });
  }

  async function fetchApiResponse<T>(
    path: string,
    businessParams: Record<string, string | number | undefined> = {}
  ) {
    return fetchJsonOrThrow<ApiResponse<T>>(buildApiUrl(path, businessParams));
  }

  async function fetchAuthenticatedApiResponse<T>(
    path: string,
    businessParams: Record<string, string | number | undefined> = {},
    reason = 'api.request'
  ) {
    await context.ensureAuthenticated(reason);
    let response = await fetchApiResponse<T>(path, businessParams);
    if (Number(response.errno) !== 0 && context.isAuthError(response.errno, response.errmsg)) {
      await context.loginWithStoredCredentials(`${reason}.retry`);
      response = await fetchApiResponse<T>(path, businessParams);
    }
    if (Number(response.errno) !== 0) {
      throw new Error(response.errmsg || `请求失败(${response.errno})`);
    }
    return response;
  }

  async function requestAccountApi<T>(path: string, options: AccountRequestOptions = {}) {
    const includeAuth = options.includeAuth !== false;
    const token = includeAuth ? await context.ensureAuthenticated(`account${path}`) : undefined;
    const headers = await context.getDefaultHeaders({
      includeAuth,
      token,
    });
    headers.Platform = 'android';
    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    const json = await requestJson<AccountApiResponse<T>>(buildAccountApiUrl(path), {
      headers,
      method: options.method,
      body: options.body,
      errorPrefix: options.errorPrefix ?? '账号接口请求失败',
    });
    const errno = Number(json.errno);
    if (
      options.checkErrno !== false &&
      json.errno !== undefined &&
      json.errno !== null &&
      Number.isFinite(errno) &&
      errno !== 0
    ) {
      throw new Error(json.errmsg || `账号接口请求失败(${json.errno})`);
    }
    return json;
  }

  async function fetchAccountApi<T>(path: string, method: RequestMethod = 'GET') {
    return requestAccountApi<T>(path, {
      method,
      contentType: 'application/x-www-form-urlencoded',
    });
  }

  async function fetchBytes(
    url: string,
    options: {
      headers?: Record<string, string>;
      timeoutMs?: number;
    } = {}
  ) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const resolvedTimeout = Math.max(0, Number(options.timeoutMs) || 30000);
    const timer = controller
      ? setTimeout(() => {
          controller.abort();
        }, resolvedTimeout)
      : undefined;

    let response: Response;
    try {
      response = await wretch(url)
        .headers(options.headers ?? {})
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

  return {
    buildApiUrl,
    fetchApiResponse,
    fetchAuthenticatedApiResponse,
    requestAccountApi,
    fetchAccountApi,
    fetchBytes,
  };
}
