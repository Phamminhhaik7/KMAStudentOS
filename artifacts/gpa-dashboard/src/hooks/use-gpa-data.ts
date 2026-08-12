import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGetGrades, getGetGradesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Grade, Subject, GradesResponseGpaScale, PortalUserInfo } from '@workspace/api-client-react';
import { computeCourseGrade, getLetterGrade } from '../lib/utils';

interface LocalEdits {
  [stt: string]: Partial<Grade>;
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

  const { data, isLoading, isError, refetch } = useGetGrades({
    query: {
      queryKey: getGetGradesQueryKey(),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
    request: {
      headers
    }
  });

  const saveCredentials = useCallback((newCookie: string, newUa: string) => {
    setCookie(newCookie);
    setUa(newUa);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: getGetGradesQueryKey() });
    }, 0);
  }, [queryClient]);

  const clearCredentials = useCallback(() => {
    setCookie('');
    setUa('');
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: getGetGradesQueryKey() });
    }, 0);
  }, [queryClient]);

  const updateGrade = useCallback((stt: string, field: keyof Grade, value: string) => {
    setLocalEdits(prev => {
      const existing = prev[stt] || {};
      const updated = { ...existing, [field]: value };
      
      // Auto-compute logic
      if ((field === 'dqt' || field === 'exam') && data?.gpaScale) {
        // Need to get the other field. We look in updated, then existing, then data
        const gradeBase = plannedSubjects.find(s => s.stt === stt) || data?.grades.find(s => s.stt === stt);
        const dqt = updated.dqt ?? existing.dqt ?? gradeBase?.dqt ?? '-';
        const exam = updated.exam ?? existing.exam ?? gradeBase?.exam ?? '-';
        
        const computed = computeCourseGrade(dqt, exam);
        if (computed !== null) {
          updated.course = computed.toString();
          updated.letter = getLetterGrade(computed, data.gpaScale);
        }
      } else if (field === 'course' && data?.gpaScale) {
        const cVal = parseFloat(value);
        if (!isNaN(cVal)) {
          updated.letter = getLetterGrade(cVal, data.gpaScale);
        }
      }

      // If it's a planned subject, we should actually update the planned array directly so it's simpler
      if (stt.startsWith('planned_')) {
        setPlannedSubjects(p => p.map(s => {
          if (s.stt === stt) {
            return { ...s, ...updated } as Grade;
          }
          return s;
        }));
        return prev;
      }

      return { ...prev, [stt]: updated };
    });
  }, [data?.gpaScale, data?.grades, plannedSubjects]);

  const deleteGrade = useCallback((stt: string) => {
    if (stt.startsWith('planned_')) {
      setPlannedSubjects(p => p.filter(s => s.stt !== stt));
    } else {
      setDeletedStts(prev => [...prev, stt]);
    }
  }, []);

  const addPlannedSubject = useCallback((subject: Subject, term: string, year: string, examStr?: string, courseStr?: string) => {
    const newGrade: Grade = {
      stt: `planned_${Date.now()}`,
      year,
      term,
      subject: subject.name,
      code: subject.code,
      credits: subject.credits,
      attempt: "1",
      tp1: "-",
      tp2: "-",
      dqt: "-",
      exam: examStr || "-",
      course: courseStr || "-",
      letter: "-"
    };

    if (courseStr && data?.gpaScale) {
      const c = parseFloat(courseStr);
      if (!isNaN(c)) {
        newGrade.letter = getLetterGrade(c, data.gpaScale);
      }
    } else if (examStr && data?.gpaScale) {
      const computed = computeCourseGrade("-", examStr); // Usually doesn't work without dqt, but let's assume if they only put exam, maybe dqt is 0 or they just want exam=course. Wait, if dqt is '-', compute Course returns null.
      if (computed !== null) {
        newGrade.course = computed.toString();
        newGrade.letter = getLetterGrade(computed, data.gpaScale);
      }
    }

    setPlannedSubjects(p => [...p, newGrade]);
  }, [data?.gpaScale]);

  const resetEdits = useCallback(() => {
    setLocalEdits({});
    setPlannedSubjects([]);
    setDeletedStts([]);
  }, []);

  // Merge data
  const finalGrades = useMemo(() => {
    if (!data) return [];
    
    let merged = data.grades
      .filter(g => !deletedStts.includes(g.stt))
      .map(g => ({
        ...g,
        ...(localEdits[g.stt] || {})
      }));
    
    merged = [...merged, ...plannedSubjects];
    return merged;
  }, [data, localEdits, plannedSubjects, deletedStts]);

  return {
    isLoading,
    isError,
    grades: finalGrades,
    subjects: data?.subjects || [],
    gpaScale: data?.gpaScale || {},
    userInfo: data?.userInfo || null,
    isLive: data?.isLive || false,
    hasCookie: !!cookie,
    saveCredentials,
    clearCredentials,
    updateGrade,
    deleteGrade,
    addPlannedSubject,
    resetEdits,
    hasEdits: Object.keys(localEdits).length > 0 || plannedSubjects.length > 0 || deletedStts.length > 0
  };
}
