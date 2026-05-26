// ===========================
// SUPABASE CLIENT
// ===========================
const SUPABASE_URL  = 'https://yaliibvznvvgmfytnrmy.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbGlpYnZ6bnZ2Z21meXRucm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjMzMDcsImV4cCI6MjA5MTA5OTMwN30.AlZhy8F-1xqPmupPoX2ptBv6-BVhnd79urK1LO8KkCA';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
  planId:    null,   // UUID del plan guardado en Supabase
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
// CREATE PLAN — show loading → generate → navigate to results
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

  // Trackear creación de plan en PostHog
  if (window.posthog) {
    posthog.capture('plan_created', {
      concert:   concert,
      city:      city,
      companion: state.companion,
      budget:    state.budget,
    });
  }

  // 1. Show loading screen immediately
  showScreen('screen-loading');
  startLoadingAnimation();
}

// LOADING SCREEN ANIMATION
function startLoadingAnimation() {
  // Reset steps & bar
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`lstep-${i}`);
    if (el) el.classList.remove('visible');
  });
  const bar = document.getElementById('loading-bar');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '0%';
  }

  // Animate steps appearing one by one
  setTimeout(() => { document.getElementById('lstep-1')?.classList.add('visible'); }, 400);
  setTimeout(() => { document.getElementById('lstep-2')?.classList.add('visible'); }, 900);
  setTimeout(() => { document.getElementById('lstep-3')?.classList.add('visible'); }, 1400);

  // Start progress bar fill
  setTimeout(() => {
    if (bar) {
      bar.style.transition = 'width 2.4s cubic-bezier(0.4, 0, 0.2, 1)';
      bar.style.width = '100%';
    }
  }, 50);

  // Generate plan data
  generatePlan();
  renderResults();

  // Save to Supabase in parallel (no bloqueamos la UI)
  saveToSupabase();

  // After animation completes → navigate to results
  setTimeout(() => {
    showScreen('screen-results');
  }, 2800);
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
// GUARDAR PLAN EN SUPABASE
// ===========================
async function saveToSupabase() {
  try {
    const [year, month, day] = state.date.split('-').map(Number);
    const fechaISO = new Date(year, month - 1, day).toISOString();

    // 1. Insertar en Recitales
    const { data: recital, error: recitalError } = await db
      .from('Recitales')
      .insert({
        artista:    state.concert,
        fecha_hora: fechaISO,
        lugar:      state.city,
      })
      .select()
      .single();

    if (recitalError) throw recitalError;

    // 2. Insertar en Planes (id = recital.id por relación 1:1)
    const outfitTexto = state.plan.outfit.map(o => o.name).join(', ');
    const { data: plan, error: planError } = await db
      .from('Planes')
      .insert({
        id:               recital.id,
        recital_id:       recital.id,
        horario_salida:   state.plan.departureTime + ':00',
        outfit_sugerido:  outfitTexto,
        checklist:        state.plan.checklist,
        clima_info:       `${state.plan.temp}°C - ${state.city}`,
        created_at:       new Date().toISOString(),
      })
      .select()
      .single();

    if (planError) throw planError;

    state.planId = plan.id;
    console.log('✅ Plan guardado en Supabase con ID:', plan.id);

  } catch (err) {
    // No bloqueamos la app si falla el guardado
    console.warn('⚠️ No se pudo guardar en Supabase:', err.message);
  }
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
function getPlanURL() {
  const base = window.location.origin + window.location.pathname;
  return state.planId ? `${base}?plan=${state.planId}` : base;
}

function copyLink() {
  const { concert, city, plan } = state;
  if (!plan) return;

  // Trackear en PostHog
  if (window.posthog) {
    posthog.capture('plan_shared_link', { concert, city, plan_id: state.planId });
  }

  const url = getPlanURL();
  const text =
    `🎵 Mi plan para el recital de ${concert} en ${city}!\n` +
    `✅ Outfit ✅ Horario ✅ Checklist\n` +
    `🕐 Salida: ${plan.departureTime} hs\n` +
    `🔗 Ver plan completo: ${url}\n` +
    `Creado en Recital Planner 🎉`;

  navigator.clipboard.writeText(text)
    .then(() => showToast('¡Link copiado! 🔗📋'))
    .catch(() => showToast('No se pudo copiar 😢'));
}

function shareWhatsApp() {
  const { concert, city, plan } = state;
  if (!plan) return;

  // Trackear en PostHog
  if (window.posthog) {
    posthog.capture('plan_shared_whatsapp', { concert, city, plan_id: state.planId });
  }

  const url = getPlanURL();
  const text =
    `🎵 Mi plan para *${concert}* en ${city}!\n` +
    `✅ Outfit ✅ Horario ✅ Checklist\n` +
    `🕐 Salgo a las ${plan.departureTime} hs en ${plan.transport}\n` +
    `🔗 Ver plan completo: ${url}\n` +
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
// ===========================
// CARGAR PLAN DESDE URL (?plan=UUID)
// ===========================
async function loadPlanFromURL() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan');
  if (!planId) return;

  try {
    showScreen('screen-loading');
    // Forzar barra llena instantánea para modo lectura
    const bar = document.getElementById('loading-bar');
    if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }

    const { data, error } = await db
      .from('Planes')
      .select('*, Recitales(*)')
      .eq('id', planId)
      .single();

    if (error || !data) throw new Error('Plan no encontrado');

    // Reconstruir state desde la base de datos
    const recital = data.Recitales;
    const fechaDate = new Date(recital.fecha_hora);
    state.concert  = recital.artista;
    state.city     = recital.lugar;
    state.date     = fechaDate.toISOString().split('T')[0];
    state.planId   = planId;
    state.plan     = {
      temp:          parseInt(data.clima_info) || 20,
      outfit:        (data.outfit_sugerido || '').split(', ').map(name => ({ icon: '👕', name, detail: '' })),
      departureTime: (data.horario_salida || '18:30').substring(0, 5),
      transport:     'Ver plan completo',
      travelTime:    '',
      checklist:     Array.isArray(data.checklist) ? data.checklist : [],
      formattedDate: formatDate(fechaDate.getFullYear(), fechaDate.getMonth() + 1, fechaDate.getDate()),
      shortDate:     formatShortDate(fechaDate.getDate(), fechaDate.getMonth() + 1),
    };

    renderResults();
    setTimeout(() => showScreen('screen-results'), 800);

    // Trackear visualización de plan compartido
    if (window.posthog) {
      posthog.capture('plan_viewed_from_link', {
        plan_id: planId,
        concert: state.concert,
        city:    state.city,
      });
    }

  } catch (err) {
    console.warn('No se pudo cargar el plan:', err.message);
    showScreen('screen-home');
    showToast('No se encontró ese plan 😢');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSlider();

  // Set today as min date for date input
  const dateInput = document.getElementById('input-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Si la URL tiene ?plan=UUID, cargar ese plan desde Supabase
  loadPlanFromURL();
});
