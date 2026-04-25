import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, analysisApi, tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Uygulama açılışında token varsa oturumu geri yükle
  useEffect(() => {
    tokenStore.getAccess().then(token => {
      if (token) setUser({ restored: true });
    });
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    setAnalysisError(null);
    try {
      await authApi.login(username, password);
      setUser({ username });
      _runAnalysis();
    } catch (err) {
      // 202 = 2FA gerekiyor — caller handle eder
      if (err.status === 202) throw err;
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verify2fa = useCallback(async (username, code, identifier) => {
    setLoading(true);
    setError(null);
    setAnalysisError(null);
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

  const _runAnalysis = async () => {
    setAnalysisError(null);
    try {
      const result = await analysisApi.run();
      setData(result);
    } catch (err) {
      // 429 = günlük limit → son analizi göster
      if (err.status === 429 || err.status === 401) {
        try {
          const last = await analysisApi.latest();
          setData(last);
          return;
        } catch {}
      }
      setAnalysisError(err.message || 'Analiz başarısız oldu.');
    }
  };

  const refreshData = useCallback(async () => {
    setLoading(true);
    setAnalysisError(null);
    try {
      const result = await analysisApi.run();
      setData(result);
    } catch (err) {
      if (err.status === 429) {
        const last = await analysisApi.latest();
        setData(last);
      } else {
        setAnalysisError(err.message || 'Analiz başarısız oldu.');
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
      setAnalysisError(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, data, loading, error, analysisError,
      login, verify2fa, logout, refreshData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
