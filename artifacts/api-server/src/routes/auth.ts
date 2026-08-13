import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";
import { ExchangeMicrosoftCodeBody, ExchangeMicrosoftCodeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const FINISH_LOGIN_URL =
  "https://ktdbcl.actvn.edu.vn/index.php/aksociallogin_finishLogin/microsoft.raw";
const FETCH_TIMEOUT_MS = 10000;

function extractCode(redirectUrl: string): string | null {
  try {
    const url = new URL(redirectUrl);
    // response_mode=fragment returns the code after a "#", which the
    // browser never sends to a server — it only exists in the pasted URL
    // text. Check the query string first, then fall back to the hash.
    const fromQuery = url.searchParams.get("code");
    if (fromQuery) return fromQuery;

    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
    return hashParams.get("code");
  } catch {
    // Not a well-formed absolute URL — the user may have pasted just the
    // query/fragment fragment (e.g. "code=...&session_state=..."). Recover
    // a `code=` param from it; otherwise this isn't usable input.
    const match = redirectUrl.match(/(?:^|[?&#])code=([^&\s]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

/**
 * Merges the portal's Set-Cookie headers, keeping the LAST value for any
 * duplicate cookie name. This is required because Joomla's aksociallogin
 * plugin creates a throw-away session, destroys it, then creates the real
 * one — emitting two Set-Cookie headers with the same name. Naively joining
 * them (first value wins in most cookie jars) sends the dead session and
 * the portal reports the visitor as not logged in.
 */
function resolveSetCookies(setCookieHeaders: string[]): string {
  const cookieMap = new Map<string, string>();

  for (const cookieString of setCookieHeaders) {
    const pair = cookieString.split(";")[0] ?? "";
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;

    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (key) cookieMap.set(key, value);
  }

  return Array.from(cookieMap.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

router.post(
  "/auth/microsoft-exchange",
  async (req: Request, res: ExpressResponse): Promise<void> => {
    const body = ExchangeMicrosoftCodeBody.parse(req.body);
    const code = extractCode(body.redirectUrl);

    if (!code) {
      res.status(400).json({
        error: "Không tìm thấy tham số 'code' trong đường dẫn đã dán.",
      });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${FINISH_LOGIN_URL}?code=${encodeURIComponent(code)}`, {
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to reach ACTVN portal for Microsoft code exchange");
      res.status(502).json({
        error: "Không thể kết nối tới cổng thông tin ACTVN. Vui lòng thử lại.",
      });
      return;
    } finally {
      clearTimeout(timeout);
    }

    const setCookieHeaders = response.headers.getSetCookie();
    const cookie = resolveSetCookies(setCookieHeaders);

    if (!cookie) {
      req.log.warn(
        { status: response.status },
        "ACTVN portal did not return any Set-Cookie headers for the Microsoft code",
      );
      res.status(502).json({
        error:
          "Mã đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại và dán đường dẫn mới.",
      });
      return;
    }

    const data = ExchangeMicrosoftCodeResponse.parse({ cookie });
    res.json(data);
  },
);

export default router;
