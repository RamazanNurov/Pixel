const API = 'http://127.0.0.1:8000/api';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = { cargo: [], ports: [], routes: [], documents: [], prediction: null };
let accessToken = localStorage.getItem('sct_access');
let refreshToken = localStorage.getItem('sct_refresh');
let liveMap;
let mapLayers = [];
const cargoMarkers = new Map();

async function api(path, options = {}) {
  const headers = {'Content-Type': 'application/json', ...(options.headers || {})};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let response = await fetch(`${API}${path}`, {...options, headers});
  if (response.status === 401 && refreshToken && !path.includes('/auth/')) {
    const renewed = await fetch(`${API}/auth/refresh/`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({refresh:refreshToken})});
    if (renewed.ok) { const tokens = await renewed.json(); saveTokens(tokens); headers.Authorization = `Bearer ${accessToken}`; response = await fetch(`${API}${path}`, {...options, headers}); }
  }
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
function saveTokens(tokens) { accessToken = tokens.access; refreshToken = tokens.refresh || refreshToken; localStorage.setItem('sct_access', accessToken); if (tokens.refresh) localStorage.setItem('sct_refresh', refreshToken); }
function clearTokens() { accessToken = null; refreshToken = null; localStorage.removeItem('sct_access'); localStorage.removeItem('sct_refresh'); }
function showAuthError(id, message) { $(id).textContent = message; }
function setAuthenticated(user) {
  $('#auth-gate').classList.add('hidden');
  const displayName = user.first_name || user.username;
  $('#user-chip').textContent = displayName;
  $('#sidebar-username').textContent = displayName;
  $('#sidebar-email').textContent = user.email || 'email не указан';
  $('#sidebar-role').textContent = user.is_staff ? 'admin' : 'logistics user';
  $('#user-avatar').textContent = displayName.slice(0, 1).toUpperCase();
}
async function loadCurrentUser() { const user = await api('/auth/me/'); setAuthenticated(user); await loadData(); }
async function login(event) { event.preventDefault(); const form = new FormData(event.target); try { const tokens = await api('/auth/login/', {method:'POST', body:JSON.stringify({username:form.get('username'), password:form.get('password')})}); saveTokens(tokens); showAuthError('#login-error', ''); await loadCurrentUser(); } catch (error) { showAuthError('#login-error', 'Неверный логин или пароль.'); } }
async function register(event) { event.preventDefault(); const form = new FormData(event.target); try { const result = await api('/auth/register/', {method:'POST', body:JSON.stringify(Object.fromEntries(form.entries()))}); saveTokens(result); showAuthError('#register-error', ''); await loadCurrentUser(); } catch (error) { showAuthError('#register-error', 'Проверьте данные: пароль минимум 8 символов, логин уникален.'); } }
async function logout() { try { if (refreshToken) await api('/auth/logout/', {method:'POST', body:JSON.stringify({refresh:refreshToken})}); } catch (error) {} clearTokens(); location.reload(); }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 3200); }
function statusLabel(status) { return {in_transit:'В пути', delayed:'Задержан', created:'Создан', delivered:'Доставлен', inspection:'На проверке'}[status] || status; }
function riskClass(value) { return value >= .67 ? 'risk-high' : value >= .34 ? 'risk-mid' : 'risk-low'; }
function initLiveMap() {
  if (!window.L || liveMap) return;
  const canvas = $('.map-canvas');
  if (!canvas) return;
  // Remove the old decorative SVG route completely: the panel must contain
  // only the real geographic map and its live overlays.
  canvas.innerHTML = '<div id="live-map"></div>';
  const mapNode = $('#live-map');
  liveMap = L.map(mapNode, {zoomControl: false, attributionControl: true, maxBounds: [[34, 43], [48, 57]], maxBoundsViscosity: 0.85}).setView([40.5, 50.1], 5);
  L.control.zoom({position: 'topright'}).addTo(liveMap);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18, crossOrigin: true, attribution: '&copy; OpenStreetMap'}).addTo(liveMap);
}
function renderLiveMap() {
  initLiveMap();
  if (!liveMap) return;
  mapLayers.forEach(layer => liveMap.removeLayer(layer)); mapLayers = [];
  const coordinates = state.ports.filter(port => Number.isFinite(port.latitude) && Number.isFinite(port.longitude)).map(port => [port.latitude, port.longitude]);
  state.ports.forEach(port => {
    const marker = L.circleMarker([port.latitude, port.longitude], {radius: 7, className: 'port-dot', color: port.is_active ? '#4de2de' : '#ff7184', fillColor: port.is_active ? '#4de2de' : '#ff7184', fillOpacity: 1, weight: 2}).addTo(liveMap).bindTooltip(`${port.code} · ${port.name}`);
    mapLayers.push(marker);
  });
  if (coordinates.length > 1) mapLayers.push(L.polyline(coordinates, {color:'#748198', weight:2, dashArray:'7 8', opacity:.8}).addTo(liveMap));
  let firstCargoPosition;
  state.cargo.forEach(cargo => {
    const origin = state.ports.find(port => port.id === cargo.origin);
    const lat = Number(cargo.current_latitude) || origin?.latitude || 42.98;
    const lng = Number(cargo.current_longitude) || origin?.longitude || 47.5;
    if (!firstCargoPosition) firstCargoPosition = [lat, lng];
    const cargoMarker = L.circleMarker([lat, lng], {radius: 8, className:'cargo-dot', color:'#f0ddff', fillColor:cargo.status === 'delayed' ? '#ffb84d' : '#b870ff', fillOpacity:1, weight:2}).addTo(liveMap).bindTooltip(`${cargo.container_number} · ${statusLabel(cargo.status)}`, {direction:'top'});
    mapLayers.push(cargoMarker);
    cargoMarkers.set(cargo.container_number, cargoMarker);
  });
  if (firstCargoPosition) liveMap.setView(firstCargoPosition, 5);
  setTimeout(() => liveMap.invalidateSize(), 100);
}
function focusCargo(containerNumber) {
  const cargo = state.cargo.find(item => item.container_number === containerNumber);
  const marker = cargoMarkers.get(containerNumber);
  if (!cargo || !marker || !liveMap) return;
  liveMap.setView(marker.getLatLng(), 7, {animate: true});
  marker.openTooltip();
  $$('.cargo-row').forEach(row => row.classList.toggle('selected-cargo', row.dataset.container === containerNumber));
  toast(`${cargo.container_number}: ${cargo.origin_name} → ${cargo.destination_name}`);
}

function showSection(id) {
  $$('.page-section').forEach(section => section.classList.toggle('active-section', section.id === id));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.section === id));
  const titles = {overview:'Панель управления', cargo:'Мониторинг грузов', routes:'Маршруты и узлы', customs:'Таможенные документы', analytics:'Аналитика и ML-прогноз'};
  $('#page-title').textContent = titles[id] || titles.overview;
}
function renderCargo() {
  const rows = state.cargo.map(item => `<tr class="cargo-row" data-container="${item.container_number}" title="Показать груз на карте"><td><span class="container-id">${item.container_number}</span><span class="subtext">${item.weight.toLocaleString('ru-RU')} кг</span></td><td>${item.origin_name}<span class="subtext">↓ транзит через Каспий</span></td><td>${item.destination_name}</td><td><span class="status-tag ${item.status}">${statusLabel(item.status)}</span></td><td class="${riskClass(item.status === 'delayed' ? .9 : .22)}">${item.status === 'delayed' ? 'Высокий' : 'Низкий'}</td></tr>`).join('');
  $('#cargo-table').innerHTML = rows || '<tr><td colspan="5" class="loading">Нет активных грузов</td></tr>';
  $('#cargo-full-table').innerHTML = state.cargo.map(item => `<tr class="cargo-row" data-container="${item.container_number}" title="Показать груз на карте"><td><span class="container-id">${item.container_number}</span></td><td>${item.origin_name}</td><td>${item.destination_name}</td><td>${item.weight.toLocaleString('ru-RU')} кг</td><td><span class="status-tag ${item.status}">${statusLabel(item.status)}</span></td></tr>`).join('');
  $$('.cargo-row').forEach(row => row.addEventListener('click', () => focusCargo(row.dataset.container)));
}
function renderPorts() { $('#graph-nodes').innerHTML = state.ports.map(port => `<div class="graph-node"><b>${port.code}</b><span>${port.name} · ${port.is_active ? 'активен' : 'закрыт'}</span></div>`).join(''); }
function renderDocuments() { $('#customs-table').innerHTML = state.documents.map(item => `<tr><td><span class="container-id">${item.document_number}</span></td><td>${item.document_type.replaceAll('_',' ')}</td><td>${item.cargo}</td><td><span class="status-tag ${item.is_verified ? '' : 'delayed'}">${item.is_verified ? 'Проверен' : 'Ожидает проверки'}</span></td></tr>`).join(''); }
function renderRoutes() { $('#route-cards').innerHTML = state.routes.slice(0, 3).map(route => `<article class="route-card"><span class="eyebrow">${route.is_alternative ? 'ALTERNATIVE' : 'PRIMARY ROUTE'}</span><h4>${route.name}</h4><p>${route.estimated_hours} ч · ${route.co2_emissions} кг CO₂</p><div class="route-progress"><i style="width:${route.is_alternative ? 28 : 66}%"></i></div></article>`).join('') || '<article class="route-card">Маршруты появятся после загрузки данных.</article>'; }

async function loadPrediction() {
  const weather = state.ports.some(port => !port.is_active) ? .9 : .18;
  const firstCargo = state.cargo[0];
  const prediction = firstCargo
    ? await api('/ml/predict-cargo/', {method:'POST', body: JSON.stringify({container_number: firstCargo.container_number, weather_risk: weather})})
    : await api('/ml/predict/', {method:'POST', body: JSON.stringify({weather_risk: weather, port_load: .62, distance_km: 1200, customs_check: true, sea_share: .8})});
  state.prediction = prediction;
  const percentage = Math.round(prediction.delay_probability * 100);
  $('#kpi-risk').innerHTML = `${percentage}<small>%</small>`; $('#prediction-value').textContent = `${percentage}%`; $('#analytics-risk').textContent = `${percentage}%`;
  $('#risk-meter-fill').style.width = `${percentage}%`; $('#analytics-meter').style.width = `${percentage}%`; $('#risk-caption').textContent = prediction.risk_level === 'high' ? 'Требуется внимание' : 'ML prediction'; $('#prediction-text').textContent = prediction.risk_level === 'high' ? 'Модель рекомендует перестроить маршрут из-за повышенного риска.' : 'Маршрут стабилен. Модель не видит критических факторов.';
  $('#prediction-text').className = `prediction-text ${riskClass(prediction.delay_probability)}`;
  $('#recommendations').innerHTML = prediction.recommendations.map(item => `<li>${item}</li>`).join('');
  $('.prediction-ring').style.background = `radial-gradient(circle,#171e35 55%,transparent 57%),conic-gradient(${prediction.risk_level === 'high' ? 'var(--red)' : 'var(--violet)'} ${percentage * 3.6}deg,#3b315f 0deg)`;
}
async function loadData() {
  try {
    const [dashboard, ports, cargo, routes, documents] = await Promise.all([api('/'), api('/ports/'), api('/cargo/'), api('/routes/'), api('/customs/')]);
    state.ports = ports.results || ports; state.cargo = cargo.results || cargo; state.routes = routes.results || routes; state.documents = documents.results || documents;
    $('#kpi-cargo').textContent = dashboard.cargo_in_transit; $('#kpi-hours').innerHTML = `${dashboard.cargo_delayed ? 84 : 72} <small>ч</small>`; $('#kpi-co2').innerHTML = '420 <small>кг</small>';
    renderCargo(); renderPorts(); renderRoutes(); renderDocuments(); renderLiveMap(); await loadPrediction();
    $('#api-time').textContent = new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}); $('#last-update').textContent = 'только что';
  } catch (error) { toast('Не удалось подключиться к API. Запустите Django-сервер.'); console.error(error); }
}
async function simulateStorm() { try { await api('/simulation/storm/', {method:'POST', body:JSON.stringify({})}); toast('Шторм активирован: Махачкала закрыта, маршрут перестроен'); await loadData(); } catch (error) { toast('Сначала запустите Django-сервер'); } }
async function verifyDocuments() { try { const result = await api('/customs/verify/', {method:'POST', body:'{}'}); toast(`Проверено документов: ${result.verified_count}`); await loadData(); } catch (error) { toast('Ошибка проверки документов'); } }

$$('.nav-item').forEach(item => item.addEventListener('click', () => showSection(item.dataset.section)));
$$('[data-section-jump]').forEach(item => item.addEventListener('click', () => showSection(item.dataset.sectionJump)));
$('#storm-btn').addEventListener('click', simulateStorm); $('#refresh-btn').addEventListener('click', loadData); $('#verify-btn').addEventListener('click', verifyDocuments);
$$('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => { const registerMode = tab.dataset.authTab === 'register'; $$('.auth-tab').forEach(item => item.classList.toggle('active', item === tab)); $('#login-form').classList.toggle('hidden', registerMode); $('#register-form').classList.toggle('hidden', !registerMode); }));
$('#login-form').addEventListener('submit', login); $('#register-form').addEventListener('submit', register); $('#logout-btn').addEventListener('click', logout);
if (accessToken) loadCurrentUser().catch(() => { clearTokens(); });
