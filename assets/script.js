/* DENEM Academy — script commun */
(function () {
  'use strict';

  const STORAGE_KEY = 'denem-progress';

  /* ===== Progression ===== */
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* noop */ }
  }

  function isSeen(id) {
    return !!loadProgress()[id];
  }

  function setSeen(id, value) {
    const state = loadProgress();
    if (value) state[id] = { seenAt: Date.now() };
    else delete state[id];
    saveProgress(state);
    document.dispatchEvent(new CustomEvent('denem:progress-change'));
  }

  /* Expose for debugging */
  window.denemProgress = { load: loadProgress, set: setSeen };

  /* ===== HOMEPAGE — checkboxes ===== */
  function hydrateHomeCheckboxes() {
    const labels = document.querySelectorAll('.card-checkbox');
    labels.forEach((label) => {
      const input = label.querySelector('input[type="checkbox"]');
      const id = input.dataset.seanceId;
      if (!id) return;
      input.checked = isSeen(id);
      label.classList.toggle('is-checked', input.checked);

      input.addEventListener('change', (e) => {
        e.stopPropagation();
        setSeen(id, input.checked);
        label.classList.toggle('is-checked', input.checked);
        const visual = label.querySelector('.checkbox-visual');
        if (visual && input.checked) {
          visual.classList.remove('just-checked');
          // restart animation
          void visual.offsetWidth;
          visual.classList.add('just-checked');
        }
      });

      // prevent card link from firing when clicking checkbox
      label.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  /* ===== HOMEPAGE — progress bar + counter ===== */
  function refreshProgressUI() {
    const progressEl = document.querySelector('.progression');
    if (!progressEl) return;

    const state = loadProgress();
    const allCards = document.querySelectorAll('.seance-card');
    const totalCount = allCards.length || 27;

    // counts per acte
    const perActeTotal = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const perActeDone = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let totalDone = 0;

    allCards.forEach((card) => {
      const acte = card.dataset.acte;
      const id = card.dataset.seanceId;
      if (acte == null) return;
      perActeTotal[acte] = (perActeTotal[acte] || 0) + 1;
      if (id && state[id]) {
        perActeDone[acte] = (perActeDone[acte] || 0) + 1;
        totalDone++;
      }
    });

    const counterEl = document.querySelector('[data-progress-counter]');
    if (counterEl) {
      counterEl.innerHTML = `<strong>${totalDone}</strong> / ${totalCount} séances complétées`;
    }

    document.querySelectorAll('.progress-segment').forEach((seg) => {
      const acte = seg.dataset.acte;
      const total = perActeTotal[acte] || 1;
      const done = perActeDone[acte] || 0;
      const pct = (done / total) * 100;
      const fill = seg.querySelector('.fill');
      if (fill) fill.style.width = pct + '%';
    });
  }

  /* ===== SEANCE PAGE — render markdown ===== */
  function renderSeanceMarkdown() {
    const mdHolder = document.getElementById('seance-markdown');
    const target = document.getElementById('fiche');
    if (!mdHolder || !target || typeof marked === 'undefined') return;

    const raw = mdHolder.textContent;
    target.innerHTML = marked.parse(raw, { mangle: false, headerIds: true });

    // Group sections (h2) into callouts when title matches
    wrapCallouts(target);
    buildToc(target);
  }

  function slug(str) {
    return str.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function wrapCallouts(root) {
    const headings = Array.from(root.querySelectorAll('h2'));
    headings.forEach((h2) => {
      const text = h2.textContent.trim().toLowerCase();
      let calloutClass = null;
      if (/^à retenir/i.test(h2.textContent.trim())) calloutClass = 'callout-retenir';
      else if (/^exercice/i.test(h2.textContent.trim())) calloutClass = 'callout-exercice';
      if (!calloutClass) return;

      // collect siblings until next h2 or hr
      const wrap = document.createElement('div');
      wrap.className = calloutClass;
      const titleNode = document.createElement('h3');
      titleNode.textContent = h2.textContent.trim();
      titleNode.style.marginTop = '0';
      wrap.appendChild(titleNode);

      let next = h2.nextElementSibling;
      const toMove = [];
      while (next && next.tagName !== 'H2' && next.tagName !== 'HR') {
        toMove.push(next);
        next = next.nextElementSibling;
      }
      h2.parentNode.insertBefore(wrap, h2);
      h2.remove();
      toMove.forEach((node) => wrap.appendChild(node));
    });
  }

  function buildToc(root) {
    const toc = document.querySelector('.toc ul');
    if (!toc) return;
    const headings = root.querySelectorAll('h2, .callout-retenir, .callout-exercice');
    if (!headings.length) {
      const tocBox = document.querySelector('.toc');
      if (tocBox) tocBox.style.display = 'none';
      return;
    }

    toc.innerHTML = '';
    headings.forEach((node) => {
      let label, id;
      if (node.tagName === 'H2') {
        label = node.textContent.trim();
        id = node.id || slug(label);
        node.id = id;
      } else {
        const titleNode = node.querySelector('h3');
        label = titleNode ? titleNode.textContent.trim() : (node.classList.contains('callout-retenir') ? 'À retenir' : 'Exercice');
        id = slug(label);
        node.id = id;
      }
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = label;
      li.appendChild(a);
      toc.appendChild(li);
    });

    // active state on scroll
    const links = toc.querySelectorAll('a');
    const map = new Map();
    links.forEach((l) => {
      const id = l.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, l);
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
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    map.forEach((_, el) => observer.observe(el));
  }

  /* ===== SEANCE PAGE — mark as seen button ===== */
  function hydrateMarkSeen() {
    const btn = document.getElementById('btn-mark-seen');
    if (!btn) return;
    const id = document.body.dataset.seanceId;
    if (!id) return;

    const update = () => {
      const seen = isSeen(id);
      btn.classList.toggle('is-seen', seen);
      btn.querySelector('.label').textContent = seen ? 'Séance vue' : 'Marquer comme vu';
    };
    update();

    btn.addEventListener('click', () => {
      setSeen(id, !isSeen(id));
      update();
    });
  }

  /* ===== Fade-up on scroll ===== */
  function setupFadeUp() {
    const targets = document.querySelectorAll('.fade-up');
    if (!targets.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach((t) => obs.observe(t));
  }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    hydrateHomeCheckboxes();
    refreshProgressUI();
    renderSeanceMarkdown();
    hydrateMarkSeen();
    setupFadeUp();
  });

  document.addEventListener('denem:progress-change', refreshProgressUI);
})();
