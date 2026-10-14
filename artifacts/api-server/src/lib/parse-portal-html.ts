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
 * Parses the ACTVN training-portal grades HTML page (view=learnerexams)
 * into structured grades and a subject catalog.
 */
export function parsePortalHtml(html: string): ParsedTranscript {
  if (!html || html.includes("Không xác định được thí sinh") || html.includes("Hãy đăng nhập")) {
    return { grades: [], subjects: [] };
  }

  const $ = cheerio.load(html);

  const courseNameToCode = new Map<string, string>();
  const subjects: CatalogSubject[] = [];
  const seenCodes = new Set<string>();

  // Extract subjects from any dropdown option that matches "CODE - NAME"
  $("select option").each((_i: number, option: any) => {
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

  // Find the table that contains grades data
  let targetTable: any = null;
  $("table").each((_i, tbl) => {
    const tableText = $(tbl).text().toLowerCase();
    if (
      tableText.includes("môn") ||
      tableText.includes("học kỳ") ||
      tableText.includes("điểm") ||
      tableText.includes("lần thi")
    ) {
      targetTable = $(tbl);
      return false; // break
    }
    return undefined;
  });

  if (!targetTable) {
    targetTable = $("table.table.table-bordered, table.table").first();
  }

  if (targetTable && targetTable.length > 0) {
    // Detect column indexes from header (if available)
    let idxStt = 0;
    let idxYear = 2;
    let idxTerm = 3;
    let idxSubject = 4;
    let idxCode = -1;
    let idxAttempt = 5;
    let idxTp1 = 6;
    let idxTp2 = 7;
    let idxDqt = 8;
    let idxExam = 9;
    let idxCourse = 10;
    let idxLetter = 11;

    const headerCells = targetTable.find("thead tr th, tr th, tr:first-child td");
    if (headerCells.length >= 8) {
      headerCells.each((idx: number, cell: any) => {
        const hText = $(cell).text().trim().toLowerCase();
        if (hText === "stt") idxStt = idx;
        else if (hText.includes("năm")) idxYear = idx;
        else if (hText.includes("kỳ") || hText.includes("học kỳ")) idxTerm = idx;
        else if (hText.includes("mã") && (hText.includes("môn") || hText.includes("hp"))) idxCode = idx;
        else if (hText.includes("môn") || hText.includes("học phần") || hText.includes("tên")) idxSubject = idx;
        else if (hText.includes("lần thi") || hText === "lần") idxAttempt = idx;
        else if (hText.includes("tp1") || hText.includes("tp 1") || hText.includes("cc")) idxTp1 = idx;
        else if (hText.includes("tp2") || hText.includes("tp 2") || hText.includes("kt")) idxTp2 = idx;
        else if (hText.includes("đqt") || hText.includes("dqt") || hText.includes("quá trình")) idxDqt = idx;
        else if (hText.includes("điểm thi") || hText === "thi") idxExam = idx;
        else if (hText.includes("tổng kết") || hText.includes("điểm hp") || hText.includes("hp") || hText === "tk") idxCourse = idx;
        else if (hText.includes("chữ") || hText.includes("điểm chữ")) idxLetter = idx;
      });
    }

    const rows = targetTable.find("tbody tr").length > 0
      ? targetTable.find("tbody tr")
      : targetTable.find("tr").slice(1);

    rows.each((_i: number, row: any) => {
      const cols = $(row).find("td");
      if (cols.length < 5) return;

      const cellText = (index: number): string => {
        if (index < 0 || index >= cols.length) return "";
        return $(cols[index]).text().trim();
      };

      const stt = cellText(idxStt);
      const year = cellText(idxYear);
      const term = cellText(idxTerm);
      const subject = cellText(idxSubject);
      let code = idxCode >= 0 ? cellText(idxCode) : "";
      const attempt = cellText(idxAttempt);
      const tp1 = cellText(idxTp1);
      const tp2 = cellText(idxTp2);
      const dqt = cellText(idxDqt);
      const exam = cellText(idxExam);
      const course = cellText(idxCourse);
      const letter = cellText(idxLetter);

      if (!subject || subject.toLowerCase() === "tên môn học") return;

      if (!code) {
        code = courseNameToCode.get(cleanName(subject)) ?? "";
      }

      if (code && !seenCodes.has(code)) {
        seenCodes.add(code);
        subjects.push({ code, name: subject, credits: resolveCredits(code, subject) });
      }

      grades.push({
        stt: stt || String(grades.length + 1),
        year: year || "-",
        term: term || "-",
        subject,
        code,
        credits: resolveCredits(code, subject),
        attempt: attempt || "1",
        tp1: tp1 || "-",
        tp2: tp2 || "-",
        dqt: dqt || "-",
        exam: exam || "-",
        course: course || "-",
        letter: letter || "-",
      });
    });
  }

  return { grades, subjects };
}

export interface ParsedUserInfo {
  name: string;
  id: string;
  email: string;
}

export function isBadStudentName(name: string | undefined | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  // Class codes: CT10A, AT18B, DT05C, etc.
  if (/^[ACD]T\d{1,3}[A-Za-z]?$/i.test(trimmed)) return true;
  // Cohort codes: CT10, AT18, DT05
  if (/^[ACD]T\d{1,3}$/i.test(trimmed)) return true;
  // Generic words
  if (/^(?:lớp|khóa|sinh viên|thí sinh|học viên|chưa đăng nhập)$/i.test(trimmed)) return true;
  // Pure numbers or student IDs
  if (/^[ACD]T\d{6,8}$/i.test(trimmed)) return true;
  // Must contain alphabetic characters
  if (!/[a-zA-ZÀ-ỹ]/.test(trimmed)) return true;
  return false;
}

export function isBadStudentId(id: string | undefined | null): boolean {
  if (!id) return true;
  const trimmed = id.trim();
  // Class codes or cohorts are not student IDs
  if (/^[ACD]T\d{1,3}[A-Za-z]?$/i.test(trimmed)) return true;
  // Real names with spaces are not student IDs
  if (/\s/.test(trimmed)) return true;
  return false;
}

/** Parses the ACTVN portal's student info page (https://ktdbcl.actvn.edu.vn/hvsv.html). */
export function parsePortalUserInfo(html: string): ParsedUserInfo | null {
  if (!html || html.includes("Hãy đăng nhập để sử dụng Cổng HVSV")) {
    return null;
  }

  const $ = cheerio.load(html);
  let name = "";
  let id = "";
  let email = "";

  // Strategy 1: Check for "Danh sách môn thi của thí sinh" (from learnerexams page)
  // E.g. "Danh sách môn thi của thí sinh: PHẠM MINH HẢI - CT100127" or "CT100127 - PHẠM MINH HẢI"
  const bodyText = $("body").text();
  const examHeaderMatch =
    html.match(/Danh sách môn thi của thí sinh[:\s]+([^\n\r<]+)/i) ||
    bodyText.match(/Danh sách môn thi của thí sinh[:\s]+([^\n\r]+)/i);

  if (examHeaderMatch) {
    const rawContent = examHeaderMatch[1].trim();
    const idRegex = /\b([ACD]T\d{6,8})\b/i;
    const idFound = rawContent.match(idRegex);
    if (idFound) {
      id = idFound[1].toUpperCase();
      const cleaned = rawContent
        .replace(idRegex, "")
        .replace(/[-–—:()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned && !isBadStudentName(cleaned)) {
        name = cleaned;
      }
    } else {
      const parts = rawContent.split(/[-–—]/).map((p) => p.trim()).filter(Boolean);
      for (const p of parts) {
        if (!id && /^[ACD]T\d{6,8}$/i.test(p)) {
          id = p.toUpperCase();
        } else if (!name && !isBadStudentName(p)) {
          name = p;
        }
      }
    }
  }

  // Strategy 2: Labeled rows in tables (th / td) without requiring a colon
  $("tr").each((_i: number, el: any) => {
    const cells = $(el).find("th, td");
    if (cells.length >= 2) {
      const label = $(cells[0]).text().trim().toLowerCase();
      const val = $(cells[1]).text().trim();
      if (label && val) {
        if (
          !name &&
          (label.includes("họ và tên") ||
            label.includes("họ tên") ||
            label.includes("tên sinh viên") ||
            label.includes("tên thí sinh"))
        ) {
          if (!isBadStudentName(val)) name = val;
        }
        if (
          !id &&
          (label.includes("mã sinh viên") ||
            label.includes("mã sv") ||
            label.includes("mã thí sinh") ||
            label.includes("mã học viên"))
        ) {
          if (!isBadStudentId(val)) id = val;
        }
        if (!email && label.includes("email")) {
          const m = val.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
          if (m) email = m[1];
        }
      }
    }
  });

  // Strategy 3: Definition list <dt> and <dd>
  $("dt").each((_i: number, el: any) => {
    const label = $(el).text().trim().toLowerCase();
    const val = $(el).next("dd").text().trim();
    if (label && val) {
      if (
        !name &&
        (label.includes("họ và tên") || label.includes("họ tên") || label.includes("tên sinh viên"))
      ) {
        if (!isBadStudentName(val)) name = val;
      }
      if (
        !id &&
        (label.includes("mã sinh viên") ||
          label.includes("mã sv") ||
          label.includes("mã học viên") ||
          label.includes("mã thí sinh"))
      ) {
        if (!isBadStudentId(val)) id = val;
      }
      if (!email && label.includes("email")) {
        const m = val.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
        if (m) email = m[1];
      }
    }
  });

  // Strategy 4: Labeled text with regex in any container
  if (!name || !id || !email) {
    $("tr, div, dl, p, li").each((_i: number, el: any) => {
      const text = $(el).text();
      if (!name && /(?:Họ\s*(?:và)?\s*tên|Họ\s*tên|Tên\s*sinh\s*viên)\s*[:]/i.test(text)) {
        const match = text.match(/(?:Họ\s*(?:và)?\s*tên|Họ\s*tên|Tên\s*sinh\s*viên)\s*[:]\s*([^\n\r\t]+)/i);
        if (match && !isBadStudentName(match[1])) name = match[1].trim();
      }
      if (!id && /(?:Mã\s*(?:sinh\s*viên|học\s*viên|SV|thí\s*sinh))\s*[:]/i.test(text)) {
        const match = text.match(/(?:Mã\s*(?:sinh\s*viên|học\s*viên|SV|thí\s*sinh))\s*[:]\s*([A-Za-z0-9_-]+)/i);
        if (match && !isBadStudentId(match[1])) id = match[1].trim();
      }
      if (!email && /Email\s*[:]/i.test(text)) {
        const match = text.match(/Email\s*[:]\s*([^\s@]+@[^\s@]+\.[^\s@]+)/i);
        if (match) email = match[1].trim();
      }
    });
  }

  // Strategy 5: Regex scan for student ID like AT180123, CT070123, CT100127, DT... anywhere in body
  if (!id || isBadStudentId(id)) {
    const idMatch = $("main, body").text().match(/\b([ACD]T\d{6,8})\b/i);
    if (idMatch) id = idMatch[1].toUpperCase();
  }

  // Strategy 6: Traditional "strong" tags ONLY if name is not a class code
  if (!name || isBadStudentName(name)) {
    const strongs = $("main strong, .container strong");
    strongs.each((_i: number, el: any) => {
      const sText = $(el).text().trim();
      if (!name && !isBadStudentName(sText) && sText.split(" ").length >= 2) {
        name = sText;
      }
    });
  }

  if (name || id) {
    return {
      name: isBadStudentName(name) ? (id || "") : name,
      id: isBadStudentId(id) ? "" : id,
      email: email || "",
    };
  }

  return null;
}
