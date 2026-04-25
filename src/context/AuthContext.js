import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, analysisApi, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Uygulama açılışında token varsa oturumu geri yükle
  useEffect(() => {
    tokenStore.getAccess().then(token => {
      if (token) setUser({ restored: true });
    });
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.login(username, password);
      setUser({ username });
      // Analiz arka planda başlatılır — AnalysisScreen'de await edilir
      _runAnalysis();
    } catch (err) {
      if (err.status === 202) {
        // 2FA gerekiyor — caller handle edecek
        throw err;
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2fa = useCallback(async (username, code, identifier) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.verify2fa(username, code, identifier);
      setUser({ username });
      _runAnalysis();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analizi arka planda başlatır — AnalysisScreen sonucu poll eder
  const _runAnalysis = async () => {
    try {
      const result = await analysisApi.run();
      setData(result);
    } catch (err) {
      // 429 = günlük limit, 401 = oturum süresi dolmuş
      if (err.status === 429 || err.status === 401) {
        // Son analizi çekmeyi dene
        try {
          const last = await analysisApi.latest();
          setData(last);
        } catch {}
      }
    }
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analysisApi.run();
      setData(result);
    } catch (err) {
      if (err.status === 429) {
        // Son analize düş
        const last = await analysisApi.latest();
        setData(last);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setData(null);
      setError(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, data, loading, error, login, verify2fa, logout, refreshData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
