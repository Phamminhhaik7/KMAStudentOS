import * as cheerio from "cheerio";

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

function extractRequiredCreditsFromGroupName(groupName: string, courses: CurriculumCourse[]): number {
  const match = groupName.match(/\((\d+)\s*TC\)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  const reqCourses = courses.filter((c) => c.isRequired);
  if (reqCourses.length > 0) {
    return reqCourses.reduce((sum, c) => sum + c.credits, 0);
  }
  return courses.reduce((sum, c) => sum + c.credits, 0);
}

export function parseCurriculumHtml(html: string): ParsedCurriculum {
  const $ = cheerio.load(html);

  // Extract student name & ID: "PHẠM MINH HẢI(CT100127)"
  const fullNameText = $("#PageHeader1_lblUserFullName").text().trim();
  let studentName = "";
  let studentId = "";
  if (fullNameText.includes("(") && fullNameText.includes(")")) {
    studentName = fullNameText.split("(")[0].trim();
    studentId = fullNameText.split("(")[1].replace(")", "").trim();
  } else {
    studentName = fullNameText;
  }

  // Major and academic year
  const majorName = $("#hidFieldName").val() || $("select#drpStudentField option:selected").text().trim() || "Công nghệ thông tin";
  const academicYear = $("select#drpAcademicYear option:selected").text().trim() || "CT10";

  const courses: CurriculumCourse[] = [];
  const groupMap = new Map<string, CurriculumCourse[]>();

  let currentKnowledgeGroup = "Khối kiến thức chung";

  $("#tblCourse tr").each((i, row) => {
    // Skip header row
    if ($(row).hasClass("DataGridFixedHeader") || i === 0) return;

    const cells = $(row).find("td");
    if (cells.length < 5) return;

    const stt = $(cells[0]).text().trim();
    if (!stt || isNaN(parseInt(stt, 10))) return;

    // Check knowledge group cell
    const groupCellText = $(cells[1]).text().trim();
    if (groupCellText && groupCellText !== "//" && !groupCellText.includes("//")) {
      currentKnowledgeGroup = groupCellText;
    }

    const courseCode = $(cells[2]).text().trim();
    const subjectName = $(cells[3]).text().trim();
    const creditsStr = $(cells[4]).text().trim();
    const credits = parseFloat(creditsStr) || 0;

    const theoryPeriods = parseInt($(cells[5]).text().trim(), 10) || undefined;
    const practicePeriods = parseInt($(cells[6]).text().trim(), 10) || undefined;
    const discussionPeriods = parseInt($(cells[7]).text().trim(), 10) || undefined;
    const term = $(cells[8]).text().trim() || undefined;

    if (courseCode && subjectName && credits > 0) {
      const isElective = currentKnowledgeGroup.toLowerCase().includes("tự chọn") || currentKnowledgeGroup.toLowerCase().includes("lựa chọn");
      const isRequired = !isElective;

      const item: CurriculumCourse = {
        stt,
        knowledgeGroup: currentKnowledgeGroup,
        courseCode,
        subjectName,
        credits,
        theoryPeriods,
        practicePeriods,
        discussionPeriods,
        term,
        isRequired,
      };

      courses.push(item);

      if (!groupMap.has(currentKnowledgeGroup)) {
        groupMap.set(currentKnowledgeGroup, []);
      }
      groupMap.get(currentKnowledgeGroup)!.push(item);
    }
  });

  // Calculate total curriculum credits based on required credits per block
  let totalCurriculumCredits = 0;
  const groups: KnowledgeGroupSummary[] = [];

  groupMap.forEach((groupCourses, groupName) => {
    const groupRequiredCredits = extractRequiredCreditsFromGroupName(groupName, groupCourses);
    totalCurriculumCredits += groupRequiredCredits;
    groups.push({
      groupName,
      totalCredits: groupRequiredCredits,
      courses: groupCourses,
    });
  });

  // If total curriculum credits is 0, default to 155
  if (totalCurriculumCredits === 0 && courses.length === 0) {
    totalCurriculumCredits = 155;
  }

  return {
    studentName,
    studentId,
    majorName: String(majorName),
    academicYear,
    totalCredits: totalCurriculumCredits,
    groups,
    courses,
  };
}
