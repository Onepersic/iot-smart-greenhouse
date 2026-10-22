function checkAlerts() {
  const checks = [];
  if (state.water <= state.settings.waterCritical) checks.push(['critical', 'Критический уровень воды', 'Насос заблокирован. Срочно пополните резервуар.', { zone: 'Резервуар', sensor: 'Уровень воды' }]);
  else if (state.water < 25) checks.push(['warning', 'Низкий уровень воды', `В резервуаре осталось ${Math.round(state.water)}% воды.`, { zone: 'Резервуар', sensor: 'Уровень воды' }]);
  const dryZone = state.zones.find(zone => zone.soil < state.settings.soilMin - 8);
  if (dryZone) checks.push(['warning', 'Низкая влажность почвы', `Зона «${dryZone.name}» · ${dryZone.soil}%`, { zone: dryZone.name, sensor: 'Влажность почвы' }]);
  const hotZone = state.zones.find(zone => zone.temp > state.settings.tempMax + 3);
  if (hotZone) checks.push(['critical', 'Перегрев теплицы', `Зона «${hotZone.name}» · ${hotZone.temp.toFixed(1)} °C`, { zone: hotZone.name, sensor: 'Температура воздуха' }]);
  const humidZone = state.zones.find(zone => zone.humidity > state.settings.humidityMax);
  if (humidZone) checks.push(['warning', 'Высокая влажность воздуха', `Зона «${humidZone.name}» · ${humidZone.humidity}%`, { zone: humidZone.name, sensor: 'Влажность воздуха' }]);
  const highCo2 = state.zones.find(zone => zone.co2 > 1500);
  if (highCo2) checks.push(['warning', 'Высокий уровень CO₂', `Зона «${highCo2.name}» · ${highCo2.co2} ppm`, { zone: highCo2.name, sensor: 'Уровень CO₂' }]);
  checks.forEach(([kind, title, detail, metadata]) => {
    const existing = state.events.find(event => event.title === title && Date.now() - event.time < 15 * 60 * 1000 && (!event.zone || event.zone === metadata.zone));
    if (existing) { existing.zone ||= metadata.zone; existing.sensor ||= metadata.sensor; existing.status ||= 'open'; existing.detail = detail; }
    else addEvent(kind, title, detail, metadata);
  });
}

function renderEvents() {
  const content = (events, actions = false) => events.length ? events.map(event => {
    const isAlert = event.kind === 'warning' || event.kind === 'critical';
    const kind = isAlert ? event.kind : '';
    const icon = event.kind === 'warning' ? '!' : event.kind === 'critical' ? '×' : event.kind === 'manual' ? '◉' : '✓';
    const index = state.events.indexOf(event), status = event.status || 'open';
    const metadata = isAlert ? ` · ${event.zone || 'Объект'} · ${event.sensor || 'Система'}` : '';
    return `<div class="event-row"><span class="event-icon ${kind}">${icon}</span><span class="event-copy"><b>${event.title}</b><small>${event.detail}${metadata} · ${timeText(event.time)}</small></span>${isAlert ? `<span class="event-status ${status}">${status === 'resolved' ? 'Обработано' : 'Открыто'}</span>${actions ? `<button class="button button-quiet event-action" data-event-index="${index}">${status === 'resolved' ? 'Вернуть' : 'Обработать'}</button>` : ''}` : ''}<span class="event-time">${timeAgo(event.time)}</span></div>`;
  }).join('') : '<div class="empty-state">Событий по выбранному фильтру нет</div>';
  if ($('#recentEvents')) $('#recentEvents').innerHTML = content(state.events.slice(0, 4));
  if ($('#allEvents')) {
    const query = ($('#eventSearch')?.value || '').trim().toLocaleLowerCase('ru'), filter = $('#eventFilter')?.value || 'all';
    const filtered = state.events.filter(event => {
      const isAlert = event.kind === 'warning' || event.kind === 'critical', status = event.status || 'open';
      const matchesText = `${event.title} ${event.detail} ${event.zone || ''} ${event.sensor || ''}`.toLocaleLowerCase('ru').includes(query);
      const matchesFilter = filter === 'all' || (filter === 'alerts' && isAlert) || (filter === 'critical' && event.kind === 'critical') || (filter === 'open' && isAlert && status === 'open') || (filter === 'resolved' && isAlert && status === 'resolved') || (filter === 'manual' && event.kind === 'manual');
      return matchesText && matchesFilter;
    });
    $('#allEvents').innerHTML = content(filtered, true);
    if ($('#eventCount')) $('#eventCount').textContent = `${filtered.length} из ${state.events.length}`;
  }
  const alerts = state.events.filter(event => (event.kind === 'warning' || event.kind === 'critical') && (event.status || 'open') === 'open');
  if ($('#navAlertCount')) { $('#navAlertCount').textContent = alerts.length; $('#navAlertCount').style.display = alerts.length ? 'inline' : 'none'; }
  if ($('#notificationDot')) $('#notificationDot').style.display = alerts.length ? 'block' : 'none';
  const banner = $('#alertBanner'), latest = alerts[0];
  if (banner) { banner.hidden = !latest || sessionStorage.getItem('greenhouse-alert-dismissed') === String(latest.time); if (latest) { $('#bannerTitle').textContent = latest.title; $('#bannerText').textContent = latest.detail; } }
}

