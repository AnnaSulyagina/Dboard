import { UIComponent } from './UIComponent.js';

const FALLBACK_QUOTES = [
  { quote: 'Простота — высшая степень изощрённости.', author: 'Леонардо да Винчи' },
  { quote: 'Сначала реши задачу. Потом напиши код.', author: 'Джон Джонсон' },
  { quote: 'Лучший способ предсказать будущее — создать его.', author: 'Алан Кэй' },
  { quote: 'Код — это способ объяснить компьютеру ваши идеи.', author: 'Хэл Абельсон' },
  { quote: 'Делай то, что не можешь не делать.', author: 'Константин Станиславский' },
];

/** Виджет «Цитата»: получает случайную цитату со стороннего API (dummyjson.com). */
export class QuoteWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.type = 'quote';
    this.current = null;
    this.loading = false;
  }

  renderBody(body) {
    body.innerHTML =
      '<div class="quote-box">' +
      '<p class="quote-text">Загружаем цитату...</p>' +
      '<p class="quote-author"></p>' +
      '</div>' +
      '<button class="quote-refresh">🔄 Обновить</button>';
    this.textEl = body.querySelector('.quote-text');
    this.authorEl = body.querySelector('.quote-author');
    this.refreshBtn = body.querySelector('.quote-refresh');
    this.refreshBtn.addEventListener('click', () => this.loadQuote());
    this.loadQuote();
  }

  async loadQuote() {
    if (this.loading || !this.textEl) return;
    this.loading = true;
    this.refreshBtn.disabled = true;
    this.textEl.textContent = 'Загрузка...';
    this.authorEl.textContent = '';
    try {
      const response = await fetch('https://zenquotes.io/api/random', {
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const [data] = await response.json(); // ответ приходит массивом: [{ q, a }]
      this.current = { quote: data.q, author: data.a };
    } catch (e) {
      // Оффлайн-резерв: локальный массив цитат
      this.current = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    }
    
    this.textEl.textContent = '«' + this.current.quote + '»';
    this.authorEl.textContent = '— ' + this.current.author;
    this.loading = false;
    this.refreshBtn.disabled = false;
    this.emitChange();
  }

  getState() { return this.current ? { quote: this.current.quote, author: this.current.author } : {}; }

  setState(state) {
    if (state && state.quote) {
      this.current = { quote: state.quote, author: state.author || '' };
      if (this.textEl) {
        this.textEl.textContent = '«' + state.quote + '»';
        this.authorEl.textContent = state.author ? '— ' + state.author : '';
      }
    }
  }
}
