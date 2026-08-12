import * as cheerio from "cheerio";
import type { Grade } from "@workspace/api-zod";
import { resolveCredits } from "./gpa-data";
import type { CatalogSubject } from "./subjects-catalog";

function cleanName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface ParsedTranscript {
  grades: Grade[];
  subjects: CatalogSubject[];
}

/**
 * Parses the ACTVN training-portal "xem-diem-thi" HTML page into structured
 * grades and a subject catalog, mirroring the original Python
 * BeautifulSoup-based parser.
 */
export function parsePortalHtml(html: string): ParsedTranscript {
  const $ = cheerio.load(html);

  const courseNameToCode = new Map<string, string>();
  const subjects: CatalogSubject[] = [];
  const seenCodes = new Set<string>();

  $("select#filter_subject_id option").each((_i, option) => {
    const text = $(option).text().trim();
    const separatorIndex = text.indexOf(" - ");
    if (separatorIndex === -1) return;

    const code = text.slice(0, separatorIndex).trim();
    const name = text.slice(separatorIndex + 3).trim();
    if (!code || !name) return;

    courseNameToCode.set(cleanName(name), code);

    if (!seenCodes.has(code)) {
      seenCodes.add(code);
      subjects.push({ code, name, credits: resolveCredits(code, name) });
    }
  });

  const grades: Grade[] = [];
  const table = $("table.table.table-bordered").first();

  table.find("tbody tr").each((_i, row) => {
    const cols = $(row).find("td");
    if (cols.length < 12) return;

    const cellText = (index: number): string => $(cols[index]).text().trim();

    const stt = cellText(0);
    const year = cellText(2);
    const term = cellText(3);
    const subject = cellText(4);
    const attempt = cellText(5);
    const tp1 = cellText(6);
    const tp2 = cellText(7);
    const dqt = cellText(8);
    const exam = cellText(9);
    const course = cellText(10);
    const letter = cellText(11);

    if (!subject) return;

    const code = courseNameToCode.get(cleanName(subject)) ?? "";

    grades.push({
      stt,
      year,
      term,
      subject,
      code,
      credits: resolveCredits(code, subject),
      attempt,
      tp1: tp1 || "-",
      tp2: tp2 || "-",
      dqt: dqt || "-",
      exam: exam || "-",
      course: course || "-",
      letter: letter || "-",
    });
  });

  return { grades, subjects };
}

export interface ParsedUserInfo {
  name: string;
  id: string;
  email: string;
}

/** Parses the ACTVN portal's "thong-tin-tai-khoan" account info page. */
export function parsePortalUserInfo(html: string): ParsedUserInfo | null {
  const $ = cheerio.load(html);
  const strongs = $("main strong");
  if (strongs.length < 3) return null;

  return {
    name: $(strongs[0]).text().trim(),
    id: $(strongs[1]).text().trim(),
    email: $(strongs[2]).text().trim(),
  };
}
