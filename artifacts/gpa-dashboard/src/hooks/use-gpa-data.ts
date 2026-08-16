import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetGrades, getGetGradesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Grade, Subject, GradesResponseGpaScale, PortalUserInfo } from '@workspace/api-client-react';
import { computeCourseGrade, getLetterGrade } from '../lib/utils';

interface LocalEdits {
  [stt: string]: Partial<Grade>;
}

interface CachedGpaData {
  grades: Grade[];
  subjects: Subject[];
  gpaScale: GradesResponseGpaScale;
  userInfo: PortalUserInfo | null;
  timestamp: number;
}

export function useGpaData() {
  const queryClient = useQueryClient();

  // Credentials
  const [cookie, setCookie] = useState<string>(() => localStorage.getItem('actvn_cookie') || '');
  const [ua, setUa] = useState<string>(() => localStorage.getItem('actvn_ua') || '');

  // Local Overrides
  const [localEdits, setLocalEdits] = useState<LocalEdits>(() => {
    const saved = localStorage.getItem('actvn_local_edits');
    return saved ? JSON.parse(saved) : {};
  });
  const [plannedSubjects, setPlannedSubjects] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('actvn_planned_subjects');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedStts, setDeletedStts] = useState<string[]>(() => {
    const saved = localStorage.getItem('actvn_deleted_stts');
    return saved ? JSON.parse(saved) : [];
  });

  // Cached API data
  const [cachedData, setCachedData] = useState<CachedGpaData | null>(() => {
    const saved = localStorage.getItem('actvn_cached_grades_data');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('actvn_cookie', cookie);
    localStorage.setItem('actvn_ua', ua);
  }, [cookie, ua]);

  useEffect(() => {
    localStorage.setItem('actvn_local_edits', JSON.stringify(localEdits));
    localStorage.setItem('actvn_planned_subjects', JSON.stringify(plannedSubjects));
    localStorage.setItem('actvn_deleted_stts', JSON.stringify(deletedStts));
  }, [localEdits, plannedSubjects, deletedStts]);

  // Fetch Data
  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (cookie) h['X-Portal-Cookie'] = cookie;
    if (ua) h['X-Portal-User-Agent'] = ua;
    return h;
  }, [cookie, ua]);

  const { data, isLoading, isError, refetch, isFetching } = useGetGrades({
    query: {
      queryKey: getGetGradesQueryKey(),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
    request: {
      headers,
    },
  });

  // Whenever fresh live data arrives from API with grades, cache to localStorage
  useEffect(() => {
    if (data && data.grades && data.grades.length > 0) {
      const cacheObj: CachedGpaData = {
        grades: data.grades,
        subjects: data.subjects,
        gpaScale: data.gpaScale,
        userInfo: data.userInfo || null,
        timestamp: Date.now(),
      };
      setCachedData(cacheObj);
      localStorage.setItem('actvn_cached_grades_data', JSON.stringify(cacheObj));
    }
  }, [data]);

  const saveCredentials = useCallback(
    (newCookie: string, newUa: string) => {
      setCookie(newCookie);
      setUa(newUa);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: getGetGradesQueryKey() });
      }, 0);
    },
    [queryClient]
  );

  const clearCredentials = useCallback(() => {
    setCookie('');
    setUa('');
    localStorage.removeItem('actvn_cookie');
    localStorage.removeItem('actvn_ua');
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: getGetGradesQueryKey() });
    }, 0);
  }, [queryClient]);

  const updateGrade = useCallback(
    (stt: string, field: keyof Grade, value: string) => {
      const activeScale = data?.gpaScale || cachedData?.gpaScale;

      setLocalEdits((prev) => {
        const existing = prev[stt] || {};
        const updated = { ...existing, [field]: value };

        if ((field === 'dqt' || field === 'exam') && activeScale) {
          const gradeBase =
            plannedSubjects.find((s) => s.stt === stt) ||
            data?.grades.find((s) => s.stt === stt) ||
            cachedData?.grades.find((s) => s.stt === stt);
          const dqt = updated.dqt ?? existing.dqt ?? gradeBase?.dqt ?? '-';
          const exam = updated.exam ?? existing.exam ?? gradeBase?.exam ?? '-';

          const computed = computeCourseGrade(dqt, exam);
          if (computed !== null) {
            updated.course = computed.toString();
            updated.letter = getLetterGrade(computed, activeScale);
          }
        } else if (field === 'course' && activeScale) {
          const cVal = parseFloat(value);
          if (!isNaN(cVal)) {
            updated.letter = getLetterGrade(cVal, activeScale);
          }
        }

        if (stt.startsWith('planned_')) {
          setPlannedSubjects((p) =>
            p.map((s) => {
              if (s.stt === stt) {
                return { ...s, ...updated } as Grade;
              }
              return s;
            })
          );
          return prev;
        }

        return { ...prev, [stt]: updated };
      });
    },
    [data?.gpaScale, data?.grades, cachedData, plannedSubjects]
  );

  const deleteGrade = useCallback((stt: string) => {
    if (stt.startsWith('planned_')) {
      setPlannedSubjects((p) => p.filter((s) => s.stt !== stt));
    } else {
      setDeletedStts((prev) => [...prev, stt]);
    }
  }, []);

  const addPlannedSubject = useCallback(
    (subject: Subject, term: string, year: string, examStr?: string, courseStr?: string) => {
      const activeScale = data?.gpaScale || cachedData?.gpaScale;
      const newGrade: Grade = {
        stt: `planned_${Date.now()}`,
        year,
        term,
        subject: subject.name,
        code: subject.code,
        credits: subject.credits,
        attempt: '1',
        tp1: '-',
        tp2: '-',
        dqt: '-',
        exam: examStr || '-',
        course: courseStr || '-',
        letter: '-',
      };

      if (courseStr && activeScale) {
        const c = parseFloat(courseStr);
        if (!isNaN(c)) {
          newGrade.letter = getLetterGrade(c, activeScale);
        }
      } else if (examStr && activeScale) {
        const computed = computeCourseGrade('-', examStr);
        if (computed !== null) {
          newGrade.course = computed.toString();
          newGrade.letter = getLetterGrade(computed, activeScale);
        }
      }

      setPlannedSubjects((p) => [...p, newGrade]);
    },
    [data?.gpaScale, cachedData]
  );

  const resetEdits = useCallback(() => {
    setLocalEdits({});
    setPlannedSubjects([]);
    setDeletedStts([]);
  }, []);

  // Effective Base Grades (API live data first, then cached fallback)
  const baseGrades = useMemo(() => {
    if (data?.grades && data.grades.length > 0) return data.grades;
    if (cachedData?.grades && cachedData.grades.length > 0) return cachedData.grades;
    return [];
  }, [data?.grades, cachedData?.grades]);

  // Merge data
  const finalGrades = useMemo(() => {
    let merged = baseGrades
      .filter((g) => !deletedStts.includes(g.stt))
      .map((g) => ({
        ...g,
        ...(localEdits[g.stt] || {}),
      }));

    merged = [...merged, ...plannedSubjects];
    return merged;
  }, [baseGrades, localEdits, plannedSubjects, deletedStts]);

  const importSubjectsFromTimetable = useCallback(
    (
      courses: { subjectName: string; courseCode: string; credits: number }[],
      year: string,
      term: string
    ): number => {
      let count = 0;
      setPlannedSubjects((prev) => {
        const existing = [...baseGrades, ...prev];
        const newItems: Grade[] = [];

        courses.forEach((c, idx) => {
          const alreadyExists = existing.some(
            (g) =>
              g.year === year &&
              g.term === term &&
              ((g.code && c.courseCode && g.code.trim().toLowerCase() === c.courseCode.trim().toLowerCase()) ||
                (g.subject && c.subjectName && g.subject.trim().toLowerCase() === c.subjectName.trim().toLowerCase()))
          );

          if (!alreadyExists) {
            newItems.push({
              stt: `planned_import_${Date.now()}_${idx}`,
              year,
              term,
              subject: c.subjectName,
              code: c.courseCode,
              credits: c.credits,
              attempt: '1',
              tp1: '-',
              tp2: '-',
              dqt: '-',
              exam: '-',
              course: '-',
              letter: '-',
            });
            count++;
          }
        });

        return [...prev, ...newItems];
      });

      return count;
    },
    [baseGrades]
  );

  return {
    isLoading: isLoading || isFetching,
    isError,
    refetch,
    grades: finalGrades,
    subjects: (data?.subjects && data.subjects.length > 0 ? data.subjects : cachedData?.subjects) || [],
    gpaScale: data?.gpaScale || cachedData?.gpaScale || {},
    userInfo: data?.userInfo || cachedData?.userInfo || null,
    isLive: data?.isLive || false,
    hasCookie: !!cookie,
    saveCredentials,
    clearCredentials,
    updateGrade,
    deleteGrade,
    addPlannedSubject,
    importSubjectsFromTimetable,
    resetEdits,
    hasEdits: Object.keys(localEdits).length > 0 || plannedSubjects.length > 0 || deletedStts.length > 0,
  };
}
