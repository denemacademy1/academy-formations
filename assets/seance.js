/* DENEM Academy — interactivité spécifique aux pages séances */
(function () {
  'use strict';

  const STORAGE_KEY = 'denem-progress';
  const ACTIONS_STORAGE_KEY = 'denem-actions';

  /* ===== Scroll progress bar (top) ===== */
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
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ===== Magnetic cards (cursor-following gradient) ===== */
  function setupMagneticCards() {
    const cards = document.querySelectorAll('.croyance-card, .magnetic');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
      });
    });
  }

  /* ===== Counter animation ===== */
  function animateCounter(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    const from = parseFloat(el.dataset.from || '0');
    const to = parseFloat(el.dataset.to);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = parseInt(el.dataset.duration || '1400', 10);
    const startTime = performance.now();
    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      el.textContent = prefix + value.toLocaleString('fr-FR') + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setupCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => obs.observe(c));
  }

  /* ===== Accordion (raisons d'échec) ===== */
  function setupAccordion() {
    const cards = document.querySelectorAll('.raison-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        // Ferme les autres
        cards.forEach((other) => {
          if (other !== card) other.classList.remove('is-open');
        });
        card.classList.toggle('is-open');
      });
    });
    // Ouvre le premier par défaut
    if (cards[0]) cards[0].classList.add('is-open');
  }

  /* ===== Tabs (cadre honnête) ===== */
  function setupTabs() {
    const navs = document.querySelectorAll('.tabs-nav');
    navs.forEach((nav) => {
      const buttons = nav.querySelectorAll('.tab-btn');
      const panelsRoot = nav.parentElement.querySelector('.tab-panels');
      if (!panelsRoot) return;
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          buttons.forEach((b) => b.classList.toggle('active', b === btn));
          nav.dataset.active = target;
          panelsRoot.querySelectorAll('.tab-panel').forEach((p) => {
            p.classList.toggle('active', p.dataset.tab === target);
          });
        });
      });
    });
  }

  /* ===== Step cards (exercice) — anim quand visible ===== */
  function setupSteps() {
    const steps = document.querySelectorAll('.step-card');
    if (!steps.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active');
        } else {
          entry.target.classList.remove('is-active');
        }
      });
    }, { threshold: 0.6 });
    steps.forEach((s) => obs.observe(s));

    steps.forEach((s) => {
      s.addEventListener('click', () => s.classList.toggle('is-active'));
    });
  }

  /* ===== Actions checklist (interactif + localStorage) ===== */
  function loadActions() {
    try {
      const raw = localStorage.getItem(ACTIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveActions(state) {
    try { localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
  }

  function setupActionsChecklist() {
    const items = document.querySelectorAll('.action-item');
    if (!items.length) return;
    const state = loadActions();
    const seanceId = document.body.dataset.seanceId || 'unknown';
    const scope = state[seanceId] || {};

    function refreshProgress() {
      const total = items.length;
      const done = Array.from(items).filter((it) => it.querySelector('input').checked).length;
      const pct = (done / total) * 100;
      const fill = document.querySelector('.actions-progress-bar-fill');
      const count = document.querySelector('.actions-progress-count');
      if (fill) fill.style.width = pct + '%';
      if (count) count.textContent = `${done} / ${total} fait`;

      // Auto-mark séance comme vue si toutes les actions sont faites
      if (done === total && total > 0) {
        try {
          const progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          if (!progress[seanceId]) {
            progress[seanceId] = { seenAt: Date.now(), via: 'actions' };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
            document.dispatchEvent(new CustomEvent('denem:progress-change'));
            // Trigger confetti-like glow
            triggerConfetti();
          }
        } catch (e) { /* noop */ }
      }
    }

    items.forEach((item) => {
      const input = item.querySelector('input[type="checkbox"]');
      const id = item.dataset.actionId;
      if (!id) return;
      input.checked = !!scope[id];
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          input.checked = !input.checked;
        }
        scope[id] = input.checked;
        state[seanceId] = scope;
        saveActions(state);
        refreshProgress();
      });
    });
    refreshProgress();
  }

  /* ===== Confetti-like glow when all actions done ===== */
  function triggerConfetti() {
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden';
    document.body.appendChild(layer);
    const colors = ['#6B5BFF', '#C8FF57', '#FF9D5C', '#FFFFFF'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      const size = 6 + Math.random() * 10;
      const left = 10 + Math.random() * 80;
      const delay = Math.random() * 0.3;
      const dur = 1.4 + Math.random() * 1.2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      piece.style.cssText = `
        position:absolute;
        left:${left}%; top:-20px;
        width:${size}px; height:${size}px;
        background:${color};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        opacity:0.95;
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${dur}s ${delay}s cubic-bezier(.4,0,.6,1) forwards;
      `;
      layer.appendChild(piece);
    }
    setTimeout(() => layer.remove(), 3500);
  }

  // inject confetti keyframes once
  (function injectKeyframes() {
    if (document.getElementById('confetti-kf')) return;
    const s = document.createElement('style');
    s.id = 'confetti-kf';
    s.textContent = '@keyframes confetti-fall { to { transform: translateY(110vh) rotate(720deg); opacity:0; } }';
    document.head.appendChild(s);
  })();

  /* ===== Floating action bar (apparait quand on scroll) ===== */
  function setupFloatingActions() {
    const bar = document.querySelector('.floating-actions');
    if (!bar) return;
    const seanceId = document.body.dataset.seanceId;
    const markBtn = bar.querySelector('.float-btn-mark');
    const topBtn = bar.querySelector('.float-btn-top');

    function isSeen() {
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        return !!(p && p[seanceId]);
      } catch (e) { return false; }
    }
    function setSeen(v) {
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (v) p[seanceId] = { seenAt: Date.now() };
        else delete p[seanceId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } catch (e) { /* noop */ }
    }

    function refresh() {
      if (markBtn) {
        const seen = isSeen();
        markBtn.classList.toggle('is-seen', seen);
        const label = markBtn.querySelector('.label');
        if (label) label.textContent = seen ? 'Séance vue' : 'Marquer comme vu';
      }
    }
    refresh();

    if (markBtn) {
      markBtn.addEventListener('click', () => {
        setSeen(!isSeen());
        refresh();
        if (isSeen()) triggerConfetti();
      });
    }
    if (topBtn) {
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    let lastShow = false;
    window.addEventListener('scroll', () => {
      const show = window.scrollY > 400;
      if (show !== lastShow) {
        bar.classList.toggle('visible', show);
        lastShow = show;
      }
    }, { passive: true });
  }

  /* ===== Reveal on scroll (stagger) ===== */
  function setupReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.revealDelay || '0', 10);
          setTimeout(() => entry.target.classList.add('revealed'), delay);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((it) => obs.observe(it));

    // base reveal styles injected once
    if (!document.getElementById('reveal-styles')) {
      const s = document.createElement('style');
      s.id = 'reveal-styles';
      s.textContent = `
        [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.2,.7,.3,1), transform .8s cubic-bezier(.2,.7,.3,1); }
        [data-reveal].revealed { opacity: 1; transform: translateY(0); }
      `;
      document.head.appendChild(s);
    }
  }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    setupScrollProgress();
    setupMagneticCards();
    setupCounters();
    setupAccordion();
    setupTabs();
    setupSteps();
    setupActionsChecklist();
    setupFloatingActions();
    setupReveal();
  });
})();
