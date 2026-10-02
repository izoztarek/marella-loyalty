/* ==========================================================================
   DR. [NAME] — PERSONAL PORTFOLIO · script.js
   --------------------------------------------------------------------------
   Vanilla JavaScript, no dependencies.
   Content and image paths are edited in the SITE CONFIG block in index.html.

   1.  Helpers
   2.  Content binding     (fills text & links from SITE CONFIG)
   3.  Images              (loads images, keeps placeholders when missing)
   4.  Intro curtain
   5.  Scroll reveals
   6.  Navigation & mobile menu
   7.  Parallax
   8.  Timeline progress
   9.  Before / After sliders
   10. Case-study modal
   11. Counters
   12. Cursor follower
   13. Init
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     1. HELPERS
     ---------------------------------------------------------------------- */
  const SITE = window.SITE || {};
  const root = document.documentElement;
  const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), SITE);
  const isFilled = (v) => typeof v === 'string' && v.trim() !== '' && !/[[\]]/.test(v);
  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  // Hide reveal targets only when JS is running and motion is allowed.
  if (motionOK) root.classList.add('is-ready');


  /* ----------------------------------------------------------------------
     2. CONTENT BINDING
     data-text="doctor.name"         → sets text
     data-href="social.instagramUrl" → sets link (external links open in a new tab)
     data-mailto="contact.email"     → mailto: link (once a real email is set)
     data-tel="contact.phone"        → tel: link (once a real number is set)
     ---------------------------------------------------------------------- */
  function bindContent() {
    $$('[data-text]').forEach((el) => {
      const v = get(el.dataset.text);
      if (typeof v === 'string' && v.trim()) el.textContent = v;
    });

    $$('[data-href]').forEach((el) => {
      const v = get(el.dataset.href);
      if (typeof v !== 'string' || !v.trim() || v === '#') return;
      el.setAttribute('href', v);
      if (/^https?:\/\//i.test(v)) {
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
    });

    $$('[data-mailto]').forEach((el) => {
      const v = get(el.dataset.mailto);
      if (isFilled(v)) el.href = 'mailto:' + v.trim();
    });

    $$('[data-tel]').forEach((el) => {
      const v = get(el.dataset.tel);
      if (isFilled(v)) el.href = 'tel:' + v.replace(/[^\d+]/g, '');
    });

    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }


  /* ----------------------------------------------------------------------
     3. IMAGES
     Each [data-img] slot looks up its path in SITE.images.
     If the file loads, it fades in over the placeholder.
     If it is missing, the labelled placeholder simply stays.
     ---------------------------------------------------------------------- */
  function setMedia(el, src) {
    const old = el.querySelector('.media__img');
    if (old) old.remove();
    el.classList.remove('has-image');
    if (!src) { el.removeAttribute('data-file'); return; }

    el.dataset.file = src.split('/').pop();

    const img = document.createElement('img');
    img.className = 'media__img';
    img.alt = '';                       // the slot itself carries the alt text
    img.decoding = 'async';
    img.loading = el.hasAttribute('data-eager') ? 'eager' : 'lazy';
    img.addEventListener('load', () => el.classList.add('has-image'), { once: true });
    img.addEventListener('error', () => img.remove(), { once: true });
    img.src = src;
    el.appendChild(img);
  }

  function initMedia() {
    const images = SITE.images || {};
    $$('[data-img]').forEach((el) => {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', el.dataset.alt || el.dataset.label || '');
      setMedia(el, images[el.dataset.img]);
    });
  }


  /* ----------------------------------------------------------------------
     4. INTRO CURTAIN
     ---------------------------------------------------------------------- */
  function initIntro() {
    const intro = $('.intro');
    if (!intro || !motionOK) {
      if (intro) intro.remove();
      root.classList.add('is-loaded');
      return;
    }

    const start = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      const wait = Math.max(0, 1250 - (performance.now() - start));
      setTimeout(() => {
        intro.classList.add('is-done');
        root.classList.add('is-loaded');
        setTimeout(() => intro.remove(), 1300);
      }, wait);
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    setTimeout(finish, 2400); // never wait on slow assets
  }


  /* ----------------------------------------------------------------------
     5. SCROLL REVEALS
     ---------------------------------------------------------------------- */
  function initReveals() {
    // Stagger children of [data-stagger]
    $$('[data-stagger]').forEach((parent) => {
      Array.from(parent.children).forEach((child, i) => {
        child.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
      });
    });

    const els = $$('[data-reveal]');
    if (!motionOK || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });

    els.forEach((el) => io.observe(el));
  }


  /* ----------------------------------------------------------------------
     6. NAVIGATION & MOBILE MENU
     ---------------------------------------------------------------------- */
  function initNav() {
    const nav = $('.nav');
    const toggle = $('.nav__toggle');
    const menu = $('#menu');
    if (!nav) return () => {};

    // Mobile menu
    if (toggle && menu) {
      const label = $('.nav__toggle-label', toggle);
      menu.inert = true;

      const setMenu = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        if (label) label.textContent = open ? 'Close' : 'Menu';
        menu.classList.toggle('is-open', open);
        menu.setAttribute('aria-hidden', String(!open));
        menu.inert = !open;
        root.classList.toggle('menu-open', open);
        root.classList.toggle('is-locked', open);
        if (open) nav.classList.remove('is-hidden');
      };

      toggle.addEventListener('click', () => {
        setMenu(toggle.getAttribute('aria-expanded') !== 'true');
      });
      menu.addEventListener('click', (e) => {
        if (e.target.closest('a')) setMenu(false);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && root.classList.contains('menu-open')) {
          setMenu(false);
          toggle.focus();
        }
      });
      window.matchMedia('(min-width: 1180px)').addEventListener('change', (m) => {
        if (m.matches) setMenu(false);
      });
    }

    // Active link highlighting
    const links = $$('.nav__links a, .menu__links a');
    const ids = new Set(links.map((a) => a.getAttribute('href')));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // Sections without their own nav link highlight their parent (data-nav)
          const href = entry.target.dataset.nav || '#' + entry.target.id;
          if (!ids.has(href)) return;
          links.forEach((a) => {
            const active = a.getAttribute('href') === href;
            a.classList.toggle('is-active', active);
            if (active) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section[id]').forEach((s) => io.observe(s));
    }

    // Glass state + hide on scroll down / show on scroll up
    let lastY = window.scrollY;
    return function onScroll() {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
      if (!root.classList.contains('menu-open') && !root.classList.contains('modal-open')) {
        if (y > lastY + 2 && y > 480) nav.classList.add('is-hidden');
        else if (y < lastY - 2 || y <= 480) nav.classList.remove('is-hidden');
      }
      lastY = y;
    };
  }


  /* ----------------------------------------------------------------------
     7. PARALLAX  — data-parallax="-0.1" (negative = slower than scroll)
     ---------------------------------------------------------------------- */
  function initParallax() {
    if (!motionOK) return () => {};
    const items = $$('[data-parallax]').map((el) => ({
      el,
      speed: parseFloat(el.dataset.parallax) || 0
    }));

    return function update() {
      const vh = window.innerHeight;
      items.forEach(({ el, speed }) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };
  }


  /* ----------------------------------------------------------------------
     8. TIMELINE PROGRESS
     ---------------------------------------------------------------------- */
  function initTimeline() {
    const tl = $('.timeline');
    if (!tl) return () => {};
    const items = $$('.tl', tl);

    return function update() {
      const mark = window.innerHeight * 0.62;
      const r = tl.getBoundingClientRect();
      const p = clamp((mark - r.top) / r.height, 0, 1);
      tl.style.setProperty('--progress', p.toFixed(3));
      items.forEach((item) => {
        item.classList.toggle('is-active', item.getBoundingClientRect().top + 14 < mark);
      });
    };
  }


  /* ----------------------------------------------------------------------
     9. BEFORE / AFTER SLIDERS
     Pointer drag (mouse, touch, pen) + keyboard via the hidden range input.
     Movement is eased with requestAnimationFrame for a smooth feel.
     ---------------------------------------------------------------------- */
  function initCompare() {
    $$('[data-compare]').forEach((ba) => {
      const range = $('.ba__range', ba);
      let target = 50;
      let current = 50;
      let raf = null;
      let dragging = false;
      let pendingTouch = null;

      const render = () => {
        current += (target - current) * (motionOK ? 0.24 : 1);
        if (Math.abs(target - current) < 0.04) current = target;
        ba.style.setProperty('--pos', current.toFixed(2) + '%');
        raf = current !== target ? requestAnimationFrame(render) : null;
      };

      const setTarget = (v) => {
        target = clamp(v, 0, 100);
        if (range) {
          range.value = Math.round(target);
          range.setAttribute('aria-valuetext', `${Math.round(target)}% before, ${100 - Math.round(target)}% after`);
        }
        if (!raf) raf = requestAnimationFrame(render);
      };

      const pctFrom = (e) => {
        const r = ba.getBoundingClientRect();
        return ((e.clientX - r.left) / r.width) * 100;
      };

      ba.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        ba.classList.add('is-dragging');
        try { ba.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
        // On touch, wait for the first move so a vertical scroll doesn't jump the slider
        if (e.pointerType === 'touch') pendingTouch = e.clientX;
        else setTarget(pctFrom(e));
      });

      ba.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        if (pendingTouch !== null) {
          if (Math.abs(e.clientX - pendingTouch) < 4) return;
          pendingTouch = null;
        }
        setTarget(pctFrom(e));
      });

      const end = () => {
        if (pendingTouch !== null && dragging) {
          // A simple tap: move to that point
          pendingTouch = null;
        }
        dragging = false;
        ba.classList.remove('is-dragging');
      };
      ba.addEventListener('pointerup', end);
      ba.addEventListener('pointercancel', end);
      ba.addEventListener('lostpointercapture', end);

      if (range) {
        range.addEventListener('input', () => setTarget(parseFloat(range.value)));
        setTarget(50);
      }

      // A gentle hint the first time the slider comes into view
      if (motionOK && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          setTimeout(() => { if (!dragging) setTarget(64); }, 500);
          setTimeout(() => { if (!dragging) setTarget(50); }, 1250);
        }, { threshold: 0.6 });
        io.observe(ba);
      }
    });
  }


  /* ----------------------------------------------------------------------
     10. CASE-STUDY MODAL
     Reads each case's content straight from its <article> in the HTML.
     ---------------------------------------------------------------------- */
  function trapFocus(e, container) {
    const focusables = $$('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])', container)
      .filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function initCases() {
    const cases = $$('[data-case]');
    const modal = $('#caseModal');
    if (!cases.length || !modal) return;

    const images = SITE.images || {};
    const body = $('.modal__body', modal);
    const ui = {
      index: $('#modalIndex'), total: $('#modalTotal'),
      eyebrow: $('#modalEyebrow'), title: $('#modalTitle'),
      treatment: $('#modalTreatment'), desc: $('#modalDesc'),
      details: $('#modalDetails'),
      hero: $('#modalHero'), before: $('#modalBefore'), after: $('#modalAfter')
    };
    const background = [$('main'), $('.nav'), $('.footer'), $('#menu')].filter(Boolean);

    let current = 0;
    let returnFocus = null;
    let closeTimer = null;

    const text = (el, sel) => { const n = $(sel, el); return n ? n.textContent.trim() : ''; };

    ui.total.textContent = pad(cases.length);

    const fill = (i) => {
      const c = cases[i];
      const num = pad(i + 1);
      const title = text(c, '.case__title');
      ui.index.textContent = num;
      ui.eyebrow.textContent = text(c, '.case__num') || `Case ${num}`;
      ui.title.textContent = title;
      ui.treatment.textContent = text(c, '.case__treatment');
      ui.desc.textContent = text(c, '.case__desc');
      const details = $('.case__details', c);
      ui.details.innerHTML = details ? details.innerHTML : '';

      const mediaKey = ($('.case__media', c) || {}).dataset?.img;
      ui.hero.dataset.label = `Case Image ${num}`;
      ui.before.dataset.label = `Before ${num}`;
      ui.after.dataset.label = `After ${num}`;
      ui.hero.setAttribute('aria-label', `${title} — case image`);
      ui.before.setAttribute('aria-label', `${title} — before`);
      ui.after.setAttribute('aria-label', `${title} — after`);
      setMedia(ui.hero, images[mediaKey]);
      setMedia(ui.before, images[c.dataset.before]);
      setMedia(ui.after, images[c.dataset.after]);
      body.scrollTop = 0;
    };

    const open = (i, trigger) => {
      clearTimeout(closeTimer);
      current = i;
      fill(i);
      returnFocus = trigger || null;
      modal.hidden = false;
      root.classList.add('is-locked', 'modal-open');
      background.forEach((el) => { el.inert = true; });
      requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
      $('.modal__close', modal).focus({ preventScroll: true });
    };

    const close = () => {
      modal.classList.remove('is-open');
      root.classList.remove('is-locked', 'modal-open');
      background.forEach((el) => { el.inert = false; });
      const menu = $('#menu');
      if (menu && !menu.classList.contains('is-open')) menu.inert = true;
      closeTimer = setTimeout(() => { modal.hidden = true; }, motionOK ? 1000 : 0);
      if (returnFocus) returnFocus.focus({ preventScroll: true });
    };

    const go = (dir) => {
      const next = (current + dir + cases.length) % cases.length;
      if (!motionOK) { current = next; fill(next); return; }
      body.classList.add('is-switching');
      setTimeout(() => {
        current = next;
        fill(next);
        body.classList.remove('is-switching');
      }, 300);
    };

    cases.forEach((c, i) => {
      const btn = $('.case__link', c);
      if (btn) btn.setAttribute('aria-label', `Open case study: ${text(c, '.case__title')}`);
      c.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        open(i, btn);
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) close();
      else if (e.target.closest('[data-prev]')) go(-1);
      else if (e.target.closest('[data-next]')) go(1);
    });

    document.addEventListener('keydown', (e) => {
      if (modal.hidden || !modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') trapFocus(e, modal);
    });
  }


  /* ----------------------------------------------------------------------
     11. COUNTERS — data-count-of=".selector" counts matching elements
     ---------------------------------------------------------------------- */
  function initCounters() {
    const els = $$('[data-count-of]');
    els.forEach((el) => {
      const n = $$(el.dataset.countOf).length;
      el.dataset.count = n;
      el.textContent = pad(n);
    });
    if (!motionOK || !('IntersectionObserver' in window)) return;

    const run = (el) => {
      const end = parseInt(el.dataset.count, 10) || 0;
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = pad(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 1 });
    els.forEach((el) => { el.textContent = '00'; io.observe(el); });
  }


  /* ----------------------------------------------------------------------
     12. CURSOR FOLLOWER — desktop only, appears over [data-cursor]
     ---------------------------------------------------------------------- */
  function initCursor() {
    if (!finePointer || !motionOK) return;

    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    root.classList.add('has-cursor');

    let x = -200, y = -200, tx = -200, ty = -200;
    let running = false;
    let seen = false;

    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) requestAnimationFrame(loop);
      else running = false;
    };

    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { x = tx; y = ty; seen = true; }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (!t) return;
      cursor.textContent = t.dataset.cursor;
      cursor.classList.add('is-active');
    });
    document.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cursor.classList.remove('is-active');
    });
  }


  /* ----------------------------------------------------------------------
     13. INIT
     ---------------------------------------------------------------------- */
  function init() {
    bindContent();
    initMedia();
    initIntro();
    initReveals();
    initCases();
    initCompare();
    initCounters();
    initCursor();

    const onScrollFns = [initNav(), initParallax(), initTimeline()];
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        onScrollFns.forEach((fn) => fn());
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
