# myDocument — kho tài liệu HTML của Andrew Classes

Kho chung cho **mọi tài liệu HTML tự đủ** dùng ở nhiều lớp, nhiều mục: video hoạt hình, slide, nội dung tương tác,
bài đọc. Mỗi tài liệu là **một thư mục** có `index.html` + `meta.json`; trang bài tập, slide, app… chỉ việc **nhúng bằng iframe**.

- Địa chỉ: **https://document.andrewclasses.com** (GitHub Pages, tệp `CNAME`)
- Trang duyệt danh mục (xem thử, sao chép link, sao chép mã nhúng): chính trang gốc `/`
- Repo: `andrewclasses-01/myDocument` · nhánh `main` · thư mục local `E:\LAP TRINH APP\myDocument`

## Cấu trúc

```
myDocument/
├─ video/            Video hoạt hình HTML
│  └─ khoa-hoc/bones-muscles/   index.html + meta.json      ← <loai>/<nhom>/<ma>/
├─ slide/            Bộ slide HTML
├─ tuong-tac/        Mô phỏng, trò chơi nhỏ, bài thực hành
├─ bai-doc/          Bài đọc, bảng tóm tắt, tài liệu tra cứu
├─ _chung/nhung.js   Mã dùng chung: cờ ?nhung=1 + nhắn tin với trang mẹ
├─ _mau/             Bản mẫu tài liệu mới
├─ tools/            build-catalog.js (dựng danh mục) · tao.js (tạo tài liệu mới)
├─ loai.json         Danh sách LOẠI (thêm loại mới ở đây + tạo thư mục cùng tên)
├─ documents.json    Danh mục — MÁY SINH, không sửa tay
├─ index.html        Trang duyệt danh mục
└─ TICH HOP.md       Hợp đồng để app/trang khác dùng kho này
```

**Đường dẫn = mã tài liệu:** `<loai>/<nhom>/<ma>`. `nhom` là thư mục chia chủ đề (vd `khoa-hoc`, `ngu-phap`,
`tu-vung`) — tuỳ chọn, có thể bỏ (`<loai>/<ma>`). Mọi tên thư mục: chữ thường không dấu, số, gạch nối.

> ⛔ **Đã nhúng vào bài nào thì KHÔNG đổi tên / dời thư mục** — link nhúng là đường dẫn. Cần sửa nội dung thì sửa tại chỗ
> (tăng `phien_ban` trong `meta.json`). Cần cấu trúc mới thì tạo tài liệu mới, giữ bản cũ.

## Thêm tài liệu mới

```bash
node tools/tao.js video khoa-hoc ten-bai "Tên hiển thị"      # tạo từ _mau/
# …làm nội dung trong index.html, điền meta.json…
node tools/build-catalog.js                                    # cập nhật documents.json
git add -A && git commit -m "Thêm video ten-bai" && git push
```
Sau khi push, GitHub Pages cập nhật trong ~1–10 phút (có cache 10 phút).

## Nhúng vào trang bài tập

```html
<div style="position:relative;padding-top:56.25%">
  <iframe src="https://document.andrewclasses.com/video/khoa-hoc/bones-muscles/?nhung=1"
          style="position:absolute;inset:0;width:100%;height:100%;border:0"
          allow="fullscreen; autoplay" allowfullscreen loading="lazy"></iframe>
</div>
```
- Luôn thêm `?nhung=1` (tài liệu bỏ phần thừa) và `allow="fullscreen; autoplay"` (nút toàn màn hình, tiếng).
- `bai.html` của myLesson đã có khung `.video-khung` 16:9 — chỉ cần `src` ở trên.
- Trang duyệt `/` có nút **Mã nhúng** sinh sẵn đoạn trên cho từng tài liệu.

## Quy tắc cho tài liệu

1. **Tự đủ:** một thư mục là chạy; ảnh/âm thanh để cạnh `index.html`. Chỉ dùng thư viện ngoài khi bắt buộc (font Google ok).
2. **16:9 mặc định** (`ti_le` trong meta nếu khác) và phải đẹp ở khung nhỏ lẫn toàn màn hình.
3. **`<meta name="mydocument:id">`** + nạp `_chung/nhung.js` (đã có sẵn trong `_mau/`).
4. Báo `ready` / `progress` / `ended` cho trang mẹ nếu tài liệu có "xem xong" (xem `TICH HOP.md`).
5. **Dung lượng:** GitHub Pages tối đa ~1 GB cả repo. Video MP4 nặng, file lớn → để kho riêng (như `myLesson-audio`), không chất vào đây.
6. Hồ sơ: tài liệu nào phức tạp (như video) có thể kèm `GHI CHU.md` ngay trong thư mục của nó.

## Hồ sơ phát triển

`CLAUDE.md` (kiến trúc) · `GHI CHU DU AN.md` (nhật ký chặng, việc đang chờ) · `TICH HOP.md` (hợp đồng tích hợp).
