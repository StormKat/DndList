(() => {
  const byId = id => document.getElementById(id);
  const cards = byId('battle-cards');
  const rerollStack = byId('battle-reroll-stack');
  const rerollCoin = byId('battle-reroll-coin');
  let displayedRerolls = masterRerolls;
  const rerollStatus = byId('battle-reroll-status');
  const rerollPassword = byId('battle-reroll-password');
  const rerollSync = byId('battle-reroll-sync');
  let rerollRevision;
  let rerollBusy = false;
  const result = byId('battle-result');
  const slotInputs = [byId('slots1'), byId('slots2')];
  const deathMarks = byId('battle-death-marks');
  deathMarks.innerHTML = [
    ['successes', 'Успехи', 'Успех', 'gemGreen'],
    ['failures', 'Провалы', 'Провал', 'gemRed']
  ].map(([id, title, label, glyph]) =>
    `<div role="group" aria-label="${title}"><span>${title}</span>` +
    [1, 2, 3].map(number =>
      `<button type="button" data-death-mark="${id}${number}" aria-label="${label} ${number}" aria-pressed="false"><img class="rpg-icon" src="rpg-icons/${glyph}.png" alt=""><span class="death-sparks" aria-hidden="true"><i></i><i></i><i></i></span></button>`
    ).join('') + '</div>'
  ).join('');
  const deathButtons = [...deathMarks.querySelectorAll('button')];
  const hands = byId('hands');
  const health = byId('hp');
  const hitDie = byId('die');
  const shortRest = byId('battle-short-rest-form');
  const shortRestToggle = byId('battle-short-rest');
  const shortRestRoll = byId('battle-short-rest-roll');
  const handPips = byId('battle-hands-pips');
  const spentHands = Array.from({ length: 5 }, (_, index) => index >= hands.valueAsNumber);
  let animation;

  handPips.innerHTML = spentHands.map((_, index) => `
    <button type="button" data-hand-point="${index}" aria-label="Очко Возложения рук ${index + 1}">
      <img class="rpg-icon" src="rpg-icons/hands.png" alt="">
    </button>`).join('');

  const dice = {
    4: ['16,3 30,28 2,28', '16,3 16,21 2,28', '16,21 30,28 2,28', 20, 22],
    6: ['16,2 29,9 29,24 16,31 3,24 3,9', '16,2 29,9 16,16 3,9', '16,16 29,9 29,24 16,31', 9, 23],
    8: ['16,2 30,16 16,30 2,16', '16,2 22,20 10,20', '10,20 22,20 30,16 16,30 2,16', 16, 25],
    10: ['16,2 30,14 24,24 16,31 8,24 2,14', '16,2 23,18 16,23 9,18', '16,2 30,14 24,24 16,31 16,23 23,18', 16, 18],
    20: ['16,2 29,9 29,24 16,31 3,24 3,9', '16,2 8,22 24,22', '16,2 29,9 29,24 16,31 8,22 24,22', 16, 19]
  };
  const die = sides => {
    const [outline, light, shade, x, y] = dice[sides];
    return `<svg class="battle-die" viewBox="0 0 32 32" role="img" aria-label="Кубик к${sides}">
      <polygon points="${outline}"/><polygon class="die-light" points="${light}"/><polygon class="die-shade" points="${shade}"/>
      <text x="${x}" y="${y}" text-anchor="middle">${sides}</text>
    </svg>`;
  };
  const rollButton = (name, label, count, sides, bonus = 0) =>
    `<button type="button" data-roll="${name}" data-count="${count}" data-sides="${sides}" data-bonus="${bonus}">${die(sides)}<span>${label}<small>${count}к${sides}${bonus ? ' + ' + bonus : ''}</small></span></button>`;
  const card = (name, icon, type, description, actions) =>
    `<article class="battle-card" data-tone="${type}"><header><span class="battle-icon"><img class="rpg-icon" src="rpg-icons/${icon}.png" alt=""></span><div><small>${type}</small><h3>${name}</h3></div></header><p>${description}</p><div class="battle-actions">${actions}</div></article>`;
  const ravenUses = [byId('raven-uses1'), byId('raven-uses2')];
  const weapon = (name, icon, description, count, sides, extra = '') => card(name, icon, 'Оружие', description,
    rollButton(name + ' · атака', 'Атака', 1, 20, 6) +
    rollButton(name + ' · урон', 'Урон', count, sides, 4) +
    rollButton(name + ' · крит', 'Крит', count * 2, sides, 4) + extra);
  cards.innerHTML = [
    weapon('Двуручный меч', 'sword', 'Рубящий урон, 5 фт. Задевание при промахе наносит 4 рубящего урона.', 2, 6),
    weapon('Копьё', 'upg_spear', 'Колющий урон, 5 фт или 20/60 фт броском. Ослабление даёт цели помеху на следующую атаку до начала твоего следующего хода.', 1, 6,
      rollButton('Копьё двумя руками', 'Двумя руками', 1, 8, 4) + rollButton('Копьё двумя руками · крит', 'Крит двумя руками', 2, 8, 4)),
    card('Благословение', 'upg_wand', 'Заклинание · 1-й уровень', 'Действие · 30 фт · концентрация до 1 минуты. До трёх целей добавляют 1к4 к атакам и спасброскам. Бонусный кубик бросается при каждой такой проверке.', '<button type="button" data-cast="bless">Применить · 1 ячейка</button>' + rollButton('Благословение · бонус', 'Бонус', 1, 4)),
    card('Щит веры', 'upg_shield', 'Заклинание · 1-й уровень', 'Бонусное действие · 60 фт · концентрация до 10 минут. Цель получает +2 к КБ на время действия заклинания.', '<button type="button" data-cast="shield">Применить · 1 ячейка</button>'),
    card('Благословение Королевы Воронов', 'raven-queen', 'Бонусное действие', 'Телепортируйся на расстояние до 30 фт в свободное место, которое видишь. Два применения за продолжительный отдых.', '<button type="button" id="battle-raven">Телепортироваться</button><small id="battle-raven-count" role="status"></small>'),
    card('Возложение рук', 'heart', 'Бонусное действие', 'Касанием восстанови себе или союзнику 1 ХП за каждое потраченное очко. Чтобы снять состояние «Отравлен», потрать 5 очков. Отмечай расход крестиками вверху, а хиты меняй у цели. Кубики не нужны.', ''),
    card('Инициатива и спасброски', 'helmet', 'Проверки', 'Ловкость даёт +1 к инициативе. При 0 ХП спасбросок от смерти обычно успешен на 10+. Натуральная 1 даёт два провала, натуральная 20 восстанавливает 1 ХП. Отмечай результаты на листе.', rollButton('Инициатива', 'Инициатива', 1, 20, 1) + rollButton('Спасбросок от смерти', 'От смерти', 1, 20)),
    `<section class="battle-card battle-tactics" aria-labelledby="battle-tactics-title">
      <header><span class="battle-icon"><img class="rpg-icon" src="rpg-icons/axe.png" alt=""></span><div><small>Тактика</small><h3 id="battle-tactics-title">Действия в бою</h3></div></header>
      <dl>
        <div><dt>Рывок <small>Действие</small></dt><dd>Получаешь дополнительное перемещение, равное твоей скорости (обычно 30 фт), до конца хода.</dd></div>
        <div><dt>Отход <small>Действие</small></dt><dd>До конца хода твоё перемещение не провоцирует атаки.</dd></div>
        <div><dt>Уклонение <small>Действие</small></dt><dd>До начала твоего следующего хода атаки тех, кого ты видишь, идут с помехой, а спасброски Ловкости — с преимуществом. Эффект пропадает, если ты недееспособен или твоя скорость падает до нуля.</dd></div>
        <div><dt>Провоцированная атака <small>Реакция</small></dt><dd>Можешь потратить реакцию, чтобы атаковать видимую цель в ближнем бою, когда она покидает твою досягаемость.</dd></div>
      </dl>
    </section>`
  ].join('');

  function syncResources() {
    const ravenAvailable = ravenUses.filter(input => !input.checked).length;
    byId('battle-raven-count').textContent = ravenAvailable + ' из 2 доступно';
    byId('battle-raven').disabled = ravenAvailable === 0;
    const previousRerolls = displayedRerolls;
    displayedRerolls = masterRerolls;
    const visibleCoins = Math.min(masterRerolls, 5);
    rerollStack.classList.toggle('is-empty', visibleCoins === 0);
    while (rerollStack.children.length > Math.max(1, visibleCoins)) {
      rerollStack.lastElementChild.remove();
    }
    while (rerollStack.children.length < Math.max(1, visibleCoins)) {
      rerollStack.append(rerollCoin.content.cloneNode(true));
    }
    if (masterRerolls > previousRerolls && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const topCoin = rerollStack.lastElementChild;
      topCoin.getAnimations().forEach(animation => animation.cancel());
      topCoin.animate([
        { transform: 'translate(7px, -33px) rotate(-24deg) scale(1.12)', opacity: 0 },
        { transform: 'translateY(2px) scale(1.06, .88)', opacity: 1, offset: .65 },
        { transform: 'translateY(-4px)', offset: .82 },
        { transform: 'none' }
      ], { duration: 420, easing: 'ease-out' });
    }
    byId('battle-reroll-count').textContent = masterRerolls;
    byId('battle-reroll-spend').disabled = rerollBusy || masterRerolls === 0;
    byId('battle-reroll-grant').disabled = rerollBusy || masterRerolls === Number.MAX_SAFE_INTEGER;
    rerollSync.disabled = rerollBusy;
    deathButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(byId(button.dataset.deathMark).checked));
    });
    byId('battle-hp').value = health.value;
    byId('battle-temp').value = byId('temp').value;
    const remaining = hands.valueAsNumber;
    let displayed = spentHands.filter(spent => !spent).length;
    for (let index = spentHands.length - 1; index >= 0 && displayed !== remaining; index--) {
      if (spentHands[index] === (displayed < remaining)) {
        spentHands[index] = !spentHands[index];
        displayed += spentHands[index] ? -1 : 1;
      }
    }
    handPips.querySelectorAll('button').forEach((button, index) => {
      button.setAttribute('aria-pressed', String(spentHands[index]));
      button.title = spentHands[index] ? 'Вернуть очко' : 'Потратить очко';
    });
    byId('battle-hands').textContent = remaining + ' из 5 доступно';
    slotInputs.forEach((input, index) => {
      const button = document.querySelector(`[data-slot="${index + 1}"]`);
      button.setAttribute('aria-pressed', String(input.checked));
      button.title = input.checked ? 'Восстановить ячейку' : 'Отметить ячейку потраченной';
    });
    const available = slotInputs.filter(input => !input.checked).length;
    byId('battle-slot-count').textContent = available + ' из 2 доступно';
    cards.querySelectorAll('[data-cast]').forEach(button => { button.disabled = !available; });
    byId('battle-short-rest-help').innerHTML = hitDie.checked
      ? 'Кость хитов уже потрачена. Она восстановится после продолжительного отдыха.'
      : die(10) + ' Брось <strong>1к10</strong> и введи выпавшее число. Лист добавит <strong>+1</strong> за Телосложение.';
    shortRestRoll.disabled = hitDie.checked;
    shortRest.querySelector('button[type="submit"]').disabled = hitDie.checked;
  }

  function show(text, total = null, sides = null, canHeal = false) {
    result.replaceChildren();
    if (sides) result.insertAdjacentHTML('beforeend', die(sides));
    const summary = document.createElement('span');
    summary.textContent = text;
    result.append(summary);
    if (total !== null) {
      const value = document.createElement('strong');
      value.textContent = total;
      result.append(value);
    }
    if (canHeal) {
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = 'Лечить себя';
      apply.addEventListener('click', () => {
        health.value = health.valueAsNumber + total;
        normalize(health);
        save();
        apply.remove();
      }, { once: true });
      result.append(apply);
    }
    animation?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation = result.animate([{ opacity: .45, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], 260);
      result.querySelector('svg')?.animate([
        { transform: 'perspective(160px) rotateX(-125deg) rotateZ(-80deg) scale(.55)' },
        { transform: 'perspective(160px) rotateX(15deg) rotateZ(12deg) scale(1.12)', offset: .72 },
        { transform: 'none' }
      ], { duration: 460, easing: 'ease-out' });
    }
  }

  function roll(name, count, sides, bonus, canHeal = false) {
    if (!byId('battle-digital-rolls').checked) {
      show(name + ' · брось ' + count + 'к' + sides + (bonus ? ' + ' + bonus : '') + (canHeal ? ' и добавь результат к ХП цели' : ''), null, sides);
      return;
    }
    const values = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
    const total = values.reduce((sum, value) => sum + value, bonus);
    show(name + ' · ' + values.join(' + ') + (bonus ? ' + ' + bonus : ''), total, sides, canHeal);
  }

  for (const [source, target] of [['battle-hp', 'hp'], ['battle-temp', 'temp']]) {
    byId(source).addEventListener('change', event => {
      byId(target).value = event.target.value;
      normalize(byId(target));
      save();
    });
  }
  for (const [id, delta] of [['battle-up', 1], ['battle-down', -1]]) {
    byId(id).addEventListener('click', () => {
      health.value = health.valueAsNumber + delta;
      normalize(health);
      save();
    });
  }
  document.querySelector('.battle-slots').addEventListener('click', event => {
    const button = event.target.closest('[data-slot]');
    if (!button) return;
    const slot = slotInputs[Number(button.dataset.slot) - 1];
    slot.checked = !slot.checked;
    save();
  });
  handPips.addEventListener('click', event => {
    const button = event.target.closest('[data-hand-point]');
    if (!button) return;
    const index = Number(button.dataset.handPoint);
    spentHands[index] = !spentHands[index];
    hands.value = spentHands.filter(spent => !spent).length;
    save();
  });
  cards.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const { cast, roll: name, count, sides, bonus } = button.dataset;
    if (name) roll(name, Number(count), Number(sides), Number(bonus));
    if (cast) {
      const slot = slotInputs.find(input => !input.checked);
      if (!slot) return;
      slot.checked = true;
      save();
      show((cast === 'shield' ? 'Щит веры: +2 к КБ цели' : 'Благословение применено') + ' · ячейка потрачена');
    }
    if (button.id === 'battle-raven') {
      const use = ravenUses.find(input => !input.checked);
      if (!use) return;
      use.checked = true;
      save();
      show('Благословение Королевы Воронов · телепортация до 30 фт');
    }
  });
  shortRestToggle.addEventListener('click', () => {
    shortRest.hidden = !shortRest.hidden;
    shortRestToggle.setAttribute('aria-expanded', String(!shortRest.hidden));
    if (!shortRest.hidden && !shortRestRoll.disabled) shortRestRoll.focus();
  });
  shortRest.addEventListener('submit', event => {
    event.preventDefault();
    if (hitDie.checked || !shortRestRoll.checkValidity()) return;
    const restored = Math.min(shortRestRoll.valueAsNumber + 1, Number(health.max) - health.valueAsNumber);
    if (restored <= 0) {
      show('Хиты уже полные. Кость хитов доступна.');
      return;
    }
    health.value = health.valueAsNumber + restored;
    hitDie.checked = true;
    shortRest.reset();
    save();
    show('Короткий отдых · восстановлено ХП', restored, 10);
  });
  byId('battle-rest').addEventListener('click', () => {
    if (!confirm('Завершить продолжительный отдых и восстановить ресурсы?')) return;
    health.value = health.max;
    byId('temp').value = 0;
    hands.value = hands.max;
    byId('die').checked = false;
    ravenUses.forEach(input => { input.checked = false; });
    document.querySelectorAll('#slots input, #successes input, #failures input').forEach(input => { input.checked = false; });
    save();
    show('Хиты, ячейки, кость хитов, «Возложение рук» и телепортации восстановлены');
  });
  document.addEventListener('sheet-resources-change', syncResources);
  async function syncRerolls(delta = 0, upload = false) {
    if (rerollBusy) return;
    const password = rerollPassword.value || sessionStorage.getItem(EDIT_TOKEN_KEY);
    if (upload && !password) {
      rerollStatus.textContent = 'Введи пароль редактора для сохранения';
      rerollPassword.focus();
      return;
    }
    rerollBusy = true;
    syncResources();
    const url = characterApi('/.netlify/functions/rerolls');
    async function readBalance() {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Не удалось загрузить перебросы');
      const state = await response.json();
      rerollRevision = state.revision;
      if (state.count !== null) {
        masterRerolls = state.count;
        save();
      }
    }
    try {
      if (!upload || rerollRevision === undefined) await readBalance();
      if (upload) {
        const count = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, masterRerolls + delta));
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-upload-token': password },
          body: JSON.stringify({ count, revision: rerollRevision })
        });
        if (response.status === 401) throw new Error('Неверный пароль редактора');
        if (response.status === 409) {
          await readBalance();
          throw new Error('Баланс обновился на другом устройстве. Повтори действие.');
        }
        if (!response.ok) throw new Error('Не удалось сохранить перебросы');
        const state = await response.json();
        rerollRevision = state.revision;
        masterRerolls = state.count;
        sessionStorage.setItem(EDIT_TOKEN_KEY, password);
        save();
      }
      rerollStatus.textContent = rerollRevision === null ? 'Можно перенести запас из этого браузера' : 'Синхронизировано';
    } catch (error) {
      rerollRevision = undefined;
      rerollStatus.textContent = error.message;
    } finally {
      rerollBusy = false;
      syncResources();
    }
  }
  for (const [id, delta] of [['battle-reroll-grant', 1], ['battle-reroll-spend', -1]]) {
    byId(id).addEventListener('click', () => {
      if (!localPreview) {
        syncRerolls(delta, true);
        return;
      }
      masterRerolls += delta;
      save();
    });
  }
  deathMarks.addEventListener('click', event => {
    const button = event.target.closest('[data-death-mark]');
    if (!button) return;
    const input = byId(button.dataset.deathMark);
    input.checked = !input.checked;
    save();
  });
  syncResources();
  if (!localPreview) {
    rerollSync.addEventListener('click', () => syncRerolls(0, true));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncRerolls();
    });
    syncRerolls();
  }
})();
