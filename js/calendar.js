/* ============================================================
   SIDIBE TUTORING – calendar.js
   Virtual appointment calendar with availability & booking
   ============================================================ */

// ── State ────────────────────────────────────────────────────
let calYear, calMonth;
let selectedDate = null;
let selectedSlot = null;

// ── Availability: day-of-week (0=Sun) → time slots ───────────
const AVAILABILITY = {
  0: ['09:00','10:00','11:00'],                                                        // Sun
  1: ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'], // Mon
  2: ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'], // Tue
  3: ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'], // Wed
  4: ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'], // Thu
  5: ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'], // Fri
  6: ['09:00','10:00','11:00','12:00','13:00'],                                          // Sat
};

// ── Pre-generate some "already booked" slots ─────────────────
function buildBookedSlots() {
  const booked = {};
  const today  = new Date();
  // seed with today so it's deterministic within a session
  const seed   = today.getDate() + today.getMonth() * 31;
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    if (!AVAILABILITY[dow]) continue;
    const slots = AVAILABILITY[dow];
    // pseudo-random based on date
    const pRand = ((seed * i * 6271) % 100) / 100;
    if (pRand < 0.45) {
      const dateKey = fmtDate(d);
      booked[dateKey] = [];
      const count = pRand < 0.2 ? slots.length : Math.ceil(slots.length * 0.5);
      for (let s = 0; s < count; s++) {
        if (!booked[dateKey].includes(slots[s])) booked[dateKey].push(slots[s]);
      }
    }
  }
  return booked;
}

const BOOKED = buildBookedSlots();

// ── Utility: format Date → 'YYYY-MM-DD' ──────────────────────
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Utility: '16:00' → '4:00 PM' ────────────────────────────
function fmt12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12    = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${suffix}`;
}
function fmt24fr(time24) {
  return time24.replace(':', 'h');  // 16:00 → 16h00
}

function formatTimeByLang(time24) {
  return currentLang === 'fr' ? fmt24fr(time24) : fmt12(time24);
}

// ── Day status helpers ────────────────────────────────────────
function isDayAvailable(date) {
  const today = new Date(); today.setHours(0,0,0,0);
  return date >= today && !!AVAILABILITY[date.getDay()];
}
function getDayStatus(date) {
  if (!isDayAvailable(date)) return 'unavailable';
  const key    = fmtDate(date);
  const slots  = AVAILABILITY[date.getDay()];
  const booked = BOOKED[key] || [];
  if (booked.length >= slots.length) return 'fully-booked';
  if (booked.length >= slots.length * 0.6) return 'limited';
  return 'available';
}

// ── Render calendar grid ──────────────────────────────────────
function renderCalendar() {
  const tr   = translations[currentLang] || translations['en'];
  const grid = document.getElementById('calGrid');
  const title= document.getElementById('calMonthTitle');
  if (!grid) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth + 1, 0);

  // Month/year title
  title.textContent = `${tr.cal_months[calMonth]} ${calYear}`;

  let html = '';

  // Day-of-week headers
  tr.cal_days.forEach(d => {
    html += `<div class="cal-day-header">${d}</div>`;
  });

  // Blank cells before month starts
  for (let i = 0; i < firstDay.getDay(); i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  // Day cells
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date    = new Date(calYear, calMonth, day);
    const dateStr = fmtDate(date);
    const isToday = fmtDate(today) === dateStr;

    let cls = 'cal-day';
    if (date < today) {
      cls += ' past';
    } else {
      const status = getDayStatus(date);
      cls += ` ${status}`;
    }
    if (isToday) cls += ' today';
    if (selectedDate === dateStr) cls += ' selected';

    const clickable = date >= today && !!AVAILABILITY[date.getDay()] && getDayStatus(date) !== 'fully-booked';
    const onclick   = clickable ? `onclick="selectDate('${dateStr}')"` : '';

    html += `<div class="${cls}" ${onclick}>${day}</div>`;
  }

  grid.innerHTML = html;
}

// ── Navigate months ───────────────────────────────────────────
function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// ── Select a date ─────────────────────────────────────────────
function selectDate(dateStr) {
  selectedDate = dateStr;
  selectedSlot = null;
  renderCalendar();
  renderSlots(dateStr);
  updateSteps(1);

  // Scroll to slots on mobile
  const slotsEl = document.getElementById('slotsSection');
  if (slotsEl && window.innerWidth < 768) {
    slotsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Render time slots ─────────────────────────────────────────
function renderSlots(dateStr) {
  const tr       = translations[currentLang] || translations['en'];
  const section  = document.getElementById('slotsSection');
  const title    = document.getElementById('slotsTitle');
  const grid     = document.getElementById('slotsGrid');
  if (!section || !grid) return;

  section.style.display = 'block';

  const date   = new Date(dateStr + 'T00:00:00');
  const dow    = date.getDay();
  const slots  = AVAILABILITY[dow] || [];
  const booked = BOOKED[dateStr]   || [];

  // Format date for title
  const months = tr.cal_months;
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const daysFr = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const dayName = currentLang === 'fr' ? daysFr[dow] : days[dow];
  const [y, mo, d] = dateStr.split('-');
  const dateLabel  = currentLang === 'fr'
    ? `${dayName} ${parseInt(d)} ${months[parseInt(mo)-1]} ${y}`
    : `${dayName}, ${months[parseInt(mo)-1]} ${parseInt(d)}, ${y}`;

  title.textContent = `${tr.slots_title} — ${dateLabel}`;

  if (!slots.length) {
    grid.innerHTML = `<p class="slots-empty">${tr.slots_none}</p>`;
    return;
  }

  let html = '';
  slots.forEach(slot => {
    const isBooked   = booked.includes(slot);
    const isSelected = selectedSlot === slot;
    const label      = formatTimeByLang(slot);
    if (isBooked) {
      html += `<div class="slot-btn booked">${label}</div>`;
    } else {
      html += `<div class="slot-btn available${isSelected ? ' selected' : ''}" onclick="selectSlot('${slot}')">${label}</div>`;
    }
  });
  grid.innerHTML = html;
}

// ── Select a time slot ────────────────────────────────────────
function selectSlot(slot) {
  selectedSlot = slot;
  renderSlots(selectedDate);
  showBookingForm();
  updateSteps(2);
}

// ── Show booking form ─────────────────────────────────────────
function showBookingForm() {
  const tr      = translations[currentLang] || translations['en'];
  const section = document.getElementById('bookingFormSection');
  if (!section) return;

  section.classList.add('show');

  // Update selected info label
  const infoEl = document.getElementById('bookingSelectedInfo');
  if (infoEl) {
    const [y, mo, d] = selectedDate.split('-');
    const months     = tr.cal_months;
    const dateLabel  = currentLang === 'fr'
      ? `${parseInt(d)} ${months[parseInt(mo)-1]} ${y} à ${fmt24fr(selectedSlot)}`
      : `${months[parseInt(mo)-1]} ${parseInt(d)}, ${y} at ${fmt12(selectedSlot)}`;
    infoEl.textContent = dateLabel;
  }

  // Update select options language
  updateBookingFormLang();

  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Update booking form language labels ───────────────────────
function updateBookingFormLang() {
  const tr  = translations[currentLang] || translations['en'];
  const map = {
    'bName':    ['data-i18n','booking_name'],
    'bEmail':   ['data-i18n','booking_email'],
    'bPhone':   ['data-i18n','booking_phone'],
    'bAge':     ['data-i18n','booking_age'],
    'bSubject': ['data-i18n','booking_subject'],
    'bLevel':   ['data-i18n','booking_level'],
    'bType':    ['data-i18n','booking_type'],
    'bNotes':   ['data-i18n','booking_notes'],
  };
  // Placeholders
  const phs = {
    'bNameInput':    'booking_name_ph',
    'bEmailInput':   'booking_email_ph',
    'bPhoneInput':   'booking_phone_ph',
    'bAgeInput':     'booking_age_ph',
    'bNotesInput':   'booking_notes_ph',
  };
  Object.entries(phs).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && tr[key]) el.placeholder = tr[key];
  });
}

// ── Booking form submission ───────────────────────────────────
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const tr = translations[currentLang] || translations['en'];

    const name    = document.getElementById('bNameInput').value.trim();
    const email   = document.getElementById('bEmailInput').value.trim();
    const age     = parseInt(document.getElementById('bAgeInput').value, 10);
    const subject = document.getElementById('bSubjectSel').value;
    const type    = document.getElementById('bTypeSel').value;

    if (!name || !email || !age || !subject || !type) {
      showBookingError(tr.booking_req_error);
      return;
    }
    if (!isValidEmail(email)) {
      showBookingError(currentLang === 'fr'
        ? 'Adresse courriel invalide.'
        : 'Invalid email address.');
      return;
    }
    if (age < 5 || age > 65 || isNaN(age)) {
      showBookingError(tr.booking_age_error);
      return;
    }

    // Build mailto
    const [y, mo, d] = selectedDate.split('-');
    const months  = tr.cal_months;
    const dateStr = `${months[parseInt(mo)-1]} ${parseInt(d)}, ${y}`;
    const timeStr = formatTimeByLang(selectedSlot);
    const notes   = document.getElementById('bNotesInput').value.trim();
    const level   = document.getElementById('bLevelSel').value;
    const phone   = document.getElementById('bPhoneInput').value.trim();

    const bodyLines = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      `Age: ${age}`,
      `Subject: ${subject}`,
      `Level: ${level}`,
      `Session Type: ${type}`,
      `Requested Date: ${dateStr}`,
      `Requested Time: ${timeStr}`,
      notes ? `\nNotes: ${notes}` : '',
    ].filter(Boolean).join('\n');

    const mailto = `mailto:ms8395074@gmail.com?subject=Tutoring Appointment Request – ${subject}&body=${encodeURIComponent(bodyLines)}`;
    window.location.href = mailto;

    // Show success
    document.getElementById('bookingForm').style.display = 'none';
    const successEl = document.getElementById('bookingSuccess');
    if (successEl) successEl.style.display = 'block';
    updateSteps(3);
  });
}

function showBookingError(msg) {
  const el = document.getElementById('bookingError');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

// ── Steps indicator ───────────────────────────────────────────
function updateSteps(activeStep) {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 < activeStep) el.classList.add('done');
    if (i + 1 === activeStep) el.classList.add('active');
  });
  document.querySelectorAll('.step-line').forEach((el, i) => {
    el.classList.toggle('done', i + 1 < activeStep);
  });
}

// ── Init calendar ─────────────────────────────────────────────
function initCalendar() {
  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();

  renderCalendar();
  updateSteps(1);

  document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
  document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);

  initBookingForm();
}

document.addEventListener('DOMContentLoaded', initCalendar);
