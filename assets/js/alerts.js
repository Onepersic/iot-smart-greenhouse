function checkAlerts() {
  const checks = [];
  if (state.water < 15) checks.push(['critical', 'Критический уровень воды', 'Насос заблокирован. Срочно пополните резервуар.']); else if (state.water < 25) checks.push(['warning', 'Низкий уровень воды', `В резервуаре осталось ${Math.round(state.water)}% воды.`]);
  const dryZone = state.zones.find(zone => zone.soil < state.settings.soilMin - 8); if (dryZone) checks.push(['warning', 'Низкая влажность почвы', `Зона «${dryZone.name}» · ${dryZone.soil}%`]);
  const hotZone = state.zones.find(zone => zone.temp > state.settings.tempMax + 3); if (hotZone) checks.push(['critical', 'Перегрев теплицы', `Зона «${hotZone.name}» · ${hotZone.temp.toFixed(1)} °C`]);
  checks.forEach(([kind, title, detail]) => { if (!state.events.some(event => event.title === title && event.detail === detail && Date.now() - event.time < 15 * 60 * 1000)) addEvent(kind, title, detail); });
}
function renderEvents() {
  const content = events => events.length ? events.map(event => { const kind = event.kind === 'warning' || event.kind === 'critical' ? event.kind : ''; const icon = event.kind === 'warning' ? '!' : event.kind === 'critical' ? '×' : event.kind === 'manual' ? '◉' : '✓'; return `<div class="event-row"><span class="event-icon ${kind}">${icon}</span><span class="event-copy"><b>${event.title}</b><small>${event.detail}</small></span><span class="event-time">${timeAgo(event.time)}</span></div>`; }).join('') : '<div class="empty-state">Событий пока нет</div>';
  if ($('#recentEvents')) $('#recentEvents').innerHTML = content(state.events.slice(0, 4));
  if ($('#allEvents')) $('#allEvents').innerHTML = content(state.events);
  if ($('#eventCount')) $('#eventCount').textContent = `${state.events.length} событий`;
  const alerts = state.events.filter(event => event.kind === 'warning' || event.kind === 'critical');
  if ($('#navAlertCount')) { $('#navAlertCount').textContent = alerts.length; $('#navAlertCount').style.display = alerts.length ? 'inline' : 'none'; }
  if ($('#notificationDot')) $('#notificationDot').style.display = alerts.length ? 'block' : 'none';
  const banner = $('#alertBanner'), latest = alerts[0];
  if (banner) { banner.hidden = !latest || sessionStorage.getItem('greenhouse-alert-dismissed') === String(latest.time); if (latest) { $('#bannerTitle').textContent = latest.title; $('#bannerText').textContent = latest.detail; } }
}
