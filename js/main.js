/* ============================================================
   SIDIBE TUTORING – main.js
   Handles: language switching, navbar scroll, mobile menu,
            contact form submission
   ============================================================ */

// ── Current language ────────────────────────────────────────
let currentLang = localStorage.getItem('sidibe_lang') || 'es';

// ── Apply translations to the page ──────────────────────────
function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined && !Array.isArray(t[key])) {
      // Use innerHTML for elements that may contain HTML
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t[key];
      } else {
        el.innerHTML = t[key];
      }
    }
  });

  // Update placeholder attributes
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // Update <html lang> attribute
  document.documentElement.lang = lang;

  // Update page title if key exists
  const pageKey = document.body.getAttribute('data-page');
  if (pageKey && t[pageKey]) document.title = t[pageKey];
}

// ── Switch language ──────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('sidibe_lang', lang);

  // Toggle active button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  applyTranslations(lang);

  // Re-render calendar if on schedule page
  if (typeof renderCalendar === 'function') {
    renderCalendar();
  }
}

// ── Navbar scroll effect ─────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Set active nav link based on current page
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ── Mobile menu ──────────────────────────────────────────────
function toggleMenu() {
  const navLinks  = document.getElementById('navLinks');
  const hamburger = document.getElementById('hamburger');
  if (!navLinks) return;
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
}

// Close menu when a nav link is clicked
document.addEventListener('click', e => {
  if (e.target.classList.contains('nav-link')) {
    const navLinks  = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    if (navLinks) navLinks.classList.remove('open');
    if (hamburger) hamburger.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ── Contact Form ─────────────────────────────────────────────
function initContactForm() {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = translations[currentLang];

    const name    = form.querySelector('#cName').value.trim();
    const email   = form.querySelector('#cEmail').value.trim();
    const subject = form.querySelector('#cSubject').value;
    const message = form.querySelector('#cMessage').value.trim();

    if (!name || !email || !subject || !message) {
      showFormError('contactError', t.form_error);
      return;
    }
    if (!isValidEmail(email)) {
      showFormError('contactError', currentLang === 'fr'
        ? 'Veuillez entrer une adresse courriel valide.'
        : 'Please enter a valid email address.');
      return;
    }

    // Build mailto link as a lightweight "send"
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}`
    );
    const mailto = `mailto:ms8395074@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailto;

    // Show success feedback
    form.style.display = 'none';
    if (success) success.style.display = 'block';
  });
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Scroll reveal (lightweight) ──────────────────────────────
function initScrollReveal() {
  const cards = document.querySelectorAll('.subject-card, .why-card, .timeline-item');
  if (!cards.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = `opacity .5s ease ${i * 0.08}s, transform .5s ease ${i * 0.08}s`;
    io.observe(card);
  });
}

// ── Helper: translate a single key ───────────────────────────
function t(key) {
  return (translations[currentLang] || translations['en'])[key] || key;
}

// ── Init on DOM ready ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  applyTranslations(currentLang);
  initContactForm();
  initScrollReveal();

  // Set correct active language button
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
  });
});
