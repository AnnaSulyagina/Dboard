import { UIComponent } from './UIComponent.js';

/** Виджет «Заметки»: свободный текст, автосохранение при вводе. */
export class NotesWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.type = 'notes';
    this.text = '';
  }

  renderBody(body) {
    body.innerHTML =
      '<textarea class="notes-area" placeholder="Пишите здесь что угодно..." maxlength="5000"></textarea>' +
      '<div class="notes-meta"><span class="notes-count">0 символов</span></div>';
    this.areaEl = body.querySelector('.notes-area');
    this.countEl = body.querySelector('.notes-count');
    this.areaEl.value = this.text;
    this.areaEl.addEventListener('input', () => {
      this.text = this.areaEl.value;
      this.updateCounter();
      this.emitChange();
    });
    this.updateCounter();
  }

  updateCounter() {
    this.countEl.textContent = this.text.length + ' символов';
  }

  getState() { return { text: this.text }; }

  setState(state) {
    if (state && typeof state.text === 'string') {
      this.text = state.text;
      if (this.areaEl) {
        this.areaEl.value = this.text;
        this.updateCounter();
      }
    }
  }
}
