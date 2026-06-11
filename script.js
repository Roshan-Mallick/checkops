(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.nav');

    /* ——— 1. Scroll-based nav styling ——— */
    if (nav) {
      const SCROLL_THRESHOLD = 60;
      window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
      }, { passive: true });
    }

    /* ——— 2. Smooth scroll for anchor links ——— */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL without jumping
        history.pushState(null, '', id);
      });
    });

    /* ——— 3. IntersectionObserver scroll-reveal fallback ——— */
    const hasScrollDriven = CSS.supports?.(
      '(animation-timeline: view()) and (animation-range: entry)'
    );

    if (!hasScrollDriven) {
      const reveals = document.querySelectorAll('.reveal');
      if (reveals.length) {
        const observer = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        reveals.forEach(el => observer.observe(el));
      }
    }

    /* ——— 4. Hero progress-bar animation ——— */
    const progressFill = document.querySelector('.hero-progress-fill');
    if (progressFill) {
      const TARGET = 75;        // percent
      const DURATION = 1500;    // ms
      const easeOutCubic = t => 1 - (1 - t) ** 3;
      let start = null;

      const animate = (ts) => {
        start ??= ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / DURATION, 1);
        progressFill.style.width = `${easeOutCubic(progress) * TARGET}%`;
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }

    /* ——— 5. Mobile nav toggle ——— */
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      const close = () => navLinks.classList.remove('open');

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');
      });

      // Close on link click
      navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', close)
      );

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && e.target !== toggle) close();
      });
    }
  });
})();