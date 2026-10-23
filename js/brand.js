/* АРКА 123 — фирменные компоненты: знак, логотип, персонаж Арчи */
(function () {
  const P = window.ARKA_PATHS;
  let uid = 0;

  // Геометрия знака (координаты исходного логотипа 1254×1254)
  const ARCH_INNER = 'M340 975V596A285.5 285.5 0 0 1 911 596V975Z';
  const ARC_L = 'M625.5 1001H314V596A311.5 311.5 0 0 1 625.5 284.5';
  const ARC_R = 'M625.5 1001H937V596A311.5 311.5 0 0 0 625.5 284.5';
  const ONE = 'M424 562H493V1001H437V622H372Z';

  function markSVG(extraClass = '') {
    const id = 'mk' + (++uid);
    return `
<svg class="mark ${extraClass}" viewBox="282 252 686 782" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="${id}-in"><path d="${ARCH_INNER}"/></clipPath>
    <clipPath id="${id}-floor"><rect x="280" y="250" width="700" height="751"/></clipPath>
    <linearGradient id="${id}-warm" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="var(--sun-1)"/>
      <stop offset="1" stop-color="var(--sun-2)" stop-opacity=".15"/>
    </linearGradient>
    <linearGradient id="${id}-beam" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset=".5" stop-color="#fff" stop-opacity=".9"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#${id}-in)">
    <rect class="mk-glow" x="340" y="300" width="571" height="680" fill="url(#${id}-warm)"/>
    <rect class="mk-beam" x="200" y="200" width="160" height="900" fill="url(#${id}-beam)" transform="skewX(-22)"/>
  </g>
  <path class="mk-arc mk-arc-l" pathLength="1" d="${ARC_L}"/>
  <path class="mk-arc mk-arc-r" pathLength="1" d="${ARC_R}"/>
  <g clip-path="url(#${id}-floor)"><path class="mk-d mk-1" d="${ONE}"/></g>
  <g transform="translate(500 540)">
    <path class="mk-d mk-2" d="${P.two}"/>
    <path class="mk-d mk-3" d="${P.three}"/>
  </g>
</svg>`;
  }

  function wordSVG(extraClass = '') {
    return `<svg class="word ${extraClass}" viewBox="128 226 1910 316" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="${P.word}"/></svg>`;
  }

  function logoHTML(extraClass = '') {
    return `<span class="logo ${extraClass}">${markSVG()}<span class="logo-text">${wordSVG()}<span class="logo-slogan">Встречаемся напротив<br>Библиотеки.</span></span></span>`;
  }

  /* Арчи — фирменный герой. Тело — арка из логотипа, в «животе» — окно
     с видом на Национальную библиотеку: он всегда носит вид с собой. */
  function archiSVG(extraClass = '') {
    const id = 'ar' + (++uid);
    return `
<svg class="archi ${extraClass}" viewBox="0 0 300 400" role="img" aria-label="Арчи — герой АРКА 123">
  <defs>
    <clipPath id="${id}-w"><path d="M102 312V232A48 48 0 0 1 198 232V312Z"/></clipPath>
    <linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FB4D6"/><stop offset="1" stop-color="#D9E7F1"/>
    </linearGradient>
    <linearGradient id="${id}-gl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6F8FA9"/><stop offset="1" stop-color="#3E5A72"/>
    </linearGradient>
  </defs>
  <g class="a-leg a-leg-l"><path d="M118 330 L115 376" class="a-line"/><rect x="96" y="372" width="30" height="13" rx="6.5" class="a-shoe"/></g>
  <g class="a-leg a-leg-r"><path d="M182 330 L185 376" class="a-line"/><rect x="174" y="372" width="30" height="13" rx="6.5" class="a-shoe"/></g>
  <g class="a-arm a-arm-l"><path d="M66 232 C44 244 34 262 32 284" class="a-line"/><circle cx="31" cy="290" r="10" class="a-hand"/></g>
  <g class="a-arm a-arm-r"><path d="M234 232 C256 244 266 262 268 284" class="a-line"/><circle cx="269" cy="290" r="10" class="a-hand"/></g>
  <path d="M60 336V150A90 90 0 0 1 240 150V336Z" class="a-body"/>
  <g clip-path="url(#${id}-w)">
    <rect x="100" y="180" width="100" height="135" fill="url(#${id}-sky)"/>
    <ellipse cx="178" cy="206" rx="14" ry="5" fill="#fff" opacity=".7"/>
    <rect x="114" y="250" width="9" height="52" fill="#C9D3DC"/>
    <path d="M128 300V270L136 258H164L172 270V300Z" fill="url(#${id}-gl)"/>
    <path d="M136 258L150 246L164 258Z" fill="#9FB6C9"/>
    <path d="M128 270H172M128 280H172M128 290H172M140 258V300M150 258V300M160 258V300" stroke="#C7D8E6" stroke-width="1" opacity=".55"/>
    <rect x="100" y="298" width="100" height="16" fill="#E6E1D6"/>
    <circle cx="186" cy="296" r="7" fill="#7FA36B"/><circle cx="194" cy="299" r="5" fill="#94B57E"/>
  </g>
  <path d="M102 312V232A48 48 0 0 1 198 232V312Z" class="a-frame"/>
  <path d="M150 184V312M102 254H198" class="a-mull"/>
  <path d="M96 314H204" class="a-sill"/>
  <g class="a-eye a-eye-l"><ellipse cx="122" cy="116" rx="15" ry="17" class="a-eyewhite"/><circle cx="122" cy="119" r="7.5" class="a-pupil"/></g>
  <g class="a-eye a-eye-r"><ellipse cx="178" cy="116" rx="15" ry="17" class="a-eyewhite"/><circle cx="178" cy="119" r="7.5" class="a-pupil"/></g>
  <circle cx="102" cy="146" r="8" class="a-cheek"/><circle cx="198" cy="146" r="8" class="a-cheek"/>
  <path d="M136 148 Q150 161 164 148" class="a-smile"/>
</svg>`;
  }

  window.ARKA = { markSVG, wordSVG, logoHTML, archiSVG, ARCH_INNER };

  // Заполняем все плейсхолдеры
  document.querySelectorAll('[data-logo]').forEach(el => { el.innerHTML = logoHTML(el.dataset.logo || ''); });
  document.querySelectorAll('[data-mark]').forEach(el => { el.innerHTML = markSVG(el.dataset.mark || ''); });
  document.querySelectorAll('[data-archi]').forEach(el => { el.innerHTML = archiSVG(el.dataset.archi || ''); });

  // Глаза Арчи следят за курсором, иногда моргают
  let mx = innerWidth / 2, my = innerHeight / 2, raf = 0;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });
  function look() {
    raf = 0;
    document.querySelectorAll('svg.archi').forEach(svg => {
      const r = svg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const flip = getComputedStyle(svg).transform.startsWith('matrix(-1') ? -1 : 1;
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.3;
      const dx = (mx - cx) * flip, dy = my - cy, d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 300) * 5;
      svg.querySelectorAll('.a-pupil').forEach(p => p.setAttribute('transform', `translate(${(dx / d * k).toFixed(2)} ${(dy / d * k).toFixed(2)})`));
    });
  }
  setInterval(() => {
    document.querySelectorAll('svg.archi').forEach(svg => {
      if (Math.random() < 0.5) { svg.classList.add('blink'); setTimeout(() => svg.classList.remove('blink'), 160); }
    });
  }, 2600);
})();
