import { UIComponent } from './UIComponent.js';

const CITIES = [
  { name: 'Москва', lat: 55.75, lon: 37.62 },
  { name: 'Санкт-Петербург', lat: 59.94, lon: 30.31 },
  { name: 'Ярославль', lat: 57.63, lon: 39.87 },
  { name: 'Екатеринбург', lat: 56.84, lon: 60.61 },
  { name: 'Новосибирск', lat: 55.03, lon: 82.92 },
  { name: 'Сочи', lat: 43.58, lon: 39.72 },
];

const WEATHER_CODES = {
  0: ['Ясно', '☀️'],
  1: ['Малооблачно', '🌤️'],
  2: ['Переменная облачность', '⛅'],
  3: ['Пасмурно', '☁️'],
  45: ['Туман', '🌫️'],
  48: ['Изморозь', '🌫️'],
  51: ['Слабая морось', '🌦️'],
  53: ['Морось', '🌦️'],
  55: ['Сильная морось', '🌦️'],
  61: ['Небольшой дождь', '🌧️'],
  63: ['Дождь', '🌧️'],
  65: ['Сильный дождь', '🌧️'],
  66: ['Ледяной дождь', '🌧️'],
  67: ['Сильный ледяной дождь', '🌧️'],
  71: ['Небольшой снег', '🌨️'],
  73: ['Снег', '🌨️'],
  75: ['Сильный снег', '❄️'],
  77: ['Снежные зёрна', '🌨️'],
  80: ['Ливень', '🌧️'],
  81: ['Ливень', '🌧️'],
  82: ['Сильный ливень', '⛈️'],
  85: ['Снежный заряд', '🌨️'],
  86: ['Сильный снегопад', '❄️'],
  95: ['Гроза', '⛈️'],
  96: ['Гроза с градом', '⛈️'],
  99: ['Сильная гроза с градом', '⛈️'],
};

/** Виджет «Погода на день»: данные Open-Meteo API по выбранной дате и городу. */
export class WeatherWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.type = 'weather';
    this.city = CITIES[0];
    this.date = WeatherWidget.todayISO();
  }

  static todayISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  renderBody(body) {
    body.innerHTML =
      '<div class="weather-controls">' +
      '<select class="weather-city"></select>' +
      '<input class="weather-date" type="date">' +
      '</div>' +
      '<div class="weather-result"><div class="weather-status">Выберите дату и город</div></div>';

    this.citySelect = body.querySelector('.weather-city');
    this.dateInput = body.querySelector('.weather-date');
    this.resultEl = body.querySelector('.weather-result');

    CITIES.forEach((city, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = city.name;
      if (city.name === this.city.name) option.selected = true;
      this.citySelect.appendChild(option);
    });
    this.dateInput.value = this.date;

    this.citySelect.addEventListener('change', () => {
      this.city = CITIES[Number(this.citySelect.value)];
      this.load();
      this.emitChange();
    });
    this.dateInput.addEventListener('change', () => {
      this.date = this.dateInput.value;
      this.load();
      this.emitChange();
    });
    this.load();
  }

  async load() {
    if (!this.date || !this.resultEl) return;
    this.resultEl.innerHTML = '<div class="weather-status">Загружаем прогноз...</div>';
    const { lat, lon, name } = this.city;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=auto&start_date=' + this.date + '&end_date=' + this.date;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const day = data.daily;
      if (!day || !day.time.length) throw new Error('Нет данных на эту дату');
      const code = day.weather_code[0];
      const desc = WEATHER_CODES[code] ? WEATHER_CODES[code][0] : 'Неизвестно';
      const icon = WEATHER_CODES[code] ? WEATHER_CODES[code][1] : '🌡️';
      const dateObj = new Date(day.time[0] + 'T12:00:00');
      const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
      const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      const precip = day.precipitation_probability_max[0] === null ? 0 : day.precipitation_probability_max[0];
      this.resultEl.innerHTML =
        '<div class="weather-main">' +
        '<span class="weather-icon">' + icon + '</span>' +
        '<div>' +
        '<div class="weather-temp">' + Math.round(day.temperature_2m_max[0]) + '° / ' +
        Math.round(day.temperature_2m_min[0]) + '°</div>' +
        '<div class="weather-desc">' + desc + '</div>' +
        '</div></div>' +
        '<div class="weather-extra">' +
        '<span>' + weekday + ', ' + dateStr + '</span>' +
        '<span>Осадки: ' + precip + '%</span>' +
        '<span>' + name + '</span>' +
        '</div>';
    } catch (e) {
      const limit = new Date();
      limit.setDate(limit.getDate() + 16);
      const note = this.date > limit.toISOString().slice(0, 10)
        ? 'Прогноз доступен максимум на 16 дней вперёд.'
        : 'Не удалось получить данные. Проверьте подключение к интернету.';
      this.resultEl.innerHTML = '<div class="weather-status error">' + note + '</div>';
    }
  }

  getState() { return { city: this.city.name, date: this.date }; }

  setState(state) {
    if (!state) return;
    if (state.city) {
      const found = CITIES.find((c) => c.name === state.city);
      if (found) this.city = found;
    }
    if (state.date) this.date = state.date;
    if (this.citySelect) {
      this.citySelect.value = CITIES.indexOf(this.city);
      this.dateInput.value = this.date;
      this.load();
    }
  }
}
