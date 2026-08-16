import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";
import { GetTimetableResponse, LoginQldtBody, LoginQldtResponse } from "@workspace/api-zod";
import { loginQldt, fetchTimetableFromPortal } from "../lib/qldt-client";

const router: IRouter = Router();

router.post("/timetable/login", async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const body = LoginQldtBody.parse(req.body);
    const result = await loginQldt(body.username, body.password);

    if (!result.success || !result.cookie) {
      res.status(401).json({
        error: result.errorMessage || "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.",
      });
      return;
    }

    const data = LoginQldtResponse.parse({
      cookie: result.cookie,
      studentInfo: result.studentInfo || `${body.username}`,
      studentId: result.studentId || body.username,
      studentName: result.studentName || body.username,
    });

    res.json(data);
  } catch (err) {
    req.log?.error?.({ err }, "Error during QLĐT login");
    res.status(500).json({ error: "Lỗi xử lý đăng nhập QLĐT." });
  }
});

router.get("/timetable", async (req: Request, res: ExpressResponse): Promise<void> => {
  try {
    const customCookie = req.header("X-Qldt-Cookie");
    const semester = typeof req.query.semester === "string" ? req.query.semester : undefined;

    const { isLive, data } = await fetchTimetableFromPortal(customCookie, semester);

    const response = GetTimetableResponse.parse({
      isLive,
      studentInfo: data.studentInfo,
      studentId: data.studentId,
      studentName: data.studentName,
      studentMajor: data.studentMajor,
      semesterName: data.semesterName,
      semesterYear: data.semesterYear,
      semesterTerm: data.semesterTerm,
      semesters: data.semesters,
      totalCredits: data.totalCredits,
      courses: data.courses,
    });

    res.json(response);
  } catch (err) {
    req.log?.error?.({ err }, "Error fetching timetable");
    res.status(500).json({ error: "Không thể lấy dữ liệu thời khóa biểu." });
  }
});

export default router;
