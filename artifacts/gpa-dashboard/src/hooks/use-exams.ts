import { useState, useEffect } from 'react';

export interface ExamItem {
  id: string;
  subjectName: string;
  courseCode: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // HH:MM
  room: string;
  studentNo?: string; // Số báo danh
  examType: 'Giữa kỳ' | 'Cuối kỳ' | 'Thi lại';
  notes?: string;
}

const DEFAULT_EXAMS: ExamItem[] = [];

const STORAGE_KEY = 'kma_academic_exams_v2';

export function useExams() {
  const [exams, setExams] = useState<ExamItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_EXAMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
    } catch {}
  }, [exams]);

  const addExam = (exam: Omit<ExamItem, 'id'>) => {
    const newExam: ExamItem = {
      ...exam,
      id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setExams((prev) => [...prev, newExam].sort((a, b) => a.examDate.localeCompare(b.examDate)));
    return newExam;
  };

  const updateExam = (id: string, updates: Partial<ExamItem>) => {
    setExams((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    exams,
    addExam,
    updateExam,
    deleteExam,
  };
}
