import { Dashboard } from './js/Dashboard.js';

const STORAGE_KEY = 'planner-dashboard-v1';

// ---------- Состояние приложения (доски) ----------
let state = loadState();
let dashboard = null;

function defaultState() {
  return {
    activeBoardId: 'default',
    boards: [
      {
        id: 'default',
        name: 'Личная доска',
        widgets: [
          { type: 'todo', title: 'Список дел', x: 30, y: 30, width: 300, state: { tasks: [{ text: 'Разобраться с модулями ES6', done: true }, { text: 'Задеплоить проект на GitHub Pages', done: false }] } },
          { type: 'notes', title: 'Заметки', x: 360, y: 30, width: 300, state: { text: 'Идеи:\n— сделать виджет с музыкой\n— добавить тёмную тему' } },
          { type: 'quote', title: 'Цитата дня', x: 690, y: 30, width: 320, state: {} },
          { type: 'weather', title: 'Погода на день', x: 30, y: 330, width: 320, state: {} },
          { type: 'countdown', title: 'Обратный отсчёт', x: 380, y: 330, width: 300, state: { label: 'До дедлайна' } },
        ],
      },
    ],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.boards) && parsed.boards.length) return parsed;
    }
  } catch (e) { /* повреждённое хранилище — начинаем с чистого листа */ }
  return defaultState();
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Не удалось сохранить состояние:', e); }
}

function getActiveBoard() {
  return state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];
}

// ---------- Боковая панель: список досок ----------
const boardListEl = document.getElementById('board-list');
const boardTitleEl = document.getElementById('board-title');
const boardHintEl = document.getElementById('board-hint');

function renderBoardList() {
  boardListEl.innerHTML = '';
  for (const board of state.boards) {
    const li = document.createElement('li');
    li.className = 'board-item' + (board.id === state.activeBoardId ? ' active' : '');
    const nameBtn = document.createElement('button');
    nameBtn.className = 'board-name';
    nameBtn.textContent = board.name;
    nameBtn.title = 'Открыть доску (двойной клик — переименовать)';
    nameBtn.addEventListener('click', () => setActiveBoard(board.id));
    nameBtn.addEventListener('dblclick', () => renameBoard(board.id));
    li.appendChild(nameBtn);

    if (board.id !== 'default') {
      const delBtn = document.createElement('button');
      delBtn.className = 'board-delete';
      delBtn.textContent = '✕';
      delBtn.title = 'Удалить доску';
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeBoard(board.id); });
      li.appendChild(delBtn);
    }
    boardListEl.appendChild(li);
  }
}

function setActiveBoard(id) {
  if (!state.boards.some((b) => b.id === id)) return;
  state.activeBoardId = id;
  saveState();
  renderBoardList();
  openActiveBoard();
}

function addBoard() {
  const name = prompt('Название новой доски:', 'Новая доска');
  if (name === null) return;
  const board = { id: 'board-' + Date.now().toString(36), name: name.trim() || 'Новая доска', widgets: [] };
  state.boards.push(board);
  setActiveBoard(board.id);
}

function renameBoard(id) {
  const board = state.boards.find((b) => b.id === id);
  if (!board) return;
  const name = prompt('Новое название доски:', board.name);
  if (name === null) return;
  board.name = name.trim() || board.name;
  saveState();
  renderBoardList();
  if (board.id === state.activeBoardId) boardTitleEl.textContent = board.name;
}

function removeBoard(id) {
  const board = state.boards.find((b) => b.id === id);
  if (!board || board.id === 'default') return;
  if (!confirm('Удалить доску «' + board.name + '» вместе с виджетами?')) return;
  state.boards = state.boards.filter((b) => b.id !== id);
  if (state.activeBoardId === id) state.activeBoardId = 'default';
  saveState();
  renderBoardList();
  openActiveBoard();
}

// ---------- Верхняя панель ----------
const editModeBtn = document.getElementById('edit-mode-btn');
const addWidgetBtn = document.getElementById('add-widget-btn');
const addWidgetMenu = document.getElementById('add-widget-menu');
const canvasEl = document.getElementById('board-canvas');

editModeBtn.addEventListener('click', () => {
  const on = !canvasEl.classList.contains('edit-mode');
  dashboard.setEditMode(on);
  editModeBtn.classList.toggle('active', on);
  editModeBtn.textContent = on ? 'Готово' : 'Режим редактирования';
});

addWidgetBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  addWidgetMenu.classList.toggle('hidden');
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.add-menu-wrap')) addWidgetMenu.classList.add('hidden');
});
addWidgetMenu.addEventListener('click', (e) => {
  const type = e.target.dataset.type;
  if (!type) return;
  dashboard.addWidget(type);
  addWidgetMenu.classList.add('hidden');
});

// ---------- Запуск ----------
function openActiveBoard() {
  const board = getActiveBoard();
  boardTitleEl.textContent = board.name;
  dashboard.restore(board.widgets);
  updateHint();
}

function updateHint() {
  const board = getActiveBoard();
  const n = board.widgets.length;
  boardHintEl.textContent = n ? n + ' виджет(ов)' : 'Пусто — добавьте первый виджет';
}

function init() {
  dashboard = new Dashboard(canvasEl, {
    onChange: (widgets) => {
      const board = getActiveBoard();
      board.widgets = widgets;
      saveState();
      updateHint();
    },
  });

  document.getElementById('add-board-btn').addEventListener('click', addBoard);

  renderBoardList();
  openActiveBoard();
}

init();
