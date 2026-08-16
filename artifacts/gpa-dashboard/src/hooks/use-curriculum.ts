import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGpaData } from './use-gpa-data';
import { useTimetable } from './use-timetable';

export interface CurriculumCourse {
  stt: string;
  knowledgeGroup: string;
  courseCode: string;
  subjectName: string;
  credits: number;
  theoryPeriods?: number;
  practicePeriods?: number;
  discussionPeriods?: number;
  term?: string;
  isRequired: boolean;
}

export interface KnowledgeGroupSummary {
  groupName: string;
  totalCredits: number;
  courses: CurriculumCourse[];
}

export interface ParsedCurriculum {
  studentName: string;
  studentId: string;
  majorName: string;
  academicYear: string;
  totalCredits: number;
  groups: KnowledgeGroupSummary[];
  courses: CurriculumCourse[];
}

interface StoredCurriculumData {
  studentId: string;
  curriculum: ParsedCurriculum;
  timestamp: number;
}

const STORAGE_PREFIX = 'kma_curriculum_';

export function useCurriculum() {
  const queryClient = useQueryClient();
  const { grades } = useGpaData();
  const { timetable, hasCookie } = useTimetable();

  const qldtCookie = localStorage.getItem('actvn_qldt_cookie') || '';
  const currentStudentId = timetable?.studentId || 'default';

  // Load cached curriculum for current student from localStorage
  const [cachedCurriculum, setCachedCurriculum] = useState<ParsedCurriculum | null>(() => {
    try {
      if (!currentStudentId || currentStudentId === 'default') {
        const fallback = localStorage.getItem('kma_curriculum_latest');
        return fallback ? JSON.parse(fallback) : null;
      }
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${currentStudentId}`);
      if (raw) {
        const parsed: StoredCurriculumData = JSON.parse(raw);
        return parsed.curriculum;
      }
    } catch {}
    return null;
  });

  // Query to fetch from backend /api/curriculum
  const { data: apiData, isLoading, refetch } = useQuery<{ isLive: boolean; data: ParsedCurriculum | null }>({
    queryKey: ['/api/curriculum', currentStudentId, hasCookie, qldtCookie],
    queryFn: async () => {
      const activeCookie = localStorage.getItem('actvn_qldt_cookie') || qldtCookie;
      const headers: Record<string, string> = {};
      if (activeCookie) {
        headers['X-Qldt-Cookie'] = activeCookie;
      }
      const res = await fetch('/api/curriculum', {
        headers,
      });
      if (!res.ok) throw new Error('Không thể tải chương trình đào tạo');
      return res.json();
    },
    enabled: !!(qldtCookie || hasCookie),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Save to localStorage whenever fresh curriculum data arrives
  useEffect(() => {
    if (apiData?.data && apiData.data.courses.length > 0) {
      const curriculum = apiData.data;
      setCachedCurriculum(curriculum);

      const targetId = curriculum.studentId || currentStudentId;
      if (targetId && targetId !== 'default') {
        const stored: StoredCurriculumData = {
          studentId: targetId,
          curriculum,
          timestamp: Date.now(),
        };
        localStorage.setItem(`${STORAGE_PREFIX}${targetId}`, JSON.stringify(stored));
      }
      localStorage.setItem('kma_curriculum_latest', JSON.stringify(curriculum));
    }
  }, [apiData, currentStudentId]);

  // When student ID changes, reload respective cached curriculum
  useEffect(() => {
    if (currentStudentId && currentStudentId !== 'default') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${currentStudentId}`);
        if (raw) {
          const parsed: StoredCurriculumData = JSON.parse(raw);
          setCachedCurriculum(parsed.curriculum);
        }
      } catch {}
    }
  }, [currentStudentId]);

  // Active curriculum data (live API -> cached -> default fallback)
  const curriculum = useMemo(() => {
    if (apiData?.data && apiData.data.courses.length > 0) {
      return apiData.data;
    }
    return cachedCurriculum;
  }, [apiData, cachedCurriculum]);

  // Set of completed course codes from student grades
  const completedCourseCodes = useMemo(() => {
    const set = new Set<string>();
    grades.forEach((g) => {
      // If course is completed (has grade and not failed F)
      if (g.course && g.course !== '-' && g.letter !== 'F') {
        set.add(g.code.trim().toUpperCase());
      }
    });
    return set;
  }, [grades]);

  // Dynamically calculate total credits and group progress
  const progressStats = useMemo(() => {
    const totalRequired = curriculum?.totalCredits || 145;

    // Sum actual credits from grades
    let totalCompleted = 0;
    grades.forEach((g) => {
      if (g.course && g.course !== '-' && g.letter !== 'F') {
        totalCompleted += g.credits;
      }
    });

    const groupsSummary = (curriculum?.groups || []).map((group) => {
      let groupCompleted = 0;
      group.courses.forEach((c) => {
        if (completedCourseCodes.has(c.courseCode.trim().toUpperCase())) {
          groupCompleted += c.credits;
        }
      });

      return {
        ...group,
        completedCredits: groupCompleted,
        percent: group.totalCredits > 0 ? Math.min(100, Math.round((groupCompleted / group.totalCredits) * 100)) : 0,
      };
    });

    const percent = Math.min(100, Math.round((totalCompleted / totalRequired) * 100));

    return {
      totalRequired,
      totalCompleted,
      totalRemaining: Math.max(0, totalRequired - totalCompleted),
      percent,
      groupsSummary,
      majorName: curriculum?.majorName || 'Công nghệ thông tin',
      academicYear: curriculum?.academicYear || 'CT10',
    };
  }, [curriculum, grades, completedCourseCodes]);

  const refreshCurriculum = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
    refetch();
  }, [queryClient, refetch]);

  return {
    curriculum,
    isLoading,
    progressStats,
    refreshCurriculum,
  };
}
