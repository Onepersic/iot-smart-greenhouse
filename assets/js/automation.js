function runAutomation() {
  if (state.mode !== 'auto') return;
  const soilTarget = state.actuators.pump ? state.settings.soilMax : state.settings.soilMin;
  const desired = {
    pump: state.water > state.settings.waterCritical && (state.actuators.pump ? average('soil') < soilTarget : average('soil') < state.settings.soilMin),
    fan: average('temp') > state.settings.tempMax,
    light: average('light') < state.settings.lightMin,
    humidifier: average('humidity') < state.settings.humidityMin,
    heater: average('temp') < state.settings.tempMin,
    vent: average('temp') > state.settings.tempMax + 2 || average('humidity') > state.settings.humidityMax
  };
  Object.keys(desired).forEach(key => { if (state.actuators[key] !== desired[key]) { state.actuators[key] = desired[key]; addEvent('auto', `${actuatorInfo[key].name}: ${desired[key] ? 'включено' : 'выключено'}`, `Автоматическое управление · условие ${desired[key] ? 'активировано' : 'в норме'}`); } });
}

