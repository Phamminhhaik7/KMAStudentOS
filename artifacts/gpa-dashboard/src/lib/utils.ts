import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Grade, GradesResponseGpaScale } from "@workspace/api-client-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function isPhysicalEducation(subjectName: string): boolean {
  if (!subjectName) return false;
  const normalized = removeAccents(subjectName);
  return normalized.includes("the chat");
}

export interface GpaStats {
  gpa10: number;
  gpa4: number;
  credits: number;
  classification: string;
}

export function getClassification(gpa4: number): string {
  if (gpa4 >= 3.6) return "Xuất sắc (Excellent)";
  if (gpa4 >= 3.2) return "Giỏi (Good)";
  if (gpa4 >= 2.5) return "Khá (Fair)";
  if (gpa4 >= 2.0) return "Trung bình (Average)";
  return "Yếu (Weak)";
}

export function calculateGpa(grades: Grade[], scale: GradesResponseGpaScale): GpaStats {
  let totalCredits = 0;
  let total10 = 0;
  let total4 = 0;

  for (const g of grades) {
    if (isPhysicalEducation(g.subject)) continue;

    const courseNum = parseFloat(g.course);
    if (!isNaN(courseNum) && g.letter && scale[g.letter] !== undefined) {
      const gpa4Value = scale[g.letter];
      totalCredits += g.credits;
      total10 += courseNum * g.credits;
      total4 += gpa4Value * g.credits;
    }
  }

  return {
    gpa10: totalCredits > 0 ? total10 / totalCredits : 0,
    gpa4: totalCredits > 0 ? total4 / totalCredits : 0,
    credits: totalCredits,
    classification: totalCredits > 0 ? getClassification(total4 / totalCredits) : "N/A"
  };
}

export function computeCourseGrade(dqtStr: string, examStr: string): number | null {
  const dqt = parseFloat(dqtStr);
  const exam = parseFloat(examStr);
  if (isNaN(dqt) || isNaN(exam)) return null;
  return Math.round((dqt * 0.3 + exam * 0.7) * 10) / 10;
}

export function getLetterGrade(courseGrade: number, scale: GradesResponseGpaScale): string {
  // Approximate ACTVN scale logic if we don't have exact ranges, but usually:
  // A+ (9.0-10), A (8.5-8.9), B+ (8.0-8.4), B (7.0-7.9), C+ (6.5-6.9), C (5.5-6.4), D+ (5.0-5.4), D (4.0-4.9), F (0-3.9)
  if (courseGrade >= 9.0) return "A+";
  if (courseGrade >= 8.5) return "A";
  if (courseGrade >= 8.0) return "B+";
  if (courseGrade >= 7.0) return "B";
  if (courseGrade >= 6.5) return "C+";
  if (courseGrade >= 5.5) return "C";
  if (courseGrade >= 5.0) return "D+";
  if (courseGrade >= 4.0) return "D";
  return "F";
}

export function extractCurlCredentials(text: string): { cookie: string, ua: string } | null {
  const cookieMatch = text.match(/[Hh]eader ['"]Cookie: (.*?)['"]/);
  const uaMatch = text.match(/[Hh]eader ['"]User-Agent: (.*?)['"]/);
  
  // also check for lowercase -H
  const cookieMatchH = text.match(/-H ['"]cookie: (.*?)['"]/i);
  const uaMatchH = text.match(/-H ['"]user-agent: (.*?)['"]/i);

  const cookie = cookieMatch?.[1] || cookieMatchH?.[1];
  const ua = uaMatch?.[1] || uaMatchH?.[1];
  
  if (cookie) {
    return { cookie, ua: ua || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" };
  }
  
  return null;
}
