const zoneDefaults = [
  { id: 'tomatoes', name: 'Томаты', variety: 'Теплолюбивые · Зона A', icon: '🍅', temp: 24.6, humidity: 64, soil: 42, light: 12800, co2: 680, online: true, lastUpdate: Date.now() },
  { id: 'cucumbers', name: 'Огурцы', variety: 'Влаголюбивые · Зона B', icon: '🥒', temp: 25.8, humidity: 72, soil: 38, light: 11600, co2: 710, online: true, lastUpdate: Date.now() },
  { id: 'greens', name: 'Зелень', variety: 'Листовые · Зона C', icon: '🥬', temp: 22.9, humidity: 59, soil: 51, light: 14200, co2: 620, online: true, lastUpdate: Date.now() }
];
const actuatorInfo = {
  pump: { name: 'Насос полива', detail: 'Главный резервуар · 500 л', icon: '◒' },
  fan: { name: 'Вентиляция', detail: 'Циркуляция воздуха', icon: '✺' },
  light: { name: 'Фитолампы', detail: 'Дополнительное освещение', icon: '☼' },
  humidifier: { name: 'Увлажнитель', detail: 'Поддержание влажности воздуха', icon: '◌' },
  heater: { name: 'Обогреватель', detail: 'Поддержание температуры', icon: '♨' },
  vent: { name: 'Форточка', detail: 'Естественное проветривание', icon: '⌁' }
};
const initialEvents = [
  { kind: 'auto', title: 'Система запущена', detail: 'Симулятор датчиков активирован', time: Date.now() - 1000 * 60 * 12 },
  { kind: 'auto', title: 'Полив завершён', detail: 'Зона «Томаты» · влажность почвы 42%', time: Date.now() - 1000 * 60 * 48 },
  { kind: 'auto', title: 'Показатели в норме', detail: 'Проверка микроклимата во всех зонах', time: Date.now() - 1000 * 60 * 130 }
];
function makeHistory() {
  return Array.from({ length: 12 }, (_, i) => ({ label: `${String((new Date().getHours() - 11 + i + 24) % 24).padStart(2, '0')}:00`, temp: +(23.5 + Math.sin(i / 2) * 1.5 + i * .12).toFixed(1), humidity: Math.round(63 + Math.cos(i / 2.3) * 5), soil: Math.round(45 - i * .3 + Math.sin(i / 2) * 3), water: +(72 - i * .18).toFixed(1), co2: Math.round(700 + Math.sin(i / 2) * 40) }));
}
const seed = () => ({ zones: structuredClone(zoneDefaults), water: 72, waterOnline: true, waterUpdatedAt: Date.now(), mode: 'auto', actuators: { pump: false, fan: false, light: false, humidifier: false, heater: false, vent: false }, settings: { soilMin: 35, soilMax: 43, humidityMin: 50, humidityMax: 80, tempMin: 20, tempMax: 28, lightMin: 12000, waterCritical: 15 }, events: initialEvents.map(event => ({ ...event })), history: makeHistory() });

