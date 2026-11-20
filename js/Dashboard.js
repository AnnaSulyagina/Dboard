import { ToDoWidget } from './ToDoWidget.js';
import { CountdownWidget } from './CountdownWidget.js';
import { NotesWidget } from './NotesWidget.js';
import { QuoteWidget } from './QuoteWidget.js';
import { WeatherWidget } from './WeatherWidget.js';

const WIDGET_TYPES = {
  todo: { cls: ToDoWidget, title: 'Список дел', width: 300 },
  countdown: { cls: CountdownWidget, title: 'Обратный отсчёт', width: 300 },
  notes: { cls: NotesWidget, title: 'Заметки', width: 300 },
  quote: { cls: QuoteWidget, title: 'Цитата', width: 320 },
  weather: { cls: WeatherWidget, title: 'Погода на день', width: 320 },
};

/**
 * Класс, управляющий доской: коллекция виджетов,
 * свободное позиционирование, перетаскивание в режиме редактирования.
 */
export class Dashboard {
  constructor(canvas, { onChange = () => {}, editMode = false } = {}) {
    this.canvas = canvas;
    this.widgets = [];
    this.editMode = editMode;
    this.onChange = onChange;
    this._drag = null;
    this._onDragStart = this._handleDragStart.bind(this);
    this._onDragMove = this._handleDragMove.bind(this);
    this._onDragEnd = this._handleDragEnd.bind(this);
    canvas.addEventListener('mousedown', this._onDragStart);
    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);
  }

  addWidget(widgetType, config = {}) {
    const meta = WIDGET_TYPES[widgetType];
    if (!meta) throw new Error('Неизвестный тип виджета: ' + widgetType);
    const id = config.id || widgetType + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const fallback = this._freeSpot();
    const widget = new meta.cls({
      id,
      title: config.title || meta.title,
      x: typeof config.x === 'number' ? config.x : fallback.x,
      y: typeof config.y === 'number' ? config.y : fallback.y,
      width: typeof config.width === 'number' ? config.width : meta.width,
    });
    widget.type = widgetType;
    widget.onClose = (widgetId) => this.removeWidget(widgetId);
    widget.onChange = () => this._persist();
    if (config.state) widget.setState(config.state);
    if (config.minimized) widget.minimized = true;

    const el = widget.render();
    this.canvas.appendChild(el);
    this.widgets.push(widget);
    this.setEditMode(this.editMode);
    this._persist();
    return widget;
  }

  removeWidget(widgetId) {
    const index = this.widgets.findIndex((w) => w.id === widgetId);
    if (index === -1) return;
    this.widgets[index].destroy();
    this.widgets.splice(index, 1);
    this._persist();
  }

  getWidgets() {
    return [...this.widgets];
  }

  setEditMode(on) {
    this.editMode = Boolean(on);
    this.canvas.classList.toggle('edit-mode', this.editMode);
  }

  clear() {
    [...this.widgets].forEach((w) => w.destroy());
    this.widgets = [];
  }

  /** Сохранённый список конфигураций -> виджеты на доске. */
  restore(list) {
    this.clear();
    (list || []).forEach((cfg) => {
      try { this.addWidget(cfg.type, cfg); }
      catch (e) { console.warn('Не удалось восстановить виджет:', cfg, e); }
    });
  }

  /** Сериализация доски для localStorage. */
  serialize() {
    return this.widgets.map((w) => ({
      type: w.type,
      id: w.id,
      title: w.title,
      ...w.getPosition(),
      state: w.getState(),
    }));
  }

  destroy() {
    this.clear();
    this.canvas.removeEventListener('mousedown', this._onDragStart);
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
  }

  _persist() {
    if (this.onChange) this.onChange(this.serialize());
  }

  _freeSpot() {
    const n = this.widgets.length;
    return { x: 30 + (n % 4) * 40, y: 30 + (n % 4) * 40 };
  }

  // ---------- Перетаскивание (только в режиме редактирования) ----------
  _handleDragStart(event) {
    if (!this.editMode) return;
    const header = event.target.closest('.widget-header');
    if (!header || event.target.closest('.w-btn')) return;
    const el = header.closest('.widget');
    const widget = this.widgets.find((w) => w.id === el.dataset.id);
    if (!widget) return;
    const rect = el.getBoundingClientRect();
    this._drag = { widget, el, dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    el.classList.add('dragging');
    event.preventDefault();
  }

  _handleDragMove(event) {
    if (!this._drag) return;
    const { widget, el, dx, dy } = this._drag;
    const canvasRect = this.canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - canvasRect.left - dx, canvasRect.width - 120));
    const y = Math.max(0, Math.min(event.clientY - canvasRect.top - dy, canvasRect.height - 60));
    widget.setPosition({ x, y });
  }

  _handleDragEnd() {
    if (!this._drag) return;
    this._drag.el.classList.remove('dragging');
    this._drag = null;
    this._persist();
  }
}
