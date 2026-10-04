#!/usr/bin/env node
/* Dựng documents.json từ mọi meta.json trong repo.
   Chạy:  node tools/build-catalog.js          (từ thư mục gốc repo, hoặc bất kỳ đâu)
   Quy ước: tài liệu = thư mục có meta.json, nằm ở  <loai>/<ma>/  hoặc  <loai>/<nhom>/<ma>/
   ⛔ documents.json do máy sinh — KHÔNG sửa tay, sửa meta.json rồi chạy lại. */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'loai.json'), 'utf8'));
const LOAI = new Set(cfg.loai.map(l => l.ma));
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/* các trường meta.json được đưa vào danh mục (trường lạ bị bỏ, để danh mục gọn) */
const TRUONG = ['ten', 'ten_vi', 'mo_ta', 'mon', 'chu_de', 'ngon_ngu', 'trinh_do', 'thoi_luong_giay',
  'co_giong_doc', 'ngay_tao', 'ngay_sua', 'phien_ban', 'poster', 'tep_chinh', 'ti_le', 'tuy_chon_nhung'];

const loi = [], canh_bao = [], items = [];

function* tim(dir, sau) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (fs.existsSync(path.join(p, 'meta.json'))) yield p;
    else if (sau < 2) yield* tim(p, sau + 1);
  }
}

for (const loai of LOAI) {
  const d = path.join(ROOT, loai);
  if (!fs.existsSync(d)) continue;
  for (const p of tim(d, 1)) {
    const rel = path.relative(ROOT, p).split(path.sep);
    const id = rel.join('/');
    let m;
    try { m = JSON.parse(fs.readFileSync(path.join(p, 'meta.json'), 'utf8')); }
    catch (e) { loi.push(`${id}: meta.json không đọc được (${e.message})`); continue; }
    const ma = rel[rel.length - 1];
    const nhom = rel.length === 3 ? rel[1] : '';
    rel.forEach(s => { if (!SLUG.test(s)) loi.push(`${id}: tên thư mục "${s}" phải là chữ thường không dấu, số, gạch nối`); });
    if (m.ma && m.ma !== ma) loi.push(`${id}: meta.ma="${m.ma}" khác tên thư mục "${ma}"`);
    if (m.loai && m.loai !== loai) loi.push(`${id}: meta.loai="${m.loai}" khác thư mục loại "${loai}"`);
    if (!m.ten) loi.push(`${id}: thiếu "ten"`);
    const tep = m.tep_chinh || 'index.html';
    if (!fs.existsSync(path.join(p, tep))) loi.push(`${id}: không thấy tệp chính "${tep}"`);
    if (m.poster && !fs.existsSync(path.join(p, m.poster))) canh_bao.push(`${id}: poster "${m.poster}" không tồn tại`);
    if (!m.mo_ta) canh_bao.push(`${id}: chưa có "mo_ta"`);

    const it = { id, loai, nhom, ma };
    for (const k of TRUONG) if (m[k] !== undefined) it[k] = m[k];
    it.tep_chinh = tep;
    it.url = id + '/' + (tep === 'index.html' ? '' : tep);
    it.nhung_url = it.url + (it.url.includes('?') ? '&' : '?') + 'nhung=1';
    if (it.poster) it.poster = id + '/' + it.poster;
    items.push(it);
  }
}

const ids = new Set();
for (const it of items) { if (ids.has(it.id)) loi.push(`${it.id}: trùng mã`); ids.add(it.id); }

items.sort((a, b) => (b.ngay_tao || '').localeCompare(a.ngay_tao || '') || a.id.localeCompare(b.id));

const out = {
  he_thong: cfg.he_thong,
  goc: cfg.goc,
  loai: cfg.loai,
  nhom: [...new Set(items.map(i => i.nhom).filter(Boolean))].sort(),
  tai_lieu: items
};

canh_bao.forEach(w => console.warn('⚠  ' + w));
if (loi.length) {
  loi.forEach(e => console.error('✗  ' + e));
  console.error(`\n${loi.length} lỗi — documents.json KHÔNG được ghi.`);
  process.exit(1);
}
fs.writeFileSync(path.join(ROOT, 'documents.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`✓ documents.json — ${items.length} tài liệu`);
items.forEach(i => console.log(`   ${i.id}  —  ${i.ten}`));
