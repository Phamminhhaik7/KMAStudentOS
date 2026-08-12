import os
import requests
import html
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
# pyrefly: ignore [missing-import]
from flask import Flask, jsonify, render_template_string, request

app = Flask(__name__)

# Standard letter to GPA scale map (ACTVN Legend / kma-legend.click standard)
GPA_SCALE = {
    'A+': 4.0,
    'A': 3.8,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.4,
    'C': 2.0,
    'D+': 1.5,
    'D': 1.0,
    'F': 0.0
}

# Detailed credit registry from the user's provided curriculum by Course Code
COURSE_CREDITS_BY_CODE = {
    'CTCTTN2': 8,   # Đồ án tốt nghiệp
    'CTCTTN1': 3,   # Thực tập tốt nghiệp
    'CTKT10.1': 3,  # Học máy và ứng dụng
    'CTCN9': 4,     # Lập trình di động cơ bản
    'CTCN10': 4,    # Lập trình di động nâng cao
    'CTCN12': 3,    # Lập trình nhân Linux
    'CTCN13': 4,    # Phát triển hệ thống IoT
    'CTCN14': 3,    # Thực tập chuyên ngành
    'CTCTHT32': 3,  # Tối ưu phần mềm di động
    'CTCTHT11': 3,  # Hệ điều hành nhúng thời gian thực
    'CTCN18': 3,    # Lập trình game trên thiết bị di động
    'PCT21': 3,     # Xử lý dữ liệu lớn
    'CTKH18': 3,    # CSDL phi quan hệ và ứng dụng
    'CTCN20': 3,    # Điện toán đám mây
    'CTCTKM14': 3,  # Phát triển phần mềm trong thẻ thông minh
    'CTCN22': 3,    # Phát triển phần mềm trên thiết bị thông minh
    'CTKT16': 3,    # Thị giác máy tính
    'CTCN21': 3,    # Ứng dụng mật mã trong phát triển phần mềm
    'ATATKH10': 3,  # Công nghệ phần mềm
    'CTCN2': 3,     # Kiểm thử phần mềm
    'CTCN4': 4,     # Phát triển ứng dụng web
    'PCT26': 3,     # Quản trị dự án phần mềm
    'CTCN6': 3,     # Thực tập cơ sở ngành
    'PCT14': 3,     # Trí tuệ nhân tạo
    'CTCN7': 2,     # Các vấn đề hiện đại về công nghệ phần mềm
    'ATATPM12': 2,  # Cấu trúc dữ liệu và giải thuật nâng cao
    'ATATPM14': 2,  # Công nghệ .NET
    'PCT43': 3,     # Khai phá dữ liệu
    'CTKT8.1': 3,   # Lập trình Python
    'CTKT9': 2,     # Phân tích và trực quan dữ liệu
    'AT1LLLM3': 2,  # Chủ nghĩa xã hội khoa học
    'PCB15': 3,     # Đại số tuyến tính
    'ATCBTT3': 3,   # Đại số tuyến tính (fallback)
    'CBTT1.1': 2,   # Giải tích 1
    'ATCBTT7': 2,   # Giải tích 1 (fallback)
    'B701202': 2,   # Giải tích 2
    'ATCBTT2': 2,   # Giải tích 2 (fallback)
    'ATQGQG1': 8,   # Giáo dục quốc phòng an ninh
    'ATQGTC1': 1,   # Giáo dục thể chất 1
    'ATQGTC2': 1,   # Giáo dục thể chất 2
    'ATQGTC3': 1,   # Giáo dục thể chất 3
    'ATQGTC4': 1,   # Giáo dục thể chất 4
    'AT1LLLM2': 2,  # Kinh tế chính trị Mác - Lênin
    'AT1LLDL1': 2,  # Lịch sử Đảng Cộng sản Việt Nam
    'ATCBNN1': 3,   # Tiếng Anh 1
    'ATCBNN2': 3,   # Tiếng Anh 2
    'ATCBNN6': 4,   # Tiếng Anh 3
    'ATCBTT6': 2,   # Toán rời rạc
    'ATCBTT8': 2,   # Toán xác suất thống kê
    'AT1LLLM1': 3,  # Triết học Mác - Lênin
    'ATLLTH1': 2,   # Tư tưởng Hồ Chí Minh
    'HMCBLH1': 3,   # Vật lý đại cương 1
    'ATCBLH1': 3,   # Vật lý đại cương 1 (fallback)
    'ATLLLM4': 2,   # Khoa học quản lý (môn thay thế)
    'ATLLDL2': 2,   # Kỹ năng mềm
    'ATLLLM6': 2,   # Pháp luật Việt Nam đại cương
    'ATLLLM3': 2,   # Tâm lý học đại cương (môn thay thế)
    'LLLM4': 2,     # Văn hóa Việt Nam
    'CTCBTT7': 2,   # Phương pháp tính
    'CBLH2': 2,     # Vật lý đại cương 2
    'C702102': 2,   # Chuyển đổi số và ứng dụng trí tuệ nhân tạo
    'PCB17': 2,     # Nhập môn công nghệ thông tin
    'CKCTKM1': 3,   # Cấu trúc Dữ liệu và giải thuật
    'ATDVDV1': 2,   # Cơ sở lý thuyết truyền tin
    'ATCTKM3': 2,   # Hệ quản trị cơ sở dữ liệu
    'ATCTHT2': 2,   # Kiến trúc máy tính
    'ATDVKV2': 2,   # Kỹ thuật vi xử lý
    'ATCTHT3': 3,   # Lập trình căn bản
    'CLC1ATCTKM5': 3, # Lập trình hướng đối tượng
    'CTKT5': 3,     # Linux và phần mềm nguồn mở
    'ATCTKM2': 2,   # Lý thuyết cơ sở dữ liệu
    'T04': 3,       # Mạng máy tính
    'PCT7': 3,      # Nguyên lý hệ điều hành
    'C700103': 3,   # Nhập môn an toàn thông tin
    'CTKH11': 2,    # Phân tích, thiết kế hệ thống thông tin
    'ATCTHT6': 3,   # Quản trị mạng máy tính
    'CTKT6.1': 3,   # Thực tập cơ sở
}

# Fallback by Course Name
DEFAULT_CREDITS = {
    'Đồ án tốt nghiệp': 8,
    'Thực tập tốt nghiệp': 3,
    'Học máy và ứng dụng': 3,
    'Lập trình di động cơ bản': 4,
    'Lập trình di động nâng cao': 4,
    'Lập trình nhân Linux': 3,
    'Phát triển hệ thống IoT': 4,
    'Thực tập chuyên ngành': 3,
    'Tối ưu phần mềm di động': 3,
    'Hệ điều hành nhúng thời gian thực': 3,
    'Lập trình game trên thiết bị di động': 3,
    'Xử lý dữ liệu lớn': 3,
    'CSDL phi quan hệ và ứng dụng': 3,
    'Điện toán đám mây': 3,
    'Phát triển phần mềm trong thẻ thông minh': 3,
    'Phát triển phần mềm trên thiết bị thông minh': 3,
    'Thị giác máy tính': 3,
    'Ứng dụng mật mã trong phát triển phần mềm': 3,
    'Công nghệ phần mềm': 3,
    'Kiểm thử phần mềm': 3,
    'Phát triển ứng dụng web': 4,
    'Quản trị dự án phần mềm': 3,
    'Thực tập cơ sở ngành': 3,
    'Trí tuệ nhân tạo': 3,
    'Các vấn đề hiện đại về công nghệ phần mềm': 2,
    'Cấu trúc dữ liệu và giải thuật nâng cao': 2,
    'Công nghệ .NET': 2,
    'Khai phá dữ liệu': 3,
    'Lập trình Python': 3,
    'Phân tích và trực quan dữ liệu': 2,
    'Chủ nghĩa xã hội khoa học': 2,
    'Đại số tuyến tính': 3,
    'Giải tích 1': 2,
    'Giải tích 2': 2,
    'Giáo dục quốc phòng an ninh': 8,
    'Giáo dục thể chất 1': 1,
    'Giáo dục thể chất 2': 1,
    'Giáo dục thể chất 3': 1,
    'Giáo dục thể chất 4': 1,
    'Kinh tế chính trị Mác - Lênin': 2,
    'Lịch sử Đảng Cộng sản Việt Nam': 2,
    'Tiếng Anh 1': 3,
    'Tiếng Anh 2': 3,
    'Tiếng Anh 3': 4,
    'Toán rời rạc': 2,
    'Toán xác suất thống kê': 2,
    'Triết học Mác - Lênin': 3,
    'Triết học Mác-Lênin': 3,
    'Tư tưởng Hồ Chí Minh': 2,
    'Vật lý đại cương 1': 3,
    'Khoa học quản lý (môn thay thế)': 2,
    'Khoa học quản lý': 2,
    'Kỹ năng mềm': 2,
    'Pháp luật Việt Nam đại cương': 2,
    'Tâm lý học đại cương (môn thay thế)': 2,
    'Tâm lý học đại cương': 2,
    'Văn hóa Việt Nam': 2,
    'Phương pháp tính': 2,
    'Vật lý đại cương 2': 2,
    'Chuyển đổi số và ứng dụng trí tuệ nhân tạo': 2,
    'Nhập môn công nghệ thông tin': 2,
    'Cấu trúc Dữ liệu và giải thuật': 3,
    'Cơ sở lý thuyết truyền tin': 2,
    'Hệ quản trị cơ sở dữ liệu': 2,
    'Kiến trúc máy tính': 2,
    'Kỹ thuật vi xử lý': 2,
    'Lập trình căn bản': 3,
    'Lập trình hướng đối tượng': 3,
    'Linux và phần mềm nguồn mở': 3,
    'Lý thuyết cơ sở dữ liệu': 2,
    'Mạng máy tính': 3,
    'Nguyên lý hệ điều hành': 3,
    'Nhập môn an toàn thông tin': 3,
    'Phân tích, thiết kế hệ thống thông tin': 2,
    'Quản trị mạng máy tính': 3,
    'Thực tập cơ sở': 3
}

def clean_name(name):
    if not name:
        return ""
    cleaned = html.unescape(name).lower()
    return " ".join(cleaned.split())

def parse_html_to_json(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Dropdown parser for course codes
    course_name_to_code = {}
    subjects_catalog = []
    subject_select = soup.find('select', id='filter_subject_id')
    if subject_select:
        for option in subject_select.find_all('option'):
            text = option.text.strip()
            if ' - ' in text:
                parts = text.split(' - ', 1)
                code = parts[0].strip()
                name = parts[1].strip()
                course_name_to_code[clean_name(name)] = code
                
                # Estimate credits
                cred = 3 # fallback
                if code in COURSE_CREDITS_BY_CODE:
                    cred = COURSE_CREDITS_BY_CODE[code]
                elif name in DEFAULT_CREDITS:
                    cred = DEFAULT_CREDITS[name]
                
                if not any(s['code'] == code for s in subjects_catalog):
                    subjects_catalog.append({
                        'code': code,
                        'name': name,
                        'credits': cred
                    })
                    
    # Fallback to predefined lists if subjects_catalog is empty
    if not subjects_catalog:
        for name, cred in DEFAULT_CREDITS.items():
            # Find a matching code from COURSE_CREDITS_BY_CODE
            code = ""
            for k, v in COURSE_CREDITS_BY_CODE.items():
                pass # Can be added if needed, but since dropdown is always parsed, it's a safe fallback
            subjects_catalog.append({
                'code': code,
                'name': name,
                'credits': cred
            })
                
    table = soup.find('table', class_=lambda c: c and 'table' in c and 'table-bordered' in c)
    grades = []
    
    if table:
        rows = table.find('tbody').find_all('tr')
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 12:
                continue
                
            try:
                stt = cols[0].text.strip()
                academic_year = cols[2].text.strip()
                term = cols[3].text.strip()
                subject = cols[4].text.strip()
                attempt = cols[5].text.strip()
                tp1 = cols[6].text.strip()
                tp2 = cols[7].text.strip()
                dqt = cols[8].text.strip()
                exam_grade = cols[9].text.strip()
                course_grade = cols[10].text.strip()
                letter_grade = cols[11].text.strip()
                
                code = course_name_to_code.get(clean_name(subject), None)
                
                # Estimate credits
                cred = 3 # fallback
                if code and code in COURSE_CREDITS_BY_CODE:
                    cred = COURSE_CREDITS_BY_CODE[code]
                elif subject in DEFAULT_CREDITS:
                    cred = DEFAULT_CREDITS[subject]
                    
                grades.append({
                    'stt': stt,
                    'year': academic_year,
                    'term': term,
                    'subject': subject,
                    'code': code if code else '',
                    'credits': cred,
                    'attempt': attempt,
                    'tp1': tp1 if tp1 else '-',
                    'tp2': tp2 if tp2 else '-',
                    'dqt': dqt if dqt else '-',
                    'exam': exam_grade if exam_grade else '-',
                    'course': course_grade if course_grade else '-',
                    'letter': letter_grade if letter_grade else '-'
                })
            except Exception:
                pass
                
    return {
        'grades': grades,
        'subjects': subjects_catalog
    }

@app.route('/')
def home():
    # Read client index.html from template string or local file
    try:
        with open('templates/index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
    except FileNotFoundError:
        # Default placeholder HTML just in case
        html_content = "<h1>Web Dashboard UI is initializing...</h1>"
    return render_template_string(html_content)

@app.route('/api/grades', methods=['GET'])
def get_grades():
    # Read custom joomla cookie from request headers
    custom_cookie = request.headers.get('X-Joomla-Cookie')
    custom_ua = request.headers.get('X-User-Agent')
    
    url = "https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/xem-diem-thi.html"
    cookies = {
        'joomla_user_state': 'logged_in',
        'cc70e48ec639b3a206b5458ea23dbecb': ''
    }
    
    
    if custom_cookie:
        custom_cookie = custom_cookie.strip()
        if custom_cookie.lower().startswith('cookie:'):
            custom_cookie = custom_cookie[7:].strip()
            
        import re
        # If it is a 26-character session ID
        if re.match(r'^[a-zA-Z0-9]{26}$', custom_cookie):
            cookies['cc70e48ec639b3a206b5458ea23dbecb'] = custom_cookie
        else:
            # Parse full cookie string
            parsed_cookies = {}
            for item in custom_cookie.split(';'):
                item = item.strip()
                if '=' in item:
                    parts = item.split('=', 1)
                    k = parts[0].strip()
                    v = parts[1].strip()
                    parsed_cookies[k] = v
            if parsed_cookies:
                cookies = parsed_cookies
                if 'joomla_user_state' not in cookies:
                    cookies['joomla_user_state'] = 'logged_in'


    headers = {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
        'cache-control': 'max-age=0',
        'referer': 'https://ktdbcl.actvn.edu.vn/home/gioi-thieu.html',
        'upgrade-insecure-requests': '1',
        # Thay đổi User-Agent thành của Windows Desktop như curl 2 hoặc lấy từ Client dán vào
        'user-agent': custom_ua if custom_ua else 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'
    }
    
    html_content = ""
    is_live = False
    user_info = None
    
    info_url = "https://ktdbcl.actvn.edu.vn/khao-thi/hvsv/thong-tin-tai-khoan.html"
    try:
        res_info = requests.get(info_url, headers=headers, cookies=cookies, timeout=8)
        if res_info.status_code == 200:
            soup_info = BeautifulSoup(res_info.text, 'html.parser')
            main_tag = soup_info.find('main')
            if main_tag:
                strongs = main_tag.find_all('strong')
                if len(strongs) >= 3:
                    user_info = {
                        'name': strongs[0].text.strip(),
                        'id': strongs[1].text.strip(),
                        'email': strongs[2].text.strip()
                    }
    except Exception as e:
        print(f"Lỗi khi crawl user info: {e}")
    
    # Try fetching live grades
    try:
        res = requests.get(url, headers=headers, cookies=cookies, timeout=8)
        if res.status_code == 200 and "Danh sách môn thi của thí sinh" in res.text:
            html_content = res.text
            is_live = True
    except Exception as e:
        print(f"Lỗi khi crawl data: {e}")
        
    # Fallback to local sample.html
    if not html_content and os.path.exists('sample.html'):
        with open('sample.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
            
    if not html_content:
        return jsonify({'error': 'Không tìm thấy nguồn dữ liệu HTML nào!'}), 500
        
    result = parse_html_to_json(html_content)
    
    return jsonify({
        'isLive': is_live,
        'grades': result['grades'],
        'GPA_SCALE': GPA_SCALE,
        'ALL_SUBJECTS_DB': result['subjects'],
        'userInfo': user_info
    })

if __name__ == '__main__':
    # Creating templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    app.run(debug=True, port=5000)
