function runAutomation() {
  if (state.mode !== 'auto') return;
  const desired = { pump: average('soil') < state.settings.soilMin && state.water > 15, fan: average('temp') > state.settings.tempMax, light: average('light') < state.settings.lightMin, heater: average('temp') < 17 };
  Object.keys(desired).forEach(key => { if (state.actuators[key] !== desired[key]) { state.actuators[key] = desired[key]; addEvent('auto', `${actuatorInfo[key].name}: ${desired[key] ? 'включено' : 'выключено'}`, `Автоматическое управление · условие ${desired[key] ? 'активировано' : 'в норме'}`); } });
}
