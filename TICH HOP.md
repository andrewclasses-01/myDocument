# TICH HOP — hợp đồng để app/trang khác dùng myDocument (v1)

Mục đích: khi thầy đã rõ hệ thống tài liệu, app (myLesson, myActivity, myBoard, AWord…) chỉ cần đọc **một danh mục**
và dựng **một link** — không cần sửa kho. File này là hợp đồng; **đổi hợp đồng = tăng `he_thong`** trong `loai.json`.

## 1. Định danh & link

- **ID tài liệu** = đường dẫn: `video/khoa-hoc/bones-muscles` (chuỗi bất biến, lưu được vào bài/CSDL).
- **Link mở:**  `https://document.andrewclasses.com/<id>/`
- **Link nhúng:** `https://document.andrewclasses.com/<id>/?nhung=1`
- App chỉ cần lưu **ID**; địa chỉ gốc lấy từ `documents.json → goc` (đổi tên miền sau này không phải sửa bài).
  Giống cách audio-kho tự suy đường dẫn từ mã bài.

## 2. Danh mục `documents.json`

`GET https://document.andrewclasses.com/documents.json` (GitHub Pages cho CORS `*` → đọc thẳng từ trang khác).

```jsonc
{
  "he_thong": 1,
  "goc": "https://document.andrewclasses.com/",
  "loai": [ { "ma": "video", "ten": "Video hoạt hình", "mo_ta": "…" }, … ],
  "nhom": ["khoa-hoc", …],
  "tai_lieu": [{
    "id": "video/khoa-hoc/bones-muscles", "loai": "video", "nhom": "khoa-hoc", "ma": "bones-muscles",
    "ten": "…", "ten_vi": "…", "mo_ta": "…", "mon": "Science", "chu_de": ["cell", …],
    "ngon_ngu": "en", "thoi_luong_giay": 277, "co_giong_doc": true,
    "ngay_tao": "2026-10-04", "phien_ban": "1.1.0", "ti_le": "16:9",
    "url": "video/khoa-hoc/bones-muscles/", "nhung_url": "video/khoa-hoc/bones-muscles/?nhung=1",
    "poster": null, "tuy_chon_nhung": { "t": "…", "cc": "…" }
  }]
}
```
Trường có thể thiếu (tuỳ tài liệu); chỉ `id`, `loai`, `ma`, `ten`, `url`, `nhung_url` luôn có.
Cache Pages ~10 phút → dùng `fetch(…, {cache:'no-cache'})`.

## 3. Tuỳ chọn trên link (tài liệu nào hỗ trợ thì ghi trong `tuy_chon_nhung`)

`?nhung=1` (bắt buộc khi nhúng) · video: `?t=60` `?cc=0` `?voice=0` `?toc=1.25`.
Tài liệu mới nên theo nếp: tham số tiếng Việt không dấu, giá trị đơn giản.

## 4. Nhắn tin (postMessage)

**Tài liệu → trang mẹ** (`window.parent.postMessage(obj,'*')`):

| `su_kien` | Dữ liệu thêm | Khi nào |
|---|---|---|
| `ready` | video: `tong`, `tong_chuong` | tải xong, sẵn sàng |
| `play` / `pause` | `t` | bấm phát / dừng |
| `chapter` | `chuong`, `ten`, `tong_chuong` | sang chương/trang mới |
| `progress` | `t`, `tong`, `pct` | mỗi giây khi đang chạy |
| `ended` | — | xem hết |

Mọi thông điệp luôn có `nguon:'myDocument'` và `id`. Trang mẹ **phải** kiểm `e.data.nguon==='myDocument'` (và nên kiểm `e.origin`).

**Trang mẹ → tài liệu** (chỉ nhận từ `window.parent`): `{lenh:'play'}` · `{lenh:'pause'}` · `{lenh:'seek', t:90}` · `{lenh:'chuong', i:4}`.

Trang `/` (danh mục) đã nghe thử các sự kiện này ở khung "Xem thử" — là ví dụ chạy được.

## 5. Gợi ý khi tích hợp vào myLesson / app tạo bài (CHƯA LÀM)

1. Bài lưu thêm mảng `taiLieu: ["video/khoa-hoc/bones-muscles", …]` (chỉ ID).
2. Trang bài: `goc + id + '?nhung=1'` → iframe trong khung `.video-khung`.
3. "Xem xong" = nhận `ended` (hoặc `progress.pct ≥ 90`) → ghi vào kho điểm như một act.
   ⚠️ Tin nhắn từ iframe do **trình duyệt học sinh** gửi → giả được. Chỉ dùng cho tiến độ/thưởng, không cho điểm quyết định.
4. App tạo bài: ô chọn tài liệu = đọc `documents.json`, lọc theo `loai`/`nhom`/`chu_de`, lưu `id`.
5. Muốn chặn nhúng từ trang lạ: kiểm `document.referrer`/`location.ancestorOrigins` trong `nhung.js` (chưa bật).

## 6. Quy tắc bất biến

- Không đổi/dời ID đã dùng. Sửa nội dung tại chỗ + tăng `phien_ban`.
- `documents.json` do `tools/build-catalog.js` sinh, không sửa tay.
- Thêm trường mới vào meta/danh mục: **được** (app cũ bỏ qua). Đổi nghĩa/xoá trường: phải tăng `he_thong`.
