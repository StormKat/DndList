const CHARACTER_KEY = 'alden-vale';
const EDIT_TOKEN_KEY = 'alden_edit_token';
const localPreview = location.protocol === 'file:' ||
  ['127.0.0.1', 'localhost'].includes(location.hostname);
document.body.classList.toggle('local-preview', localPreview);
function characterApi(path) {
  const separator = path.includes('?') ? '&' : '?';
  return path + separator + 'character=' + encodeURIComponent(CHARACTER_KEY);
}

const INVENTORY_STORAGE_KEY = 'alden_inventory_v1';
const INVENTORY_UPDATED_KEY = 'alden_inventory_updated_at_v1';
let inventoryState = null;
let inventoryLoaded = false;
let inventoryCloudLoaded = false;
let inventorySaveTimer = null;
let inventorySaving = false;

function defaultInventory() {
  const item = (name, quantity = 1) => ({
    id: 'item-' + Math.random().toString(36).slice(2) + Date.now(),
    name,
    quantity
  });
  return {
    version: 1,
    currency: { gold: 59, silver: 0 },
    categories: [
      {
        id: 'weapons',
        title: 'Оружие',
        items: [item('Двуручный меч'), item('Копьё')]
      },
      {
        id: 'armor',
        title: 'Доспехи',
        items: [item('Кольчуга')]
      },
      {
        id: 'tools',
        title: 'Принадлежности',
        items: []
      },
      {
        id: 'gear',
        title: 'Прочее снаряжение',
        items: [item('Набор священника'), item('Ездовой конь')]
      }
    ]
  };
}

function loadInventoryLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.categories)) return saved;
  } catch(e) {}
  return defaultInventory();
}

function saveInventoryLocal() {
  const updatedAt = new Date().toISOString();
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryState));
  localStorage.setItem(INVENTORY_UPDATED_KEY, updatedAt);
  renderSheetInventory();
  scheduleInventoryCloudSave();
}

function initInventory() {
  if (!inventoryState) inventoryState = loadInventoryLocal();
  if (!inventoryLoaded) {
    inventoryLoaded = true;
    renderInventory();
  }
}

function escapeInventoryHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function inventoryIconMarkup(categoryId, extraClass = '') {
  const icons = {
    weapons: 'dagger',
    armor: 'shield',
    tools: 'tools',
    gear: 'bag',
    currency: 'coin'
  };
  const icon = icons[categoryId] || 'bag';
  return '<svg class="ui-icon ' + extraClass + '" aria-hidden="true"><use href="#icon-' + icon + '"></use></svg>';
}

function cleanInventoryTitle(value) {
  return String(value).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '').trim();
}

function inventoryItemDetails(name) {
  switch (name.trim().toLowerCase()) {
    case 'набор священника':
      return '<details class="inventory-branch"><summary>Содержимое одного набора</summary><ul>' +
        ['Рюкзак', 'Одеяло', 'Святая вода', 'Лампа', 'Рационы на 7 дней', 'Одеяние', 'Трутница']
          .map(entry => '<li>' + entry + '</li>').join('') +
        '</ul></details>';
    case 'кольчуга':
      return '<p class="inventory-item-note">Тяжёлый доспех · КБ 16 · 75 зм<br>Сила 13 · Помеха на Скрытность</p>';
    default:
      return '';
  }
}

function renderSheetInventory() {
  if (!inventoryState) return;
  const list = document.getElementById('sheet-inventory-list');
  const currency = document.getElementById('sheet-inventory-currency');

  if (list) {
    const items = inventoryState.categories
      .flatMap(category => category.items)
      .filter(item => item.quantity > 0);

    list.innerHTML = items.length
      ? items.map(item =>
        '<li class="eqli relative pl-3">' +
          escapeInventoryHtml(item.name) +
          (item.quantity !== 1 ? ' × ' + item.quantity : '') +
          inventoryItemDetails(item.name) +
        '</li>'
      ).join('')
      : '<li class="text-drow-faint">Снаряжение не добавлено</li>';
  }

  if (currency) {
    currency.innerHTML =
      inventoryIconMarkup('currency') +
      '<span>' + inventoryState.currency.gold + ' зм · ' +
      inventoryState.currency.silver + ' см</span>';
    currency.classList.add('icon-label');
  }
}

function renderInventory() {
  if (!inventoryState) return;
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = inventoryState.categories.map(category => {
    const items = category.items.length
      ? category.items.map(item =>
        '<div class="inv-item">' +
          '<div><div class="inv-item-name">' + escapeInventoryHtml(item.name) + '</div>' +
            inventoryItemDetails(item.name) + '</div>' +
          '<div class="inv-item-controls">' +
            '<button class="inv-qty-btn" onclick="changeInventoryQuantity(\'' + category.id + '\', \'' + item.id + '\', -1)">−</button>' +
            '<input class="inv-qty-input" type="number" inputmode="numeric" min="0" value="' + item.quantity +
              '" onchange="setInventoryQuantity(\'' + category.id + '\', \'' + item.id + '\', this.value)" aria-label="Количество ' +
              escapeInventoryHtml(item.name) + '">' +
            '<button class="inv-qty-btn" onclick="changeInventoryQuantity(\'' + category.id + '\', \'' + item.id + '\', 1)">+</button>' +
            '<button class="inv-remove-btn" onclick="removeInventoryItem(\'' + category.id + '\', \'' + item.id + '\')" aria-label="Удалить">×</button>' +
          '</div>' +
        '</div>'
      ).join('')
      : '<div class="inv-empty">В этой категории пока нет предметов.</div>';

    return '<section class="inv-section">' +
      '<div class="inv-section-title">' + inventoryIconMarkup(category.id) +
        escapeInventoryHtml(cleanInventoryTitle(category.title)) + '</div>' +
      '<div>' + items + '</div>' +
      '<div class="inv-add-row">' +
        '<input class="inv-add-input" id="inv-add-' + category.id + '" maxlength="120" placeholder="Новый предмет" ' +
          'onkeydown="if(event.key===\'Enter\') addInventoryItem(\'' + category.id + '\')">' +
        '<button class="inv-add-btn" onclick="addInventoryItem(\'' + category.id + '\')">Добавить</button>' +
      '</div>' +
    '</section>';
  }).join('');

  document.getElementById('inventory-gold').value = inventoryState.currency.gold;
  document.getElementById('inventory-silver').value = inventoryState.currency.silver;
  renderSheetInventory();
}

function findInventoryCategory(categoryId) {
  return inventoryState.categories.find(category => category.id === categoryId);
}

function addInventoryItem(categoryId) {
  initInventory();
  const category = findInventoryCategory(categoryId);
  const input = document.getElementById('inv-add-' + categoryId);
  const name = input.value.trim();
  if (!category || !name) return;
  category.items.push({
    id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    name,
    quantity: 1
  });
  input.value = '';
  saveInventoryLocal();
  renderInventory();
}

function setInventoryQuantity(categoryId, itemId, value) {
  const item = findInventoryCategory(categoryId)?.items.find(entry => entry.id === itemId);
  if (!item) return;
  item.quantity = Math.max(0, Math.min(99999, Math.floor(Number(value) || 0)));
  saveInventoryLocal();
  renderInventory();
}

function changeInventoryQuantity(categoryId, itemId, delta) {
  const item = findInventoryCategory(categoryId)?.items.find(entry => entry.id === itemId);
  if (!item) return;
  setInventoryQuantity(categoryId, itemId, item.quantity + delta);
}

function removeInventoryItem(categoryId, itemId) {
  const category = findInventoryCategory(categoryId);
  if (!category) return;
  category.items = category.items.filter(item => item.id !== itemId);
  saveInventoryLocal();
  renderInventory();
}

function setInventoryMoney(type, value) {
  initInventory();
  inventoryState.currency[type] = Math.max(0, Math.min(9999999, Math.floor(Number(value) || 0)));
  saveInventoryLocal();
}

function setInventoryStatus(message, state = '') {
  const status = document.querySelector('.inventory-sync-status');
  status.textContent = message;
  status.className = 'inventory-sync-status ' + state;
}

function setInventoryPassword(value) {
  sessionStorage.setItem(EDIT_TOKEN_KEY, value);
  if (value) scheduleInventoryCloudSave();
}

function getInventoryPassword() {
  return document.querySelector('.inventory-password')?.value ||
    sessionStorage.getItem(EDIT_TOKEN_KEY) || '';
}

function scheduleInventoryCloudSave() {
  clearTimeout(inventorySaveTimer);
  if (!inventoryCloudLoaded || !getInventoryPassword()) return;
  setInventoryStatus('Есть локальные изменения...', 'saving');
  inventorySaveTimer = setTimeout(() => saveInventoryCloud(false), 900);
}

async function loadInventoryCloud() {
  if (localPreview) return;
  setInventoryStatus('Загружаю инвентарь...', 'saving');
  try {
    const response = await fetch(characterApi('/.netlify/functions/get-inventory'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Не удалось загрузить инвентарь');
    const result = await response.json();
    const cloudTime = result.updatedAt ? new Date(result.updatedAt).getTime() : 0;
    const localValue = localStorage.getItem(INVENTORY_UPDATED_KEY);
    const localTime = localValue ? new Date(localValue).getTime() : 0;

    if (result.data?.version === 1 && cloudTime >= localTime) {
      inventoryState = result.data;
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryState));
      localStorage.setItem(INVENTORY_UPDATED_KEY, result.updatedAt);
      if (inventoryLoaded) renderInventory();
      else renderSheetInventory();
      setInventoryStatus('Загружено из облака', 'saved');
    } else if (result.data && localTime > cloudTime) {
      setInventoryStatus('На этом устройстве более свежая версия', 'saving');
    } else {
      setInventoryStatus('Облачный инвентарь пока пуст');
    }
  } catch(error) {
    setInventoryStatus('Нет связи с облаком. Используются локальные данные.', 'error');
  } finally {
    inventoryCloudLoaded = true;
    if (getInventoryPassword()) scheduleInventoryCloudSave();
  }
}

async function saveInventoryCloud(manual = false) {
  if (inventorySaving) return;
  initInventory();
  const password = getInventoryPassword();
  if (!password) {
    setInventoryStatus('Введи пароль редактора', 'error');
    document.querySelector('.inventory-password')?.focus();
    return;
  }

  clearTimeout(inventorySaveTimer);
  inventorySaving = true;
  setInventoryStatus('Сохраняю в Netlify...', 'saving');
  try {
    const response = await fetch(characterApi('/.netlify/functions/save-inventory'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-upload-token': password
      },
      body: JSON.stringify(inventoryState)
    });
    let result = {};
    try { result = await response.json(); } catch(e) {}
    if (!response.ok) {
      if (response.status === 401) throw new Error('Неверный пароль');
      throw new Error(result.error || 'Не удалось сохранить инвентарь');
    }
    sessionStorage.setItem(EDIT_TOKEN_KEY, password);
    localStorage.setItem(INVENTORY_UPDATED_KEY, result.updatedAt);
    setInventoryStatus(manual ? 'Синхронизировано' : 'Сохранено в облаке', 'saved');
  } catch(error) {
    setInventoryStatus(error.message || 'Ошибка сохранения', 'error');
  } finally {
    inventorySaving = false;
  }
}

window.addEventListener('DOMContentLoaded', function() {
  inventoryState = loadInventoryLocal();
  renderSheetInventory();
  const savedToken = sessionStorage.getItem(EDIT_TOKEN_KEY) || '';
  const password = document.querySelector('.inventory-password');
  if (password) password.value = savedToken;
  loadInventoryCloud();
});



const NOTES_DRAFT_KEY = 'alden_notes_draft';
let notesLoaded = false;
let notesDirty = false;
let notesSaveTimer = null;

function setNotesStatus(message, state = '') {
  const status = document.getElementById('notes-status');
  status.textContent = message;
  status.className = 'notes-status ' + state;
}

function formatNotesDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function escapeNotesText(value) {
  return String(value || '').replace(/[&<>"']/g, function(char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}

function plainTextToNotesHtml(value) {
  const text = String(value || '');
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .map(part => '<p>' + escapeNotesText(part).replace(/\n/g, '<br>') + '</p>')
    .join('');
}

function sanitizeNotesHtml(value) {
  const raw = String(value || '');
  if (!raw.trim()) return '';

  const template = document.createElement('template');
  template.innerHTML = /<\/?[a-z][\s\S]*>/i.test(raw) ? raw : plainTextToNotesHtml(raw);
  const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H3', 'H4', 'HR', 'SPAN', 'FONT']);
  const allowedClasses = new Set(['notes-size-xs', 'notes-size-sm', 'notes-size-md', 'notes-size-lg']);
  const fontSizeClassMap = {
    '1': 'notes-size-xs',
    '2': 'notes-size-sm',
    '3': 'notes-size-sm',
    '4': 'notes-size-md',
    '5': 'notes-size-lg',
    '6': 'notes-size-lg',
    '7': 'notes-size-lg'
  };

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');

    const tag = node.tagName;
    if (!allowedTags.has(tag)) {
      const fragment = document.createDocumentFragment();
      node.childNodes.forEach(child => fragment.appendChild(cleanNode(child)));
      return fragment;
    }

    const clean = document.createElement(tag === 'FONT' ? 'span' : tag.toLowerCase());
    if (tag === 'SPAN') {
      const safeClasses = [...node.classList].filter(className => allowedClasses.has(className));
      if (safeClasses.length) clean.className = safeClasses.join(' ');
    }
    if (tag === 'FONT') {
      const safeClass = fontSizeClassMap[node.getAttribute('size')] || 'notes-size-sm';
      clean.className = safeClass;
    }
    node.childNodes.forEach(child => clean.appendChild(cleanNode(child)));
    return clean;
  }

  const fragment = document.createDocumentFragment();
  template.content.childNodes.forEach(node => fragment.appendChild(cleanNode(node)));
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML
    .replace(/<div><br><\/div>/g, '<p><br></p>')
    .replace(/(<br>\s*){3,}/g, '<br><br>')
    .trim();
}

function setNotesEditorHtml(value) {
  const editor = document.getElementById('notes-editor');
  editor.innerHTML = sanitizeNotesHtml(value);
}

function getNotesEditorHtml() {
  const editor = document.getElementById('notes-editor');
  const html = sanitizeNotesHtml(editor.innerHTML);
  if (html !== editor.innerHTML.trim()) editor.innerHTML = html;
  return html;
}

function focusNotesEditor() {
  const editor = document.getElementById('notes-editor');
  editor.focus();
}

function noteSelectionInsideEditor() {
  const editor = document.getElementById('notes-editor');
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer);
}

function wrapNoteSelection(className) {
  focusNotesEditor();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !noteSelectionInsideEditor()) {
    document.execCommand('insertHTML', false, '<span class="' + className + '">\u200b</span>');
    return;
  }

  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.className = className;

  if (range.collapsed) {
    span.appendChild(document.createTextNode('\u200b'));
    range.insertNode(span);
    range.setStart(span.firstChild, 1);
    range.collapse(true);
  } else {
    span.appendChild(range.extractContents());
    range.insertNode(span);
    range.selectNodeContents(span);
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

function markNotesChanged() {
  notesDirty = true;
  localStorage.setItem(NOTES_DRAFT_KEY, getNotesEditorHtml());
  setNotesStatus('Есть несохранённые изменения', 'saving');
  scheduleNotesSave();
}

function formatNote(action) {
  focusNotesEditor();
  if (action === 'heading') {
    document.execCommand('formatBlock', false, 'h3');
  } else if (action === 'quote') {
    document.execCommand('formatBlock', false, 'blockquote');
  } else if (action === 'hr') {
    document.execCommand('insertHTML', false, '<hr><p><br></p>');
  } else if (action === 'ul') {
    document.execCommand('insertUnorderedList', false, null);
  } else if (action === 'ol') {
    document.execCommand('insertOrderedList', false, null);
  } else if (action === 'clear') {
    document.execCommand('removeFormat', false, null);
    document.execCommand('formatBlock', false, 'p');
  } else if (action === 'size-xs') {
    wrapNoteSelection('notes-size-xs');
  } else if (action === 'size-sm') {
    wrapNoteSelection('notes-size-sm');
  } else if (action === 'size-md') {
    wrapNoteSelection('notes-size-md');
  } else if (action === 'size-lg') {
    wrapNoteSelection('notes-size-lg');
  } else {
    document.execCommand(action, false, null);
  }
  markNotesChanged();
}

function insertNoteEmoji(value) {
  focusNotesEditor();
  document.execCommand('insertText', false, value + ' ');
  markNotesChanged();
}

async function loadNotes() {
  if (notesLoaded) return;
  notesLoaded = true;

  const localDraft = localStorage.getItem(NOTES_DRAFT_KEY);
  if (localPreview) {
    setNotesEditorHtml(localDraft || '');
    setNotesStatus('Сохранение в этом браузере');
    return;
  }
  setNotesStatus('Загружаю заметки...');

  try {
    const response = await fetch(characterApi('/.netlify/functions/get-notes'), {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Не удалось загрузить заметки');

    const result = await response.json();
    if (notesDirty) return;
    if (localDraft !== null && localDraft !== result.notes) {
      setNotesEditorHtml(localDraft);
      notesDirty = true;
      setNotesStatus('Открыт локальный черновик. Введи пароль, чтобы сохранить его в облако.', 'saving');
    } else {
      setNotesEditorHtml(result.notes || '');
      setNotesStatus(
        result.updatedAt ? 'Сохранено в облаке · ' + formatNotesDate(result.updatedAt) : 'Досье пока пустое',
        result.updatedAt ? 'saved' : ''
      );
    }
  } catch(error) {
    if (notesDirty) return;
    setNotesEditorHtml(localDraft || '');
    notesDirty = localDraft !== null;
    setNotesStatus(
      localDraft !== null ? 'Нет связи с облаком. Открыт локальный черновик.' : 'Нет связи с облаком.',
      'error'
    );
  }
}

function scheduleNotesSave() {
  clearTimeout(notesSaveTimer);
  const password = document.getElementById('notes-password').value;
  if (!password) return;
  notesSaveTimer = setTimeout(saveNotes, 1200);
}

async function saveNotes() {
  if (localPreview) {
    localStorage.setItem(NOTES_DRAFT_KEY, getNotesEditorHtml());
    setNotesStatus('Сохранено в браузере', 'saved');
    return;
  }
  const editor = document.getElementById('notes-editor');
  const passwordInput = document.getElementById('notes-password');
  const saveButton = document.getElementById('notes-save-btn');
  if (saveButton.disabled) return;
  const password = passwordInput.value;

  if (!password) {
    setNotesStatus('Введи пароль редактора, чтобы сохранить заметки в облако.', 'error');
    passwordInput.focus();
    return;
  }

  clearTimeout(notesSaveTimer);
  const notesHtml = getNotesEditorHtml();
  saveButton.disabled = true;
  setNotesStatus('Сохраняю в Netlify...', 'saving');

  try {
    const response = await fetch(characterApi('/.netlify/functions/save-notes'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-upload-token': password
      },
      body: JSON.stringify({ notes: notesHtml })
    });

    let result = {};
    try { result = await response.json(); } catch(e) {}

    if (!response.ok) {
      if (response.status === 401) throw new Error('Неверный пароль');
      throw new Error(result.error || 'Не удалось сохранить заметки');
    }

    sessionStorage.setItem(EDIT_TOKEN_KEY, password);
    notesDirty = getNotesEditorHtml() !== notesHtml;
    if (notesDirty) {
      scheduleNotesSave();
      setNotesStatus('Есть новые изменения', 'saving');
    } else {
      localStorage.removeItem(NOTES_DRAFT_KEY);
      setNotesStatus('Сохранено в облаке · ' + formatNotesDate(result.updatedAt), 'saved');
    }
  } catch(error) {
    setNotesStatus(error.message || 'Ошибка сохранения заметок', 'error');
  } finally {
    saveButton.disabled = false;
  }
}

document.getElementById('notes-editor').addEventListener('input', function() {
  notesDirty = true;
  localStorage.setItem(NOTES_DRAFT_KEY, getNotesEditorHtml());
  setNotesStatus(localPreview ? 'Сохранено в браузере' : 'Есть несохранённые изменения', localPreview ? 'saved' : 'saving');
  scheduleNotesSave();
});

document.getElementById('notes-editor').addEventListener('paste', function(event) {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
});

document.getElementById('notes-password').addEventListener('input', function() {
  if (notesDirty && this.value) scheduleNotesSave();
});

document.addEventListener('keydown', function(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    const notesPanel = document.getElementById('panel-notes');
    if (notesPanel.classList.contains('active')) {
      event.preventDefault();
      saveNotes();
    }
  }
});

window.addEventListener('DOMContentLoaded', function() {
  const savedToken = sessionStorage.getItem(EDIT_TOKEN_KEY);
  if (savedToken) document.getElementById('notes-password').value = savedToken;
  loadNotes();
});



let selectedFile = null;

function openPortraitModal() {
  document.getElementById('portraitModal').classList.add('open');
  const savedToken = sessionStorage.getItem(EDIT_TOKEN_KEY);
  if (savedToken) document.getElementById('portrait-password').value = savedToken;
}
function closePortraitModal() {
  document.getElementById('portraitModal').classList.remove('open');
  selectedFile = null;
  document.getElementById('portrait-password').value = '';
  document.getElementById('fi-modal').value = '';
  document.getElementById('modal-preview').classList.remove('show');
  document.getElementById('modal-preview').removeAttribute('src');
  document.getElementById('dropzone').style.display = '';
  document.getElementById('modal-apply-btn').disabled = true;
  document.getElementById('upload-status').textContent = '';
  document.getElementById('upload-status').className = 'upload-status';
}

function handleFileSelect(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    setStatus('Разрешены только JPG, PNG и WEBP', 'error');
    return;
  }
  if (file.size > 4 * 1024 * 1024) {
    setStatus('Файл слишком большой (макс. 4 МБ)', 'error');
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    const preview = document.getElementById('modal-preview');
    preview.src = ev.target.result;
    preview.classList.add('show');
    document.getElementById('modal-apply-btn').disabled = false;
    document.getElementById('dropzone').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function applyPortrait() {
  if (!selectedFile) return;
  if (localPreview) {
    const dataUrl = document.getElementById('modal-preview').src;
    try {
      localStorage.setItem('alden_portrait', dataUrl);
      showPortrait(dataUrl);
      closePortraitModal();
    } catch {
      setStatus('Не удалось сохранить портрет в браузере. Попробуй файл меньшего размера.', 'error');
    }
    return;
  }
  const password = document.getElementById('portrait-password').value;
  if (!password) {
    setStatus('Введи пароль для изменения портрета', 'error');
    return;
  }

  const applyButton = document.getElementById('modal-apply-btn');
  applyButton.disabled = true;
  setStatus('Загружаю портрет...', '');

  try {
    const response = await fetch(characterApi('/.netlify/functions/upload-portrait'), {
      method: 'POST',
      headers: {
        'content-type': selectedFile.type,
        'x-upload-token': password
      },
      body: selectedFile
    });

    let result = {};
    try { result = await response.json(); } catch(e) {}

    if (!response.ok) {
      if (response.status === 401) throw new Error('Неверный пароль');
      throw new Error(result.error || 'Не удалось сохранить портрет');
    }

    showPortrait(characterApi('/.netlify/functions/get-portrait?v=' + Date.now()));
    sessionStorage.setItem(EDIT_TOKEN_KEY, password);
    try {
      const reader = new FileReader();
      reader.onload = event => localStorage.setItem('alden_portrait', event.target.result);
      reader.readAsDataURL(selectedFile);
    } catch(e) {}

    setStatus('✓ Портрет сохранён и доступен на всех устройствах', 'success');
    setTimeout(closePortraitModal, 1400);
  } catch(error) {
    setStatus(error.message || 'Ошибка загрузки портрета', 'error');
    applyButton.disabled = false;
  }
}

function setStatus(msg, cls) {
  const el = document.getElementById('upload-status');
  el.textContent = msg;
  el.className = 'upload-status ' + cls;
}

// Drag & drop
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}
function handleDragLeave(e) {
  document.getElementById('dropzone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFileSelect(file);
}

// Закрыть по клику вне модалки
document.getElementById('portraitModal').addEventListener('click', function(e) {
  if (e.target === this) closePortraitModal();
});

function showPortrait(source) {
  const image = document.getElementById('portrait-img');
  const video = document.getElementById('portrait-video');
  if (video) {
    video.dataset.customPortrait = 'true';
    video.pause();
    video.closest('.portrait-frame').classList.remove('is-playing');
  }
  image.src = source;
  image.style.display = 'block';
  document.getElementById('upload-zone').style.display = 'none';
}

function restoreLocalPortrait() {
  try {
    const saved = localStorage.getItem('alden_portrait');
    if (saved) showPortrait(saved);
  } catch(e) {}
}

async function loadStoredPortrait() {
  if (localPreview) {
    restoreLocalPortrait();
    return;
  }
  try {
    const response = await fetch(characterApi('/.netlify/functions/get-portrait'), {
      method: 'HEAD',
      cache: 'no-store'
    });
    if (response.ok) {
      showPortrait(characterApi('/.netlify/functions/get-portrait?v=' + Date.now()));
      return;
    }
  } catch(e) {}
  restoreLocalPortrait();
}

window.addEventListener('DOMContentLoaded', loadStoredPortrait);
