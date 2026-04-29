/**
 * GhostScore API service — JWT refresh + güvenli token yönetimi.
 * Tüm API çağrıları buradan geçer.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const KEYS = {
  ACCESS:  'gs_access_token',
  REFRESH: 'gs_refresh_token',
};

// ── Token yönetimi ────────────────────────────────────────────

export const tokenStore = {
  async getAccess()  { return AsyncStorage.getItem(KEYS.ACCESS); },
  async getRefresh() { return AsyncStorage.getItem(KEYS.REFRESH); },

  async save(access, refresh) {
    await AsyncStorage.multiSet([
      [KEYS.ACCESS,  access],
      [KEYS.REFRESH, refresh],
    ]);
  },

  async clear() {
    await AsyncStorage.multiRemove([KEYS.ACCESS, KEYS.REFRESH]);
  },
};

// ── HTTP yardımcısı ───────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];

async function drainQueue(error, token) {
  refreshQueue.forEach(cb => cb(error, token));
  refreshQueue = [];
}

async function refreshAccessToken() {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) throw new Error('NO_REFRESH_TOKEN');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });

  if (!res.ok) {
    await tokenStore.clear();
    throw new Error('REFRESH_FAILED');
  }

  const json = await res.json();
  await tokenStore.save(json.access_token, json.refresh_token);
  return json.access_token;
}

async function request(path, options = {}, retry = true) {
  const access = await tokenStore.getAccess();

  const headers = {
    'Content-Type': 'application/json',
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (networkErr) {
    const err = new Error(
      'Bağlantı hatası. Lütfen internet bağlantını kontrol edip tekrar dene.'
    );
    err.status = 0;
    throw err;
  }

  // 401 → token yenile ve tekrar dene
  if (res.status === 401 && retry) {
    if (isRefreshing) {
      // Diğer istekler kuyrukta beklesin
      return new Promise((resolve, reject) => {
        refreshQueue.push(async (err, newToken) => {
          if (err) return reject(err);
          resolve(request(path, options, false));
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      drainQueue(null, newToken);
      return request(path, options, false);
    } catch (err) {
      drainQueue(err, null);
      throw err;
    } finally {
      isRefreshing = false;
    }
  }

  // 2FA gerekiyor — header'dan identifier al, özel hata fırlat
  if (res.status === 202) {
    const identifier = res.headers.get('X-2FA-Identifier') || '';
    const err = new Error('TWO_FACTOR_REQUIRED');
    err.status = 202;
    err.twoFaIdentifier = identifier;
    throw err;
  }

  if (!res.ok) {
    let detail = 'Bir hata oluştu';
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Auth endpoints ────────────────────────────────────────────

export const authApi = {
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  async verify2fa(username, code, identifier) {
    const data = await request('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ username, code, identifier }),
    });
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  async sessionLogin(sessionId) {
    const data = await request('/auth/session-login', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  async webviewLogin(payload) {
    const data = await request('/auth/webview-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await tokenStore.save(data.access_token, data.refresh_token);
    return data;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'DELETE' });
    } finally {
      await tokenStore.clear();
    }
  },
};

// ── Analysis endpoints ────────────────────────────────────────

export const analysisApi = {
  run()    { return request('/analysis/run',    { method: 'POST' }); },
  latest() { return request('/analysis/latest', { method: 'GET'  }); },
};

// ── User endpoints ────────────────────────────────────────────

export const usersApi = {
  me()            { return request('/users/me', { method: 'GET'    }); },
  deleteAccount() { return request('/users/me', { method: 'DELETE' }); },
};
