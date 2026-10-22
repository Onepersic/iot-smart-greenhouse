function simulate() {
  state.zones.forEach(zone => { zone.temp = +(zone.temp + (Math.random() - .5) * .55 + (state.actuators.fan ? -.14 : 0) + (state.actuators.heater ? .14 : 0)).toFixed(1); zone.humidity = Math.max(35, Math.min(88, Math.round(zone.humidity + (Math.random() - .5) * 3 + (state.actuators.fan ? -1 : 0)))); zone.soil = Math.max(12, Math.min(85, Math.round(zone.soil + (state.actuators.pump ? 2 : -.25) + (Math.random() - .5) * 2))); zone.light = Math.max(2000, Math.min(18000, Math.round(zone.light + (state.actuators.light ? 150 : 0) + (Math.random() - .5) * 350))); zone.co2 = Math.max(420, Math.min(1100, Math.round(zone.co2 + (Math.random() - .5) * 22))); });
  state.water = Math.max(0, Math.min(100, state.water - (state.actuators.pump ? .24 : .025)));
  if (state.actuators.pump && state.water > 15) state.zones.forEach(zone => { zone.soil = Math.min(85, zone.soil + 2); });
  runAutomation(); checkAlerts();
  const now = new Date(); state.history.push({ label: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, temp: +average('temp').toFixed(1), humidity: Math.round(average('humidity')), soil: Math.round(average('soil')) }); state.history = state.history.slice(-12);
  save(); render();
}
