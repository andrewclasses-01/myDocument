# myDocument — kho tài liệu HTML (video, slide, tương tác, bài đọc)

## Mục đích
Kho chung các tài liệu HTML tự đủ để **nhúng bằng iframe** vào trang bài tập (myLesson), slide, app… ở nhiều lớp.
Tên cũ ý tưởng: "myVideo" → đổi thành myDocument vì kho chứa nhiều loại chứ không riêng video.
Chạy ở **https://document.andrewclasses.com** (GitHub Pages, `CNAME`). Đọc `README.md` (cách dùng), `TICH HOP.md` (hợp đồng tích hợp).

## Cấu trúc & quy ước
- Tài liệu = thư mục `<loai>/<nhom>/<ma>/` (nhóm tuỳ chọn) có `index.html` + `meta.json`. Loại khai ở `loai.json`
  (video, slide, tuong-tac, bai-doc). Tên thư mục: chữ thường không dấu/số/gạch nối.
- **ID = đường dẫn** → bất biến sau khi đã nhúng (không đổi tên/dời thư mục).
- `documents.json` do `node tools/build-catalog.js` sinh từ mọi `meta.json` (kiểm: slug, `ma`/`loai` khớp đường dẫn, tệp chính tồn tại, trùng mã). **Không sửa tay.**
- `node tools/tao.js <loai> <nhom|-> <ma> "Tên"` tạo tài liệu từ `_mau/` (tự điền id, đường lên `_chung/nhung.js`, meta).
- `_chung/nhung.js` → `window.MyDocument` {id, nhung, q, emit(su_kien,data), onLenh(fn)}; thêm class `nhung` lên `<html>` khi `?nhung=1`.
  Tài liệu phải chạy được cả khi thiếu file này (dùng shim `window.MyDocument||{…}`).
- Hợp đồng nhắn tin: tài liệu → mẹ `{nguon:'myDocument',id,su_kien}` (`ready/play/pause/chapter/progress/ended`);
  mẹ → tài liệu `{lenh:'play|pause|seek|chuong'}` (chỉ nhận từ `window.parent`). Chi tiết `TICH HOP.md`.
- `index.html` gốc = trang duyệt danh mục: lọc loại/nhóm/tìm, "Xem thử" trong khung nhúng (có nghe sự kiện), sao chép link/mã nhúng.
  Mở qua `file://` sẽ không đọc được `documents.json` → test bằng `python -m http.server`.
- `robots.txt` Disallow + `<meta robots noindex>` ở trang gốc và mẫu: kho không để Google lập chỉ mục.

## Tài liệu hiện có
- `video/khoa-hoc/bones-muscles` — video hoạt hình "Why are bones hard and muscles soft?" (14 cảnh, 4:37). Kiến trúc riêng của video:
  động cơ Web Animations điều khiển bằng đồng hồ chính (xem phần cuối `GHI CHU DU AN.md` mục "kiến thức mang theo từ BonesMuscles Video").
  Tuỳ chọn link: `?t= ?cc=0 ?voice=0 ?toc=`.

## Kiểm thử
`cd "E:\LAP TRINH APP\myDocument"` → `python -m http.server 8765` → mở `http://127.0.0.1:8765/`.
Pane xem trước của Claude chỉ vẽ khi chụp ảnh (rAF dừng khi pane ẩn): kiểm bằng `seek` + chụp, và với `postMessage` bằng JS đọc `__msgs`.

## Roadmap
- Đẩy repo lên GitHub (`andrewclasses-01/myDocument`), trỏ DNS `document` → GitHub Pages, bật HTTPS.
- Tích hợp myLesson: trường `taiLieu[]` trong bài + ô chọn trong app tạo bài (chờ thầy rõ hệ thống tài liệu).
- Poster/thumbnail tự sinh cho video; slide mẫu; tài liệu tương tác mẫu.
