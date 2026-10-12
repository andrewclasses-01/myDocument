/* myDocument — TRÌNH CHIẾU SLIDE ẢNH TĨNH dùng chung. Xem đầu trinh-chieu.css.
   Chuyển trang kiểu COVER (slide mới trượt đè slide cũ: tới từ phải, lùi từ trái), vuốt bám ngón tay,
   phím ←/→/Space/Home/End/F, `?trang=N`, báo `chapter`/`ended` cho trang mẹ (hợp đồng nhung.js). */
(function () {
  'use strict';
  var khung = document.createElement('div');
  khung.innerHTML = `<div class="san" id="san">
    <div class="ui" id="ui">
      <button class="nut" id="lui" aria-label="Previous slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
      <button class="nut" id="toi" aria-label="Next slide"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
      <button class="toan" id="toan" aria-label="Full screen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
      <div class="dem" id="dem">1 / …</div>
      <div class="vach" id="vach"></div>
    </div>
  </div>`;
  document.body.insertBefore(khung.firstElementChild, document.body.firstChild);
})();
  (function () {
    'use strict';
    var MD = window.MyDocument || { nhung:false, q:new URLSearchParams(location.search), emit:function(){}, onLenh:function(){} };
    var CF = window.TRINH_CHIEU || {};
    var TONG = Math.max(1, +CF.tong || 1), DUOI = CF.duoi || 'jpg';
    var san = document.getElementById('san'), ui = document.getElementById('ui');
    var bLui = document.getElementById('lui'), bToi = document.getElementById('toi');
    var dem = document.getElementById('dem'), vach = document.getElementById('vach');

    // Dựng TONG lớp slide; nạp sẵn hết ảnh để vuốt không bị trắng.
    var TR = [];
    for (var i = 0; i < TONG; i++) {
      var d = document.createElement('div');
      var src = 'anh/s' + String(i + 1).padStart(2, '0') + '.' + DUOI;
      d.className = 'tr';
      d.style.backgroundImage = 'url("' + src + '")';
      san.insertBefore(d, ui);
      TR.push(d);
      new Image().src = src;
    }

    var cur = Math.min(TONG - 1, Math.max(0, (parseInt(MD.q.get('trang'), 10) || 1) - 1));
    var dangChay = false, daHet = false;

    function datTr(el, x, chay) {          // x: % bề ngang (0 = đúng chỗ, 100 = ngoài mép phải, -100 = ngoài mép trái)
      el.classList.toggle('chay', !!chay);
      el.style.transform = 'translateX(' + x + '%)';
    }
    function capNhatUi() {
      dem.textContent = (cur + 1) + ' / ' + TONG;
      vach.style.width = ((cur + 1) / TONG * 100) + '%';
      bLui.disabled = cur === 0;
      bToi.disabled = cur === TONG - 1;
      MD.emit('chapter', { so: cur + 1, tong: TONG });
      if (cur === TONG - 1 && !daHet) { daHet = true; MD.emit('ended'); }
    }
    function chiHien(n) {
      TR.forEach(function (el, k) { el.classList.toggle('hien', k === n); el.classList.remove('tren', 'chay'); el.style.transform = ''; });
    }

    // COVER: slide đích nằm TRÊN, trượt từ mép (phải nếu tới, trái nếu lùi) vào đè slide hiện tại.
    // daKeo = slide đích đang nằm sẵn giữa chừng do vuốt → chạy tiếp từ chỗ đó.
    function sangTrang(n, daKeo) {
      if (n < 0 || n >= TONG || n === cur || dangChay) return;
      var huong = n > cur ? 1 : -1, moi = TR[n];
      dangChay = true;
      moi.classList.add('hien', 'tren');
      if (!daKeo) { datTr(moi, 100 * huong, false); void moi.offsetWidth; }
      datTr(moi, 0, true);
      var xong = false;
      function ket() {
        if (xong) return; xong = true;
        cur = n; chiHien(cur); dangChay = false; capNhatUi();
      }
      moi.addEventListener('transitionend', ket, { once: true });
      // lưới an toàn khi transitionend không tới (tab ẩn…): độ dài hiệu ứng + 250 ms
      setTimeout(ket, (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--t')) || 520) + 250);
    }
    function toi() { sangTrang(cur + 1); }
    function lui() { sangTrang(cur - 1); }

    // ---- Vuốt: slide kế bám theo ngón tay, thả quá 18% bề ngang (hoặc vuốt nhanh) là sang ----
    var keo = null;
    san.addEventListener('pointerdown', function (e) {
      if (dangChay || e.target.closest('button') || (e.pointerType === 'mouse' && e.button !== 0)) return;
      keo = { x: e.clientX, y: e.clientY, t: Date.now(), w: san.clientWidth, dich: -1, dx: 0, id: e.pointerId, quyet: false };
    });
    san.addEventListener('pointermove', function (e) {
      if (!keo || e.pointerId !== keo.id) return;
      var dx = e.clientX - keo.x, dy = e.clientY - keo.y;
      if (!keo.quyet) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { keo = null; return; }      // vuốt dọc: bỏ
        keo.quyet = true;
        try { san.setPointerCapture(e.pointerId); } catch (_) {}
      }
      var dich = dx < 0 ? cur + 1 : cur - 1;
      if (dich !== keo.dich) {                       // đổi hướng giữa chừng → giấu slide đang kéo dở
        if (keo.dich >= 0 && keo.dich < TONG) TR[keo.dich].classList.remove('hien', 'tren');
        keo.dich = dich;
        if (dich >= 0 && dich < TONG) TR[dich].classList.add('hien', 'tren');
      }
      keo.dx = dx;
      if (dich < 0 || dich >= TONG) return;          // hết slide: không kéo
      datTr(TR[dich], (dx < 0 ? 100 : -100) + dx / keo.w * 100, false);
    });
    function tha(e) {
      if (!keo || (e && e.pointerId !== keo.id)) return;
      var k = keo; keo = null;
      if (!k.quyet) return;
      var dich = k.dich, nhanh = Math.abs(k.dx) / Math.max(1, Date.now() - k.t) > 0.5;
      if (dich < 0 || dich >= TONG) return;
      if (Math.abs(k.dx) > k.w * 0.18 || nhanh) { sangTrang(dich, true); }
      else {                                          // không đủ: slide kế lui ra lại mép
        dangChay = true;
        datTr(TR[dich], k.dx < 0 ? 100 : -100, true);
        setTimeout(function () { chiHien(cur); dangChay = false; }, 540);
      }
    }
    san.addEventListener('pointerup', tha);
    san.addEventListener('pointercancel', tha);

    bToi.addEventListener('click', toi);
    bLui.addEventListener('click', lui);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); toi(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); lui(); }
      else if (e.key === 'Home') sangTrang(0);
      else if (e.key === 'End') sangTrang(TONG - 1);
      else if (e.key === 'f' || e.key === 'F') toanMan();
      hienUi();
    });

    // Toàn màn hình
    function toanMan() {
      var el = document.documentElement;
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
    document.getElementById('toan').addEventListener('click', toanMan);

    // Nút tự mờ sau 2,5 s để yên; rê chuột / chạm là hiện lại
    var hen;
    function hienUi() { ui.classList.remove('an'); clearTimeout(hen); hen = setTimeout(function () { ui.classList.add('an'); }, 2500); }
    ['pointermove', 'pointerdown'].forEach(function (ev) { document.addEventListener(ev, hienUi, { passive: true }); });

    // Lệnh từ trang mẹ: {lenh:'chuong', so:N} = nhảy tới slide N
    MD.onLenh(function (lenh, m) { if (lenh === 'chuong' || lenh === 'seek') sangTrang((parseInt(m.so, 10) || 1) - 1); });

    chiHien(cur); capNhatUi(); hienUi();
    MD.emit('ready', { tong: TONG });
    window.__slide = { get cur() { return cur + 1; }, toi: toi, lui: lui, sang: function (n) { sangTrang(n - 1); } };
  })();
