# slide/ — bộ slide HTML

Mỗi bộ: `slide/<nhom>/<ma>/index.html` + `meta.json`. Slide nên: chuyển trang bằng phím ←/→ và chạm, có số trang,
vừa khung 16:9 khi nhúng, báo `chapter` (số trang) và `ended` (trang cuối) cho trang mẹ.
Tạo mới: `node tools/tao.js slide <nhom> <ma> "Tên"`.
