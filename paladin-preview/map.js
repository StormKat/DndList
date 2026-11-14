(() => {
  const panel = document.getElementById('panel-map');
  const view = panel.querySelector('.faerun-view');
  const world = view.firstElementChild;
  const image = world.querySelector('img');
  const search = panel.querySelector('input');
  const results = panel.querySelector('.faerun-results');
  const width = image.width;
  const height = image.height;
  // Coordinates on the 1824 × 1368 reference preview, not geodetic positions.
  const places = [
    ['Лускан', 'Luskan', 199, 128, 1],
    ['Рашемен', 'Rashemen', 1615, 126, 1],
    ['Тэй', 'Thay Тай', 1619, 351, 1],
    ['Уотердип', 'Waterdeep Глубоководье', 312, 282, 1],
    ['Врата Балдура', "Baldur's Gate Балдурс Гейт", 467, 476, 1],
    ['Калимпорт', 'Calimport', 566, 993, 1],
    ['Долина Ледяного Ветра', 'Icewind Dale', 135, 65, 1],
    ['Серебряные Пределы', 'Silver Marches', 503, 64, 1],
    ['Анаурох', 'Anauroch', 743, 94, 1],
    ['Лунные острова', 'Moonshae Isles', 110, 470, 1],
    ['Море Упавших Звёзд', 'Sea of Fallen Stars', 1191, 408, 1],
    ['Чульт', 'Chult Jungles of Chult', 287, 1164, 1],
    ['Халруаа', 'Halruaa', 1113, 1181, 1],
    ['Невервинтер', 'Neverwinter', 206, 195, 2],
    ['Порт Лласт', 'Port Llast', 199, 176, 4],
    ['Лейлон', 'Leilon', 212, 222, 4],
    ['Гонтлгрим', 'Gauntlgrym', 187, 179, 4],
    ['Земли Утгарда', 'Uthgardt', 246, 89, 4],
    ['Мирабар', 'Mirabar', 287, 65, 2],
    ['Лонгсэддл', 'Longsaddle', 291, 135, 4],
    ['Трибор', 'Triboar', 329, 199, 4],
    ['Яртар', 'Yartar', 362, 175, 3],
    ['Ред-Ларч', 'Red Larch', 325, 232, 4],
    ['Лаудуотер', 'Loudwater', 517, 277, 3],
    ['Ллёрк', 'Llorkh', 563, 278, 4],
    ['Сильверимун', 'Silverymoon', 464, 78, 2],
    ['Эверлунд', 'Everlund', 474, 96, 4],
    ['Сандабар', 'Sundabar', 527, 78, 3],
    ['Цитадель Фелбарр', 'Citadel Felbarr', 491, 31, 4],
    ['Цитадель Адбар', 'Citadel Adbar', 546, 42, 3],
    ['Эвереска', 'Evereska', 659, 362, 3],
    ['Даггерфорд', 'Daggerford', 335, 307, 2],
    ['Секомбер', 'Secomber', 427, 277, 4],
    ['Кэндлкип', 'Candlekeep Свечной замок', 430, 535, 2],
    ['Берег Мечей', 'Sword Coast Побережье Мечей', 444, 379, 2],
    ['Берегост', 'Beregost', 468, 520, 4],
    ['Амн', 'Amn', 583, 650, 2],
    ['Аткатла', 'Athkatla', 493, 647, 3],
    ['Крэниммор', 'Crimmor', 538, 642, 4],
    ['Тетир', 'Tethyr', 642, 824, 2],
    ['Зазеспур', 'Zazesspur', 552, 840, 3],
    ['Дарромар', 'Darromar', 676, 859, 4],
    ['Мир', 'Myr Forest', 711, 912, 4],
    ['Калимшан', 'Calimshan', 618, 961, 2],
    ['Мемнон', 'Memnon', 519, 921, 4],
    ['Лантан', 'Lantan', 187, 918, 2],
    ['Острова Нелантер', 'Nelanther Isles', 290, 752, 2],
    ['Порт Нянзару', 'Port Nyanzaru', 357, 1002, 3],
    ['Форт Белуариан', 'Fort Beluarian', 389, 1003, 4],
    ['Самарах', 'Samarach', 436, 1245, 3],
    ['Ташалар', 'Tashalar', 694, 1184, 3],
    ['Тарсульт', 'Tharsult', 812, 1090, 3],
    ['Кормир', 'Cormyr', 865, 402, 2],
    ['Сюзейл', 'Suzail', 830, 446, 3],
    ['Арабель', 'Arabel', 845, 386, 4],
    ['Марасембер', 'Marsember', 850, 443, 4],
    ['Вестгейт', 'Westgate', 924, 460, 3],
    ['Сембия', 'Sembia', 1017, 347, 2],
    ['Урмласпир', 'Urmlaspyr', 944, 453, 4],
    ['Миф Драннор', 'Myth Drannor', 1044, 276, 3],
    ['Кормантор', 'Cormanthor', 1015, 247, 2],
    ['Лунное море', 'Moonsea', 1086, 194, 2],
    ['Хиллсфар', 'Hillsfar', 1052, 209, 3],
    ['Мулмастер', 'Mulmaster', 1118, 209, 3],
    ['Вааса', 'Vaasa', 1150, 87, 2],
    ['Дамара', 'Damara', 1260, 111, 2],
    ['Импилтур', 'Impiltur', 1290, 272, 2],
    ['Нарфелл', 'Narfell', 1435, 125, 2],
    ['Великая Долина', 'Great Dale', 1415, 220, 2],
    ['Теск', 'Thesk', 1517, 294, 2],
    ['Агларонд', 'Aglarond', 1462, 439, 2],
    ['Велпринталар', 'Velprintalar', 1452, 397, 4],
    ['Эльтаббар', 'Eltabbar', 1671, 389, 3],
    ['Безтур', 'Bezantur', 1615, 488, 3],
    ['Тэйские горы', 'Thay Mount', 1618, 314, 4],
    ['Тармиш', 'Turmish', 1097, 595, 2],
    ['Алагон', 'Alaghon', 1142, 580, 4],
    ['Алтумбел', 'Altumbel', 1306, 475, 3],
    ['Чондат', 'Chondath', 1206, 693, 2],
    ['Чессента', 'Chessenta', 1385, 678, 2],
    ['Унтер', 'Unther', 1618, 750, 2],
    ['Мулхоранд', 'Mulhorand', 1701, 702, 2],
    ['Мургом', 'Murghom', 1783, 568, 2],
    ['Озеро Пара', 'Lake of Steam', 947, 877, 2],
    ['Шаар', 'Shaar', 1120, 991, 2],
    ['Восточный Шаар', 'Eastern Shaar', 1608, 930, 3],
    ['Луирен', 'Luiren', 1645, 1080, 3],
    ['Дамбрэт', 'Dambrath', 1483, 1237, 3],
    ['Лапалайя', 'Lapaliiya', 997, 1104, 3]
  ].map(([name, alias, x, y, detail]) => [name, alias, x / 1824, y / 1368, detail]);
  let x = 0, y = 0, scale = 0, fit = 0;
  const pointers = new Map();

  function draw() {
    const bound = (offset, size, viewport) => size <= viewport
      ? (viewport - size) / 2 : Math.max(viewport - size, Math.min(0, offset));
    x = bound(x, width * scale, view.clientWidth);
    y = bound(y, height * scale, view.clientHeight);
    world.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    world.style.setProperty('--pin-scale', 1 / scale);
    const occupied = [];
    const sorted = pins.filter(pin => pin.getAttribute('aria-pressed') === 'true');
    for (const pin of [...sorted, ...pins.filter(pin => !sorted.includes(pin))]) {
      const [, , px, py, detail] = places[Number(pin.dataset.place)];
      const sx = x + px * width * scale, sy = y + py * height * scale;
      pin.hidden = !sorted.includes(pin) && (scale < fit * detail * .99 ||
        sx < -16 || sx > view.clientWidth + 16 || sy < -16 || sy > view.clientHeight + 32 ||
        occupied.some(([ox, oy]) => Math.hypot(sx - ox, sy - oy) < 30));
      if (!pin.hidden) occupied.push([sx, sy]);
    }
  }
  function zoom(next, px = view.clientWidth / 2, py = view.clientHeight / 2,
                fromX = px, fromY = py) {
    next = Math.min(2.5, Math.max(fit, next));
    x = px - (fromX - x) * next / scale;
    y = py - (fromY - y) * next / scale;
    scale = next;
    draw();
  }
  function reset() {
    scale = fit;
    pins.forEach(pin => pin.setAttribute('aria-pressed', 'false'));
    draw();
  }
  function choose(index) {
    const [name, , px, py] = places[index];
    pins.forEach((pin, i) => pin.setAttribute('aria-pressed', String(i === index)));
    scale = Math.max(scale, Math.min(2.5, fit * 4));
    x = view.clientWidth / 2 - px * width * scale;
    y = view.clientHeight / 2 - py * height * scale;
    search.value = name;
    results.replaceChildren();
    draw();
  }
  const pins = places.map(([name, , px, py], index) => {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'faerun-pin';
    pin.dataset.place = index;
    pin.setAttribute('aria-label', name);
    pin.setAttribute('aria-pressed', 'false');
    pin.style.left = `${px * 100}%`;
    pin.style.top = `${py * 100}%`;
    const label = document.createElement('span');
    label.textContent = name;
    pin.append(label);
    pin.addEventListener('click', () => choose(index));
    world.append(pin);
    return pin;
  });
  new ResizeObserver(() => {
    if (!view.clientWidth || !view.clientHeight) return;
    if (!image.hasAttribute('src')) image.src = image.dataset.src;
    fit = Math.min(view.clientWidth / width, view.clientHeight / height);
    if (!scale) reset();
    else zoom(scale);
  }).observe(view);

  const matches = () => places.map(([name, alias], index) => ({name, alias, index}))
    .filter(({name, alias}) => `${name} ${alias}`.toLowerCase().includes(search.value.trim().toLowerCase()));
  function showResults() {
    results.replaceChildren();
    const found = matches();
    if (!found.length) {
      const message = document.createElement('p');
      message.textContent = 'Среди меток ничего не найдено';
      results.append(message);
    }
    found.forEach(({name, index}) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      button.addEventListener('click', () => { choose(index); view.focus(); });
      results.append(button);
    });
  }
  search.addEventListener('focus', showResults);
  search.addEventListener('input', showResults);
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape') results.replaceChildren();
    if (event.key === 'Enter' && matches().length) {
      choose(matches()[0].index);
      view.focus();
    }
  });
  panel.addEventListener('click', event => {
    if (!event.target.closest('.faerun-search')) results.replaceChildren();
    const action = event.target.dataset.mapAction;
    if (action === 'reset') { search.value = ''; reset(); }
    if (action === 'in' || action === 'out') zoom(scale * (action === 'in' ? 1.35 : 1 / 1.35));
  });
  function point(event) {
    const rect = view.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }
  view.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(scale * (event.deltaY < 0 ? 1.18 : 1 / 1.18), ...point(event));
  }, { passive: false });
  view.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    pointers.set(event.pointerId, point(event));
    view.setPointerCapture(event.pointerId);
  });
  view.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const [a, b] = pointers.get(event.pointerId);
    const [c, d] = point(event);
    pointers.set(event.pointerId, [c, d]);
    const other = [...pointers].find(([id]) => id !== event.pointerId)?.[1];
    if (other) {
      const [e, f] = other;
      const ratio = Math.hypot(c - e, d - f) / Math.max(1, Math.hypot(a - e, b - f));
      zoom(scale * ratio, (c + e) / 2, (d + f) / 2, (a + e) / 2, (b + f) / 2);
    } else { x += c - a; y += d - b; draw(); }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type =>
    view.addEventListener(type, event => pointers.delete(event.pointerId)));
  view.addEventListener('keydown', event => {
    if (event.target !== view) return;
    const shift = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[event.key];
    if (shift) { x += shift[0]; y += shift[1]; draw(); }
    else if (event.key === '+' || event.key === '=') zoom(scale * 1.35);
    else if (event.key === '-') zoom(scale / 1.35);
    else return;
    event.preventDefault();
  });
})();
