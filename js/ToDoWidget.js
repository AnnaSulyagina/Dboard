import { UIComponent } from './UIComponent.js';

/** Виджет «Список дел»: добавление, удаление, отметка выполненных. */
export class ToDoWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.type = 'todo';
    this.tasks = []; // данные списка дел — свойство класса
  }

  renderBody(body) {
    body.innerHTML =
      '<div class="todo-add">' +
      '<input class="todo-input" type="text" placeholder="Новая задача..." maxlength="120">' +
      '<button class="todo-add-btn">Добавить</button>' +
      '</div>' +
      '<ul class="todo-list"></ul>' +
      '<div class="todo-counter"></div>';
    this.listEl = body.querySelector('.todo-list');
    this.counterEl = body.querySelector('.todo-counter');
    this.inputEl = body.querySelector('.todo-input');
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTask();
    });
    this.renderTasks();
  }

  onBodyClick(event) {
    const taskEl = event.target.closest('.todo-item');
    if (event.target.closest('.todo-del')) {
      if (taskEl) this.removeTask(Number(taskEl.dataset.index));
      return;
    }
    if (event.target.closest('.todo-label') && taskEl) {
      this.toggleTask(Number(taskEl.dataset.index));
    }
  }

  addTask() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.tasks.push({ text, done: false });
    this.inputEl.value = '';
    this.renderTasks();
    this.emitChange();
  }

  removeTask(index) {
    this.tasks.splice(index, 1);
    this.renderTasks();
    this.emitChange();
  }

  toggleTask(index) {
    if (this.tasks[index]) {
      this.tasks[index].done = !this.tasks[index].done;
      this.renderTasks();
      this.emitChange();
    }
  }

  renderTasks() {
    this.listEl.innerHTML = '';
    this.tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.done ? ' done' : '');
      li.dataset.index = index;
      li.innerHTML =
        '<label class="todo-label"><input type="checkbox" ' + (task.done ? 'checked' : '') + '>' +
        '<span class="todo-text"></span></label>' +
        '<button class="todo-del" title="Удалить задачу">✕</button>';
      li.querySelector('.todo-text').textContent = task.text;
      this.listEl.appendChild(li);
    });
    const done = this.tasks.filter((t) => t.done).length;
    this.counterEl.textContent = this.tasks.length
      ? done + ' из ' + this.tasks.length + ' выполнено'
      : 'Задач пока нет';
  }

  getState() { return { tasks: this.tasks.map((t) => ({ ...t })) }; }

  setState(state) {
    if (state && Array.isArray(state.tasks)) {
      this.tasks = state.tasks.map((t) => ({ text: String(t.text), done: Boolean(t.done) }));
      if (this.listEl) this.renderTasks();
    }
  }
}
