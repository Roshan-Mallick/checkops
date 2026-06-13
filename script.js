(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.nav');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ——— 1. Scroll-based nav styling ——— */
    if (nav) {
      const SCROLL_THRESHOLD = 60;
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            nav.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
            ticking = false;
          });
          ticking = true;
        }
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
        history.pushState(null, '', id);
      });
    });

    /* ——— 3. IntersectionObserver scroll-reveal with stagger ——— */
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
        { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
      );
      reveals.forEach(el => observer.observe(el));
    }

    /* ——— 4. Hero progress-bar animation ——— */
    const progressFill = document.querySelector('.hero-progress-fill');
    if (progressFill && !prefersReducedMotion) {
      const TARGET = 75;
      const DURATION = 1500;
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
    } else if (progressFill) {
      progressFill.style.width = '75%';
    }

    /* ——— 5. Mobile nav toggle ——— */
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
      const close = () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      };

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) close();
      });

      // Close on link click
      navLinks.querySelectorAll('a').forEach(a =>
        a.addEventListener('click', close)
      );

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && e.target !== toggle) close();
      });

      // Set initial aria state
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();