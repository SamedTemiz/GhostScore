import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, analysisApi, tokenStore } from '../services/api';

const STORED_USERNAME_KEY    = 'gs_username';
const STORED_PROFILE_PIC_KEY = 'gs_profile_pic';

const MOCK_DEV_DATA = {
  profile: {
    username: 'mock_user',
    profilePic: '',
    followers: 842,
    following: 310,
    posts: 67,
    ghostScore: 74,
    visibilityScore: 87,
  },
  stalkers: [
    { id: '101', username: 'silent_watcher_1', profilePic: '', viewedStories: 5, isFollowing: false },
    { id: '102', username: 'ghost_reader_2',   profilePic: '', viewedStories: 3, isFollowing: false },
    { id: '103', username: 'lurker_99',         profilePic: '', viewedStories: 2, isFollowing: false },
  ],
  ghostFollowers: [
    { id: '301', username: 'phantom_user_1',  profilePic: '', postsLiked: 0 },
    { id: '302', username: 'invisible_acc_2', profilePic: '', postsLiked: 0 },
    { id: '303', username: 'ghost_follow_3',  profilePic: '', postsLiked: 0 },
    { id: '304', username: 'shadow_user_4',   profilePic: '', postsLiked: 0 },
    { id: '305', username: 'lurk_master_5',   profilePic: '', postsLiked: 0 },
  ],
  unfollowers: [
    { id: '201', username: 'ex_follower_1', profilePic: '', unfollowedAt: '3 gün önce',   wasFollowedBack: true  },
    { id: '202', username: 'ghost_gone_2',  profilePic: '', unfollowedAt: '1 hafta önce', wasFollowedBack: true  },
    { id: '203', username: 'silent_drop_3', profilePic: '', unfollowedAt: '2 hafta önce', wasFollowedBack: false },
  ],
  analysisId: 'mock-id',
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  const _syncProfilePic = useCallback(async (profilePic) => {
    if (!profilePic) return;
    await AsyncStorage.setItem(STORED_PROFILE_PIC_KEY, profilePic).catch(() => {});
    setUser(prev => prev ? { ...prev, profilePic } : prev);
  }, []);

  // Uygulama açılışında token varsa oturumu + son analizi geri yükle
  useEffect(() => {
    tokenStore.getAccess().then(async token => {
      if (!token) return;
      const storedUsername = await AsyncStorage.getItem(STORED_USERNAME_KEY).catch(() => null);
      const storedPic      = await AsyncStorage.getItem(STORED_PROFILE_PIC_KEY).catch(() => null);
      setUser({ username: storedUsername ?? '', profilePic: storedPic ?? '' });
      try {
        const last = await analysisApi.latest();
        if (last) {
          setData(last);
          // Username yoksa veya eksikse analiz verisinden al
          const freshUsername = last?.profile?.username;
          if (freshUsername) {
            await AsyncStorage.setItem(STORED_USERNAME_KEY, freshUsername).catch(() => {});
            setUser(prev => ({ ...prev, username: freshUsername }));
          }
          // Profil fotoğrafı varsa güncelle
          if (last?.profile?.profilePic) _syncProfilePic(last.profile.profilePic);
        }
      } catch {}
    });
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    setAnalysisError(null);
    try {
      await authApi.login(username, password);
      await AsyncStorage.setItem(STORED_USERNAME_KEY, username).catch(() => {});
      setUser({ username, profilePic: '' });
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
      await AsyncStorage.setItem(STORED_USERNAME_KEY, username).catch(() => {});
      setUser({ username, profilePic: '' });
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
      if (result?.profile?.profilePic) _syncProfilePic(result.profile.profilePic);
    } catch (err) {
      // 429 = günlük limit veya 401 = session → son analizi göster, hata ekranı açma
      if (err.status === 429 || err.status === 401) {
        try {
          const last = await analysisApi.latest();
          if (last) {
            setData(last);
            if (last?.profile?.profilePic) _syncProfilePic(last.profile.profilePic);
          }
          // Eski veri yok olsa bile sessizce Dashboard'a geç (analysisError set etme)
          return;
        } catch {}
        return; // latest da başarısız → yine de hata gösterme, Dashboard'a geç
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
      if (result?.profile?.profilePic) _syncProfilePic(result.profile.profilePic);
    } catch (err) {
      if (err.status === 429) {
        // Günlük limit — eski veriyi göster, hata fırlatma
        try {
          const last = await analysisApi.latest();
          if (last) {
            setData(last);
            if (last?.profile?.profilePic) _syncProfilePic(last.profile.profilePic);
          }
        } catch {}
        // 429 mesajını caller'a ilet (Settings'te gösterilecek)
        throw err;
      }
      setAnalysisError(err.message || 'Analiz başarısız oldu.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    setAnalysisError(null);
    try {
      const response = await authApi.sessionLogin(sessionId);
      const username   = response.analysis?.profile?.username ?? 'user';
      const profilePic = response.analysis?.profile?.profilePic ?? '';
      await AsyncStorage.setItem(STORED_USERNAME_KEY, username).catch(() => {});
      await AsyncStorage.setItem(STORED_PROFILE_PIC_KEY, profilePic).catch(() => {});
      setUser({ username, profilePic });
      setData(response.analysis);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithWebView = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    setAnalysisError(null);
    try {
      const response = await authApi.webviewLogin(payload);
      setUser({ username: payload.profile.username });
      setData(response.analysis);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithMock = useCallback(() => {
    setUser({ username: 'mock_user', profilePic: '' });
    setData(MOCK_DEV_DATA);
    setError(null);
    setAnalysisError(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      await AsyncStorage.removeItem(STORED_USERNAME_KEY).catch(() => {});
      await AsyncStorage.removeItem(STORED_PROFILE_PIC_KEY).catch(() => {});
      setUser(null);
      setData(null);
      setError(null);
      setAnalysisError(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, data, loading, error, analysisError,
      login, verify2fa, loginWithSession, loginWithWebView, loginWithMock, logout, refreshData,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
