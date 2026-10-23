/* АРКА 123 — прелоадер, путь гостя, галерея, отзывы, форма */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────── Прелоадер ───────── */
  const loader = $('#loader');
  const ldsvg = $('#ldsvg');
  const fitLoader = () => ldsvg.setAttribute('viewBox', innerWidth < innerHeight ? '-180 -260 1610 2000' : '-560 -180 2370 2000');
  fitLoader(); addEventListener('resize', fitLoader);
  // вставляем внутренности знака в loader
  const tmp = document.createElement('div'); tmp.innerHTML = ARKA.markSVG();
  const mk = tmp.firstElementChild; mk.removeAttribute('viewBox');
  $('#ldmark').append(...mk.childNodes);
  $('#ldmark').classList.add('mark');
  // слоган «печатается» по словам
  const sl = $('#ldsl');
  'Встречаемся напротив Библиотеки.'.split(' ').forEach((w, i) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); t.textContent = (i ? ' ' : '') + w; sl.append(t);
  });
  document.body.classList.add('locked');

  const critical = $$('#journey img').map(i => i.currentSrc || i.src);
  let loaded = 0;
  const total = critical.length;
  critical.forEach(src => { const im = new Image(); im.onload = im.onerror = () => loaded++; im.src = src; });

  const t0 = performance.now();
  const MIN = reduce ? 300 : 2700, MAX = 9000;
  let shown = 0;
  const num = $('#ldnum'), sun = $('#ldsunrect');
  const words = $$('tspan', sl);
  (function tick() {
    const el = performance.now() - t0;
    const realP = total ? loaded / total : 1;
    const timeP = Math.min(1, el / MIN);
    const target = Math.min(realP, timeP, 1) * 123;
    shown += (target - shown) * 0.12; if (target - shown < 0.4) shown = target;
    const v = Math.round(shown);
    num.textContent = v;
    const h = 665 * (shown / 123);
    sun.setAttribute('y', 975 - h); sun.setAttribute('height', h);
    words.forEach((w, i) => w.classList.toggle('on', el > 1500 + i * 220));
    if ((v >= 123 && el >= MIN) || el > MAX) return finish();
    requestAnimationFrame(tick);
  })();

  function finish() {
    setTimeout(() => {
      loader.classList.add('out');
      const z = $('#ldzoom'), ins = $('#ldinside');
      const cx = 625.5, cy = 700;
      const dur = reduce ? 10 : 1300;
      setTimeout(() => {
        ins.style.transition = 'opacity .5s'; ins.style.opacity = 0;
        const s0 = performance.now();
        (function zoom() {
          const k = Math.min(1, (performance.now() - s0) / dur);
          const e = k * k * k; // ease-in: «влетаем» в арку
          const s = 1 + e * 60;
          z.setAttribute('transform', `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`);
          if (k < 1) requestAnimationFrame(zoom);
          else { loader.classList.add('done'); document.body.classList.remove('locked'); setTimeout(() => loader.remove(), 450); }
        })();
      }, 380);
    }, 250);
  }

  /* ───────── Хедер ───────── */
  const head = $('#head'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const o = head.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
    if (o) head.classList.add('solid'); else onScroll();
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { head.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  /* ───────── Путь гостя ───────── */
  const journey = $('#journey');
  const layers = $$('.layer', journey).map(f => ({ f, img: $('img', f) }));
  const caps = $$('.cap', journey);
  const steps = $$('.steps li', journey);
  const say = $('#say'), bubble = $('#bubble'), guide = $('#guide'), hint = $('#hint');
  const archiWrap = $('.guide-archi', guide);
  const N = layers.length;
  let curScene = -1, lastY = scrollY, walkT = 0;

  function setScene(i) {
    if (i === curScene) return;
    curScene = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    bubble.classList.add('swap');
    setTimeout(() => { say.textContent = caps[i].dataset.say; bubble.classList.remove('swap'); }, 220);
    const svg = $('svg.archi', archiWrap);
    if (svg) { svg.classList.remove('wave', 'point', 'present', 'cheer'); svg.classList.add(i === 0 ? 'wave' : i === N - 1 ? 'cheer' : i === 4 ? 'present' : 'point'); }
  }

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function onScroll() {
    const y = scrollY;
    if (!head.classList.contains('open')) head.classList.toggle('solid', y > journey.offsetTop + journey.offsetHeight - innerHeight - 10);
    const r = journey.getBoundingClientRect();
    const span = journey.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / span));
    const pos = p * (N - 1);       // 0..N-1
    const i = Math.min(N - 1, Math.round(pos));
    layers.forEach(({ f, img }, k) => {
      const d = pos - k;              // <0 до сцены, >0 после
      const op = k === 0 ? 1 - smooth(0.55, 0.95, d) : smooth(-0.45, -0.05, d) * (k === N - 1 ? 1 : 1 - smooth(0.55, 0.95, d));
      f.style.opacity = op.toFixed(3);
      const local = Math.min(1, Math.max(0, (d + 0.5)));
      const s = 1.04 + local * 0.22;      // «камера» медленно едет вперёд
      img.style.transform = `scale(${s.toFixed(4)})`;
    });
    caps.forEach((c, k) => {
      const d = pos - k;
      const op = (k === 0 ? 1 : smooth(-0.32, -0.08, d)) * (k === N - 1 ? 1 : 1 - smooth(0.08, 0.32, d));
      c.style.opacity = op.toFixed(3);
      c.style.transform = (innerWidth > 760 ? 'translateY(-50%) ' : '') + `translateY(${(d * -40).toFixed(1)}px)`;
      c.classList.toggle('on', op > 0.5);
    });
    hint.style.opacity = p > 0.04 ? 0 : 0.8;
    setScene(i);
    // Арчи шагает, пока листают, и разворачивается при движении назад
    const dy = y - lastY; lastY = y;
    if (Math.abs(dy) > 1 && p > 0 && p < 1) {
      guide.classList.add('walking'); guide.classList.toggle('back', dy < 0);
      clearTimeout(walkT); walkT = setTimeout(() => guide.classList.remove('walking'), 180);
    }
  }
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ───────── Галерея ───────── */
  const photos = [
    ['01', 'win', 'Два арочных окна 4 × 3,5 м с видом на библиотеку'], ['1', 'hall', 'Зал: высота потолка до 4,5 м'], ['6', 'hall', 'Зал от входа к окнам'],
    ['7', 'win', 'Национальная библиотека в окне'], ['2', 'hall', 'Колонны и рабочая зона'], ['4', 'hall', 'Окна и потолок антрацит'],
    ['3', 'hall', 'Отделка: кварцвинил, штукатурка, панели'], ['8', 'win', 'Вид на променад'], ['5', 'hall', 'Зал вдоль окон'],
    ['9', 'win', 'Вид на город'], ['10', 'hall', 'Стена с часами'], ['11', 'in', 'Ресепшн'], ['12', 'in', 'Шкафы и стеклянная перегородка'],
    ['13', 'in', 'Стеклянная галерея у входа'], ['14', 'in', 'Коридор'], ['15', 'out', 'Фасад с арочными окнами'],
    ['16', 'out', 'Променад'], ['17', 'out', 'Здание с перекрёстка'], ['18', 'out', 'Вход в здание'], ['19', 'out', 'Комплекс: два дома и арка'],
    ['20', 'out', 'Здание с парковки'], ['21', 'out', 'Библиотека с улицы']
  ];
  const gal = $('#gal');
  gal.innerHTML = photos.map(([n, c, a], i) => `<button data-c="${c}" data-i="${i}" aria-label="Открыть фото: ${a}"><img src="img/p${n}_s.webp" alt="${a}" loading="lazy"></button>`).join('');
  $$('#filters button').forEach(b => b.addEventListener('click', () => {
    $$('#filters button').forEach(x => x.classList.toggle('on', x === b));
    $$('button', gal).forEach(x => x.hidden = !(b.dataset.f === 'all' || x.dataset.c === b.dataset.f));
  }));
  let lb = null, li = 0;
  const visible = () => $$('button', gal).filter(x => !x.hidden).map(x => +x.dataset.i);
  function openLb(i) {
    li = i;
    if (!lb) {
      lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
      lb.innerHTML = '<img alt=""><button class="x" aria-label="Закрыть">✕</button><button class="pv" aria-label="Предыдущее фото">‹</button><button class="nx" aria-label="Следующее фото">›</button><span class="cnt"></span>';
      document.body.append(lb);
      $('.x', lb).onclick = closeLb; $('.pv', lb).onclick = () => step(-1); $('.nx', lb).onclick = () => step(1);
      lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
      let sx = 0; lb.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
      lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
    }
    const [n, , a] = photos[i]; const img = $('img', lb); img.src = `img/p${n}.webp`; img.alt = a;
    const v = visible(); $('.cnt', lb).textContent = `${v.indexOf(i) + 1} / ${v.length}`;
    lb.hidden = false; document.body.classList.add('locked'); $('.x', lb).focus();
  }
  function step(d) { const v = visible(); openLb(v[(v.indexOf(li) + d + v.length) % v.length]); }
  function closeLb() { lb.hidden = true; document.body.classList.remove('locked'); $(`button[data-i="${li}"]`, gal)?.focus(); }
  gal.addEventListener('click', e => { const b = e.target.closest('button'); if (b) openLb(+b.dataset.i); });
  addEventListener('keydown', e => { if (!lb || lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

  /* ───────── Отзывы (демо) ───────── */
  const revs = [
    ['Мастер-класс по керамике', 'Дарья К.', 'студия гончарного дела', 'Ученики сначала фотографируют окна, потом садятся за круг. Свет ровный весь день, глину видно идеально. Удобно, что столы уже стояли островками к нашему приходу.'],
    ['Семинар', 'Игорь М.', 'бизнес-тренер', 'Провели двухдневный семинар на 45 человек. Звук и проектор работали без сюрпризов, а в перерывах все стояли у окон с видом на Библиотеку. Адрес объяснять не пришлось.'],
    ['Фотосъёмка', 'Алина Ш.', 'фотограф', 'Арочные окна дают такой мягкий свет, что я почти не доставала вспышку. 4,5 метра потолка позволяют работать с высокими стойками.'],
    ['Стратсессия', 'Ольга В.', 'HR-директор', 'Сидели за большим столом весь день. Тихо, светло, никто не отвлекается. Кофе-брейки организовали сами администраторы.'],
    ['Лекция', 'Павел Р.', 'просветительский клуб', 'Ряды на 60 мест собрали за 20 минут до начала. Слушатели отметили, что лекция про архитектуру Минска с видом на Библиотеку звучит совсем по-другому.'],
    ['Кулинарный мастер-класс', 'Кристина Л.', 'шеф-повар', 'Привезли свои плиты, розеток хватило на всех. После нас помогли с уборкой, всё прошло спокойно.']
  ];
  $('#revs').innerHTML = revs.map(([f, n, r, t]) => `<article class="rev"><span class="fmt">${f}</span><q>${t}</q><div class="who"><span class="av">${n[0]}</span><div><b>${n}</b><span>${r}</span></div></div></article>`).join('');

  /* ───────── Форма ───────── */
  const form = $('#bk');
  const dt = $('#f-date'); const today = new Date(); dt.min = today.toISOString().slice(0, 10);
  $$('[data-plan]').forEach(a => a.addEventListener('click', () => { $('#f-plan').value = a.dataset.plan; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const err = $('#bkErr');
    const miss = [];
    if (!$('#f-name').value.trim()) miss.push('имя');
    if ($('#f-phone').value.replace(/\D/g, '').length < 9) miss.push('телефон');
    if (!dt.value) miss.push('дату');
    if (miss.length) { err.textContent = 'Укажите ' + miss.join(', ') + ', чтобы мы могли перезвонить.'; err.hidden = false; return; }
    err.hidden = true; $('#bkOk').hidden = false;
  });
  $$('.copy').forEach(b => b.addEventListener('click', () => {
    const el = $('#' + b.dataset.copy); const txt = el.textContent;
    const done = () => { b.textContent = 'скопировано'; setTimeout(() => b.textContent = 'копировать', 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, sel); else sel();
    function sel() { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  }));
})();
