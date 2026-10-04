#!/usr/bin/env node
/* Tạo tài liệu mới từ bản mẫu _mau/.
   Chạy:  node tools/tao.js <loai> <nhom|-> <ma> "Tên hiển thị"
   Ví dụ: node tools/tao.js slide ngu-phap present-perfect "Present Perfect"
          node tools/tao.js tuong-tac - quay-so "Vòng quay số"        (dấu - = không chia nhóm) */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'loai.json'), 'utf8'));
const [loai, nhomArg, ma, ...tenParts] = process.argv.slice(2);
const ten = tenParts.join(' ').trim();
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nhom = nhomArg === '-' ? '' : nhomArg;

function thoat(m) { console.error('✗ ' + m); process.exit(1); }
if (!loai || !nhomArg || !ma || !ten) thoat('Cách dùng: node tools/tao.js <loai> <nhom|-> <ma> "Tên hiển thị"');
if (!cfg.loai.some(l => l.ma === loai)) thoat(`Loại "${loai}" không có trong loai.json (${cfg.loai.map(l => l.ma).join(', ')})`);
for (const s of [nhom, ma].filter(Boolean)) if (!SLUG.test(s)) thoat(`"${s}" phải là chữ thường không dấu, số, gạch nối (vd: present-perfect)`);

const dich = path.join(ROOT, loai, ...(nhom ? [nhom] : []), ma);
if (fs.existsSync(dich)) thoat('Đã tồn tại: ' + path.relative(ROOT, dich));
fs.mkdirSync(dich, { recursive: true });

const id = [loai, nhom, ma].filter(Boolean).join('/');
const sau = id.split('/').length;                    // số cấp thư mục → đường lên _chung
const len = '../'.repeat(sau) + '_chung/nhung.js';
const homNay = new Date().toISOString().slice(0, 10);
const dung = (s) => s.replace(/__ID__/g, id).replace(/__TEN__/g, ten).replace(/__NHUNG_JS__/g, len)
  .replace(/__MA__/g, ma).replace(/__LOAI__/g, loai).replace(/__NGAY__/g, homNay);

for (const f of fs.readdirSync(path.join(ROOT, '_mau'))) {
  fs.writeFileSync(path.join(dich, f), dung(fs.readFileSync(path.join(ROOT, '_mau', f), 'utf8')), 'utf8');
}
console.log('✓ Đã tạo ' + path.relative(ROOT, dich));
console.log('  Việc tiếp: sửa index.html + meta.json (mo_ta, mon, chu_de…), rồi  node tools/build-catalog.js');
