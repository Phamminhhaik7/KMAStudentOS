import * as cheerio from "cheerio";

export interface TimetableScheduleItem {
  raw: string;
  phase: number;
  startDate: string;
  endDate: string;
  dayOfWeek: number; // 2 for Monday ... 8 for Sunday
  dayName: string;   // "Thứ 2", "Thứ 3", etc.
  periods: number[];
  lessonType: string;
  room: string;
}

export interface TimetableCourse {
  stt: string;
  className: string;
  subjectName: string;
  courseCode: string;
  credits: number;
  timeRaw: string;
  schedules: TimetableScheduleItem[];
  room: string;
  lecturer: string;
  capacity: number;
  enrolled: number;
  tuition: string;
  note: string;
}

export interface SemesterOption {
  id: string;
  name: string;
  selected: boolean;
}

export interface ParsedTimetable {
  studentInfo: string;
  studentId: string;
  studentName: string;
  studentMajor: string;
  semesterName: string;
  semesterYear: string;
  semesterTerm: string;
  semesters: SemesterOption[];
  totalCredits: number;
  courses: TimetableCourse[];
}

function parseDayOfWeek(dayStr: string): { dayOfWeek: number; dayName: string } {
  const normalized = dayStr.trim().toLowerCase();
  if (normalized.includes("2") || normalized.includes("hai")) return { dayOfWeek: 2, dayName: "Thứ 2" };
  if (normalized.includes("3") || normalized.includes("ba")) return { dayOfWeek: 3, dayName: "Thứ 3" };
  if (normalized.includes("4") || normalized.includes("tư") || normalized.includes("tu")) return { dayOfWeek: 4, dayName: "Thứ 4" };
  if (normalized.includes("5") || normalized.includes("năm") || normalized.includes("nam")) return { dayOfWeek: 5, dayName: "Thứ 5" };
  if (normalized.includes("6") || normalized.includes("sáu") || normalized.includes("sau")) return { dayOfWeek: 6, dayName: "Thứ 6" };
  if (normalized.includes("7") || normalized.includes("bảy") || normalized.includes("bay")) return { dayOfWeek: 7, dayName: "Thứ 7" };
  if (normalized.includes("cn") || normalized.includes("chủ nhật") || normalized.includes("chu nhat")) return { dayOfWeek: 8, dayName: "Chủ Nhật" };
  return { dayOfWeek: 2, dayName: dayStr.trim() };
}

function cleanSubjectName(className: string): string {
  // E.g. "Cơ sở lý thuyết truyền tin-1-26 (A22C10D903)" -> "Cơ sở lý thuyết truyền tin"
  let name = className.trim();
  // Remove trailing parentheses like (A22C10D903)
  name = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  // Remove trailing -1-26 or -2-25
  name = name.replace(/-\d+-\d+\s*$/, "").trim();
  return name || className;
}

export function parseSchedules(timeHtml: string, defaultRoom: string): TimetableScheduleItem[] {
  const items: TimetableScheduleItem[] = [];
  
  // Replace <br>, <p>, <div> with newlines
  const textWithBreaks = timeHtml
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/&nbsp;/g, " ");

  const lines = textWithBreaks
    .split("\n")
    .map(line => line.replace(/<[^>]*>/g, "").trim())
    .filter(Boolean);

  let currentStartDate = "";
  let currentEndDate = "";
  let currentPhase = 1;

  for (const line of lines) {
    // Check for date range line: "Từ 26/10/2026 đến 15/11/2026: (1)" or "Từ 26/10/2026 đến 15/11/2026"
    const dateRangeMatch = line.match(/Từ\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+đến\s+(\d{1,2}\/\d{1,2}\/\d{4})(?::\s*\(?(\d+)\)?)?/i);
    if (dateRangeMatch) {
      currentStartDate = dateRangeMatch[1];
      currentEndDate = dateRangeMatch[2];
      if (dateRangeMatch[3]) {
        currentPhase = parseInt(dateRangeMatch[3], 10);
      }
      continue;
    }

    // Check for lesson line: "Thứ 2 tiết 1,2,3 (LT)" or "Thứ 4 tiết 4,5,6"
    const lessonMatch = line.match(/(Thứ\s+\d+|Thứ\s+[a-zA-ZÀ-ỹ]+|Chủ\s+Nhật|CN)\s+tiết\s+([\d,\s]+)(?:\s*\(([^)]+)\))?/i);
    if (lessonMatch) {
      const dayRaw = lessonMatch[1];
      const { dayOfWeek, dayName } = parseDayOfWeek(dayRaw);
      const periodsRaw = lessonMatch[2];
      const periods = periodsRaw
        .split(",")
        .map(p => parseInt(p.trim(), 10))
        .filter(n => !isNaN(n));
      const lessonType = (lessonMatch[3] || "LT").trim().toUpperCase();

      items.push({
        raw: line,
        phase: currentPhase,
        startDate: currentStartDate,
        endDate: currentEndDate,
        dayOfWeek,
        dayName,
        periods,
        lessonType,
        room: defaultRoom,
      });
    }
  }

  return items;
}

export function parseTimetableHtml(html: string): ParsedTimetable {
  const $ = cheerio.load(html);

  // Student Info: #lblStudent => "CT100127 - PHẠM MINH HẢI - Ngành Công nghệ thông tin"
  const studentHeader = $("#lblStudent").text().trim() || $("span[id*='lblStudent']").text().trim();
  let studentId = "";
  let studentName = "";
  let studentMajor = "";

  if (studentHeader) {
    const parts = studentHeader.split("-").map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (!studentId && /^[ACD]T\d{6,8}$/i.test(part)) {
        studentId = part.toUpperCase();
      } else if (!studentMajor && /(?:ngành|chuyên ngành|khoa)/i.test(part)) {
        studentMajor = part;
      } else if (
        !studentName &&
        /[a-zA-ZÀ-ỹ]/.test(part) &&
        !/^[ACD]T\d{1,3}[A-Za-z]?$/i.test(part)
      ) {
        studentName = part;
      }
    }
    // Fallback if not matched by patterns
    if (!studentId && parts.length >= 1) studentId = parts[0];
    if (!studentName && parts.length >= 2) studentName = parts[1];
    if (!studentMajor && parts.length >= 3) studentMajor = parts.slice(2).join(" - ");
  }

  // Semester info: #lblSemester => "Học kỳ 1 Năm học 2026_2027 Đợt học 1"
  const semesterLabel = $("#lblSemester").text().trim() || $("span[id*='lblSemester']").text().trim();
  let semesterYear = "";
  let semesterTerm = "1";

  const semYearMatch = semesterLabel.match(/(\d{4}[_-]\d{4})/);
  if (semYearMatch) {
    semesterYear = semYearMatch[1].replace("-", "_");
  }
  const semTermMatch = semesterLabel.match(/Học kỳ\s+(\d+)/i);
  if (semTermMatch) {
    semesterTerm = semTermMatch[1];
  }

  // Semesters dropdown: #drpSemester option
  const semesters: SemesterOption[] = [];
  $("select#drpSemester option, select[name*='drpSemester'] option").each((_i, el) => {
    const id = $(el).attr("value") || "";
    const name = $(el).text().trim();
    const selected = $(el).is(":selected");
    if (id) {
      semesters.push({ id, name, selected });
    }
  });

  // Table #gridRegistered
  const courses: TimetableCourse[] = [];
  const table = $("table#gridRegistered, table[id*='gridRegistered']").first();

  let totalCredits = 0;

  table.find("tbody tr, tr").each((_i, row) => {
    const cols = $(row).find("td");
    // Skip header or footer summary rows
    if (cols.length < 9) return;

    const firstColText = $(cols[0]).text().trim();
    const sttNum = parseInt(firstColText, 10);
    if (isNaN(sttNum)) return; // Header or summary row

    const className = $(cols[1]).text().trim();
    const courseCode = $(cols[2]).text().trim();
    const timeHtml = $(cols[3]).html() || "";
    const room = $(cols[4]).text().trim().replace(/\s+/g, " ");
    const lecturer = $(cols[5]).text().trim().replace(/\s+/g, " ");
    const capacity = parseInt($(cols[6]).text().trim(), 10) || 0;
    const enrolled = parseInt($(cols[7]).text().trim(), 10) || 0;
    const credits = parseFloat($(cols[8]).text().trim()) || 0;
    const tuition = cols.length > 9 ? $(cols[9]).text().trim() : "";
    const note = cols.length > 10 ? $(cols[10]).text().trim() : "";

    const subjectName = cleanSubjectName(className);
    const schedules = parseSchedules(timeHtml, room);

    totalCredits += credits;

    courses.push({
      stt: String(sttNum),
      className,
      subjectName,
      courseCode,
      credits,
      timeRaw: $(cols[3]).text().trim(),
      schedules,
      room,
      lecturer,
      capacity,
      enrolled,
      tuition,
      note,
    });
  });

  return {
    studentInfo: studentHeader,
    studentId,
    studentName,
    studentMajor,
    semesterName: semesterLabel || "Học kỳ 1 Năm học 2026_2027",
    semesterYear: semesterYear || "2026_2027",
    semesterTerm: semesterTerm || "1",
    semesters,
    totalCredits,
    courses,
  };
}
