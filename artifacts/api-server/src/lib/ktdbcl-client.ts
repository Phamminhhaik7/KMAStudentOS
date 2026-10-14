import * as cheerio from "cheerio";
import { parsePortalUserInfo } from "./parse-portal-html";

const KTDBCL_LOGIN_PAGE_URL = "https://ktdbcl.actvn.edu.vn/dang-nhap.html";
const KTDBCL_LOGIN_ACTION_URL = "https://ktdbcl.actvn.edu.vn/dang-nhap.html?task=user.login";
const KTDBCL_STUDENT_INFO_URL = "https://ktdbcl.actvn.edu.vn/hvsv.html";
const KTDBCL_EXAMS_URL = "https://ktdbcl.actvn.edu.vn/hvsv.html?view=learnerexams";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10000;

export function mergeCookies(existingCookie: string, setCookieHeaders: string[]): string {
  const cookieMap = new Map<string, string>();

  if (existingCookie) {
    existingCookie.split(";").forEach((part) => {
      const eq = part.indexOf("=");
      if (eq !== -1) {
        cookieMap.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
      }
    });
  }

  for (const header of setCookieHeaders) {
    const mainPart = header.split(";")[0] ?? "";
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

export interface KtdbclLoginResult {
  success: boolean;
  cookie?: string;
  studentInfo?: string;
  studentId?: string;
  studentName?: string;
  errorMessage?: string;
}

export async function loginKtdbcl(username: string, password: string): Promise<KtdbclLoginResult> {
  try {
    // Step 1: GET login page to obtain CSRF token and initial session cookie
    const getRes = await fetchWithTimeout(KTDBCL_LOGIN_PAGE_URL, {
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
        errorMessage: "Không thể kết nối đến Cổng Khảo thí ACTVN (ktdbcl.actvn.edu.vn). Vui lòng thử lại sau.",
      };
    }

    const initialSetCookies = getRes.headers.getSetCookie();
    const sessionCookie = mergeCookies("", initialSetCookies);
    const getHtml = await getRes.text();
    const $get = cheerio.load(getHtml);

    // Find CSRF token (32 hex characters with value="1")
    let csrfToken = "";
    $get("input[type=hidden]").each((_, el) => {
      const name = $get(el).attr("name") || "";
      const val = $get(el).attr("value") || "";
      if (val === "1" && /^[a-f0-9]{32}$/i.test(name)) {
        csrfToken = name;
      }
    });

    const returnUrl = $get("input[name=return]").val() || "MTA0";

    const formData = new URLSearchParams();
    formData.set("username", username.trim());
    formData.set("password", password);
    formData.set("return", String(returnUrl));
    formData.set("remember", "yes");
    if (csrfToken) {
      formData.set(csrfToken, "1");
    }

    // Step 2: POST credentials to Joomla login action
    const postRes = await fetchWithTimeout(KTDBCL_LOGIN_ACTION_URL, {
      method: "POST",
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookie,
        Origin: "https://ktdbcl.actvn.edu.vn",
        Referer: KTDBCL_LOGIN_PAGE_URL,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
      },
      body: formData.toString(),
      redirect: "manual",
    });

    if (!postRes) {
      return {
        success: false,
        errorMessage: "Không thể gửi yêu cầu đăng nhập tới Cổng Khảo thí.",
      };
    }

    const postSetCookies = postRes.headers.getSetCookie();
    let currentCookie = mergeCookies(sessionCookie, postSetCookies);
    if (!currentCookie.includes("joomla_user_state")) {
      currentCookie = `joomla_user_state=logged_in; ${currentCookie}`;
    }

    // Follow redirect if given
    const location = postRes.headers.get("location");
    let checkHtml = "";
    if (location) {
      const redirectUrl = new URL(location, "https://ktdbcl.actvn.edu.vn").href;
      const followRes = await fetchWithTimeout(redirectUrl, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Cookie: currentCookie,
          Referer: KTDBCL_LOGIN_PAGE_URL,
        },
      });
      if (followRes) {
        currentCookie = mergeCookies(currentCookie, followRes.headers.getSetCookie());
        checkHtml = await followRes.text();
      }
    } else {
      checkHtml = await postRes.text();
    }

    // Check for error alerts
    if (checkHtml) {
      const $check = cheerio.load(checkHtml);
      const errorAlert = $check(".alert-danger, .alert-warning").text().trim();
      if (
        errorAlert.includes("không phù hợp") ||
        errorAlert.includes("không đúng") ||
        errorAlert.includes("không chính xác") ||
        errorAlert.includes("Tên đăng nhập và mật khẩu")
      ) {
        return {
          success: false,
          errorMessage: errorAlert || "Tên đăng nhập hoặc mật khẩu không chính xác.",
        };
      }
    }

    // Step 3: Verify login by fetching the student portal info page
    const studentInfoRes = await fetchWithTimeout(KTDBCL_STUDENT_INFO_URL, {
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Cookie: currentCookie,
        Referer: KTDBCL_LOGIN_PAGE_URL,
      },
    });

    let studentName = username;
    let studentId = username;
    let studentInfo = username;

    if (studentInfoRes?.ok) {
      const infoHtml = await studentInfoRes.text();
      // If it says "Hãy đăng nhập để sử dụng Cổng HVSV", login was not successful
      if (infoHtml.includes("Hãy đăng nhập để sử dụng Cổng HVSV")) {
        return {
          success: false,
          errorMessage: "Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.",
        };
      }

      const parsedUser = parsePortalUserInfo(infoHtml);
      if (parsedUser) {
        studentId = parsedUser.id || username;
        studentName = parsedUser.name || username;
        studentInfo = `${studentId} - ${studentName}`;
      }
    }

    return {
      success: true,
      cookie: currentCookie,
      studentInfo,
      studentId,
      studentName,
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || "Đã xảy ra lỗi không xác định trong quá trình đăng nhập.",
    };
  }
}
