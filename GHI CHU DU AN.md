# GHI CHÚ DỰ ÁN — myDocument

## Chặng 1 — 04/10/2026 — Dựng kho myDocument + đưa video đầu tiên vào

**Bối cảnh:** thầy vừa có video hoạt hình "Why are bones hard and muscles soft?" (làm ở `D:\OTHERS\CLAUDE\BonesMuscles Video`)
và muốn một nơi lưu các video loại này để gắn vào trang bài tập của nhiều lớp. Thầy chốt: tên **myDocument** (không chỉ video mà còn slide HTML,
nội dung tương tác HTML…), chia nhiều thư mục theo nội dung, subdomain **document.andrewclasses.com**; **chưa** làm ô chọn trong app, chỉ "mở đường" tích hợp.

**Quyết định:**
- Mô hình giống `audio-kho` (repo riêng, Pages): kho tách khỏi `myLesson` vì giới hạn ~1 GB/Pages, link bất biến, mọi lớp dùng chung 1 bản.
- ID = đường dẫn `<loai>/<nhom>/<ma>` (nhóm tuỳ chọn). Loại: video / slide / tuong-tac / bai-doc (khai ở `loai.json`, thêm loại mới không cần sửa code).
- Danh mục `documents.json` **sinh từ meta.json** (không có nguồn sự thật thứ hai) + validate ⇒ thêm tài liệu = chép thư mục + chạy 1 lệnh.
- "Mở đường tích hợp" = hợp đồng viết sẵn (`TICH HOP.md`): ID bất biến, link suy từ ID + `goc`, `?nhung=1`, `postMessage` 2 chiều. App sau này chỉ lưu ID.
- Mọi tài liệu tự đủ (không phụ thuộc `_chung` để chạy); `_chung/nhung.js` chỉ thêm phần nhắn tin.
- Chặn Google lập chỉ mục (`robots.txt` + meta noindex).

**Đã làm & kiểm:**
- Khung repo (local, `git init -b main`, **chưa commit, chưa push**), `CNAME`, `.nojekyll`, `.gitattributes`.
- `tools/build-catalog.js` (đã thử: dựng đúng, báo lỗi tên sai/trùng/thiếu tệp), `tools/tao.js` (đã thử tạo + từ chối trùng/tên sai, mục thử đã xoá).
- `index.html` danh mục: đã mở qua máy chủ cục bộ, hiện thẻ video, lọc/tìm, **Xem thử** mở khung nhúng.
- Video chép vào `video/khoa-hoc/bones-muscles/`, thêm: chế độ `?nhung=1` (ẩn nhãn thương hiệu), tuỳ chọn `?t ?cc ?voice ?toc`
  (đã thử đủ 4), sự kiện `ready/chapter/play/pause/progress/ended` (đã thử ready + chapter), lệnh `seek/chuong/play/pause` từ trang mẹ (đã thử seek + chuong).
- Chưa thử được `progress/ended` ở thời gian thực (pane xem trước dừng rAF khi ẩn) — logic gọn, nhưng nên thử khi thầy xem thật.

**Kiến thức mang theo từ BonesMuscles Video (đã chuyển từ hồ sơ cũ):**
- Động cơ video: mọi hiệu ứng là Web Animation tạm dừng, `currentTime` do đồng hồ chính đặt mỗi khung ⇒ tua/dừng/tốc độ chính xác.
- Cú pháp `data-fx="tên@khi/thời_lượng"`; preset *ra* (`fo`, `dim`, `undim`) dùng `fill:forwards` và khai báo SAU preset vào; không đặt `transform` thuộc tính
  lên phần tử có `data-fx` (bọc 2 lớp bằng `G()`).
- Cánh tay (rig) + cơ nhị đầu: độ dày = hằng số / chiều dài ⇒ ngắn lại thì dày ra là hệ quả hình học.
- Thời lượng câu thoại = số từ/2.2 + 0.9 s; cần chỉnh nếu giọng máy thật nhanh/chậm khác nhiều.
- Pane xem trước Claude: ảnh chụp lần đầu hay timeout; ảnh sau có thể bị phóng to 1,6× (lỗi công cụ, trang đúng).

**VIỆC ĐANG CHỜ**
- ✅ (xong ở Chặng 2) repo, push, DNS, Pages, HTTPS — xem dưới.
- ⬜ Thử video thật trên máy lớp/TOMKO: tiếng, toàn màn hình trong iframe, tốc độ lời so với hình.
- ⬜ Chưa có: poster cho video, slide mẫu, tương tác mẫu, tích hợp myLesson (`taiLieu[]`), phụ đề tiếng Việt, xuất MP4.

## Chặng 2 — 04/10/2026 — Đưa lên mạng (GitHub + DNS + Pages + HTTPS)

Thầy duyệt; làm cùng ngày với Chặng 1.
- **Repo:** `andrewclasses-01/myDocument`, **CÔNG KHAI** (kiểm `myLesson` cũng công khai; Pages repo riêng tư cần gói Enterprise nên cả cụm app đều để công khai).
  Tạo qua giao diện github.com (Chrome đã đăng nhập andrewclasses-01 — `gh` trên máy là tài khoản khác). `git remote add origin …` + `git push -u origin main` (credential andrewclasses-01) chạy thẳng.
- **DNS** (portal.inet.vn → OneShield → Bản ghi DNS): thêm CNAME `document` → `andrewclasses-01.github.io`, TTL 5 phút, bảo vệ TẮT (cùng nếp `aword`, `speaking`, `kiemtra`, `nentangtienganh`). Phân giải ra 4 IP GitHub Pages trong vài chục giây.
- **Pages:** nguồn `main` / `(root)`; GitHub tự đọc `CNAME` làm tên miền tuỳ chỉnh; DNS check thành công; cấp chứng chỉ ngay; đã tick **Enforce HTTPS** (HTTP → 301 → HTTPS).
- **Kiểm live:** `https://document.andrewclasses.com/` hiện danh mục; `documents.json` 200 + `Access-Control-Allow-Origin: *` + `Cache-Control: max-age=600`; video `?nhung=1` và `_chung/nhung.js` 200.
- Gỡ lỗi nhỏ: `git commit` báo "LF will be replaced by CRLF" (autocrlf Windows) — vô hại, repo lưu LF nhờ `.gitattributes text=auto`.
