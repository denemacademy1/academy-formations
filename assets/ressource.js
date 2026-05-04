/* DENEM Academy — Fiches pratiques (ressources) — checklist persistante,
   sommaire actif au scroll, progression, impression, reset */
(function () {
  'use strict';

  /* ----- Config ----- */
  const fiche = document.body.dataset.ficheId;
  if (!fiche) return; // page non taggée comme fiche
  const STORAGE_KEY = 'denem-checklist-' + fiche;
  const COMPLETE_KEY = 'denem-fiche-complete-' + fiche;

  /* ===== Checklists persistantes ===== */
  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveChecks(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* noop */ }
  }

  function slug(text) {
    return (text || '').trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function setupCheckboxes() {
    const inputs = document.querySelectorAll('.check-row input[type="checkbox"]');
    if (!inputs.length) return;
    const state = loadChecks();

    inputs.forEach((input) => {
      // Génère un ID stable depuis le data-attr ou le label
      let id = input.dataset.checkId;
      if (!id) {
        const label = input.closest('.check-row')?.querySelector('.check-label');
        id = slug(label?.textContent || input.id || 'check-' + Math.random());
        input.dataset.checkId = id;
      }
      input.checked = !!state[id];

      input.addEventListener('change', () => {
        const cur = loadChecks();
        if (input.checked) cur[id] = true;
        else delete cur[id];
        saveChecks(cur);
        refreshProgress();
      });
    });

    refreshProgress();
  }

  /* ===== Progression ===== */
  function refreshProgress() {
    const total = document.querySelectorAll('.check-row input[type="checkbox"]').length;
    const done = document.querySelectorAll('.check-row input[type="checkbox"]:checked').length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const numEl = document.querySelector('[data-progression-num]');
    const textEl = document.querySelector('[data-progression-text]');
    const fillEl = document.querySelector('.progression-bar-fill');
    if (numEl) numEl.textContent = pct + ' %';
    if (textEl) textEl.textContent = `${done} / ${total} étapes complétées`;
    if (fillEl) fillEl.style.width = pct + '%';
  }

  /* ===== Reset ===== */
  function setupReset() {
    const btn = document.querySelector('[data-reset-checks]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const ok = window.confirm('Réinitialiser ta progression sur cette fiche ? Toutes les cases cochées seront décochées.');
      if (!ok) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(COMPLETE_KEY);
      } catch (e) { /* noop */ }
      document.querySelectorAll('.check-row input[type="checkbox"]').forEach((i) => { i.checked = false; });
      const completeBtn = document.querySelector('[data-fiche-complete]');
      if (completeBtn) {
        completeBtn.classList.remove('is-done');
        const lbl = completeBtn.querySelector('.label');
        if (lbl) lbl.textContent = 'Marquer cette fiche comme complétée';
      }
      refreshProgress();
    });
  }

  /* ===== Imprimer ===== */
  function setupPrint() {
    const btn = document.querySelector('[data-print]');
    if (!btn) return;
    btn.addEventListener('click', () => window.print());
  }

  /* ===== Marquer comme complétée ===== */
  function setupComplete() {
    const btn = document.querySelector('[data-fiche-complete]');
    if (!btn) return;

    function refresh() {
      const done = !!localStorage.getItem(COMPLETE_KEY);
      btn.classList.toggle('is-done', done);
      const lbl = btn.querySelector('.label');
      if (lbl) lbl.textContent = done ? 'Fiche complétée ✓' : 'Marquer cette fiche comme complétée';
    }
    refresh();

    btn.addEventListener('click', () => {
      const done = !!localStorage.getItem(COMPLETE_KEY);
      try {
        if (done) localStorage.removeItem(COMPLETE_KEY);
        else localStorage.setItem(COMPLETE_KEY, JSON.stringify({ at: Date.now() }));
      } catch (e) { /* noop */ }
      refresh();
      if (!done) triggerConfetti();
    });
  }

  /* ===== Sommaire — état actif au scroll ===== */
  function setupSommaireActive() {
    const links = document.querySelectorAll('.sommaire-list a[href^="#"]');
    if (!links.length) return;
    const map = new Map();
    links.forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, a);
    });
    if (!map.size) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          const link = map.get(entry.target);
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });

    map.forEach((_, el) => observer.observe(el));
  }

  /* ===== Scroll progress (si présent) ===== */
  function setupScrollProgress() {
    const fill = document.querySelector('.scroll-progress-fill');
    if (!fill) return;
    let ticking = false;
    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.width = pct + '%';
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ===== Confetti léger (réutilisé du seance.js) ===== */
  function triggerConfetti() {
    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden';
    document.body.appendChild(layer);
    const colors = ['#6B5BFF', '#C8FF57', '#FF9D5C', '#FFFFFF'];
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      const size = 6 + Math.random() * 10;
      const left = 10 + Math.random() * 80;
      const delay = Math.random() * 0.3;
      const dur = 1.4 + Math.random() * 1.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      piece.style.cssText = `position:absolute;left:${left}%;top:-20px;width:${size}px;height:${size}px;background:${color};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};opacity:0.95;transform:rotate(${Math.random() * 360}deg);animation:confetti-fall ${dur}s ${delay}s cubic-bezier(.4,0,.6,1) forwards;`;
      layer.appendChild(piece);
    }
    if (!document.getElementById('confetti-kf')) {
      const s = document.createElement('style');
      s.id = 'confetti-kf';
      s.textContent = '@keyframes confetti-fall { to { transform: translateY(110vh) rotate(720deg); opacity:0; } }';
      document.head.appendChild(s);
    }
    setTimeout(() => layer.remove(), 3500);
  }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    setupCheckboxes();
    setupReset();
    setupPrint();
    setupComplete();
    setupSommaireActive();
    setupScrollProgress();
  });
})();
