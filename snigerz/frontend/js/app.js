const API = 'http://127.0.0.1:8000/api';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = { cargo: [], ports: [], routes: [], documents: [], prediction: null };

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: {'Content-Type': 'application/json'}, ...options });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 3200); }
function statusLabel(status) { return {in_transit:'В пути', delayed:'Задержан', created:'Создан', delivered:'Доставлен', inspection:'На проверке'}[status] || status; }
function riskClass(value) { return value >= .67 ? 'risk-high' : value >= .34 ? 'risk-mid' : 'risk-low'; }

function showSection(id) {
  $$('.page-section').forEach(section => section.classList.toggle('active-section', section.id === id));
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.section === id));
  const titles = {overview:'Панель управления', cargo:'Мониторинг грузов', routes:'Маршруты и узлы', customs:'Таможенные документы', analytics:'Аналитика и ML-прогноз'};
  $('#page-title').textContent = titles[id] || titles.overview;
}
function renderCargo() {
  const rows = state.cargo.map(item => `<tr><td><span class="container-id">${item.container_number}</span><span class="subtext">${item.weight.toLocaleString('ru-RU')} кг</span></td><td>${item.origin_name}<span class="subtext">↓ транзит через Каспий</span></td><td>${item.destination_name}</td><td><span class="status-tag ${item.status}">${statusLabel(item.status)}</span></td><td class="${riskClass(item.status === 'delayed' ? .9 : .22)}">${item.status === 'delayed' ? 'Высокий' : 'Низкий'}</td></tr>`).join('');
  $('#cargo-table').innerHTML = rows || '<tr><td colspan="5" class="loading">Нет активных грузов</td></tr>';
  $('#cargo-full-table').innerHTML = state.cargo.map(item => `<tr><td><span class="container-id">${item.container_number}</span></td><td>${item.origin_name}</td><td>${item.destination_name}</td><td>${item.weight.toLocaleString('ru-RU')} кг</td><td><span class="status-tag ${item.status}">${statusLabel(item.status)}</span></td></tr>`).join('');
}
function renderPorts() { $('#graph-nodes').innerHTML = state.ports.map(port => `<div class="graph-node"><b>${port.code}</b><span>${port.name} · ${port.is_active ? 'активен' : 'закрыт'}</span></div>`).join(''); }
function renderDocuments() { $('#customs-table').innerHTML = state.documents.map(item => `<tr><td><span class="container-id">${item.document_number}</span></td><td>${item.document_type.replaceAll('_',' ')}</td><td>${item.cargo}</td><td><span class="status-tag ${item.is_verified ? '' : 'delayed'}">${item.is_verified ? 'Проверен' : 'Ожидает проверки'}</span></td></tr>`).join(''); }
function renderRoutes() { $('#route-cards').innerHTML = state.routes.slice(0, 3).map(route => `<article class="route-card"><span class="eyebrow">${route.is_alternative ? 'ALTERNATIVE' : 'PRIMARY ROUTE'}</span><h4>${route.name}</h4><p>${route.estimated_hours} ч · ${route.co2_emissions} кг CO₂</p><div class="route-progress"><i style="width:${route.is_alternative ? 28 : 66}%"></i></div></article>`).join('') || '<article class="route-card">Маршруты появятся после загрузки данных.</article>'; }

async function loadPrediction() {
  const weather = state.ports.some(port => !port.is_active) ? .9 : .18;
  const prediction = await api('/ml/predict/', {method:'POST', body: JSON.stringify({weather_risk: weather, port_load: .62, distance_km: 1200, customs_check: true, sea_share: .8})});
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
    renderCargo(); renderPorts(); renderRoutes(); renderDocuments(); await loadPrediction();
    $('#api-time').textContent = new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}); $('#last-update').textContent = 'только что';
  } catch (error) { toast('Не удалось подключиться к API. Запустите Django-сервер.'); console.error(error); }
}
async function simulateStorm() { try { await api('/simulation/storm/', {method:'POST', body:JSON.stringify({})}); toast('Шторм активирован: Махачкала закрыта, маршрут перестроен'); await loadData(); } catch (error) { toast('Сначала запустите Django-сервер'); } }
async function verifyDocuments() { try { const result = await api('/customs/verify/', {method:'POST', body:'{}'}); toast(`Проверено документов: ${result.verified_count}`); await loadData(); } catch (error) { toast('Ошибка проверки документов'); } }

$$('.nav-item').forEach(item => item.addEventListener('click', () => showSection(item.dataset.section)));
$$('[data-section-jump]').forEach(item => item.addEventListener('click', () => showSection(item.dataset.sectionJump)));
$('#storm-btn').addEventListener('click', simulateStorm); $('#refresh-btn').addEventListener('click', loadData); $('#verify-btn').addEventListener('click', verifyDocuments);
loadData();
