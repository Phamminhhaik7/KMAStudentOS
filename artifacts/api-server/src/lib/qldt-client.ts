import * as cheerio from "cheerio";
import { parseTimetableHtml, type ParsedTimetable } from "./parse-timetable-html";
import { SAMPLE_TIMETABLE_DATA } from "./sample-timetable";

const QLDT_LOGIN_URL = "http://qldt.actvn.edu.vn/CMCSoft.IU.Web.info/login.aspx";
const QLDT_TIMETABLE_URL = "http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Reports/Form/StudentTimeTable.aspx";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10000;

export function mergeCookies(existingCookie: string, setCookieHeaders: string[]): string {
  const cookieMap = new Map<string, string>();

  if (existingCookie) {
    existingCookie.split(";").forEach(part => {
      const eq = part.indexOf("=");
      if (eq !== -1) {
        cookieMap.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
      }
    });
  }

  for (const header of setCookieHeaders) {
    const mainPart = header.split(";")[0];
    const eq = mainPart.indexOf("=");
    if (eq !== -1) {
      cookieMap.set(mainPart.slice(0, eq).trim(), mainPart.slice(eq + 1).trim());
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface QldtLoginResult {
  success: boolean;
  cookie?: string;
  studentInfo?: string;
  studentId?: string;
  studentName?: string;
  errorMessage?: string;
}

export async function loginQldt(username: string, password: string): Promise<QldtLoginResult> {
  // Step 1: GET login page to obtain ViewState, EventValidation, and initial session cookie
  const getRes = await fetchWithTimeout(QLDT_LOGIN_URL, {
    method: "GET",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
    },
  });

  if (!getRes || !getRes.ok) {
    return {
      success: false,
      errorMessage: "Không thể kết nối đến cổng đào tạo QLĐT ACTVN. Vui lòng thử lại sau.",
    };
  }

  const initialSetCookies = getRes.headers.getSetCookie();
  const sessionCookie = mergeCookies("", initialSetCookies);
  const getHtml = await getRes.text();
  const $get = cheerio.load(getHtml);

  // Collect all hidden & default form inputs dynamically to ensure no ASP.NET tokens are missed
  const formData = new URLSearchParams();
  $get("form input").each((_, el) => {
    const name = $get(el).attr("name");
    const value = $get(el).attr("value") || "";
    if (name && !["txtUserName", "txtPassword", "btnSubmit"].includes(name)) {
      formData.append(name, value);
    }
  });

  // Extract language GUID from select or hidden input
  const lang =
    $get("select[name='PageHeader1$drpNgonNgu'] option:selected").val() ||
    $get("select#PageHeader1_drpNgonNgu option:selected").val() ||
    $get("input[name='PageHeader1$hidLanguage']").val() ||
    "4215c90de00e47088924a2ef3e0705a4";

  formData.set("PageHeader1$drpNgonNgu", String(lang));
  formData.set("PageHeader1$hidLanguage", String(lang));
  formData.set("PageHeader1$hidisNotify", "0");
  formData.set("PageHeader1$hidValueNotify", ".");
  formData.set("txtUserName", username.trim());
  formData.set("txtPassword", password);
  formData.set("btnSubmit", "Đăng nhập");
  if (!formData.has("hidUserId")) formData.append("hidUserId", "");
  if (!formData.has("hidUserFullName")) formData.append("hidUserFullName", "");
  if (!formData.has("hidTrainingSystemId")) formData.append("hidTrainingSystemId", "");

  const postRes = await fetchWithTimeout(QLDT_LOGIN_URL, {
    method: "POST",
    headers: {
      "User-Agent": DEFAULT_USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: sessionCookie,
      Origin: "http://qldt.actvn.edu.vn",
      Referer: QLDT_LOGIN_URL,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
    },
    body: formData.toString(),
    redirect: "manual",
  });

  if (!postRes) {
    return {
      success: false,
      errorMessage: "Không thể kết nối đến cổng QLĐT để đăng nhập.",
    };
  }

  const postSetCookies = postRes.headers.getSetCookie();
  const finalCookie = mergeCookies(sessionCookie, postSetCookies);

  // Check login success / error
  const postHtml = await postRes.text();
  const $post = cheerio.load(postHtml);

  const errorText =
    $post("#lblErrorInfo").text().trim() ||
    $post("span[id*='lblErrorInfo']").text().trim() ||
    $post("#lblError").text().trim();

  if (errorText && !errorText.includes("thành công") && !errorText.includes("Welcome")) {
    return {
      success: false,
      errorMessage: errorText,
    };
  }

  // Check if SignIn cookie is present or redirect occurred
  const hasSignInCookie = finalCookie.includes("SignIn=");
  let studentFullName =
    $post("#PageHeader1_lblUserFullName").text().trim() ||
    $post("span[id*='lblUserFullName']").text().trim() ||
    "";

  // If 302 redirect or has SignIn cookie but student name not on login page, fetch Home.aspx
  if ((postRes.status === 302 || hasSignInCookie) && !studentFullName) {
    try {
      const homeRes = await fetchWithTimeout("http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Home.aspx", {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Cookie: finalCookie,
          Referer: QLDT_LOGIN_URL,
        },
      });
      if (homeRes?.ok) {
        const homeHtml = await homeRes.text();
        const $home = cheerio.load(homeHtml);
        studentFullName =
          $home("#PageHeader1_lblUserFullName").text().trim() ||
          $home("span[id*='lblUserFullName']").text().trim();
      }
    } catch {
      // Ignore home fetch error
    }
  }

  if (hasSignInCookie || postRes.status === 302 || studentFullName) {
    let studentId = username;
    let studentName = studentFullName || username;
    const parenMatch = studentFullName.match(/^(.*?)\s*\((.*?)\)$/);
    if (parenMatch) {
      studentName = parenMatch[1].trim();
      studentId = parenMatch[2].trim();
    }

    return {
      success: true,
      cookie: finalCookie,
      studentInfo: `${studentId} - ${studentName}`,
      studentId,
      studentName,
    };
  }

  return {
    success: false,
    errorMessage: errorText || "Tên đăng nhập hoặc mật khẩu không chính xác.",
  };
}

export const DEFAULT_SEMESTERS = [
  { id: "45584e93d80340daa51ff2d2d83c59bd", name: "1_2026_2027", selected: true },
  { id: "40dfa224e67c40a1b07880473085873e", name: "3_2025_2026", selected: false },
  { id: "e2cfff3ec6ae4fae9e5383b250f8e3cb", name: "2_2025_2026", selected: false },
  { id: "c6e4c6b836db402d89ee0b79d4c2eb92", name: "1_2025_2026", selected: false },
  { id: "185fff76e5fc4094ad907abadf8e2c92", name: "2_2024_2025", selected: false },
  { id: "d3320f14e08b4763bcd2a360a07bd0cd", name: "1_2024_2025", selected: false },
];

export const EMPTY_TIMETABLE_DATA: ParsedTimetable = {
  studentInfo: "",
  studentId: "",
  studentName: "",
  studentMajor: "",
  semesterName: "Học kỳ 1 Năm học 2026_2027 Đợt học 1",
  semesterYear: "2026_2027",
  semesterTerm: "1",
  semesters: DEFAULT_SEMESTERS,
  totalCredits: 0,
  courses: [],
};

export async function fetchTimetableFromPortal(
  cookie: string | undefined,
  semesterId?: string,
): Promise<{ isLive: boolean; data: ParsedTimetable }> {
  if (!cookie) {
    return { isLive: false, data: EMPTY_TIMETABLE_DATA };
  }

  const headers = {
    "User-Agent": DEFAULT_USER_AGENT,
    Cookie: cookie,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
    Referer: "http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Home.aspx",
  };

  const getRes = await fetchWithTimeout(QLDT_TIMETABLE_URL, {
    method: "GET",
    headers,
  });

  if (!getRes || !getRes.ok) {
    return { isLive: false, data: EMPTY_TIMETABLE_DATA };
  }

  let html = await getRes.text();

  // If user requested a specific semester and it's not the currently selected one
  if (semesterId) {
    const $get = cheerio.load(html);
    const currentSelected = $get("select#drpSemester option:selected").attr("value");
    
    if (currentSelected !== semesterId) {
      const viewState = $get("input#__VIEWSTATE").val() || "";
      const viewStateGenerator = $get("input#__VIEWSTATEGENERATOR").val() || "";
      const eventValidation = $get("input#__EVENTVALIDATION").val() || "";

      const formData = new URLSearchParams();
      formData.append("__EVENTTARGET", "drpSemester");
      formData.append("__EVENTARGUMENT", "");
      formData.append("__LASTFOCUS", "");
      formData.append("__VIEWSTATE", String(viewState));
      formData.append("__VIEWSTATEGENERATOR", String(viewStateGenerator));
      formData.append("__EVENTVALIDATION", String(eventValidation));
      formData.append("drpSemester", semesterId);

      const postRes = await fetchWithTimeout(QLDT_TIMETABLE_URL, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "http://qldt.actvn.edu.vn",
        },
        body: formData.toString(),
      });

      if (postRes && postRes.ok) {
        html = await postRes.text();
      }
    }
  }

  if (!html.includes("gridRegistered")) {
    return { isLive: false, data: EMPTY_TIMETABLE_DATA };
  }

  try {
    const parsed = parseTimetableHtml(html);
    if (parsed.courses.length > 0) {
      return { isLive: true, data: parsed };
    }
  } catch {
    // Return empty on error
  }

  return { isLive: false, data: EMPTY_TIMETABLE_DATA };
}
