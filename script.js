/* ================================================================
   BIRTHDAY WEBSITE — script.js
   Author: Generated for your special someone ❤️

   Sections:
     A. Configuration
     B. Utility Helpers
     C. Starfield (Canvas)
     D. Page System (show / transition)
     E. Page 1 — Password
     F. Page 2 — Opening Joke (Typewriter)
     G. Pages 3–8 — Scroll-based sections (single-page after unlock)
     H. Bouquet Sparkle Injector
     I. Scroll Reveal (IntersectionObserver)
     J. Page 9 — Grand Ending (Confetti + Hearts)
     K. Init
================================================================ */

'use strict';

/* ----------------------------------------------------------------
   A. CONFIGURATION — edit these values
---------------------------------------------------------------- */
const CONFIG = {
  PASSWORD: '03-05-2026',

  /* Kalimat-kalimat joke (diketik satu per satu) */
  JOKES: [
    'Cieeeee...',
    'Kepalanya udah dua sekarang 🤭',
    'Happy 20th Birthday...',
    'Tapi tenang aja...',
    'Cantiknya masih 100/100 kok ❤️',
  ],

  /* Delay antar kalimat (ms) */
  JOKE_DELAY_BETWEEN: 700,

  /* Kecepatan ketik per karakter (ms) */
  JOKE_TYPE_SPEED: 50,
};


/* ----------------------------------------------------------------
   B. UTILITY HELPERS
---------------------------------------------------------------- */

/** Tunggu sejumlah ms */
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/** Pilih elemen tunggal */
const $ = (sel, root = document) => root.querySelector(sel);

/** Pilih semua elemen */
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Random float antara min dan max */
const rand = (min, max) => Math.random() * (max - min) + min;

/** Random int */
const randInt = (min, max) => Math.floor(rand(min, max + 1));


/* ----------------------------------------------------------------
   C. STARFIELD (Canvas)
   Dipakai di halaman password, joke, dan final.
---------------------------------------------------------------- */

/**
 * Menggambar bintang animasi di sebuah elemen <canvas>.
 * @param {HTMLCanvasElement} canvas
 * @param {number} count jumlah bintang
 * @returns {() => void} fungsi stop (untuk membersihkan)
 */
function createStarfield(canvas, count = 180) {
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  let raf;
  let stars = [];

  function resize() {
    canvas.width  = canvas.offsetWidth  || window.innerWidth;
    canvas.height = canvas.offsetHeight || window.innerHeight;
  }

  function initStars() {
    stars = Array.from({ length: count }, () => ({
      x:       rand(0, canvas.width),
      y:       rand(0, canvas.height),
      r:       rand(0.4, 1.8),
      alpha:   rand(0.3, 1),
      speed:   rand(0.002, 0.008),
      phase:   rand(0, Math.PI * 2),
    }));
  }

  function draw(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((s) => {
      s.phase += s.speed;
      const a = (Math.sin(s.phase) + 1) / 2 * s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  resize();
  initStars();
  draw(0);

  const ro = new ResizeObserver(() => { resize(); initStars(); });
  ro.observe(canvas.parentElement || document.body);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}


/* ----------------------------------------------------------------
   D. PAGE SYSTEM
   Website berjalan dalam dua mode:
     - Mode "multi-page" (fixed fullscreen) untuk halaman password, joke, hero
     - Setelah hero, semua halaman di-"unlocked" dan scroll normal
---------------------------------------------------------------- */

/** ID urutan halaman yang tampil satu per satu */
const PAGES = [
  'page-password',
  'page-joke',
  'page-hero',
  'page-bouquet',
  'page-love',
  'page-letter',
  'page-memories',
  'page-final',
  'page-ending',
];

let currentPageIndex = 0;

/**
 * Tampilkan halaman berdasarkan ID, dengan fade transition.
 * @param {string} pageId
 * @param {boolean} scrollable — apakah halaman ini jadi scrollable (tidak fixed)
 */
function showPage(pageId, scrollable = false) {
  // Sembunyikan semua halaman dulu
  PAGES.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('page--active');
    el.hidden = true;
    el.style.display = '';  
  });

  const target = document.getElementById(pageId);
  if (!target) return;

  target.hidden = false;
  target.style.display = 'flex';

  target.getBoundingClientRect();

  target.classList.add('page--active', 'fade-in');

  target.addEventListener(
    'animationend',
    () => target.classList.remove('fade-in'),
    { once: true }
  );

  if (scrollable) {
    target.classList.add('page--scrollable');
  }
}

/**
 * Transisi ke halaman berikutnya setelah halaman multi-page awal.
 * Flow: password (0) → joke (1) → hero fullscreen (2) → scroll mode
 */
function transitionToNextPage() {
  console.log("CURRENT:", currentPageIndex);

  currentPageIndex++; // Cukup panggil satu kali saja di sini!

  console.log("NEXT:", PAGES[currentPageIndex]);
  const nextId = PAGES[currentPageIndex];
  if (!nextId) return;

  // Index 0,1,2 = fullscreen one-by-one (password, joke, hero)
  // Index 3+    = scroll mode
  if (currentPageIndex <= 2) {
    showPage(nextId);
    // Setelah hero ditampilkan, setup trigger ke scroll mode
    if (currentPageIndex === 2) {
      initHeroPage();
    }
  } else {
    activateScrollMode();
  }
}

/**
 * Setup hero page:
 * - Klik scroll indicator → masuk scroll mode
 * - Scroll/swipe → masuk scroll mode
 * - Auto-advance 4 detik kalau user diam
 */
function initHeroPage() {
  let triggered = false;

  function goToScrollMode() {
    if (triggered) return;
    triggered = true;
    activateScrollMode();
  }

  // Klik pada titik scroll indicator
  const scrollDot = document.querySelector('#page-hero .scroll-indicator');
  if (scrollDot) {
    scrollDot.style.cursor = 'pointer';
    scrollDot.addEventListener('click', goToScrollMode, { once: true });
  }

  // Wheel / touchmove di atas hero page
  const heroPage = document.getElementById('page-hero');
  if (heroPage) {
    heroPage.addEventListener('wheel',     goToScrollMode, { once: true, passive: true });
    heroPage.addEventListener('touchmove', goToScrollMode, { once: true, passive: true });
  }

  // Auto-advance setelah 4 detik
  setTimeout(goToScrollMode, 4000);
}

/**
 * Aktifkan mode scroll — tampilkan semua section sekaligus
 * dalam satu halaman yang bisa di-scroll.
 * Ini terjadi setelah halaman hero.
 */
function activateScrollMode() {
  // Sembunyikan semua halaman fixed
  PAGES.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('page--active');
    el.hidden = true;
  });

  // Ubah body menjadi scrollable
  document.body.style.overflow = 'auto';
  document.body.style.height   = 'auto';

  // Tampilkan semua section dari index 2 (hero) ke atas
  for (let i = 2; i < PAGES.length; i++) {
    const el = document.getElementById(PAGES[i]);
    if (!el) continue;
    el.hidden = false;
    el.classList.remove('page--active');
    // Ubah dari position:fixed ke position:relative agar bisa scroll
    el.style.position = 'relative';
    el.style.height   = 'auto';
    el.style.minHeight = '100vh';
    el.style.opacity  = '1';
    el.style.pointerEvents = 'all';
    el.style.display  = 'flex';
  }

  // Scroll ke atas
  window.scrollTo({ top: 0 });

  // Inisialisasi observer setelah layout stabil
  setTimeout(() => {
    initScrollReveal();
    initBouquetObserver();
    initFinalObserver();
  }, 100);
}


/* ----------------------------------------------------------------
   E. PAGE 1 — PASSWORD
---------------------------------------------------------------- */

function initPasswordPage() {
  const stopStars = createStarfield($('#stars-canvas-pw'), 200);

  const input  = $('#pw-input');
  const btn    = $('#pw-btn');
  const errEl  = $('#pw-error');
  const overlay = $('#pw-unlock-overlay');

  async function handleUnlock() {
    const val = input.value.trim();

    if (val === CONFIG.PASSWORD) {
      // Sukses
      errEl.textContent = '';
      overlay.hidden = false;

      // Tunggu animasi unlock
      await wait(1800);

      // Tampilkan music player setelah unlock
      if (typeof window.showMusicPlayer === 'function') {
        window.showMusicPlayer();
      }

      stopStars();
      currentPageIndex = 1;

        showPage('page-joke');
        initJokePage();
    } else {
      // Gagal
      errEl.textContent = 'Yahhh salah 😝 Coba lagi ya!';
      input.value = '';
      input.classList.add('shake');
      input.addEventListener('animationend', () => input.classList.remove('shake'), { once: true });
    }
  }

  btn.addEventListener('click', handleUnlock);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
}

/* Tambahkan CSS shake secara inline karena hanya dipakai di sini */
(function addShakeStyle() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%    {transform:translateX(-8px)}
      40%    {transform:translateX(8px)}
      60%    {transform:translateX(-6px)}
      80%    {transform:translateX(6px)}
    }
    .shake { animation: shake 0.5s ease; }
  `;
  document.head.appendChild(s);
})();


/* ----------------------------------------------------------------
   F. PAGE 2 — OPENING JOKE (TYPEWRITER)
---------------------------------------------------------------- */

async function initJokePage() {
  createStarfield($('#stars-canvas-joke'), 150);

  const textEl = $('#joke-text');
  const nextBtn = $('#joke-next-btn');

  /**
   * Ketik sebuah string ke dalam element, karakter per karakter.
   * Menambahkan kursor berkedip.
   */
  async function typeString(str) {
    // Buat span untuk baris baru
    const line = document.createElement('p');
    line.style.margin = '0 0 0.4rem';
    textEl.appendChild(line);

    // Kursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    line.appendChild(cursor);

    for (const char of str) {
      const span = document.createElement('span');
      span.textContent = char;
      line.insertBefore(span, cursor);
      await wait(CONFIG.JOKE_TYPE_SPEED);
    }

    // Hapus kursor setelah ketik selesai
    cursor.remove();
  }

  // Ketik semua kalimat satu per satu
  for (let i = 0; i < CONFIG.JOKES.length; i++) {
    await typeString(CONFIG.JOKES[i]);
    await wait(CONFIG.JOKE_DELAY_BETWEEN);
  }

  // Tampilkan tombol lanjut
  await wait(400);
  nextBtn.classList.remove('btn--hidden');
  nextBtn.classList.add('btn--visible');
  nextBtn.focus();

  nextBtn.addEventListener('click', () => {
    transitionToNextPage(); // → Hero
  }, { once: true });
}


/* ----------------------------------------------------------------
   G. PAGES 3–8 — Single-page scroll mode
   (Hero sampai Final semua aktif setelah scroll mode on)
---------------------------------------------------------------- */

/* Hero sudah langsung tampil karena activateScrollMode() */

/* ——— Final Message Page: tombol ke Grand Ending ——— */
function initFinalObserver() {
  const endingBtn = $('#ending-btn');
  if (!endingBtn) return;

  endingBtn.addEventListener('click', () => {
    launchGrandEnding();
  }, { once: true });
}


/* ----------------------------------------------------------------
   H. BOUQUET SPARKLE INJECTOR
---------------------------------------------------------------- */

function injectSparkles() {
  const container = $('#sparkle-container');
  if (!container || container.dataset.injected) return;
  container.dataset.injected = '1';

  const count = 18;
  for (let i = 0; i < count; i++) {
    const sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.style.cssText = `
      top:  ${rand(5, 90)}%;
      left: ${rand(5, 90)}%;
      animation-delay: ${rand(0, 3)}s;
      animation-duration: ${rand(1.5, 3.5)}s;
      background: hsl(${randInt(320, 360)}, 100%, ${randInt(75, 100)}%);
    `;
    container.appendChild(sp);
  }
}

function initBouquetObserver() {
  const bouquetRoot = $('#bouquet-root');
  if (!bouquetRoot) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          injectSparkles();
          observer.unobserve(bouquetRoot);
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(bouquetRoot);
}


/* ----------------------------------------------------------------
   I. SCROLL REVEAL — IntersectionObserver
   Mengamati semua elemen dengan class .reveal-section, .reveal-card,
   .bouquet-line, .final-line, .final-title
---------------------------------------------------------------- */

function initScrollReveal() {
  const targets = $$(
    '.reveal-section, .reveal-card, .bouquet-line, .final-line, .final-title'
  );

  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Stagger untuk love cards dalam satu grid
          if (entry.target.classList.contains('reveal-card')) {
            const siblings = $$('.reveal-card');
            const idx = siblings.indexOf(entry.target);
            entry.target.style.transitionDelay = `${idx * 0.08}s`;
          }

          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  targets.forEach((el) => observer.observe(el));
}


/* ----------------------------------------------------------------
   J. PAGE 9 — GRAND ENDING
   Confetti + floating hearts + text reveal
---------------------------------------------------------------- */

function launchGrandEnding() {
  // Scroll ke atas dulu kalau perlu
  const endingPage = $('#page-ending');
  if (endingPage) {
    endingPage.scrollIntoView({ behavior: 'smooth' });
  }

  setTimeout(() => {
    startConfetti();
    spawnHearts();
  }, 600);
}

/* ——— CONFETTI ——— */
function startConfetti() {
  const canvas = $('#confetti-canvas');
  if (!canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');
  const COLORS = [
    '#ff7eb6', '#ffd6e8', '#ffffff',
    '#ff4d94', '#ffb3d1', '#ffe0f0',
  ];

  const pieces = Array.from({ length: 140 }, () => ({
    x:     rand(0, canvas.width),
    y:     rand(-100, -10),
    w:     rand(6, 14),
    h:     rand(10, 22),
    color: COLORS[randInt(0, COLORS.length - 1)],
    rot:   rand(0, Math.PI * 2),
    rotV:  rand(-0.08, 0.08),
    vx:    rand(-2, 2),
    vy:    rand(2.5, 6),
    alpha: 1,
  }));

  let running = true;
  let frame   = 0;

  function drawPiece(p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let allDone = true;
    pieces.forEach((p) => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rotV;
      p.vx  *= 0.995;

      if (p.y > canvas.height - 40) {
        p.alpha = Math.max(0, p.alpha - 0.015);
      }
      if (p.alpha > 0) {
        allDone = false;
        drawPiece(p);
      }
    });

    frame++;
    if (!allDone) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }

  loop();

  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }, { once: true });
}


/* ——— FLOATING HEARTS ——— */
function spawnHearts() {
  const container = $('#hearts-container');
  if (!container) return;

  const EMOJIS = ['❤️', '🌸', '💕', '🌷', '💖', '✨', '💗'];
  const total  = 30;

  for (let i = 0; i < total; i++) {
    const heart = document.createElement('div');
    heart.className = 'heart';
    heart.textContent = EMOJIS[randInt(0, EMOJIS.length - 1)];

    const delay    = rand(0, 4);
    const duration = rand(4, 9);
    const left     = rand(2, 96);

    heart.style.cssText = `
      left: ${left}%;
      font-size: ${rand(1, 2.2)}rem;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(heart);

    // Hapus setelah animasi selesai agar DOM bersih
    setTimeout(
      () => heart.remove(),
      (delay + duration + 0.5) * 1000
    );
  }
}


/* ----------------------------------------------------------------
   K. INIT — Jalankan semua saat DOM siap
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Pastikan body tidak bisa di-scroll di awal (mode fullscreen pages)
  document.body.style.overflow = 'hidden';
  document.body.style.height   = '100vh';

  // Tampilkan halaman password pertama
  showPage('page-password');

  // Inisialisasi halaman password
  initPasswordPage();

  // Inisialisasi music player (tersembunyi dulu, muncul setelah unlock)
  initMusicPlayer();

  // Hero: tombol scroll indicator → aktifkan scroll mode
  // (hero sendiri aktif lewat activateScrollMode → transitionToNextPage)

  // Debugging helper — bisa dihapus setelah production
  // Ketik window.skipToPage(n) di console untuk skip ke halaman n
  window.skipToPage = (n) => {
    if (n === 0) {
      location.reload();
      return;
    }
    if (n >= 2) {
      currentPageIndex = n;
      activateScrollMode();
      return;
    }
    currentPageIndex = n - 1;
    transitionToNextPage();
  };
});


/* ----------------------------------------------------------------
   L. MUSIC PLAYER
   File: music/song.mp3
   Player muncul setelah password benar.
   Klik toggle untuk play/pause.
---------------------------------------------------------------- */

function initMusicPlayer() {
  const player  = $('#music-player');
  const audio   = $('#bg-audio');
  const toggle  = $('#music-toggle');
  const label   = $('#music-label');

  if (!player || !audio || !toggle) return;

  let isPlaying = false;

  /**
   * Tampilkan music player — dipanggil dari luar (setelah unlock).
   * Exposed ke window agar bisa dipanggil dari initPasswordPage.
   */
  window.showMusicPlayer = function () {
    player.hidden = false;
  };

  /**
   * Toggle play / pause
   */
  function togglePlay() {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      player.classList.remove('playing');
      if (label) label.textContent = 'Play Music';
    } else {
      // Browser autoplay policy: harus dipicu oleh user gesture ✓
      audio.play().then(() => {
        isPlaying = true;
        player.classList.add('playing');
        if (label) label.textContent = 'Now Playing ♪';
      }).catch((err) => {
        console.warn('Audio play blocked:', err);
        if (label) label.textContent = 'Klik untuk play';
      });
    }
  }

  toggle.addEventListener('click', togglePlay);

  // Jika audio habis (loop=false), reset state
  audio.addEventListener('ended', () => {
    isPlaying = false;
    player.classList.remove('playing');
    if (label) label.textContent = 'Play Music';
  });

  // Keyboard shortcut: tekan M untuk toggle (opsional)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      if (!player.hidden) togglePlay();
    }
  });
}