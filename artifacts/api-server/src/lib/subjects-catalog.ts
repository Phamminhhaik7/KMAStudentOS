import { resolveCredits } from "./gpa-data";

/** code -> Vietnamese course name, ported from the curriculum comments. */
const CODE_TO_NAME: Record<string, string> = {
  CTCTTN2: "Đồ án tốt nghiệp",
  CTCTTN1: "Thực tập tốt nghiệp",
  "CTKT10.1": "Học máy và ứng dụng",
  CTCN9: "Lập trình di động cơ bản",
  CTCN10: "Lập trình di động nâng cao",
  CTCN12: "Lập trình nhân Linux",
  CTCN13: "Phát triển hệ thống IoT",
  CTCN14: "Thực tập chuyên ngành",
  CTCTHT32: "Tối ưu phần mềm di động",
  CTCTHT11: "Hệ điều hành nhúng thời gian thực",
  CTCN18: "Lập trình game trên thiết bị di động",
  PCT21: "Xử lý dữ liệu lớn",
  CTKH18: "CSDL phi quan hệ và ứng dụng",
  CTCN20: "Điện toán đám mây",
  CTCTKM14: "Phát triển phần mềm trong thẻ thông minh",
  CTCN22: "Phát triển phần mềm trên thiết bị thông minh",
  CTKT16: "Thị giác máy tính",
  CTCN21: "Ứng dụng mật mã trong phát triển phần mềm",
  ATATKH10: "Công nghệ phần mềm",
  CTCN2: "Kiểm thử phần mềm",
  CTCN4: "Phát triển ứng dụng web",
  PCT26: "Quản trị dự án phần mềm",
  CTCN6: "Thực tập cơ sở ngành",
  PCT14: "Trí tuệ nhân tạo",
  CTCN7: "Các vấn đề hiện đại về công nghệ phần mềm",
  ATATPM12: "Cấu trúc dữ liệu và giải thuật nâng cao",
  ATATPM14: "Công nghệ .NET",
  PCT43: "Khai phá dữ liệu",
  "CTKT8.1": "Lập trình Python",
  CTKT9: "Phân tích và trực quan dữ liệu",
  AT1LLLM3: "Chủ nghĩa xã hội khoa học",
  PCB15: "Đại số tuyến tính",
  "CBTT1.1": "Giải tích 1",
  B701202: "Giải tích 2",
  ATQGQG1: "Giáo dục quốc phòng an ninh",
  ATQGTC1: "Giáo dục thể chất 1",
  ATQGTC2: "Giáo dục thể chất 2",
  ATQGTC3: "Giáo dục thể chất 3",
  ATQGTC4: "Giáo dục thể chất 4",
  AT1LLLM2: "Kinh tế chính trị Mác - Lênin",
  AT1LLDL1: "Lịch sử Đảng Cộng sản Việt Nam",
  ATCBNN1: "Tiếng Anh 1",
  ATCBNN2: "Tiếng Anh 2",
  ATCBNN6: "Tiếng Anh 3",
  ATCBTT6: "Toán rời rạc",
  ATCBTT8: "Toán xác suất thống kê",
  AT1LLLM1: "Triết học Mác-Lênin",
  ATLLTH1: "Tư tưởng Hồ Chí Minh",
  HMCBLH1: "Vật lý đại cương 1",
  ATLLLM4: "Khoa học quản lý (môn thay thế)",
  ATLLDL2: "Kỹ năng mềm",
  ATLLLM6: "Pháp luật Việt Nam đại cương",
  ATLLLM3: "Tâm lý học đại cương (môn thay thế)",
  LLLM4: "Văn hóa Việt Nam",
  CTCBTT7: "Phương pháp tính",
  CBLH2: "Vật lý đại cương 2",
  C702102: "Chuyển đổi số và ứng dụng trí tuệ nhân tạo",
  PCB17: "Nhập môn công nghệ thông tin",
  CKCTKM1: "Cấu trúc Dữ liệu và giải thuật",
  ATDVDV1: "Cơ sở lý thuyết truyền tin",
  ATCTKM3: "Hệ quản trị cơ sở dữ liệu",
  ATCTHT2: "Kiến trúc máy tính",
  ATDVKV2: "Kỹ thuật vi xử lý",
  ATCTHT3: "Lập trình căn bản",
  CLC1ATCTKM5: "Lập trình hướng đối tượng",
  CTKT5: "Linux và phần mềm nguồn mở",
  ATCTKM2: "Lý thuyết cơ sở dữ liệu",
  T04: "Mạng máy tính",
  PCT7: "Nguyên lý hệ điều hành",
  C700103: "Nhập môn an toàn thông tin",
  CTKH11: "Phân tích, thiết kế hệ thống thông tin",
  ATCTHT6: "Quản trị mạng máy tính",
  "CTKT6.1": "Thực tập cơ sở",
};

export interface CatalogSubject {
  code: string;
  name: string;
  credits: number;
}

/**
 * Fallback subject catalog built from the curriculum reference data, used
 * for the "add planned subject" autocomplete when no live portal HTML
 * (with its `<select id="filter_subject_id">` dropdown) is available.
 */
export const FALLBACK_SUBJECTS_CATALOG: CatalogSubject[] = Object.entries(CODE_TO_NAME).map(
  ([code, name]) => ({
    code,
    name,
    credits: resolveCredits(code, name),
  }),
);
