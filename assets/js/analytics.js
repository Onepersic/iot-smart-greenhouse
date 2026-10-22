function percentChange(previous, current) {
  if (!previous) return 0;
  return Math.abs(((current - previous) / previous) * 100);
}

function detectSuddenChange(previous, current) {
  return percentChange(previous, current) >= 30;
}

function riskData() {
  const previous = state.history.at(-2), current = state.history.at(-1);
  const sudden = previous && current && ['temp', 'humidity', 'soil', 'water', 'co2'].some(key => detectSuddenChange(previous[key], current[key]));
  const risks = {
    Температура: state.zones.some(zone => zone.temp > state.settings.tempMax) ? 25 : state.zones.some(zone => zone.temp < state.settings.tempMin) ? 20 : 0,
    Почва: state.zones.some(zone => zone.soil < state.settings.soilMin) ? 25 : 0,
    Вода: state.water <= state.settings.waterCritical ? 30 : 0,
    'CO₂': state.zones.some(zone => zone.co2 > 1500) ? 15 : 0,
    Изменения: sudden ? 20 : 0
  };
  return { risk: Math.min(100, Object.values(risks).reduce((sum, value) => sum + value, 0)), risks, sudden };
}

function renderAnalytics() {
  if (!$('#riskValue')) return;
  const { risk, risks, sudden } = riskData();
  $('#riskValue').textContent = risk;
  $('#riskCaption').textContent = risk < 25 ? 'Условия в норме' : risk < 55 ? 'Есть небольшие отклонения' : 'Требуется внимание';
  $('#riskCaption').style.color = risk < 25 ? '#59845f' : risk < 55 ? '#b97923' : '#bc554a';
  $('.risk-circle').style.borderColor = risk < 25 ? '#e8f1e6' : risk < 55 ? '#f6e9cb' : '#f5dcd8';
  $('.risk-circle').style.borderTopColor = risk < 25 ? '#67a770' : risk < 55 ? '#d0a24f' : '#c87267';
  $('.risk-circle').style.borderRightColor = risk < 25 ? '#67a770' : risk < 55 ? '#d0a24f' : '#c87267';
  $('#riskBreakdown').innerHTML = Object.entries(risks).map(([key, value]) => `<span>${key}<b>${value}%</b></span>`).join('');

  const recommendations = [];
  if (state.water <= state.settings.waterCritical) recommendations.push(['warn', 'Насос заблокирован', `Уровень воды ${Math.round(state.water)}% достиг критического порога ${state.settings.waterCritical}%. Заполните резервуар перед поливом.`, '◒']);
  else if (state.water < 30) recommendations.push(['warn', 'Пополните резервуар', `Осталось ${Math.round(state.water)}% воды. Запас уменьшается при работе полива, поэтому пополните его заранее.`, '◒']);
  state.zones.forEach(zone => {
    if (zone.soil < state.settings.soilMin) recommendations.push(['warn', `Проверьте влажность почвы: ${zone.name}`, `Значение ${zone.soil}% ниже заданного порога ${state.settings.soilMin}%. Проверьте полив; насос работает автоматически только при достаточном запасе воды.`, '⌁']);
    if (zone.temp > state.settings.tempMax) recommendations.push(['warn', `Высокая температура: ${zone.name}`, `${zone.temp.toFixed(1)} °C выше заданного максимума ${state.settings.tempMax} °C. Проверьте вентиляцию и воздушный поток.`, '✺']);
    if (zone.temp < state.settings.tempMin) recommendations.push(['warn', `Низкая температура: ${zone.name}`, `${zone.temp.toFixed(1)} °C ниже заданного минимума ${state.settings.tempMin} °C. Проверьте отопление и датчик.`, '♨']);
    if (zone.humidity < state.settings.humidityMin) recommendations.push(['warn', `Сухой воздух: ${zone.name}`, `${zone.humidity}% ниже заданного минимума ${state.settings.humidityMin}%. Проверьте увлажнитель и циркуляцию воздуха.`, '◌']);
    if (zone.light < state.settings.lightMin) recommendations.push(['warn', `Недостаточно света: ${zone.name}`, `${zone.light.toLocaleString('ru-RU')} лк ниже порога ${state.settings.lightMin.toLocaleString('ru-RU')} лк. Проверьте фитолампы.`, '☼']);
    if (zone.co2 > 1500) recommendations.push(['warn', `Высокий CO₂: ${zone.name}`, `${zone.co2} ppm превышает учебный порог 1500 ppm. Проветрите зону и проверьте датчик.`, '◉']);
  });
  if (sudden) recommendations.push(['warn', 'Резкое изменение показаний', 'Один из показателей изменился на 30% и более относительно предыдущего замера. Проверьте датчик и условия в зоне.', '↗']);
  if (!recommendations.length) recommendations.push(['', 'Микроклимат стабилен', 'Все показания находятся в заданных порогах. Продолжайте наблюдение за трендами датчиков.', '✓']);
  $('#recommendations').innerHTML = recommendations.slice(0, 5).map(([kind, title, desc, icon]) => `<div class="recommendation ${kind}"><span class="rec-icon">${icon}</span><span><b>${title}</b><p>${desc}</p></span></div>`).join('');
}

