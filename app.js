// ===========================
// STATE
// ===========================
const state = {
  concert:   '',
  city:      '',
  date:      '',
  companion: 'solo',
  budget:    50000,
  plan:      null,
};

// ===========================
// NAVIGATION
// ===========================
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }
}

// ===========================
// BUDGET SLIDER
// ===========================
function initSlider() {
  const slider  = document.getElementById('budget-slider');
  const display = document.getElementById('budget-display');
  if (!slider || !display) return;

  slider.addEventListener('input', () => {
    state.budget = parseInt(slider.value, 10);
    display.textContent = formatMoney(state.budget);

    const pct = ((state.budget - 10000) / (200000 - 10000)) * 100;
    slider.style.background =
      `linear-gradient(to right, #E87329 ${pct}%, #E8E8E8 ${pct}%)`;
  });
}

// ===========================
// COMPANION SELECTION
// ===========================
function selectCompanion(type) {
  state.companion = type;
  document.querySelectorAll('.companion-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

// ===========================
// CREATE PLAN (validate → generate → render → navigate)
// ===========================
function createPlan() {
  const concert = document.getElementById('input-concert').value.trim();
  const city    = document.getElementById('input-city').value;
  const date    = document.getElementById('input-date').value;

  if (!concert) { showToast('¡Escribí el nombre del recital 🎵'); return; }
  if (!city)    { showToast('¡Seleccioná una ciudad 📍');          return; }
  if (!date)    { showToast('¡Elegí la fecha del evento 📅');      return; }

  state.concert = concert;
  state.city    = city;
  state.date    = date;

  generatePlan();
  renderResults();
  showScreen('screen-results');
}

// ===========================
// GENERATE PLAN DATA
// ===========================
function generatePlan() {
  // Parse date safely (avoid timezone issues)
  const [year, month, day] = state.date.split('-').map(Number);
  const monthNum = month; // 1–12

  // Southern-hemisphere seasons
  let temp;
  if (monthNum >= 12 || monthNum <= 2)      temp = 27; // Summer
  else if (monthNum >= 3 && monthNum <= 5)  temp = 17; // Fall
  else if (monthNum >= 6 && monthNum <= 8)  temp = 9;  // Winter
  else                                       temp = 21; // Spring

  // Outfit suggestion
  let outfit;
  if (temp <= 12) {
    outfit = [
      { icon: '🧥', name: 'Campera de abrigo',   detail: `Clima: ${temp}°C` },
      { icon: '👟', name: 'Zapatillas cómodas',  detail: 'Vas a estar parado mucho tiempo' },
      { icon: '🎒', name: 'Mochila chica',        detail: 'Para tus cosas' },
      { icon: '🧣', name: 'Bufanda/Gorro',        detail: 'Puede hacer frío de noche' },
    ];
  } else if (temp <= 20) {
    outfit = [
      { icon: '🧥', name: 'Campera ligera',      detail: `Clima: ${temp}°C` },
      { icon: '👟', name: 'Zapatillas cómodas', detail: 'Vas a estar parado' },
      { icon: '🎒', name: 'Mochila chica',       detail: 'Para tus cosas' },
    ];
  } else {
    outfit = [
      { icon: '👕', name: 'Remera cómoda',       detail: `Clima: ${temp}°C` },
      { icon: '🕶️', name: 'Anteojos de sol',     detail: 'Si es de día' },
      { icon: '👟', name: 'Zapatillas cómodas', detail: 'Vas a estar parado' },
      { icon: '🎒', name: 'Mochila chica',       detail: 'Para tus cosas' },
    ];
  }

  // Transport by city
  const transports = {
    'Buenos Aires': { mode: 'Subte + Caminata',     time: '45 min' },
    'Córdoba':      { mode: 'Colectivo + Caminata', time: '30 min' },
    'Rosario':      { mode: 'Colectivo + Caminata', time: '25 min' },
    'La Plata':     { mode: 'Colectivo + Caminata', time: '20 min' },
  };
  const transportInfo = transports[state.city] || { mode: 'Remis o colectivo', time: '30 min' };

  // Departure time (fixed demo: 18:30)
  const departureTime = '18:30';

  // Checklist
  const cashAmount = Math.round(state.budget * 0.5 / 1000) * 1000;
  const checklist = [
    'Entrada digital o física',
    'DNI y documento de identidad',
    `Efectivo (${formatMoney(cashAmount)})`,
    'Cargador portátil',
    'Botella de agua reutilizable',
    'Punto de encuentro definido',
    temp >= 23 ? 'Protector solar ☀️' : 'Ropa de abrigo extra 🧤',
  ];

  state.plan = {
    temp,
    outfit,
    departureTime,
    transport:     transportInfo.mode,
    travelTime:    transportInfo.time,
    checklist,
    formattedDate: formatDate(year, month, day),
    shortDate:     formatShortDate(day, month),
  };
}

// ===========================
// RENDER RESULTS SCREEN
// ===========================
function renderResults() {
  const { plan } = state;
  const container = document.getElementById('results-content');
  if (!container) return;

  const outfitHTML = plan.outfit.map(item => `
    <div class="outfit-item">
      <div class="outfit-item-icon">${item.icon}</div>
      <div class="outfit-item-info">
        <strong>${item.name}</strong>
        <span>${item.detail}</span>
      </div>
    </div>
  `).join('');

  const checklistHTML = plan.checklist.map((item, i) => `
    <div class="checklist-item" id="check-${i}" onclick="toggleCheck(${i})" role="checkbox" aria-checked="false" tabindex="0">
      <div class="checklist-checkbox">✓</div>
      <span class="checklist-text">${item}</span>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="results-date-pill">📅 ${plan.formattedDate}</div>
    <h2 class="results-artist">${escapeHTML(state.concert)}</h2>
    <div class="results-city"><span>📍</span>${escapeHTML(state.city)}</div>

    <!-- === OUTFIT === -->
    <div class="result-card card-outfit">
      <div class="card-header">
        <div class="card-icon">👕</div>
        <span class="card-title">Tu Outfit</span>
      </div>
      ${outfitHTML}
    </div>

    <!-- === SCHEDULE === -->
    <div class="result-card card-schedule">
      <div class="card-header">
        <div class="card-icon">⏰</div>
        <span class="card-title">Horario y cómo ir</span>
      </div>
      <div class="schedule-time-block">
        <div>
          <div class="schedule-label">Hora de salida</div>
          <div class="schedule-time">${plan.departureTime}</div>
        </div>
        <div class="schedule-icon">🕡</div>
      </div>
      <div class="schedule-transport">
        <div class="transport-icon">🧭</div>
        <div class="transport-info">
          <strong>${plan.transport}</strong>
          <span>Tiempo estimado: ${plan.travelTime}</span>
        </div>
      </div>
    </div>

    <!-- === CHECKLIST === -->
    <div class="result-card card-checklist">
      <div class="card-header">
        <div class="card-icon">✅</div>
        <span class="card-title">Checklist</span>
      </div>
      ${checklistHTML}
    </div>

    <button class="btn-share" onclick="goToShare()">
      🔗 Compartir plan
    </button>
  `;
}

// ===========================
// CHECKLIST TOGGLE
// ===========================
function toggleCheck(index) {
  const item = document.getElementById(`check-${index}`);
  if (!item) return;
  const isChecked = item.classList.toggle('checked');
  item.setAttribute('aria-checked', String(isChecked));
}

// ===========================
// SHARE SCREEN
// ===========================
function goToShare() {
  renderShare();
  showScreen('screen-share');
}

function renderShare() {
  const card = document.getElementById('share-card');
  if (!card || !state.plan) return;

  card.innerHTML = `
    <div class="share-card-header">
      <div class="share-card-icon">🎵</div>
      <div class="share-card-info">
        <h3>${escapeHTML(state.concert)}</h3>
        <p>${state.plan.shortDate} • ${escapeHTML(state.city)}</p>
      </div>
    </div>
    <div class="share-card-tags">
      <span class="share-tag yellow">Outfit ✓</span>
      <span class="share-tag blue">Horario ✓</span>
      <span class="share-tag orange">Checklist ✓</span>
    </div>
    <div class="share-card-footer">
      <p>Plan creado con <span class="heart">♥</span> en Manija</p>
    </div>
  `;
}

// ===========================
// SHARE ACTIONS
// ===========================
function copyLink() {
  const { concert, city, plan } = state;
  if (!plan) return;

  const text =
    `🎵 Mi plan para el recital de ${concert} en ${city}!\n` +
    `✅ Outfit ✅ Horario ✅ Checklist\n` +
    `🕐 Salida: ${plan.departureTime} hs\n` +
    `Creado en Recital Planner 🎉`;

  navigator.clipboard.writeText(text)
    .then(() => showToast('¡Copiado al portapapeles! 📋'))
    .catch(() => showToast('No se pudo copiar 😢'));
}

function shareWhatsApp() {
  const { concert, city, plan } = state;
  if (!plan) return;

  const text =
    `🎵 Mi plan para *${concert}* en ${city}!\n` +
    `✅ Outfit ✅ Horario ✅ Checklist\n` +
    `🕐 Salgo a las ${plan.departureTime} hs en ${plan.transport}\n` +
    `Creado con Recital Planner 🎉`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function downloadImage() {
  showToast('📸 ¡Función próximamente!');
}

// ===========================
// TOAST NOTIFICATION
// ===========================
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===========================
// HELPER UTILITIES
// ===========================
function formatMoney(amount) {
  return `$${amount.toLocaleString('es-AR')}`;
}

function formatDate(year, month, day) {
  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const date   = new Date(year, month - 1, day);
  return `${days[date.getDay()]}, ${day} de ${months[month - 1]}`;
}

function formatShortDate(day, month) {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${day} de ${months[month - 1]}`;
}

function escapeHTML(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

// ===========================
// KEYBOARD ACCESSIBILITY
// ===========================
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList.contains('checklist-item')) {
    e.target.click();
  }
});

// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  initSlider();

  // Set today as min date for date input
  const dateInput = document.getElementById('input-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }
});
