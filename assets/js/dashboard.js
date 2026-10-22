let state = loadState();
let climateChart, humidityChart, soilChart, waterChart, analyticsChart, toastTimer, simulationTimer;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
function average(key) { return state.zones.reduce((sum, zone) => sum + zone[key], 0) / state.zones.length; }
function timeAgo(time) { const mins = Math.max(0, Math.floor((Date.now() - time) / 60000)); if (mins < 1) return 'только что'; if (mins < 60) return `${mins} мин. назад`; const hours = Math.floor(mins / 60); return `${hours} ч. назад`; }
function timeText(time) { return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(time)); }
function showToast(message) { const toast = $('#toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
function addEvent(kind, title, detail, metadata = {}) { state.events.unshift({ kind, title, detail, time: Date.now(), ...(kind === 'warning' || kind === 'critical' ? { status: 'open' } : {}), ...metadata }); state.events = state.events.slice(0, 80); }
function renderKpis() {
  if (!$('#avgTemp')) return;
  $('#avgTemp').textContent = average('temp').toFixed(1); $('#avgHumidity').textContent = Math.round(average('humidity')); $('#avgSoil').textContent = Math.round(average('soil')); $('#waterLevel').textContent = Math.round(state.water);
  $('#waterProgress').style.width = `${state.water}%`;
  $('#waterTrend').className = state.water < 25 ? 'trend warning' : 'trend steady'; $('#waterTrend').innerHTML = state.water < 25 ? '⚠ <span>низкий уровень</span>' : '● <span>достаточно</span>';
  const allSensors = sensorRecords(); $('#activeAlerts').textContent = state.events.filter(event => ['warning', 'critical'].includes(event.kind) && (event.status || 'open') === 'open').length; $('#devicesOnline').textContent = allSensors.filter(sensor => sensor.online).length; $('#devicesTotal').textContent = `/ ${allSensors.length}`;
  $('#updatedAt').textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  ['temp-bars', 'humidity-bars', 'soil-bars'].forEach((cls, series) => { const box = $(`.${cls}`); box.innerHTML = ''; state.history.slice(-9).forEach(item => { const bar = document.createElement('i'); const value = series === 0 ? item.temp : series === 1 ? item.humidity : item.soil; bar.style.height = `${Math.max(25, Math.min(100, value))}%`; box.append(bar); }); });
}
function zoneStatus(zone) { if (!zone.online) return { text: 'Датчики офлайн', warn: true }; if (zone.soil < state.settings.soilMin && state.water <= state.settings.waterCritical) return { text: 'Полив заблокирован', warn: true }; if (zone.soil < state.settings.soilMin) return { text: 'Нужен полив', warn: true }; if (zone.temp > state.settings.tempMax) return { text: 'Жарко', warn: true }; if (zone.temp < state.settings.tempMin) return { text: 'Холодно', warn: true }; if (zone.humidity < state.settings.humidityMin || zone.humidity > state.settings.humidityMax) return { text: 'Влажность вне порога', warn: true }; return { text: 'Всё хорошо', warn: false }; }
function zoneRiskScore(zone) { return Math.min(100, (zone.temp > state.settings.tempMax ? 25 : zone.temp < state.settings.tempMin ? 20 : 0) + (zone.soil < state.settings.soilMin ? 25 : 0) + (state.water <= state.settings.waterCritical ? 30 : 0) + (zone.co2 > 1500 ? 15 : 0) + (!zone.online ? 20 : 0)); }
function renderZones() {
  const list = $('#zoneList'), grid = $('#zoneGrid');
  if (list) list.innerHTML = state.zones.map(zone => { const status = zoneStatus(zone); return `<div class="zone-row"><span class="zone-thumb">${zone.icon}</span><span class="zone-info"><b>${zone.name}</b><small>${zone.variety.split(' · ')[1]}</small></span><span class="zone-condition ${status.warn ? 'warn' : ''}">${status.text}</span><span class="zone-metric">${zone.temp.toFixed(1)}°</span></div>`; }).join('');
  if (grid) {
    const query = ($('#zoneSearch')?.value || '').trim().toLocaleLowerCase('ru');
    const filter = $('#zoneStatusFilter')?.value || 'all';
    const zones = state.zones.filter(zone => { const status = zoneStatus(zone); const matchesText = `${zone.name} ${zone.variety}`.toLocaleLowerCase('ru').includes(query); return matchesText && (filter === 'all' || (filter === 'attention') === (status.warn || !zone.online)); });
    grid.innerHTML = zones.length ? zones.map(zone => { const status = zoneStatus(zone); return `<article class="panel zone-card"><div class="zone-card-head"><span class="zone-thumb">${zone.icon}</span><span><h2>${zone.name}</h2><p>${zone.variety}</p></span><span class="zone-condition ${status.warn || !zone.online ? 'warn' : ''}">${!zone.online ? 'Датчики офлайн' : status.text}</span></div><div class="zone-card-art"><i class="plant"></i><i class="plant"></i><i class="plant"></i><i class="plant"></i><i class="plant"></i></div><div class="zone-metrics"><div class="zone-metric-cell"><small>Температура</small><b>${zone.temp.toFixed(1)} °C</b></div><div class="zone-metric-cell"><small>Воздух</small><b>${zone.humidity} %</b></div><div class="zone-metric-cell"><small>Почва</small><b>${zone.soil} %</b></div><div class="zone-metric-cell"><small>Освещение</small><b>${(zone.light / 1000).toFixed(1)}k лк</b></div></div><div class="zone-card-foot"><span>CO₂ ${zone.co2} ppm · Риск ${zoneRiskScore(zone)}/100</span><span>${zone.online ? '● Датчики онлайн' : '○ Нет связи'}</span></div></article>`; }).join('') : '<div class="empty-state">Зоны не найдены</div>';
  }
}
function sensorRecords() { return state.zones.flatMap(zone => [ ['Температура воздуха', '☼', `${zone.temp.toFixed(1)} °C`], ['Влажность воздуха', '◌', `${zone.humidity} %`], ['Влажность почвы', '⌁', `${zone.soil} %`], ['Освещённость', '☀', `${zone.light.toLocaleString('ru-RU')} лк`], ['Уровень CO₂', '◉', `${zone.co2} ppm`] ].map(([name, icon, value]) => ({ name, icon, value, zone: zone.name, online: zone.online, lastUpdate: zone.lastUpdate }))).concat([{ name: 'Уровень воды', icon: '◒', value: `${Math.round(state.water)} %`, zone: 'Резервуар', online: state.waterOnline !== false, lastUpdate: state.waterUpdatedAt }]); }
function renderSensors() {
  const rows = $('#sensorRows'); if (!rows) return;
  const query = ($('#sensorSearch')?.value || '').trim().toLocaleLowerCase('ru'), selectedZone = $('#sensorZoneFilter')?.value || 'all';
  const sensors = sensorRecords().filter(sensor => `${sensor.name} ${sensor.zone}`.toLocaleLowerCase('ru').includes(query) && (selectedZone === 'all' || sensor.zone === selectedZone));
  const online = sensors.filter(sensor => sensor.online).length;
  $('#sensorCount').textContent = `${online} онлайн из ${sensors.length}`;
  rows.innerHTML = sensors.length ? sensors.map(sensor => `<tr><td><span class="device-name"><i class="device-icon">${sensor.icon}</i><b>${sensor.name}</b></span></td><td>${sensor.zone}</td><td><b>${sensor.value}</b></td><td><span class="status-pill ${sensor.online ? '' : 'offline'}"><i class="live-dot"></i> ${sensor.online ? 'Онлайн' : 'Офлайн'}</span></td><td>${sensor.lastUpdate ? timeAgo(sensor.lastUpdate) : '—'}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">Датчики не найдены</td></tr>';
}
function renderActuators() {
  const modeIndicator = $('#modeIndicator'); if (modeIndicator) modeIndicator.textContent = state.mode === 'auto' ? 'AUTO' : 'MANUAL';
  if (!$('#modeSwitch')) return;
  $('#modeSwitch').querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn.dataset.mode === state.mode));
  $('#modeLabel').textContent = state.mode === 'auto' ? '● Автоматический режим' : '● Ручное управление';
  $('#actuatorList').innerHTML = Object.entries(actuatorInfo).map(([key, info]) => `<div class="actuator-row"><span class="actuator-icon">${info.icon}</span><span class="actuator-info"><b>${info.name}</b><small>${info.detail}</small></span><span class="actuator-state">${state.actuators[key] ? 'Включено' : 'Выключено'}</span><button class="toggle ${state.actuators[key] ? 'on' : ''}" data-actuator="${key}" aria-label="${info.name}" aria-pressed="${state.actuators[key]}" ${state.mode === 'auto' ? 'disabled' : ''}></button></div>`).join('');
  ['soilMin', 'soilMax', 'humidityMin', 'humidityMax', 'tempMin', 'tempMax', 'lightMin', 'waterCritical'].forEach(id => { const input = $(`#${id}`); if (input) input.value = state.settings[id]; });
}
function chartOptions() { return { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#263b2b', padding: 9, titleFont: { size: 10 }, bodyFont: { size: 9 }, cornerRadius: 6 } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#9aa59b', font: { size: 8 }, maxTicksLimit: 6 } }, y: { border: { display: false, dash: [3, 3] }, grid: { color: '#eef1ec' }, ticks: { color: '#9aa59b', font: { size: 8 }, maxTicksLimit: 5 } } } }; }
function renderCharts() {
  if (!window.Chart) return;
  const labels = state.history.map(item => item.label), options = chartOptions();
  const line = (canvas, existing, datasets, opts = options) => { if (existing) { existing.data.labels = labels; existing.data.datasets.forEach((dataset, i) => dataset.data = datasets[i].data); existing.update('none'); return existing; } return new Chart($(canvas), { type: 'line', data: { labels, datasets }, options: opts }); };
  if ($('#climateChart')) climateChart = line('#climateChart', climateChart, [{ label: 'Температура °C', data: state.history.map(x => x.temp), borderColor: '#6fa579', backgroundColor: '#6fa57915', fill: true, tension: .38, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 }], { ...options, scales: { ...options.scales, y: { ...options.scales.y, min: 15, max: 35 } } });
  if ($('#humidityChart')) humidityChart = line('#humidityChart', humidityChart, [{ label: 'Влажность воздуха %', data: state.history.map(x => x.humidity), borderColor: '#8abbd4', backgroundColor: '#8abbd415', fill: true, tension: .38, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 }], { ...options, scales: { ...options.scales, y: { ...options.scales.y, min: 30, max: 90 } } });
  if ($('#soilChart')) soilChart = line('#soilChart', soilChart, [{ label: 'Почва %', data: state.history.map(x => x.soil), borderColor: '#76a66f', backgroundColor: '#76a66f20', fill: true, tension: .4, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2 }], { ...options, scales: { ...options.scales, y: { ...options.scales.y, min: 15, max: 75 } } });
  const waterCanvas = $('#waterChart');
  if (waterCanvas) {
    const waterData = state.history.map(item => item.water ?? state.water);
    if (!waterChart) waterChart = new Chart(waterCanvas, { type: 'line', data: { labels, datasets: [{ label: 'Запас воды %', data: waterData, borderColor: '#76a9c7', backgroundColor: '#76a9c720', fill: true, tension: .35, pointRadius: 0, borderWidth: 2 }] }, options: { ...options, scales: { ...options.scales, y: { ...options.scales.y, min: 0, max: 100 } } } });
    else { waterChart.data.labels = labels; waterChart.data.datasets[0].data = waterData; waterChart.update('none'); }
  }
  const ctx = $('#analyticsChart');
  if (!ctx) return;
  if (!analyticsChart) analyticsChart = new Chart(ctx, { type: 'bar', data: { labels: ['Температура', 'Влажность воздуха', 'Влажность почвы', 'Освещение'], datasets: [{ label: 'Сейчас', data: [average('temp') / 40 * 100, average('humidity'), average('soil'), average('light') / 20000 * 100], backgroundColor: ['#e9b777', '#8abbd4', '#76a66f', '#e6cb70'], borderRadius: 5, barThickness: 24 }] }, options: { ...options, indexAxis: 'y', scales: { x: { ...options.scales.y, min: 0, max: 100, ticks: { ...options.scales.y.ticks, callback: value => `${value}%` } }, y: { ...options.scales.x, grid: { display: false } } } } });
  else { analyticsChart.data.datasets[0].data = [average('temp') / 40 * 100, average('humidity'), average('soil'), average('light') / 20000 * 100]; analyticsChart.update('none'); }
}
function render() { renderKpis(); renderZones(); renderSensors(); renderActuators(); renderEvents(); renderAnalytics(); renderCharts(); }
function navigate(page) { $$('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`)); $$('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.page === page)); if (page === 'analytics') setTimeout(() => { climateChart?.resize(); humidityChart?.resize(); soilChart?.resize(); analyticsChart?.resize(); }, 80); $('#sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function init() {
  state.zones ??= structuredClone(zoneDefaults); state.history ??= makeHistory(); state.events ??= initialEvents;
  const currentPage = document.body.dataset.currentPage;
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === currentPage));
  const theme = localStorage.getItem('greenhouse-theme') || 'light'; document.body.classList.toggle('theme-dark', theme === 'dark');
  if ($('#themeButton')) $('#themeButton').textContent = theme === 'dark' ? '☀' : '☾';
  runAutomation(); checkAlerts(); save(); render();
  if ($('#themeButton')) $('#themeButton').addEventListener('click', () => { const dark = !document.body.classList.contains('theme-dark'); document.body.classList.toggle('theme-dark', dark); localStorage.setItem('greenhouse-theme', dark ? 'dark' : 'light'); $('#themeButton').textContent = dark ? '☀' : '☾'; });
  if ($('#settingsThemeButton')) $('#settingsThemeButton').addEventListener('click', () => $('#themeButton').click());
  if ($('#settingsResetButton')) $('#settingsResetButton').addEventListener('click', () => $('#resetButton').click());
  if ($('#menuButton')) $('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  ['zoneSearch', 'zoneStatusFilter', 'sensorSearch', 'sensorZoneFilter'].forEach(id => { const control = $(`#${id}`); if (control) control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', () => id.startsWith('zone') ? renderZones() : renderSensors()); });
  document.addEventListener('click', event => { const button = event.target.closest('button[data-page]'); if (button) window.location.href = `${button.dataset.page === 'events' ? 'alerts' : button.dataset.page}.html`; });
  if ($('#modeSwitch')) $('#modeSwitch').addEventListener('click', event => { const button = event.target.closest('[data-mode]'); if (!button || state.mode === button.dataset.mode) return; state.mode = button.dataset.mode; addEvent('manual', `Режим управления: ${state.mode === 'auto' ? 'автоматический' : 'ручной'}`, 'Настройка изменена оператором'); runAutomation(); save(); render(); showToast('Режим управления обновлён'); });
  if ($('#actuatorList')) $('#actuatorList').addEventListener('click', event => { const button = event.target.closest('[data-actuator]'); if (!button || state.mode !== 'manual') return; const key = button.dataset.actuator; if (key === 'pump' && state.water <= 15 && !state.actuators.pump) return showToast('Насос заблокирован: низкий уровень воды'); state.actuators[key] = !state.actuators[key]; addEvent('manual', `${actuatorInfo[key].name}: ${state.actuators[key] ? 'включено' : 'выключено'}`, 'Команда оператора'); save(); render(); });
  [['soilMin', 10, 80], ['soilMax', 15, 90], ['humidityMin', 20, 90], ['humidityMax', 25, 95], ['tempMin', 5, 30], ['tempMax', 20, 45], ['lightMin', 1000, 35000], ['waterCritical', 1, 40]].forEach(([id, min, max]) => { const input = $(`#${id}`); if (input) input.addEventListener('change', event => { const value = Math.max(min, Math.min(max, Number(event.target.value) || min)); state.settings[id] = value; event.target.value = value; if (id === 'soilMin' && state.settings.soilMax <= value) state.settings.soilMax = value + 1; if (id === 'soilMax' && value <= state.settings.soilMin) state.settings.soilMin = value - 1; addEvent('manual', 'Обновлены пороговые значения', 'Изменены параметры автоматического управления'); runAutomation(); save(); render(); showToast('Пороговое значение сохранено'); }); });
  if ($('#exportButton')) $('#exportButton').addEventListener('click', () => { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), zones: state.zones, water: state.water, events: state.events, history: state.history }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'greenhouse-data.json'; link.click(); URL.revokeObjectURL(url); showToast('Данные экспортированы'); });
  if ($('#resetButton')) $('#resetButton').addEventListener('click', () => { state = seed(); sessionStorage.removeItem('greenhouse-alert-dismissed'); runAutomation(); save(); render(); showToast('Данные сброшены к начальному состоянию'); });
  if ($('#clearEvents')) $('#clearEvents').addEventListener('click', () => { state.events = []; save(); renderEvents(); showToast('Журнал событий очищен'); });
  ['eventSearch', 'eventFilter'].forEach(id => { const control = $(`#${id}`); if (control) control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderEvents); });
  if ($('#allEvents')) $('#allEvents').addEventListener('click', event => { const button = event.target.closest('[data-event-index]'); if (!button) return; const item = state.events[Number(button.dataset.eventIndex)]; if (!item) return; item.status = (item.status || 'open') === 'open' ? 'resolved' : 'open'; save(); renderEvents(); });
  if ($('#dismissAlert')) $('#dismissAlert').addEventListener('click', () => { const alert = state.events.find(item => item.kind === 'warning' || item.kind === 'critical'); if (alert) sessionStorage.setItem('greenhouse-alert-dismissed', String(alert.time)); $('#alertBanner').hidden = true; });
  const startSimulation = () => { clearInterval(simulationTimer); const savedSpeed = Number(localStorage.getItem('greenhouse-simulation-speed')); const speed = [3000, 5000, 10000].includes(savedSpeed) ? savedSpeed : 3000; localStorage.setItem('greenhouse-simulation-speed', String(speed)); simulationTimer = setInterval(simulate, speed); document.querySelectorAll('[data-simulation-interval]').forEach(el => { el.textContent = `${speed / 1000} сек.`; }); };
  const speedSelect = $('#simulationSpeed'); if (speedSelect) { speedSelect.value = String(Number(localStorage.getItem('greenhouse-simulation-speed')) || 3000); speedSelect.addEventListener('change', () => { localStorage.setItem('greenhouse-simulation-speed', speedSelect.value); startSimulation(); showToast('Скорость симуляции сохранена'); }); }
  startSimulation();
}
document.addEventListener('DOMContentLoaded', init);

