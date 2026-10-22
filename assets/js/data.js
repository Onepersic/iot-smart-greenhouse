const zoneDefaults = [
  { id: 'tomatoes', name: 'Томаты', variety: 'Теплолюбивые · Зона A', icon: '🍅', temp: 24.6, humidity: 64, soil: 42, light: 12800, co2: 680 },
  { id: 'cucumbers', name: 'Огурцы', variety: 'Влаголюбивые · Зона B', icon: '🥒', temp: 25.8, humidity: 72, soil: 38, light: 11600, co2: 710 },
  { id: 'greens', name: 'Зелень', variety: 'Листовые · Зона C', icon: '🥬', temp: 22.9, humidity: 59, soil: 51, light: 14200, co2: 620 }
];
const actuatorInfo = {
  pump: { name: 'Насос полива', detail: 'Главный резервуар · 500 л', icon: '◒' },
  fan: { name: 'Вентиляция', detail: 'Циркуляция воздуха', icon: '✺' },
  light: { name: 'Фитолампы', detail: 'Дополнительное освещение', icon: '☼' },
  heater: { name: 'Обогреватель', detail: 'Поддержание температуры', icon: '♨' }
};
const initialEvents = [
  { kind: 'auto', title: 'Система запущена', detail: 'Симулятор датчиков активирован', time: Date.now() - 1000 * 60 * 12 },
  { kind: 'auto', title: 'Полив завершён', detail: 'Зона «Томаты» · влажность почвы 42%', time: Date.now() - 1000 * 60 * 48 },
  { kind: 'auto', title: 'Показатели в норме', detail: 'Проверка микроклимата во всех зонах', time: Date.now() - 1000 * 60 * 130 }
];
function makeHistory() {
  return Array.from({ length: 12 }, (_, i) => ({ label: `${String((new Date().getHours() - 11 + i + 24) % 24).padStart(2, '0')}:00`, temp: +(23.5 + Math.sin(i / 2) * 1.5 + i * .12).toFixed(1), humidity: Math.round(63 + Math.cos(i / 2.3) * 5), soil: Math.round(45 - i * .3 + Math.sin(i / 2) * 3) }));
}
const seed = () => ({ zones: structuredClone(zoneDefaults), water: 72, mode: 'auto', actuators: { pump: false, fan: false, light: false, heater: false }, settings: { soilMin: 35, tempMax: 30, lightMin: 8000 }, events: initialEvents.map(event => ({ ...event })), history: makeHistory() });
