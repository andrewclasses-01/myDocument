/* myDocument — mã dùng chung cho MỌI tài liệu (video, slide, tương tác…) khi được NHÚNG vào trang khác.
   Nạp bằng:  <script src="../../../_chung/nhung.js"></script>   (đường dẫn tương đối tuỳ độ sâu thư mục)
   Tài liệu vẫn chạy được nếu thiếu file này — chỉ mất phần nhắn tin với trang mẹ.

   HỢP ĐỒNG (v1) — chi tiết ở TICH HOP.md:
   • Cờ trên link:  ?nhung=1  → gắn class "nhung" lên <html> (tài liệu tự bỏ phần thừa khi nằm trong khung).
   • Tài liệu → trang mẹ:  postMessage({nguon:'myDocument', id, su_kien, ...})
       su_kien = ready | play | pause | chapter | progress | ended | (tài liệu tự thêm)
   • Trang mẹ → tài liệu:  postMessage({lenh:'play'|'pause'|'seek'|'chuong', ...})  (chỉ nhận từ window.parent)
*/
(function () {
  'use strict';
  var Q = new URLSearchParams(location.search);
  var meta = document.querySelector('meta[name="mydocument:id"]');
  var D = {
    version: 1,
    id: meta ? meta.content : '',
    nhung: Q.get('nhung') === '1',
    q: Q,
    /* gửi sự kiện lên trang mẹ — không làm gì nếu tài liệu đang mở riêng */
    emit: function (suKien, data) {
      if (window.parent === window) return;
      try {
        window.parent.postMessage(Object.assign({ nguon: 'myDocument', id: D.id, su_kien: suKien }, data || {}), '*');
      } catch (e) { /* trang mẹ chặn — bỏ qua */ }
    },
    /* nhận lệnh từ trang mẹ: fn(lenh, toanBoThongDiep) */
    onLenh: function (fn) {
      window.addEventListener('message', function (e) {
        if (e.source !== window.parent) return;
        var m = e.data;
        if (m && typeof m === 'object' && m.lenh) fn(m.lenh, m);
      });
    }
  };
  if (D.nhung) document.documentElement.classList.add('nhung');
  window.MyDocument = D;
})();
