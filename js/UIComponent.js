/**
 * Базовый (абстрактный) класс для всех виджетов.
 * Отвечает за обёртку, заголовок, сворачивание, удаление и позицию на доске.
 */
export class UIComponent {
  constructor({ id, title, x = 40, y = 40, width = 300 }) {
    if (new.target === UIComponent) {
      throw new Error('UIComponent — абстрактный класс, создайте наследника');
    }
    this.id = id;
    this.title = title;
    this.type = null; // задаётся в наследнике
    this.x = x;
    this.y = y;
    this.width = width;
    this.minimized = false;
    this.el = null;
    this.body = null;
    // Колбэки, которые подключает Dashboard
    this.onChange = null; // состояние изменилось -> сохранить
    this.onClose = null;  // запрос на удаление виджета
    this._onClick = this._handleClick.bind(this);
  }

  /** Создаёт DOM-обёртку виджета и возвращает её. */
  render() {
    if (this.el) return this.el;

    const el = document.createElement('section');
    el.className = 'widget';
    el.dataset.id = this.id;
    el.style.left = this.x + 'px';
    el.style.top = this.y + 'px';
    el.style.width = this.width + 'px';

    const header = document.createElement('header');
    header.className = 'widget-header';
    header.innerHTML =
      '<span class="widget-grip" title="Перетащите в режиме редактирования">⠿</span>' +
      '<h3 class="widget-title"></h3>' +
      '<span class="widget-controls">' +
      '<button class="w-btn w-minimize" title="Свернуть / развернуть">—</button>' +
      '<button class="w-btn w-close" title="Удалить виджет">✕</button>' +
      '</span>';

    const body = document.createElement('div');
    body.className = 'widget-body';

    el.append(header, body);
    this.el = el;
    this.body = body;

    this.setTitle(this.title);
    this.renderBody(body);
    el.addEventListener('click', this._onClick);

    if (this.minimized) el.classList.add('minimized');
    return el;
  }

  /** Делегирование кликов внутри виджета: кнопки шапки + действия наследников. */
  _handleClick(event) {
    if (event.target.closest('.w-minimize')) {
      this.minimize();
      return;
    }
    if (event.target.closest('.w-close')) {
      this.close();
      return;
    }
    this.onBodyClick(event);
  }

  /** Переопределяется в наследниках: клики по телу виджета. */
  onBodyClick() {}

  /** Переопределяется в наследниках: наполнение тела виджета. */
  renderBody() {}

  setTitle(text) {
    this.title = text;
    if (this.el) this.el.querySelector('.widget-title').textContent = text;
  }

  minimize() {
    this.minimized = !this.minimized;
    this.el.classList.toggle('minimized', this.minimized);
    this.emitChange();
  }

  close() {
    if (this.onClose) this.onClose(this.id);
  }

  /** Корректно удаляет виджет из DOM и снимает слушатели. */
  destroy() {
    if (this.el) {
      this.el.removeEventListener('click', this._onClick);
      this.el.remove();
    }
    this.el = null;
    this.body = null;
    this.onChange = null;
    this.onClose = null;
  }

  emitChange() {
    if (this.onChange) this.onChange();
  }

  setPosition({ x, y, width }) {
    if (typeof x === 'number') { this.x = x; if (this.el) this.el.style.left = x + 'px'; }
    if (typeof y === 'number') { this.y = y; if (this.el) this.el.style.top = y + 'px'; }
    if (typeof width === 'number') { this.width = width; if (this.el) this.el.style.width = width + 'px'; }
  }

  getPosition() {
    return { x: this.x, y: this.y, width: this.width, minimized: this.minimized };
  }

  /** Наследники возвращают своё состояние для сохранения. */
  getState() { return {}; }

  /** Наследники восстанавливают состояние. */
  setState() {}
}
