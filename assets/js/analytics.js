function riskData() {
  const t = average('temp'), h = average('humidity'), s = average('soil');
  const risks = { Климат: Math.min(35, Math.abs(t - 25) * 3 + Math.max(0, 48 - h) * .35), Почва: Math.min(35, Math.abs(s - 48) * .8), Резервуар: Math.max(0, (50 - state.water) * .55), Датчики: 2 };
  return { risk: Math.round(Math.min(100, Object.values(risks).reduce((a, b) => a + b, 0))), risks };
}
function renderAnalytics() {
  if (!$('#riskValue')) return;
  const { risk, risks } = riskData(); $('#riskValue').textContent = risk; $('#riskCaption').textContent = risk < 25 ? 'Условия в норме' : risk < 55 ? 'Есть небольшие отклонения' : 'Требуется внимание'; $('#riskCaption').style.color = risk < 25 ? '#59845f' : risk < 55 ? '#b97923' : '#bc554a';
  $('.risk-circle').style.borderColor = risk < 25 ? '#e8f1e6' : risk < 55 ? '#f6e9cb' : '#f5dcd8'; $('.risk-circle').style.borderTopColor = risk < 25 ? '#67a770' : risk < 55 ? '#d0a24f' : '#c87267'; $('.risk-circle').style.borderRightColor = risk < 25 ? '#67a770' : risk < 55 ? '#d0a24f' : '#c87267';
  $('#riskBreakdown').innerHTML = Object.entries(risks).map(([key, value]) => `<span>${key}<b>${Math.round(value)}%</b></span>`).join('');
  const recommendations = [];
  if (state.water < 30) recommendations.push(['warn', 'Пополните резервуар', `Осталось ${Math.round(state.water)}% воды. Насос отключится при уровне ниже 15%.`, '◒']);
  state.zones.forEach(zone => { if (zone.soil < state.settings.soilMin) recommendations.push(['warn', `Проверьте полив: ${zone.name}`, `Влажность почвы ${zone.soil}%, порог установлен на ${state.settings.soilMin}%.`, '⌁']); if (zone.temp > state.settings.tempMax) recommendations.push(['warn', `Повысьте вентиляцию: ${zone.name}`, `Температура достигла ${zone.temp.toFixed(1)} °C.`, '✺']); });
  if (!recommendations.length) recommendations.push(['', 'Микроклимат стабилен', 'Показатели температуры, влажности и почвы находятся в заданных пределах.', '✓'], ['', 'Проверьте уровень воды', `Резервуар заполнен на ${Math.round(state.water)}%. Следующее обновление через несколько секунд.`, '◒']);
  $('#recommendations').innerHTML = recommendations.slice(0, 4).map(([kind, title, desc, icon]) => `<div class="recommendation ${kind}"><span class="rec-icon">${icon}</span><span><b>${title}</b><p>${desc}</p></span></div>`).join('');
}
