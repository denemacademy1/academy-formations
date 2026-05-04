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

  /* ===== Quizz interactif ===== */
  const QUIZZ_STORAGE_KEY = 'denem-quizz-scores';

  function setupQuizz() {
    const wraps = document.querySelectorAll('[data-quizz]');
    wraps.forEach((wrap) => {
      const questions = Array.from(wrap.querySelectorAll('.quizz-q'));
      const total = questions.length;
      if (!total) return;
      let answered = 0;
      let correct = 0;

      const fillEl = wrap.querySelector('.quizz-progress-fill');
      const countEl = wrap.querySelector('.quizz-progress-count');
      const resultEl = wrap.querySelector('[data-quizz-result]');

      function refresh() {
        if (fillEl) fillEl.style.width = (answered / total) * 100 + '%';
        if (countEl) countEl.textContent = `${answered} / ${total}`;
        if (answered === total) showResult();
      }

      function showResult() {
        if (!resultEl) return;
        const pct = Math.round((correct / total) * 100);
        let msg;
        if (pct === 100) msg = 'Score parfait. Tu as tout intégré — passe à la séance suivante.';
        else if (pct >= 80) msg = 'Excellent. Le mindset est en place.';
        else if (pct >= 60) msg = 'Bien. Relis les sections où tu as buté avant la séance 2.';
        else msg = 'Reprends la séance — ces points sont les fondations de tout le programme.';

        resultEl.innerHTML = `
          <div class="quizz-result-eyebrow">Résultat du quizz</div>
          <div class="quizz-result-score">${correct} / ${total}</div>
          <div class="quizz-result-pct">${pct} % de bonnes réponses</div>
          <div class="quizz-result-message">${msg}</div>
          <button class="quizz-retry-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Recommencer le quizz
          </button>
        `;
        resultEl.classList.add('visible');
        const retry = resultEl.querySelector('.quizz-retry-btn');
        if (retry) retry.addEventListener('click', resetQuizz);

        // Sauvegarde du score
        try {
          const scores = JSON.parse(localStorage.getItem(QUIZZ_STORAGE_KEY) || '{}');
          const seanceId = document.body.dataset.seanceId || 'unknown';
          scores[seanceId] = { score: correct, total, pct, at: Date.now() };
          localStorage.setItem(QUIZZ_STORAGE_KEY, JSON.stringify(scores));
        } catch (e) { /* noop */ }

        // Confettis si score > 80%
        if (pct >= 80 && typeof triggerConfetti === 'function') {
          setTimeout(triggerConfetti, 250);
        }
      }

      function resetQuizz() {
        answered = 0;
        correct = 0;
        questions.forEach((q) => {
          q.classList.remove('is-answered', 'is-correct', 'is-wrong');
          q.querySelectorAll('.quizz-opt').forEach((o) => {
            o.disabled = false;
            o.classList.remove('is-correct', 'is-wrong');
          });
        });
        if (resultEl) {
          resultEl.classList.remove('visible');
          resultEl.innerHTML = '';
        }
        refresh();
        const first = wrap.querySelector('.quizz-q');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      questions.forEach((q) => {
        const correctAns = q.dataset.correct;
        const opts = Array.from(q.querySelectorAll('.quizz-opt'));
        opts.forEach((opt) => {
          opt.addEventListener('click', () => {
            if (q.classList.contains('is-answered')) return;
            q.classList.add('is-answered');
            const chosen = opt.dataset.opt;
            const isCorrect = chosen === correctAns;
            opts.forEach((o) => {
              o.disabled = true;
              if (o.dataset.opt === correctAns) o.classList.add('is-correct');
              else if (o === opt) o.classList.add('is-wrong');
            });
            q.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
            answered++;
            if (isCorrect) correct++;
            refresh();
          });
        });
      });

      refresh();
    });
  }

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
    setupQuizz();
    setupFloatingActions();
    setupReveal();
  });
})();
