# video/ — video hoạt hình HTML

Mỗi video: `video/<nhom>/<ma>/index.html` + `meta.json`.
Nhóm gợi ý: `khoa-hoc`, `ngu-phap`, `tu-vung`, `doc-hieu`, `ky-nang`.
Video nên: có thanh tua, phụ đề, lồng tiếng (tắt được), tự co theo khung 16:9, hỗ trợ `?nhung=1`
và báo `ready/progress/ended` (xem mẫu: `khoa-hoc/bones-muscles`).
Tạo mới: `node tools/tao.js video <nhom> <ma> "Tên"` (từ thư mục gốc repo).
