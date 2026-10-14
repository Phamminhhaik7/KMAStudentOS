import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";
import { GetGradesResponse } from "@workspace/api-zod";
import { GPA_SCALE } from "../lib/gpa-data";
import { SAMPLE_GRADES, SAMPLE_SUBJECTS_CATALOG } from "../lib/sample-data";
import {
  parsePortalHtml,
  parsePortalUserInfo,
  isBadStudentName,
  isBadStudentId,
} from "../lib/parse-portal-html";

const router: IRouter = Router();

// New endpoints of KTDBCL ACTVN portal
const GRADES_URL = "https://ktdbcl.actvn.edu.vn/hvsv.html?view=learnerexams";
const USER_INFO_URL = "https://ktdbcl.actvn.edu.vn/hvsv.html";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10000;

// Current and legacy Joomla session cookie names for ktdbcl.actvn.edu.vn
const CURRENT_COOKIE_NAME = "23782a59952067715128532cfcd568f5";
const LEGACY_COOKIE_NAME = "cc70e48ec639b3a206b5458ea23dbecb";

function buildCookieHeader(rawCookie: string | undefined): string {
  const fallback = "joomla_user_state=logged_in";
  if (!rawCookie) return fallback;

  let cookie = rawCookie.trim();
  if (cookie.toLowerCase().startsWith("cookie:")) {
    cookie = cookie.slice("cookie:".length).trim();
  }

  // Bare session ID (typically 26-32 alphanumeric characters)
  if (/^[a-zA-Z0-9]{24,36}$/.test(cookie)) {
    return `joomla_user_state=logged_in; ${CURRENT_COOKIE_NAME}=${cookie}; ${LEGACY_COOKIE_NAME}=${cookie}`;
  }

  // Already a full "key=value; key2=value2" cookie string.
  if (!cookie.includes("joomla_user_state")) {
    cookie = `joomla_user_state=logged_in; ${cookie}`;
  }
  return cookie;
}

async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

router.get("/grades", async (req: Request, res: ExpressResponse): Promise<void> => {
  const customCookie = req.header("X-Portal-Cookie");
  const customUserAgent = req.header("X-Portal-User-Agent");

  const headers: Record<string, string> = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "vi,en-US;q=0.9,en;q=0.8",
    cookie: buildCookieHeader(customCookie),
    referer: "https://ktdbcl.actvn.edu.vn/hvsv.html",
    "user-agent": customUserAgent || DEFAULT_USER_AGENT,
  };

  let isLive = false;
  let userInfo = null;
  let grades: any[] = [];
  let subjects = SAMPLE_SUBJECTS_CATALOG;

  if (customCookie) {
    const [gradesRes, userInfoRes] = await Promise.all([
      fetchWithTimeout(GRADES_URL, headers),
      fetchWithTimeout(USER_INFO_URL, headers),
    ]);

    if (userInfoRes?.ok) {
      try {
        const infoHtml = await userInfoRes.text();
        userInfo = parsePortalUserInfo(infoHtml);
      } catch (err) {
        req.log?.warn?.({ err }, "Failed to parse portal user info");
      }
    }

    if (gradesRes?.ok) {
      const html = await gradesRes.text();
      // Ensure the student was identified and grades are accessible
      if (
        html.includes("Danh sách môn thi của thí sinh") &&
        !html.includes("Không xác định được thí sinh") &&
        !html.includes("Hãy đăng nhập")
      ) {
        try {
          const parsed = parsePortalHtml(html);
          if (parsed.grades.length > 0) {
            grades = parsed.grades;
            subjects = parsed.subjects.length > 0 ? parsed.subjects : subjects;
            isLive = true;
          }
        } catch (err) {
          req.log?.error?.({ err }, "Failed to parse live portal grades HTML");
        }

        // Also extract or refine userInfo from the grades page HTML
        try {
          const userFromGrades = parsePortalUserInfo(html);
          if (userFromGrades) {
            if (!userInfo) {
              userInfo = userFromGrades;
            } else {
              if (
                (!userInfo.name || isBadStudentName(userInfo.name)) &&
                userFromGrades.name &&
                !isBadStudentName(userFromGrades.name)
              ) {
                userInfo.name = userFromGrades.name;
              }
              if (
                (!userInfo.id || isBadStudentId(userInfo.id)) &&
                userFromGrades.id &&
                !isBadStudentId(userFromGrades.id)
              ) {
                userInfo.id = userFromGrades.id;
              }
              if (!userInfo.email && userFromGrades.email) {
                userInfo.email = userFromGrades.email;
              }
            }
          }
        } catch (err) {
          req.log?.warn?.({ err }, "Failed to refine user info from grades HTML");
        }
      }
    } else {
      req.log?.info?.(
        { status: gradesRes?.status },
        "Live portal grades fetch did not succeed, falling back to sample data",
      );
    }
  }

  const data = GetGradesResponse.parse({
    isLive,
    grades,
    subjects,
    gpaScale: GPA_SCALE,
    userInfo,
  });

  res.json(data);
});

export default router;
