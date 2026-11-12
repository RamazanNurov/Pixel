'use strict';

/* Smart Caspian Transit frontend. Served separately from Django at localhost:5500. */
const API_BASE = (new URLSearchParams(location.search).get('api') || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const DEMO_PORTS = [
  {id:1,name:'Астрахань',code:'ASF',country:'Россия',city:'Астрахань',latitude:46.35,longitude:48.04,is_active:true},
  {id:2,name:'Махачкала',code:'MHK',country:'Россия',city:'Махачкала',latitude:42.98,longitude:47.50,is_active:true},
  {id:3,name:'Баку / Алят',code:'BAK',country:'Азербайджан',city:'Алят',latitude:40.28,longitude:49.75,is_active:true},
  {id:4,name:'Энзели',code:'ENZ',country:'Иран',city:'Энзели',latitude:37.47,longitude:49.46,is_active:true},
  {id:5,name:'Амирбад',code:'AMR',country:'Иран',city:'Амирбад',latitude:36.85,longitude:53.07,is_active:true}
];
const DEMO_CARGO = [{id:1,container_number:'MSKU1234567',origin:1,origin_name:'Астрахань',destination:4,destination_name:'Энзели',status:'in_transit',weight:12000,description:'Контейнер с промышленным оборудованием'}];
const DEMO_ROUTE = {id:1,cargo:1,name:'Север — Юг: Каспийский мультимодальный маршрут',estimated_hours:72,co2_emissions:420,is_alternative:false,steps:[
  {id:1,port:1,port_name:'Астрахань',port_code:'ASF',transport_type:'road',order:1,estimated_hours:18},
  {id:2,port:2,port_name:'Махачкала',port_code:'MHK',transport_type:'sea',order:2,estimated_hours:18},
  {id:3,port:3,port_name:'Баку / Алят',port_code:'BAK',transport_type:'sea',order:3,estimated_hours:18},
  {id:4,port:4,port_name:'Энзели',port_code:'ENZ',transport_type:'sea',order:4,estimated_hours:18}
]};
const DEMO_DOCS = [
  {id:1,document_type:'bill_of_lading',document_number:'BL-2026-001',is_verified:false},
  {id:2,document_type:'declaration',document_number:'DEC-2026-001',is_verified:false},
  {id:3,document_type:'certificate',document_number:'CERT-2026-001',is_verified:false},
  {id:4,document_type:'invoice',document_number:'INV-2026-001',is_verified:false}
];
const state = {ports:[],cargo:[],documents:[],route:null,analytics:null,selectedCargo:null,selectedDocs:new Set(),stormActive:false,map:null,markers:null,routeLayer:null,layers:{},apiOnline:false};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function unwrapList(payload) { return Array.isArray(payload) ? payload : (payload && Array.isArray(payload.results) ? payload.results : []); }
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {'Content-Type':'application/json', ...(options.headers || {})},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(data?.detail || data?.message || `HTTP ${response.status}`);
  return data;
}
function setConnection(online, message) {
  state.apiOnline = online;
  const node = $('#connection-state');
  node.classList.toggle('offline', !online);
  $('#connection-text').textContent = message || (online ? 'API подключён' : 'API недоступен');
}
function toast(message, type = 'info') {
  const node = document.createElement('div');
  node.className = `toast ${type}`;
  node.textContent = message;
  $('#toast-region').append(node);
  window.setTimeout(() => node.remove(), 4200);
}
function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat('ru-RU', {maximumFractionDigits:digits}).format(Number(value) || 0);
}
function statusLabel(status) {
  return ({created:'Создан',in_transit:'В пути',delayed:'Задержан',inspection:'На проверке',delivered:'Доставлен'})[status] || status || 'Неизвестно';
}
function transportLabel(type) { return ({road:'Авто',rail:'Ж/Д',sea:'Море'})[type] || type || '—'; }
function documentLabel(type) { return ({bill_of_lading:'Bill of Lading',declaration:'Таможенная декларация',certificate:'Фитосанитарный сертификат',invoice:'Invoice'})[type] || type || 'Документ'; }
function setKpi(id, value) { $(id).textContent = formatNumber(value); }
function selectedCargo() { return state.cargo.find(item => item.container_number === state.selectedCargo) || state.cargo[0] || null; }

async function loadDashboard() {
  try {
    const [dashboard, ports, cargo, documents, analytics] = await Promise.all([
      api('/'), api('/ports/'), api('/cargo/'), api('/customs/'), api('/analytics/')
    ]);
    state.ports = unwrapList(ports);
    state.cargo = unwrapList(cargo);
    state.documents = unwrapList(documents);
    state.analytics = analytics;
    state.selectedCargo = state.selectedCargo || state.cargo[0]?.container_number || null;
    state.apiOnline = true;
    state.stormActive = state.ports.some(port => port.code === 'MHK' && !port.is_active);
    $('#storm-button').hidden = state.stormActive;
    $('#reset-storm-button').hidden = !state.stormActive;
    setConnection(true, 'API подключён');
    renderDashboard(dashboard);
    await loadSelectedRoute();
    toast('Данные синхронизированы с сервером', 'success');
  } catch (error) {
    console.warn('API request failed:', error);
    setConnection(false, 'API недоступен · демо-режим');
    state.ports = DEMO_PORTS.map(item => ({...item}));
    state.cargo = DEMO_CARGO.map(item => ({...item}));
    state.documents = DEMO_DOCS.map(item => ({...item}));
    state.analytics = {kpi:{average_delivery_hours:72,total_co2:420,delayed_cargo:0},cargo_by_status:{created:0,in_transit:1,delayed:0,inspection:0,delivered:0}};
    state.stormActive = false;
    $('#storm-button').hidden = false;
    $('#reset-storm-button').hidden = true;
    state.selectedCargo = 'MSKU1234567';
    state.route = DEMO_ROUTE;
    renderDashboard({ports_total:5,active_ports:5,cargo_total:1,cargo_in_transit:1,cargo_delayed:0,documents_pending:4});
    toast('Не удалось подключиться к Django API. Отображён демонстрационный набор данных.', 'error');
  }
}
function renderDashboard(dashboard) {
  setKpi('#kpi-ports', `${dashboard.active_ports ?? 0}/${dashboard.ports_total ?? state.ports.length}`);
  $('#kpi-ports-caption').textContent = `${formatNumber(dashboard.active_ports ?? 0)} активных узлов`;
  setKpi('#kpi-transit', dashboard.cargo_in_transit ?? 0);
  setKpi('#kpi-delayed', dashboard.cargo_delayed ?? 0);
  setKpi('#kpi-documents', dashboard.documents_pending ?? 0);
  renderMap();
  renderCargoFocus();
  renderDocuments();
  renderAnalytics();
  renderCo2();
  $('#last-updated').textContent = `Обновлено ${new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}`;
  $('#map-port-count').textContent = `${state.ports.length} портовых узлов · Каспийский бассейн`;
}
async function loadSelectedRoute() {
  const cargo = selectedCargo();
  if (!cargo) { state.route = null; renderRoute(); return; }
  try {
    state.route = await api(`/cargo/${encodeURIComponent(cargo.container_number)}/route/`);
  } catch (error) {
    console.warn('Route request failed:', error);
    state.route = state.apiOnline ? null : DEMO_ROUTE;
  }
  renderRoute();
  renderCargoFocus();
  renderMap();
}
function renderCargoFocus() {
  const cargo = selectedCargo();
  if (!cargo) {
    $('#focus-container').textContent = 'Нет грузов';
    $('#focus-origin').textContent = '—';
    $('#focus-destination').textContent = '—';
    $('#focus-description').textContent = 'В реестре пока нет грузов.';
    return;
  }
  const origin = state.ports.find(port => port.id === cargo.origin) || state.ports.find(port => port.name === cargo.origin_name);
  const destination = state.ports.find(port => port.id === cargo.destination) || state.ports.find(port => port.name === cargo.destination_name);
  $('#focus-container').textContent = cargo.container_number;
  $('#focus-status').textContent = statusLabel(cargo.status);
  $('#focus-status').className = `status-pill ${cargo.status || 'created'}`;
  $('#focus-origin').textContent = origin?.name || cargo.origin_name || '—';
  $('#focus-origin-country').textContent = origin?.country || '—';
  $('#focus-destination').textContent = destination?.name || cargo.destination_name || '—';
  $('#focus-destination-country').textContent = destination?.country || '—';
  $('#focus-weight').textContent = `${formatNumber(cargo.weight)} кг`;
  $('#focus-duration').textContent = `${formatNumber(state.route?.estimated_hours || 0)} ч`;
  $('#focus-description').textContent = cargo.description || 'Описание груза не указано.';
}
function renderRoute() {
  const target = $('#route-timeline');
  const steps = state.route?.steps || [];
  $('#route-name').textContent = state.route?.name || 'Маршрут не найден';
  if (!steps.length) { target.innerHTML = '<div class="empty-state">Для выбранного контейнера маршрут пока не зарегистрирован.</div>'; return; }
  target.innerHTML = steps.map((step,index) => {
    const port = state.ports.find(item => item.id === step.port);
    const isClosed = port && !port.is_active;
    return `<div class="timeline-step ${isClosed ? 'closed' : ''}"><div class="timeline-node">${isClosed ? '!' : String(index+1).padStart(2,'0')}</div><strong title="${escapeHtml(step.port_name || port?.name || '')}">${escapeHtml(step.port_name || port?.name || step.port_code || 'Узел')}</strong><small>${escapeHtml(port?.country || step.port_code || '')}</small><span class="transport">${transportLabel(step.transport_type)} · ${formatNumber(step.estimated_hours)} ч</span></div>`;
  }).join('');
}
function renderDocuments() {
  const list = $('#documents-list');
  $('#documents-count').textContent = String(state.documents.length);
  if (!state.documents.length) { list.innerHTML = '<div class="empty-state">Документы не найдены.</div>'; return; }
  list.innerHTML = state.documents.map(doc => `<label class="document-row"><input class="document-check" type="checkbox" value="${doc.id}" ${state.selectedDocs.has(doc.id) ? 'checked' : ''} ${doc.is_verified ? 'disabled' : ''}><span><span class="document-name">${escapeHtml(documentLabel(doc.document_type))}</span><span class="document-number">${escapeHtml(doc.document_number)}</span></span><span class="document-state ${doc.is_verified ? 'verified' : ''}">${doc.is_verified ? 'Проверен' : 'Ожидает'}</span></label>`).join('');
  $$('.document-check').forEach(input => input.addEventListener('change', () => {
    const id = Number(input.value);
    if (input.checked) state.selectedDocs.add(id); else state.selectedDocs.delete(id);
    updateVerifyButton();
  }));
  updateVerifyButton();
}
function updateVerifyButton() {
  const pending = state.documents.filter(doc => !doc.is_verified).length;
  $('#verify-documents-button').disabled = !state.apiOnline || state.selectedDocs.size === 0;
  $('#documents-hint').textContent = state.selectedDocs.size ? `Выбрано: ${state.selectedDocs.size}` : `${pending} ожидают верификации`;
}
function renderAnalytics() {
  const values = state.analytics?.cargo_by_status || {};
  const items = [
    ['В пути',values.in_transit || 0],['Доставлены',values.delivered || 0],['Задержаны',values.delayed || 0],['На проверке',values.inspection || 0],['Созданы',values.created || 0]
  ];
  const max = Math.max(1,...items.map(item => item[1]));
  $('#status-chart').innerHTML = items.map(([label,value]) => `<div class="chart-row"><span class="chart-label">${label}</span><div class="chart-track"><div class="chart-fill" style="width:${Math.max(value ? 5 : 0, value/max*100)}%"></div></div><strong class="chart-count">${formatNumber(value)}</strong></div>`).join('');
}
function renderCo2() {
  const value = Number(state.analytics?.kpi?.total_co2 ?? 0);
  $('#co2-value').textContent = formatNumber(value,1);
  $('#co2-caption').textContent = `${formatNumber(state.analytics?.kpi?.average_delivery_hours ?? 0,1)} ч — среднее время`;
  $('#co2-bar').style.width = `${Math.max(0,Math.min(100,value/1000*100))}%`;
}
function initMap() {
  if (!window.L || state.map) return;
  state.map = L.map('caspian-map',{zoomControl:true,scrollWheelZoom:false}).setView([41.8,50.2],5);
  const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'});
  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,attribution:'Tiles © Esri'});
  const labels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:18,opacity:.82,attribution:'Labels © Esri'});
  state.layers = {street,satellite,hybrid:L.layerGroup([satellite,labels])};
  street.addTo(state.map);
  state.markers = L.layerGroup().addTo(state.map);
  state.routeLayer = L.layerGroup().addTo(state.map);
}
function renderMap() {
  initMap();
  if (!state.map) return;
  state.markers.clearLayers(); state.routeLayer.clearLayers();
  const points = state.ports.filter(port => Number.isFinite(Number(port.latitude)) && Number.isFinite(Number(port.longitude)));
  points.forEach(port => {
    const markerIcon = L.divIcon({className:'',html:`<div class="custom-port-marker ${port.is_active ? '' : 'closed'}"></div>`,iconSize:[12,12],iconAnchor:[6,6]});
    const marker = L.marker([port.latitude,port.longitude],{icon:markerIcon}).bindPopup(`<div class="port-popup"><strong>${escapeHtml(port.name)}</strong><span>${escapeHtml(port.country)} · ${escapeHtml(port.code)}</span><br><span>${port.is_active ? 'Узел активен' : 'Узел закрыт'}</span></div>`);
    state.markers.addLayer(marker);
  });
  const routePoints = (state.route?.steps || []).map(step => state.ports.find(port => port.id === step.port) || state.ports.find(port => port.code === step.port_code)).filter(port => port && Number.isFinite(Number(port.latitude)) && Number.isFinite(Number(port.longitude)));
  if (routePoints.length > 1) {
    const line = L.polyline(routePoints.map(port => [port.latitude,port.longitude]),{color:'#168b83',weight:3,opacity:.85,dashArray:'7 7',lineCap:'round'});
    state.routeLayer.addLayer(line);
    const bounds = L.latLngBounds(routePoints.map(port => [port.latitude,port.longitude]));
    state.map.fitBounds(bounds.pad(.22),{animate:false});
  } else if (points.length) {
    state.map.fitBounds(L.latLngBounds(points.map(port => [port.latitude,port.longitude])).pad(.18),{animate:false});
  }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function switchMapLayer(layerName) {
  if (!state.map || !state.layers[layerName]) return;
  Object.values(state.layers).forEach(layer => { if (state.map.hasLayer(layer)) state.map.removeLayer(layer); });
  state.layers[layerName].addTo(state.map);
  $$('.map-layer').forEach(button => button.classList.toggle('active',button.dataset.layer === layerName));
}
async function activateStorm() {
  $('#confirm-storm-button').disabled = true;
  try {
    const result = await api('/simulation/storm/',{method:'POST',body:{port_code:'MHK'}});
    $('#storm-modal').hidden = true;
    state.stormActive = true;
    $('#storm-button').hidden = true;
    $('#reset-storm-button').hidden = false;
    toast(`${result.message || 'Шторм смоделирован'}. Задержка: +${result.delay_hours || 12} ч.`, 'success');
    await loadDashboard();
  } catch (error) {
    toast(`Не удалось запустить сценарий: ${error.message}. Проверь, что Django запущен.`, 'error');
  } finally { $('#confirm-storm-button').disabled = false; }
}
async function resetStorm() {
  $('#reset-storm-button').disabled = true;
  try {
    const result = await api('/simulation/reset/',{method:'POST',body:{}});
    state.stormActive = false;
    $('#storm-button').hidden = false;
    $('#reset-storm-button').hidden = true;
    toast(result.message || 'Сценарий сброшен', 'success');
    await loadDashboard();
  } catch (error) { toast(`Не удалось сбросить сценарий: ${error.message}`, 'error'); }
  finally { $('#reset-storm-button').disabled = false; }
}
async function verifyDocuments() {
  const ids = [...state.selectedDocs];
  if (!ids.length) return;
  $('#verify-documents-button').disabled = true;
  try {
    const result = await api('/customs/verify/',{method:'POST',body:{document_ids:ids}});
    state.selectedDocs.clear();
    toast(result.message || `Проверено документов: ${result.verified_count}`, 'success');
    await loadDashboard();
  } catch (error) { toast(`Ошибка проверки документов: ${error.message}`, 'error'); updateVerifyButton(); }
}
function bindEvents() {
  $('#refresh-button').addEventListener('click',loadDashboard);
  $('#storm-button').addEventListener('click',() => { $('#storm-modal').hidden = false; });
  $('#close-storm-modal').addEventListener('click',() => { $('#storm-modal').hidden = true; });
  $('#cancel-storm-button').addEventListener('click',() => { $('#storm-modal').hidden = true; });
  $('#confirm-storm-button').addEventListener('click',activateStorm);
  $('#reset-storm-button').addEventListener('click',resetStorm);
  $('#verify-documents-button').addEventListener('click',verifyDocuments);
  $('#show-route-button').addEventListener('click',() => $('#route-details').scrollIntoView({behavior:'smooth',block:'center'}));
  $$('.map-layer').forEach(button => button.addEventListener('click',() => switchMapLayer(button.dataset.layer)));
  $$('.nav-item').forEach(link => link.addEventListener('click',() => {
    $$('.nav-item').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
  }));
  $('#storm-modal').addEventListener('click',event => { if (event.target === $('#storm-modal')) $('#storm-modal').hidden = true; });
  document.addEventListener('keydown',event => { if (event.key === 'Escape') $('#storm-modal').hidden = true; });
}
function initDate() {
  $('#current-date').textContent = new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date());
}

bindEvents();
initDate();
loadDashboard();
