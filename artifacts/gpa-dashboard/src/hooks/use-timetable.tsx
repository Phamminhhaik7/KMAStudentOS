import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useGetTimetable, useLoginQldt, getTimetable } from '@workspace/api-client-react';
import type { TimetableResponse, TimetableCourse, TimetableScheduleItem } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export interface DayLessonSlot {
  course: TimetableCourse;
  schedule: TimetableScheduleItem;
  periodStart: number;
  periodCount: number;
}

interface QldtCredentials {
  username: string;
  password: string;
}

interface TimetableContextType {
  timetable: TimetableResponse | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isLive: boolean;
  hasCookie: boolean;
  savedUsername: string;
  selectedSemester: string;
  setSelectedSemester: (semId: string) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  saveCookieDirectly: (cookie: string) => void;
  logout: () => void;
  syncTimetable: () => Promise<{
    success: boolean;
    reauthenticated: boolean;
    requireLogin: boolean;
    error?: string;
  }>;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

export function TimetableProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [cookie, setCookie] = useState<string>(() => localStorage.getItem('actvn_qldt_cookie') || '');
  const [selectedSemester, setSelectedSemester] = useState<string>('');

  // Cached timetable
  const [cachedTimetable, setCachedTimetable] = useState<TimetableResponse | null>(() => {
    const saved = localStorage.getItem('actvn_cached_timetable');
    return saved ? JSON.parse(saved) : null;
  });

  // Saved credentials for auto-relogin
  const [savedCreds, setSavedCreds] = useState<QldtCredentials | null>(() => {
    const saved = localStorage.getItem('actvn_qldt_credentials');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('actvn_qldt_cookie', cookie);
  }, [cookie]);

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (cookie) h['X-Qldt-Cookie'] = cookie;
    return h;
  }, [cookie]);

  const queryParams = useMemo(() => {
    return selectedSemester ? { semester: selectedSemester } : undefined;
  }, [selectedSemester]);

  const { data, isLoading, isError, refetch, isFetching } = useGetTimetable(
    queryParams,
    {
      query: {
        queryKey: ['/timetable', cookie, selectedSemester],
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
      },
      request: {
        headers,
      },
    }
  );

  // When live timetable data with courses arrives, persist to localStorage
  useEffect(() => {
    if (data && data.courses && data.courses.length > 0) {
      setCachedTimetable(data);
      localStorage.setItem('actvn_cached_timetable', JSON.stringify(data));
    }
  }, [data]);

  const loginMutation = useLoginQldt();

  // Login handler that saves credentials locally for seamless re-authentication
  const handleLogin = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await loginMutation.mutateAsync({
          data: { username, password },
        });

        if (res.cookie) {
          const freshCookie = res.cookie;
          localStorage.setItem('actvn_qldt_cookie', freshCookie);
          setCookie(freshCookie);
          const creds: QldtCredentials = { username, password };
          setSavedCreds(creds);
          localStorage.setItem('actvn_qldt_credentials', JSON.stringify(creds));

          try {
            const liveData = await getTimetable(queryParams, {
              headers: { 'X-Qldt-Cookie': freshCookie },
            });
            if (liveData?.courses && liveData.courses.length > 0) {
              setCachedTimetable(liveData);
              localStorage.setItem('actvn_cached_timetable', JSON.stringify(liveData));
            }
            queryClient.setQueryData(['/timetable', freshCookie, selectedSemester], liveData);
          } catch {
            // Ignore immediate fetch error
          }

          queryClient.invalidateQueries({ queryKey: ['/timetable'] });
          return { success: true };
        }
        return { success: false, error: 'Không nhận được phiên đăng nhập hợp lệ.' };
      } catch (err: any) {
        const message = err?.response?.data?.error || err?.message || 'Đăng nhập không thành công.';
        return { success: false, error: message };
      }
    },
    [loginMutation, queryClient, queryParams, selectedSemester]
  );

  const saveCookieDirectly = useCallback((newCookie: string) => {
    localStorage.setItem('actvn_qldt_cookie', newCookie.trim());
    setCookie(newCookie.trim());
    queryClient.invalidateQueries();
    setTimeout(() => {
      refetch();
    }, 50);
  }, [queryClient, refetch]);

  const logout = useCallback(() => {
    localStorage.removeItem('actvn_qldt_cookie');
    localStorage.removeItem('actvn_qldt_credentials');
    localStorage.removeItem('actvn_cached_timetable');
    setCookie('');
    setSavedCreds(null);
    setCachedTimetable(null);
    queryClient.invalidateQueries();
  }, [queryClient]);

  // Unified sync method that auto-relies on saved credentials when expired
  const syncTimetable = useCallback(async (): Promise<{
    success: boolean;
    reauthenticated: boolean;
    requireLogin: boolean;
    error?: string;
  }> => {
    try {
      // 1. Try with current cookie first
      const currentCookie = localStorage.getItem('actvn_qldt_cookie') || cookie;
      if (currentCookie) {
        try {
          const checkRes = await getTimetable(queryParams, {
            headers: { 'X-Qldt-Cookie': currentCookie },
          });
          if (checkRes?.isLive && checkRes.courses && checkRes.courses.length > 0) {
            setCachedTimetable(checkRes);
            localStorage.setItem('actvn_cached_timetable', JSON.stringify(checkRes));
            queryClient.setQueryData(['/timetable', currentCookie, selectedSemester], checkRes);
            queryClient.invalidateQueries({ queryKey: ['/timetable'] });
            return { success: true, reauthenticated: false, requireLogin: false };
          }
        } catch {
          // Current cookie failed/expired, proceed to auto-login
        }
      }

      // 2. Read saved credentials from localStorage
      const rawCreds = localStorage.getItem('actvn_qldt_credentials');
      let creds: QldtCredentials | null = null;
      if (rawCreds) {
        try {
          creds = JSON.parse(rawCreds);
        } catch {
          creds = null;
        }
      }

      // 3. If credentials exist, perform auto-login seamlessly
      if (creds?.username && creds?.password) {
        try {
          const res = await loginMutation.mutateAsync({
            data: { username: creds.username, password: creds.password },
          });

          if (res.cookie) {
            const freshCookie = res.cookie;
            localStorage.setItem('actvn_qldt_cookie', freshCookie);
            setCookie(freshCookie);
            setSavedCreds(creds);

            const liveData = await getTimetable(queryParams, {
              headers: { 'X-Qldt-Cookie': freshCookie },
            });

            if (liveData?.courses) {
              setCachedTimetable(liveData);
              localStorage.setItem('actvn_cached_timetable', JSON.stringify(liveData));
            }
            queryClient.setQueryData(['/timetable', freshCookie, selectedSemester], liveData);
            queryClient.invalidateQueries({ queryKey: ['/timetable'] });

            return { success: true, reauthenticated: true, requireLogin: false };
          } else {
            return {
              success: false,
              reauthenticated: false,
              requireLogin: true,
              error: 'Không nhận được phiên đăng nhập hợp lệ từ Cổng QLĐT.',
            };
          }
        } catch (loginErr: any) {
          const errMsg =
            loginErr?.response?.data?.error ||
            loginErr?.message ||
            'Tài khoản hoặc mật khẩu đã lưu không còn đúng. Vui lòng đăng nhập lại.';
          return {
            success: false,
            reauthenticated: false,
            requireLogin: true,
            error: errMsg,
          };
        }
      }

      // 4. No saved credentials
      return {
        success: false,
        reauthenticated: false,
        requireLogin: true,
        error: 'Chưa có thông tin đăng nhập QLĐT đã lưu. Vui lòng đăng nhập.',
      };
    } catch (err: any) {
      return {
        success: false,
        reauthenticated: false,
        requireLogin: false,
        error: err?.message || 'Không thể kết nối đến Cổng QLĐT.',
      };
    }
  }, [cookie, queryParams, selectedSemester, loginMutation, queryClient]);

  // Active timetable data (live -> cached -> null)
  const activeTimetable = useMemo(() => {
    if (data?.isLive && data.courses && data.courses.length > 0) {
      return data;
    }
    if (cachedTimetable && cachedTimetable.courses && cachedTimetable.courses.length > 0) {
      return cachedTimetable;
    }
    return data || cachedTimetable || null;
  }, [data, cachedTimetable]);

  const value: TimetableContextType = {
    timetable: activeTimetable,
    isLoading,
    isFetching,
    isError,
    isLive: data?.isLive || false,
    hasCookie: !!cookie,
    savedUsername: savedCreds?.username || '',
    selectedSemester,
    setSelectedSemester,
    login: handleLogin,
    saveCookieDirectly,
    logout,
    syncTimetable,
  };

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}
