import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetTimetable, getGetTimetableQueryKey, useLoginQldt } from '@workspace/api-client-react';
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

export function useTimetable() {
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
        queryKey: getGetTimetableQueryKey(queryParams),
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
          setCookie(res.cookie);
          const creds: QldtCredentials = { username, password };
          setSavedCreds(creds);
          localStorage.setItem('actvn_qldt_credentials', JSON.stringify(creds));
          queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
          return { success: true };
        }
        return { success: false, error: 'Không nhận được phiên đăng nhập hợp lệ.' };
      } catch (err: any) {
        const message = err?.response?.data?.error || err?.message || 'Đăng nhập không thành công.';
        return { success: false, error: message };
      }
    },
    [loginMutation, queryClient]
  );

  const saveCookieDirectly = useCallback((newCookie: string) => {
    setCookie(newCookie.trim());
    queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
  }, [queryClient]);

  const logout = useCallback(() => {
    setCookie('');
    localStorage.removeItem('actvn_qldt_cookie');
    localStorage.removeItem('actvn_qldt_credentials');
    setSavedCreds(null);
    queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
  }, [queryClient]);

  // Unified sync method that auto-relies on saved credentials when expired
  const syncTimetable = useCallback(async (): Promise<{
    success: boolean;
    reauthenticated: boolean;
    requireLogin: boolean;
    error?: string;
  }> => {
    try {
      const result = await refetch();

      // If fetch gave valid live courses
      if (result.data?.isLive && result.data.courses && result.data.courses.length > 0) {
        return { success: true, reauthenticated: false, requireLogin: false };
      }

      // If not live or expired session, attempt auto-relogin using saved credentials
      const credsRaw = localStorage.getItem('actvn_qldt_credentials');
      if (credsRaw) {
        const creds: QldtCredentials = JSON.parse(credsRaw);
        if (creds.username && creds.password) {
          const loginRes = await loginMutation.mutateAsync({
            data: { username: creds.username, password: creds.password },
          });

          if (loginRes.cookie) {
            setCookie(loginRes.cookie);
            localStorage.setItem('actvn_qldt_cookie', loginRes.cookie);
            await queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
            return { success: true, reauthenticated: true, requireLogin: false };
          }
        }
      }

      return { success: false, reauthenticated: false, requireLogin: true };
    } catch (err: any) {
      return {
        success: false,
        reauthenticated: false,
        requireLogin: true,
        error: err?.message || 'Không thể đồng bộ thời khóa biểu.',
      };
    }
  }, [refetch, loginMutation, queryClient]);

  // Effective timetable: live API data if available with courses, otherwise cached data
  const effectiveTimetable = useMemo((): TimetableResponse | undefined => {
    if (data && data.courses && data.courses.length > 0) {
      return data;
    }
    if (cachedTimetable && cachedTimetable.courses && cachedTimetable.courses.length > 0) {
      return cachedTimetable;
    }
    return data;
  }, [data, cachedTimetable]);

  // Flattened schedules
  const allScheduledSlots = useMemo((): DayLessonSlot[] => {
    if (!effectiveTimetable?.courses) return [];
    const slots: DayLessonSlot[] = [];

    effectiveTimetable.courses.forEach((course) => {
      course.schedules.forEach((schedule) => {
        if (schedule.periods && schedule.periods.length > 0) {
          const sortedPeriods = [...schedule.periods].sort((a, b) => a - b);
          const periodStart = sortedPeriods[0];
          const periodCount = sortedPeriods.length;

          slots.push({
            course,
            schedule,
            periodStart,
            periodCount,
          });
        }
      });
    });

    return slots;
  }, [effectiveTimetable?.courses]);

  // Group slots by Day of Week
  const scheduleByDay = useMemo(() => {
    const map = new Map<number, DayLessonSlot[]>();
    for (let day = 2; day <= 8; day++) {
      map.set(day, []);
    }

    allScheduledSlots.forEach((slot) => {
      const day = slot.schedule.dayOfWeek;
      if (map.has(day)) {
        map.get(day)!.push(slot);
      }
    });

    map.forEach((slots) => {
      slots.sort((a, b) => a.periodStart - b.periodStart);
    });

    return map;
  }, [allScheduledSlots]);

  return {
    timetable: effectiveTimetable,
    isLoading: isLoading || isFetching,
    isError,
    refetch,
    syncTimetable,
    hasCookie: !!cookie,
    hasSavedCredentials: !!savedCreds,
    selectedSemester,
    setSelectedSemester,
    login: handleLogin,
    saveCookieDirectly,
    logout,
    scheduleByDay,
    allScheduledSlots,
    isLoggingIn: loginMutation.isPending,
  };
}
