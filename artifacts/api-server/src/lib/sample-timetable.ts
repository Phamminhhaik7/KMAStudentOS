import { parseTimetableHtml, type ParsedTimetable } from "./parse-timetable-html";

export const SAMPLE_TIMETABLE_HTML = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" >
<HTML>
	<HEAD>
		<title>.: Thời khóa biểu sinh viên :.</title>
	</HEAD>
	<body>
		<form method="post" action="./StudentTimeTable.aspx" id="Form1">
			<div id="header">
				<span id="lblStudent">CT100127 - PHẠM MINH HẢI - Ngành Công nghệ thông tin</span>
				<span id="lblSemester">Học kỳ 1 Năm học 2026_2027 Đợt học 1</span>
			</div>
			<select name="drpSemester" id="drpSemester">
				<option selected="selected" value="45584e93d80340daa51ff2d2d83c59bd">1_2026_2027</option>
				<option value="40dfa224e67c40a1b07880473085873e">3_2025_2026</option>
				<option value="e2cfff3ec6ae4fae9e5383b250f8e3cb">2_2025_2026</option>
				<option value="c6e4c6b836db402d89ee0b79d4c2eb92">1_2025_2026</option>
				<option value="185fff76e5fc4094ad907abadf8e2c92">2_2024_2025</option>
				<option value="d3320f14e08b4763bcd2a360a07bd0cd">1_2024_2025</option>
			</select>
			<table id="gridRegistered">
				<tr class="DataGridFixedHeader">
					<td>STT</td><td>Lớp học phần</td><td>Học phần</td><td>Thời gian</td><td>Địa điểm</td><td>Giảng viên</td><td>Sĩ số</td><td>Số ĐK</td><td>Số TC</td><td>Học phí</td><td>Ghi chú</td>
				</tr>
				<tr class="cssListItem">
					<td>1</td><td>Cơ sở lý thuyết truyền tin-1-26 (A22C10D903)</td><td>ATDVDV1</td>
					<td>Từ 26/10/2026 đến 15/11/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 1,2,3 (LT)</b><br>Từ 23/11/2026 đến 13/12/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 1,2,3 (LT)</b><br>Từ 14/12/2026 đến 20/12/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 1,2,3 (LT)</b><br>Từ 21/12/2026 đến 27/12/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 1,2,3 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Phạm Thị Thúy An</td><td>80</td><td>77</td><td>2</td><td></td><td></td>
				</tr>
				<tr class="cssListAlternativeItem">
					<td>2</td><td>Giáo dục thể chất 3-1-26 (A22C10D903)</td><td>ATQGTC3</td>
					<td>Từ 10/08/2026 đến 30/08/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 7,8,9 (LT)</b><br>Từ 31/08/2026 đến 06/09/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 7,8,9 (LT)</b><br>Từ 07/09/2026 đến 04/10/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 7,8,9 (LT)</b><br>Từ 05/10/2026 đến 11/10/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 7,8,9 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 7,8,9 (LT)</b></td>
					<td>Sân thể chất KMA</td><td>Lê Đình Huynh</td><td>50</td><td>51</td><td>1</td><td></td><td></td>
				</tr>
				<tr class="cssListItem">
					<td>3</td><td>Kỹ thuật vi xử lý-1-26 (A22C1003)</td><td>ATDVKV2</td>
					<td>Từ 10/08/2026 đến 30/08/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 4,5,6 (LT)</b><br>Từ 31/08/2026 đến 06/09/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 4,5,6 (LT)</b><br>Từ 07/09/2026 đến 20/09/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 4,5,6 (LT)</b><br>Từ 21/09/2026 đến 11/10/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 4,5,6 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 4,5,6 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Chu Thị Ngọc Quỳnh</td><td>80</td><td>81</td><td>2</td><td></td><td></td>
				</tr>
				<tr class="cssListAlternativeItem">
					<td>4</td><td>Lịch sử Đảng Cộng sản Việt Nam-1-26 (A22C10D903)</td><td>AT1LLDL1</td>
					<td>Từ 26/10/2026 đến 15/11/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>Từ 16/11/2026 đến 22/11/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>Từ 23/11/2026 đến 13/12/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>Từ 14/12/2026 đến 27/12/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 4,5,6 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Nguyễn Thị Hồng Phương</td><td>80</td><td>81</td><td>2</td><td></td><td></td>
				</tr>
				<tr class="cssListItem">
					<td>5</td><td>Lý thuyết cơ sở dữ liệu-1-26 (A22C1003)</td><td>ATCTKM2</td>
					<td>Từ 26/10/2026 đến 15/11/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 1,2,3 (LT)</b><br>Từ 16/11/2026 đến 22/11/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 1,2,3 (LT)</b><br>Từ 23/11/2026 đến 06/12/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 1,2,3 (LT)</b><br>Từ 07/12/2026 đến 13/12/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 1,2,3 (LT)</b><br>Từ 14/12/2026 đến 27/12/2026: (5)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 1,2,3 (LT)</b></td>
					<td>302-TA1 TA1- 8T-HN</td><td>Bùi Thị Như (GVM)</td><td>80</td><td>64</td><td>2</td><td></td><td></td>
				</tr>
				<tr class="cssListAlternativeItem">
					<td>6</td><td>Mạng máy tính-1-26 (A22C10D903)</td><td>T04</td>
					<td>Từ 26/10/2026 đến 15/11/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b><br>Từ 16/11/2026 đến 22/11/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b><br>Từ 23/11/2026 đến 06/12/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b><br>Từ 07/12/2026 đến 27/12/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 1,2,3 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Giảng viên mời</td><td>80</td><td>68</td><td>3</td><td></td><td></td>
				</tr>
				<tr class="cssListItem">
					<td>7</td><td>Tiếng Anh 1-1-26 (A22C10D910)</td><td>ATCBNN1</td>
					<td>Từ 26/10/2026 đến 08/11/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 7,8,9 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 7,8,9 (LT)</b><br>Từ 09/11/2026 đến 15/11/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 7,8,9 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 7,8,9 (LT)</b><br>Từ 16/11/2026 đến 22/11/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 7,8,9 (LT)</b><br>Từ 23/11/2026 đến 27/12/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 7,8,9 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 6 tiết 7,8,9 (LT)</b></td>
					<td>203-TA1 TA1- 8T-HN</td><td>Nguyễn Thị Huyền Trang</td><td>50</td><td>16</td><td>3</td><td></td><td></td>
				</tr>
				<tr class="cssListAlternativeItem">
					<td>8</td><td>Toán xác suất thống kê-1-26 (A22C10D903)</td><td>ATCBTT8</td>
					<td>Từ 10/08/2026 đến 30/08/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b><br>Từ 31/08/2026 đến 06/09/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b><br>Từ 07/09/2026 đến 27/09/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b><br>Từ 28/09/2026 đến 11/10/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 1,2,3 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 1,2,3 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Bùi Thị Giang</td><td>80</td><td>69</td><td>2</td><td></td><td></td>
				</tr>
				<tr class="cssListItem">
					<td>9</td><td>Tư tưởng Hồ Chí Minh-1-26 (A22C10D903)</td><td>ATLLTH1</td>
					<td>Từ 10/08/2026 đến 23/08/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 4,5,6 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 4,5,6 (LT)</b><br>Từ 24/08/2026 đến 30/08/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 3 tiết 4,5,6 (LT)</b><br>Từ 31/08/2026 đến 06/09/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 4,5,6 (LT)</b><br>Từ 07/09/2026 đến 11/10/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 5 tiết 4,5,6 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Hoàng Thị Tuyết</td><td>80</td><td>81</td><td>2</td><td></td><td></td>
				</tr>
				<tr class="cssListAlternativeItem">
					<td>10</td><td>Vật lý đại cương 2-1-26 (A22C10D903)</td><td>CBLH2</td>
					<td>Từ 10/08/2026 đến 23/08/2026: (1)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 4,5,6 (LT)</b><br>Từ 24/08/2026 đến 30/08/2026: (2)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>Từ 07/09/2026 đến 27/09/2026: (3)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 4,5,6 (LT)</b><br>Từ 28/09/2026 đến 11/10/2026: (4)<br>&nbsp;&nbsp;&nbsp;<b>Thứ 2 tiết 4,5,6 (LT)</b><br>&nbsp;&nbsp;&nbsp;<b>Thứ 4 tiết 4,5,6 (LT)</b></td>
					<td>402-TA1 TA1- 8T-HN</td><td>Dương Thị Hồng Gấm</td><td>80</td><td>70</td><td>2</td><td></td><td></td>
				</tr>
			</table>
		</form>
	</body>
</HTML>`;

export const SAMPLE_TIMETABLE_DATA: ParsedTimetable = parseTimetableHtml(SAMPLE_TIMETABLE_HTML);
