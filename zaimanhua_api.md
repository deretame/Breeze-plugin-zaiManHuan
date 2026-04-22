# 再漫画 (zaimanhua.com) API 鉴权与核心接口

> 基于 APK v2.3.4 反编译 + Venera 书源验证 + Dart AOT (blutter) 分析

---

## 一、鉴权逻辑

### 1.1 密码加密

```javascript
// 密码明文 → MD5(UTF8) → 小写 Hex
function encryptPassword(password) {
    // Node.js
    const crypto = require('crypto');
    return crypto.createHash('md5')
        .update(Buffer.from(password, 'utf8'))
        .digest('hex');
    
    // 浏览器 / 纯 JS
    // return md5(utf8Encode(password));
}

// 示例
// encryptPassword("123456") => "e10adc3949ba59abbe56e057f20f883e"
```

### 1.2 登录获取 Token

```javascript
async function login(username, password) {
    const encryptedPwd = encryptPassword(password);
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('passwd', encryptedPwd);
    
    const res = await fetch('https://account-api.zaimanhua.com/v1/login/passwd', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'User-Agent': 'Mozilla/5.0 (Linux; Android) Mobile',
        },
        body: formData.toString(),
    });
    
    const data = await res.json();
    // data.data.user.token 就是后续需要的 Bearer Token
    return data.data?.user?.token;
}
```

### 1.3 通用请求头

```javascript
function getHeaders(token) {
    return {
        'User-Agent': 'Mozilla/5.0 (Linux; Android) Mobile',
        'Accept': 'application/json',
        // 登录后带上 Token
        'Authorization': token ? `Bearer ${token}` : '',
    };
}
```

---

## 二、公共参数（所有请求自动附加）

```javascript
function getDefaultParams() {
    return {
        platform: 'android',
        timestamp: Date.now().toString(),  // 毫秒级时间戳
        _v: '2.3.4',                       // App 版本
        _c: '101_01_01_000',               // 渠道号
    };
}
```

> **注意**：后端不校验这些参数的签名，仅作日志/统计用。

---

## 三、核心 API

### 3.1 搜索漫画（无需登录）

```javascript
async function search(keyword, page = 1) {
    const params = new URLSearchParams({
        keyword,
        page: page.toString(),
        sort: '0',
        size: '20',
        ...getDefaultParams(),
    });
    
    const res = await fetch(
        `https://v4api.zaimanhua.com/app/v1/search/index?${params}`,
        { headers: getHeaders() }
    );
    
    const json = await res.json();
    // json.data.list => Comic[]
    return json.data?.list || [];
}
```

### 3.2 获取漫画详情（无需登录）

```javascript
async function getComicDetail(comicId) {
    const res = await fetch(
        `https://v4api.zaimanhua.com/app/v1/comic/detail/${comicId}?channel=android`,
        { headers: getHeaders() }
    );
    
    const json = await res.json();
    // json.data.data => 漫画详情（标题、封面、章节列表等）
    return json.data?.data;
}
```

### 3.3 获取章节图片（无需登录）

```javascript
async function getChapterImages(comicId, chapterId) {
    const res = await fetch(
        `https://v4api.zaimanhua.com/app/v1/comic/chapter/${comicId}/${chapterId}`,
        { headers: getHeaders() }
    );
    
    const json = await res.json();
    // json.data.data.page_url_hd || json.data.data.page_url
    return json.data?.data?.page_url_hd || json.data?.data?.page_url || [];
}
```

### 3.4 收藏列表（需要 Token）

```javascript
async function getFavorites(token, page = 1) {
    const params = new URLSearchParams({
        status: '0',
        page: page.toString(),
        size: '20',
    });
    
    const res = await fetch(
        `https://v4api.zaimanhua.com/app/v1/comic/sub/list?${params}`,
        { headers: getHeaders(token) }
    );
    
    const json = await res.json();
    return json.data?.subList || [];
}
```

### 3.5 添加/取消收藏（需要 Token）

```javascript
async function toggleFavorite(token, comicId, isAdding) {
    const action = isAdding ? 'add' : 'del';
    
    const res = await fetch(
        `https://v4api.zaimanhua.com/app/v1/comic/sub/${action}?comic_id=${comicId}`,
        { headers: getHeaders(token) }
    );
    
    const json = await res.json();
    return json.errno === 0;
}
```

---

## 四、响应格式

```typescript
interface ApiResponse<T> {
    errno: number;    // 0 = 成功
    errmsg: string;   // 错误信息
    data: T;
}

// 漫画项
interface ComicItem {
    id: string;
    title: string;
    cover: string;
    authors: string;
    status: string;
    types: string;
    last_update_chapter_name: string;
    description: string;
}

// 章节
interface ChapterGroup {
    title: string;      // "连载" / "单行本"
    data: {
        chapter_id: string;
        chapter_title: string;
    }[];
}
```

---

## 五、Token 刷新

```javascript
async function refreshToken(token) {
    const res = await fetch(
        'https://account-api.zaimanhua.com/v1/user/token/refresh',
        {
            method: 'POST',
            headers: {
                ...getHeaders(token),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ refresh_token: token }),
        }
    );
    
    const json = await res.json();
    return json.data?.token;
}
```

---

## 六、安全说明

| 项目 | 状态 |
|------|------|
| 密码加密 | `MD5(password)` 无盐 |
| 请求签名 | ❌ **无**（除微信支付外） |
| 设备绑定 | ❌ **无** |
| Token 有效期 | 需调用 `/v1/user/token/refresh` 刷新 |
| 防重放攻击 | ❌ **无** |

> **提示**：后端对公开内容（搜索、详情、图片）完全开放，无需任何鉴权。
