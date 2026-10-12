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

## Chặng 3 — 09/10/2026 — Video bones-muscles lồng GIỌNG THẬT Teacher Andrew (v1.2.0)

Thầy "ok build", chọn giọng **"thầy Andrew · kể chuyện"** của myVoice (mã `0670723f`, nhân bản từ `Desktop\Giong Andrew.wav`).
- **Đọc:** `tools/doc-giong.mjs` gọi thẳng lõi VoiceStudio (cổng 3900, cùng API myVoice dùng): mỗi câu `/generate` → Whisper `/v1/audio/transcriptions`
  (verbose_json + giờ TỪNG CHỮ) → khớp < 0,97 ⇒ đọc lại (seed mới + `duration` dài hơn) → `/stories/encode` MP3 64k. 38/38 câu khớp 100%
  (8-2 và 11-0 sót 1 chữ lần đầu, đọc lại đủ). Tổng 2,2 MB.
- **Gắn:** `tools/giong-video.mjs` chép mp3 vào `<video>/giong/<cảnh>-<câu>.mp3` + nhúng khối `GIONG` (d = giây tiếng, w = giây bắt đầu từng CHỮ PHỤ ĐỀ)
  vào index.html giữa mốc `/*GIONG*/…/*/GIONG*/` (nhúng thẳng để mở file:// vẫn chạy). Chữ gạch nối Whisper tách đôi, dấu "—" không có tiếng ⇒ tool tự ghép (lệch 0).
- **Trình phát:** có GIONG ⇒ câu dài = tiếng + 0,5 s (hình bám đầu câu nên tự dời theo); phát file từ đúng chỗ khi tua giữa câu; dừng/tiếp; đổi tốc độ
  (`playbackRate`); M tắt/bật; lệch đồng hồ > 0,3 s tự kéo về; phụ đề sáng theo giờ chữ thật; file lỗi ⇒ quay về giọng máy trình duyệt.
  Móc thử: `__video.au` (file đang phát, giây, dừng?), `__video.loiAu`.
- Video dài **5:07** (cũ 4:37 — giọng thầy chậm hơn giọng máy, nhất là cảnh 2, 4, 5). Đã chụp soát cảnh 2/4/8/12: hình và lời khớp.
- ⚠ Kho CÔNG KHAI ⇒ file giọng thầy ai có link cũng tải được (giọng thầy, không phải học sinh — thầy đã biết khi duyệt).

**Làm video khác có giọng:** thêm mốc `const GIONG=/*GIONG*/null/*/GIONG*/` + phần phát tiếng như bones-muscles → lấy cues.json từ trang (dòng đầu doc-giong.mjs)
→ `node tools/doc-giong.mjs cues.json <thư mục tạm>` → `node tools/giong-video.mjs <thư mục tạm> <thư mục video> "<tên giọng>"` → `node tools/build-catalog.js`.

**VIỆC ĐANG CHỜ**
- ⬜ Thầy nghe thật trên máy/TOMKO (giọng kể chuyện có hợp không, tốc độ, quãng nghỉ 0,5 s giữa câu).

## Chặng 4 — 09/10/2026 — Nhạc nền theo đoạn (bones-muscles v1.3.0)

Thầy duyệt kho **Incompetech (Kevin MacLeod, CC BY 4.0 — chỉ cần ghi công)** + 4 bài, "ok tải và build". Pixabay Music bị loại: giấy phép cấm
phát tán nguyên file, mà kho myDocument công khai. FreePD (CC0) đã đóng cửa.
- 4 đoạn: cảnh 0–4 "Inspired" · 5–8 "Wallpaper" · 9–11 "Clean Soul" · 12–13 "Life of Riley". Nguồn + cách cắt: `video/khoa-hoc/bones-muscles/nhac/NGUON NHAC.md`.
- Máy không có ffmpeg ⇒ cắt bằng Electron ẩn (WebAudio `decodeAudioData` → WAV, fade vào 0,6 s / ra 3 s), nén bằng lõi VoiceStudio `/stories/encode`
  (mp3 96k). Mỗi file = độ dài đoạn + 3 s. Tổng 3,85 MB.
- Trình phát (`nhacTick` gọi cuối `render`): vị trí nhạc = t − đầu đoạn (tua/dừng/tốc độ tự đúng, lệch > 0,35 s kéo về); chuyển đoạn chéo 1,5 s;
  có lời ⇒ nhạc 0,07, không lời ⇒ 0,2 (hạ nhanh, lên chậm); đoạn cuối nhỏ dần hết trước khi dừng. Nút ♪ `#bMusic` (phím N), `?nhac=0`.
  Ghi công ở màn WATCH AGAIN + `meta.json nhac_nen`. Móc thử `__video.nhac`.
- Đổi độ dài cảnh (đọc lại giọng…) ⇒ phải cắt lại file nhạc cho khớp độ dài đoạn mới.

**VIỆC ĐANG CHỜ**
- ⬜ Thầy nghe thật: nhạc to/nhỏ so với giọng (chỉnh `NH_TO` / `NH_NHO`), bài có hợp từng đoạn không.

## Chặng 5 — 12/10/2026 — Slide Speaking `slide/khoa-hoc/bones-muscles-sp` (v1.0.0) cho bài SP SLIDE myLesson

**Bối cảnh:** thầy muốn bài SP SLIDE của B2-B (12/10, DS-S5.I1.W1 BONES AND MUSCLES) dùng slide PowerPoint `SLIDE 2.pptx`
thay link Canva, qua myDocument để nhúng iframe được (cùng tên miền, link cố định). Chốt: CHỈ SLIDE 2, ẢNH TĨNH,
chuyển trang kiểu **Cover** của PowerPoint; thầy xem mẫu trước rồi mới đẩy. Sau đó thầy thêm slide 15 (THANKS FOR LISTENING).

**Đã làm:**
- Xuất ảnh: PowerShell COM `PowerPoint.Application` → `Presentations.Open(src, ReadOnly)` → `Slide.Export(png, 1920, 1080)`
  rồi Pillow nén WebP q82 (15 slide ≈ 1,4 MB; pptx gốc 14,9 MB). Ảnh ở `anh/s01..s15.webp`, `poster.webp` = slide 1 nhỏ.
- `index.html` tự viết (không thư viện): sân khấu 16:9 lớn nhất vừa khung; mỗi slide một lớp `.tr` nền ảnh.
  **COVER** = slide đích nằm TRÊN (`.tren`, có bóng), trượt từ mép vào đè slide cũ đứng yên (tới: từ phải, lùi: từ trái),
  `transition: transform var(--t)` (520 ms, cubic-bezier(.22,.61,.36,1)). Vuốt (pointer events): slide kế BÁM NGÓN TAY,
  thả > 18% bề ngang hoặc vuốt nhanh (> 0,5 px/ms) là sang, không đủ thì lùi ra mép. Vuốt dọc bị bỏ (`touch-action:pan-y`).
- Nút ‹ › (ẩn ở 2 đầu), đếm `n / 15`, thanh tiến độ xanh đáy, nút toàn màn hình; nút tự mờ sau 2,5 s. Phím ←/→/Space/PgUp/PgDn/Home/End/F.
- Hợp đồng nhúng: `chapter {so,tong}` mỗi lần sang trang, `ended` khi tới slide cuối, nhận lệnh `{lenh:'chuong'|'seek', so}`;
  `?trang=N` mở ở slide N. Móc thử `window.__slide` (`cur`, `toi()`, `lui()`, `sang(n)`).
- Push `d59f3be` (15 slide). Live: `https://document.andrewclasses.com/slide/khoa-hoc/bones-muscles-sp/?nhung=1`.

**Khám phá / bẫy:**
- `setTimeout` lưới an toàn của hiệu ứng phải tính theo `--t` (ban đầu cứng 700 ms ⇒ khi thử với `--t` dài để chụp
  giữa hiệu ứng thì hiệu ứng bị cắt). Nay = `--t` + 250 ms.
- Đường dẫn Windows trong heredoc bash bị nuốt `\5`, `\3` thành ký tự điều khiển ⇒ ghi `nguon` trong meta.json bằng dấu `/`.
- Thêm slide cho bộ này: xuất lại, so pixel với bản cũ (Pillow `ImageChops.difference`), chép ảnh mới, sửa `TONG` + chữ `1 / N`
  trong index.html + `so_trang` meta.json, chạy `build-catalog.js`.

**VIỆC ĐANG CHỜ**
- ⬜ Thầy nghe thật nhạc nền bones-muscles (chặng 4).
- ⬜ Muốn làm slide khác cùng kiểu: tách khung trình chiếu ra `slide/_chung/` (hiện chép trong index.html) khi có bộ thứ 2.

## Chặng 6 — 12/10/2026 — Trình chiếu dùng chung `slide/_chung/` + bộ slide do app myLesson sinh (`slide/bai/…`)

**Bối cảnh:** app myLesson v2.159.0 có khung QUẢN LÝ SLIDE, nút "chuyển pptx sang myDocument" (main `lib/slide-mydoc.js`).
**Đã làm (`77b9d60`):** tách trình chiếu của `bones-muscles-sp` thành `slide/_chung/trinh-chieu.css` + `trinh-chieu.js` (JS tự dựng
khung `.san` + nút; đọc `window.TRINH_CHIEU = { tong, duoi }`, ảnh `anh/sNN.<duoi>`). `bones-muscles-sp` GIỮ NGUYÊN (không trỏ vào _chung).
**Bộ do app sinh:** `slide/bai/<slug mã bài + tên file pptx>/` — index.html tối giản (meta `mydocument:ban` = dấu bản để app biết đã live),
ảnh JPEG q84 1920 ngang, `poster.jpg`, meta.json có `nguon` (đường pptx, dấu "/"), `so_trang`, `sinh_boi: "myLesson"`, `ti_le: "16:9"`.
⛔ Đừng sửa tay index.html của bộ `slide/bai/…` (app ghi đè khi chuyển lại) — sửa trình chiếu ở `slide/_chung/`.
⛔ `build-catalog.js` bỏ qua thư mục không có meta.json nên `_chung` không vào danh mục.

**VIỆC ĐANG CHỜ**
- ⬜ Lần chuyển thật đầu tiên từ app (mới chạy trên bản sao kho trong máy).
- ⬜ Thầy nghe thật nhạc nền bones-muscles (chặng 4).
