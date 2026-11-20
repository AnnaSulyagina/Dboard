import { UIComponent } from './UIComponent.js';

/** Виджет «Обратный отсчёт»: живой таймер до выбранной даты и времени. */
export class CountdownWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.type = 'countdown';
    this.target = null;
    this.label = 'Событие';
    this.timerId = null;
  }

  renderBody(body) {
    body.innerHTML =
      '<div class="countdown-display">' +
      '<div class="cd-label"></div>' +
      '<div class="cd-digits">' +
      '<span class="cd-cell"><b class="cd-d">0</b><i>дней</i></span>' +
      '<span class="cd-cell"><b class="cd-h">00</b><i>часов</i></span>' +
      '<span class="cd-cell"><b class="cd-m">00</b><i>минут</i></span>' +
      '<span class="cd-cell"><b class="cd-s">00</b><i>секунд</i></span>' +
      '</div>' +
      '<div class="cd-finished hidden">Время вышло! 🎉</div>' +
      '</div>' +
      '<div class="countdown-controls">' +
      '<input class="cd-date" type="datetime-local">' +
      '<input class="cd-name" type="text" placeholder="Название события" maxlength="60">' +
      '</div>';

    this.cdLabel = body.querySelector('.cd-label');
    this.cdD = body.querySelector('.cd-d');
    this.cdH = body.querySelector('.cd-h');
    this.cdM = body.querySelector('.cd-m');
    this.cdS = body.querySelector('.cd-s');
    this.cdFinished = body.querySelector('.cd-finished');
    this.dateInput = body.querySelector('.cd-date');
    this.nameInput = body.querySelector('.cd-name');

    this.nameInput.value = this.label;
    this.nameInput.addEventListener('input', () => {
      this.label = this.nameInput.value;
      this.cdLabel.textContent = this.label;
      this.emitChange();
    });
    this.dateInput.addEventListener('change', () => {
      this.target = this.dateInput.value ? new Date(this.dateInput.value).getTime() : null;
      this.update();
      this.emitChange();
    });

    if (this.target) {
      this.dateInput.value = this.toLocalInput(new Date(this.target));
    }
    this.cdLabel.textContent = this.label;
    this.update();
    this.timerId = setInterval(() => this.update(), 1000);
  }

  toLocalInput(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  update() {
    if (!this.cdD) return;
    if (!this.target) {
      this.cdD.textContent = '—';
      this.cdH.textContent = this.cdM.textContent = this.cdS.textContent = '—';
      return;
    }
    const diff = this.target - Date.now();
    if (diff <= 0) {
      this.cdFinished.classList.remove('hidden');
      this.cdD.textContent = this.cdH.textContent = this.cdM.textContent = this.cdS.textContent = '0';
      return;
    }
    this.cdFinished.classList.add('hidden');
    const s = Math.floor(diff / 1000);
    this.cdD.textContent = Math.floor(s / 86400);
    this.cdH.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
    this.cdM.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    this.cdS.textContent = String(s % 60).padStart(2, '0');
  }

  destroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    super.destroy();
  }

  getState() { return { target: this.target, label: this.label }; }

  setState(state) {
    if (!state) return;
    if (state.target) this.target = new Date(state.target).getTime();
    if (typeof state.label === 'string') this.label = state.label;
    if (this.dateInput) {
      this.nameInput.value = this.label;
      if (this.target) this.dateInput.value = this.toLocalInput(new Date(this.target));
      this.cdLabel.textContent = this.label;
      this.update();
    }
  }
}
