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
    ['successes', 'Успехи', 'Успех', '<path d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6Z"/><path d="M18 16v6m-3-3h6M5 2v5M2.5 4.5h5"/>'],
    ['failures', 'Провалы', 'Провал', '<path d="M13 1c1 6-5 7-3 12 2-1 3-3 4-5 4 3 6 6 6 9a8 8 0 0 1-16 0c0-3 2-6 4-8 0 3 1 4 2 4"/><path d="M12 15c-1 2-3 3-3 5a3 3 0 0 0 6 0c0-2-1-3-3-5Z"/>']
  ].map(([id, title, label, glyph]) =>
    `<div role="group" aria-label="${title}"><span>${title}</span>` +
    [1, 2, 3].map(number =>
      `<button type="button" data-death-mark="${id}${number}" aria-label="${label} ${number}" aria-pressed="false"><svg viewBox="0 0 24 25" aria-hidden="true">${glyph}</svg><span class="death-sparks" aria-hidden="true"><i></i><i></i><i></i></span></button>`
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
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path class="hand-moon" d="M18 3a11 11 0 1 0 7 18A10 10 0 0 1 18 3Z"/>
        <path class="hand-cross" d="M15 6h4v5h5v4h-5v7h-4v-7h-5v-4h5Z"/>
      </svg>
    </button>`).join('');

  const dice = {
    4: ['16,3 30,28 2,28', 'M16 3v17L2 28m14-8 14 8'],
    6: ['16,2 29,9 29,24 16,31 3,24 3,9', 'M3 9l13 7 13-7M16 16v15'],
    8: ['16,2 29,16 16,30 3,16', 'M16 2l-6 18 6 10m0-28 6 18-6 10M3 16l7 4h12l7-4'],
    10: ['16,2 29,14 24,24 16,31 8,24 3,14', 'M16 2l-7 17 7 12m0-29 7 17-7 12M3 14l6 5h14l6-5'],
    20: ['16,2 29,9 29,24 16,31 3,24 3,9', 'M16 2l-8 20h16L16 2M3 9l5 13-5 2m26-15-5 13 5 2M8 22l8 9 8-9']
  };
  const die = sides => {
    const [outline, facets] = dice[sides];
    return `<svg class="battle-die" viewBox="0 0 32 32" role="img" aria-label="Кубик к${sides}"><polygon points="${outline}"/><path d="${facets}"/></svg>`;
  };
  const rollButton = (name, label, count, sides, bonus = 0) =>
    `<button type="button" data-roll="${name}" data-count="${count}" data-sides="${sides}" data-bonus="${bonus}">${die(sides)}<span>${label}<small>${count}к${sides}${bonus ? ' + ' + bonus : ''}</small></span></button>`;
  const card = (name, icon, type, description, actions) =>
    `<article class="battle-card" data-tone="${type}"><header><span class="battle-icon"><i data-lucide="${icon}"></i></span><div><small>${type}</small><h3>${name}</h3></div></header><p>${description}</p><div class="battle-actions">${actions}</div></article>`;
  const weapon = (name, icon, description, sides) => card(name, icon, 'Оружие', description,
    rollButton(name + ' · атака', 'Атака', 1, 20, 5) +
    rollButton(name + ' · урон', 'Урон', 1, sides, 3) +
    rollButton(name + ' · крит', 'Крит', 2, sides, 3));
  cards.innerHTML = [
    weapon('Длинный меч', 'sword', 'Действие · 5 фт · рубящий урон. Ослабление: при попадании цель получает помеху на следующую атаку до начала твоего следующего хода. Урон указан для меча в одной руке.', 8),
    weapon('Метательное копьё', 'crosshair', 'Действие · 5 фт вблизи или 30/120 фт броском · колющий урон. При нанесении урона снижает скорость цели на 10 фт до начала твоего следующего хода.', 6),
    card('Благословение', 'sparkles', 'Заклинание · 1-й уровень', 'Действие · 30 фт · концентрация до 1 минуты. До трёх целей добавляют 1к4 к атакам и спасброскам. Бонусный кубик бросается при каждой такой проверке.', '<button type="button" data-cast="bless">Применить · 1 ячейка</button>' + rollButton('Благословение · бонус', 'Бонус', 1, 4)),
    card('Лечение ран', 'heart-pulse', 'Заклинание · 1-й уровень', 'Действие · касание. Восстанавливает 2к8 + 2 хитов выбранной цели.', `<button type="button" data-cast="cure">${die(8)}<span>Применить · 1 ячейка<small>2к8 + 2</small></span></button>`),
    card('Возложение рук', 'hand-heart', 'Бонусное действие', 'Касанием восстанови себе или союзнику 1 ХП за каждое потраченное очко. Чтобы снять состояние «Отравлен», потрать 5 очков. Отмечай расход крестиками вверху, а хиты меняй у цели. Кубики не нужны.', ''),
    card('Инициатива и спасброски', 'shield', 'Проверки', 'Бдительность даёт +2 к инициативе. При 0 ХП спасбросок от смерти обычно успешен на 10+. Натуральная 1 даёт два провала, натуральная 20 восстанавливает 1 ХП. Отмечай результаты на листе.', rollButton('Инициатива', 'Инициатива', 1, 20, 2) + rollButton('Спасбросок от смерти', 'От смерти', 1, 20)),
    card('Действия в бою', 'footprints', 'Тактика', 'Рывок даёт дополнительные 30 фт перемещения. Отход защищает от провоцированных атак до конца хода. Уклонение даёт видимым атакующим помеху и тебе преимущество на спасброски Ловкости, пока действуют условия уклонения. Провоцированная атака тратит реакцию.', '')
  ].join('');

  function syncResources() {
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
      : die(10) + ' Брось <strong>1к10</strong> и введи выпавшее число. Лист добавит <strong>+2</strong> за Телосложение.';
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
      if (cast === 'cure') roll('Лечение ран', 2, 8, 2, true);
      else show('Благословение применено · ячейка потрачена');
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
    const restored = Math.min(shortRestRoll.valueAsNumber + 2, Number(health.max) - health.valueAsNumber);
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
    byId('inspiration').checked = true;
    document.querySelectorAll('#slots input, #successes input, #failures input').forEach(input => { input.checked = false; });
    save();
    show('Хиты, ячейки, кость хитов и «Возложение рук» восстановлены');
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
