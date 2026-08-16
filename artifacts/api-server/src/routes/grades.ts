import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";
import { GetGradesResponse } from "@workspace/api-zod";
import { GPA_SCALE } from "../lib/gpa-data";
import { SAMPLE_GRADES, SAMPLE_SUBJECTS_CATALOG } from "../lib/sample-data";
import { parsePortalHtml, parsePortalUserInfo } from "../lib/parse-portal-html";

const router: IRouter = Router();

const GRADES_URL = "https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html";
const USER_INFO_URL = "https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/thong-tin-tai-khoan.html";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 8000;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9]{26}$/;

function buildCookieHeader(rawCookie: string | undefined): string {
  const fallback = "joomla_user_state=logged_in";
  if (!rawCookie) return fallback;

  let cookie = rawCookie.trim();
  if (cookie.toLowerCase().startsWith("cookie:")) {
    cookie = cookie.slice("cookie:".length).trim();
  }

  if (SESSION_ID_PATTERN.test(cookie)) {
    return `joomla_user_state=logged_in; cc70e48ec639b3a206b5458ea23dbecb=${cookie}`;
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
    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
    cookie: buildCookieHeader(customCookie),
    referer: "https://ktdbcl.actvn.edu.vn/home/gioi-thieu.html",
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
        userInfo = parsePortalUserInfo(await userInfoRes.text());
      } catch (err) {
        req.log.warn({ err }, "Failed to parse portal user info");
      }
    }

    if (gradesRes?.ok) {
      const html = await gradesRes.text();
      if (html.includes("Danh sách môn thi của thí sinh")) {
        try {
          const parsed = parsePortalHtml(html);
          if (parsed.grades.length > 0) {
            grades = parsed.grades;
            subjects = parsed.subjects.length > 0 ? parsed.subjects : subjects;
            isLive = true;
          }
        } catch (err) {
          req.log.error({ err }, "Failed to parse live portal grades HTML");
        }
      }
    } else {
      req.log.info(
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
