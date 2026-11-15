// MoHeatGuide — a short tour of the demo page UI (user 2026-11-08: "加个界面使用引导，熟悉的人可以选择跳过"). Loaded by nav.js.
//   · first visit of any demo page: steps highlight the UI one by one (device, STOP, language, fullscreen, start / voice, radar,
//     thermal meters, intensity) with Next / Back / Skip. Done or skipped → not shown again (localStorage 'moheat.guide').
//   · the "?" button in the top bar replays it. Text follows the display language (shared/subs.js; missing → English).
//   · not in ?embed (site menu) / ?cover / ?render / ?auto / ?autoplay, and steps whose element is hidden are skipped.
//   · to add a step: one entry in STEPS (selector + text in en / ja / zh). New UI elements of the standard (§7.3) are covered automatically.
(() => {
  if (window.MoHeatGuide) return;
  const QS = new URLSearchParams(location.search);
  if (['embed', 'cover', 'render', 'auto', 'autoplay'].some((k) => QS.has(k))) return;
  const KEY = 'moheat.guide';
  const STEPS = [
    { sel: null, en: 'Welcome! Put on headphones: you will hear the story in 3D and, with MoHeat Evo, feel warmth and coolness on each ear. Choose your language (we’ll remember it for every demo), then a 30-second tour.',
      ja: 'ようこそ！ヘッドホンをつけてください。立体音響で物語を聴き、MoHeat Evo をつなぐと左右の耳で温かさ・冷たさを感じられます。言語を選ぶと全デモで記憶されます。そのあと 30 秒で画面の使い方をご紹介します。',
      zh: '欢迎！请戴上耳机：你会听到立体声的故事，连接 MoHeat Evo 后还能在左右耳感受到冷和热。先选择语言（所有 Demo 都会记住），再用 30 秒介绍一下界面。', ko: '환영해요! 헤드폰을 써 주세요. 입체 음향으로 이야기를 듣고, MoHeat Evo를 연결하면 양쪽 귀로 따뜻함과 시원함을 느낄 수 있어요. 먼저 언어를 고르면 모든 데모에서 기억해요. 그다음 30초 동안 화면 사용법을 소개할게요.' },
    { sel: 'header .device, #connectBtn, .mdev-btn', en: 'Connect MoHeat Evo here (desktop Chrome / Edge, USB or Bluetooth). Without it you can still watch and listen. When you put it on, tuck your hair behind your ears: warmth and coolness need bare skin.',
      ja: 'ここで MoHeat Evo をつなぎます（パソコンの Chrome / Edge、USB または Bluetooth）。つながなくても、見る・聴くことはできます。つけるときは髪を耳にかけて、肌が出るようにしてください。',
      zh: '在这里连接 MoHeat Evo（电脑上的 Chrome / Edge，USB 或蓝牙）。不连接也可以观看和收听。戴的时候把头发别到耳后，让皮肤露出来。', ko: '여기서 MoHeat Evo를 연결해요 (컴퓨터의 Chrome / Edge, USB 또는 블루투스). 연결하지 않아도 보고 들을 수 있어요. 쓸 때는 머리카락을 귀 뒤로 넘겨 피부가 드러나게 해 주세요.' },
    { sel: '.mtc-btn', en: 'Thermal check: left warm → right warm → left cool → right cool, a few seconds each, to make sure every channel works.',
      ja: '温冷チェック：左あたたかい → 右あたたかい → 左つめたい → 右つめたい の順に数秒ずつ。全チャンネルが動くか確かめられます。',
      zh: '温冷检查：依次 左耳暖 → 右耳暖 → 左耳凉 → 右耳凉，每个几秒，确认四个通道都正常。', ko: '온냉 확인: 왼쪽 따뜻함 → 오른쪽 따뜻함 → 왼쪽 시원함 → 오른쪽 시원함 순서로 몇 초씩. 모든 채널이 작동하는지 확인할 수 있어요.' },
    { sel: '#estop', en: '■ STOP turns all heating and cooling off at once (also the Esc key).',
      ja: '■ STOP で温冷をすぐに全部止められます（Esc キーでも）。', zh: '按 ■ 停止 立即关闭所有冷热输出（也可以按 Esc 键）。', ko: '■ STOP으로 온냉 출력을 바로 모두 멈출 수 있어요 (Esc 키로도).' },
    { sel: '.msub-btn:not(.mfs-btn)', en: 'Language: tap to switch English / 日本語 / 中文 / 한국어. Subtitles, buttons and voice answers follow.',
      ja: '言語：タップで English / 日本語 / 中文 / 한국어 を切り替え。字幕・ボタン・声での回答もその言語になります。',
      zh: '语言：点一下在 English / 日本語 / 中文 / 한국어 之间切换，字幕、按钮和语音回答都会跟着变。', ko: '언어: 탭할 때마다 English / 日本語 / 中文 / 한국어가 바뀌어요. 자막, 버튼, 목소리 대답도 그 언어를 따라가요.' },
    { sel: '.mfs-btn', en: 'Fullscreen (or press F) — only the picture. Space pauses, Esc leaves. On a phone, turn it sideways for the biggest picture.',
      ja: '全画面表示（F キーでも）。画面だけになります。スペースで一時停止、Esc で戻ります。スマホは横向きにすると最大で見られます。',
      zh: '全屏（也可以按 F 键），只显示画面。空格暂停，Esc 退出。手机上把手机横过来，画面最大。', ko: '전체 화면 (F 키로도) — 화면만 보여요. Space로 일시정지, Esc로 돌아가요. 휴대폰은 가로로 돌리면 가장 크게 볼 수 있어요.' },
    { sel: '#startBtn', en: 'Start here. When it is your turn, tap an answer — or simply say it out loud (microphone).',
      ja: 'ここからスタート。あなたの番では、ボタンをタップするか、声に出して答えてもOK（マイク）。',
      zh: '从这里开始。轮到你时，点选答案，或者直接说出来也可以（麦克风）。', ko: '여기서 시작해요. 당신 차례가 되면 대답을 탭하거나, 그냥 소리 내어 말해도 돼요 (마이크).' },
    { sel: '.mside-btn', en: '🎛 opens the panel with the sound map, the thermal output and the settings (on small screens).',
      ja: '🎛 で、音の位置・温冷の出力・設定のパネルを開きます（小さい画面のとき）。', zh: '点 🎛 打开声音位置、冷热输出和设置面板（小屏幕时）。', ko: '🎛을 누르면 소리 위치, 온냉 출력, 설정 패널이 열려요 (작은 화면일 때).' },
    { sel: 'aside .card:has(#radar)', en: 'Where the voices and sounds are around your head.', ja: '声や音が、頭のまわりのどこにあるかを表示します。', zh: '显示声音在你头部周围的位置。', ko: '목소리와 소리가 머리 주위 어디에 있는지 보여 줘요.' },
    { sel: 'aside .card:has(.meters), aside .card:has(#cmd)', en: 'What the headphones do on each ear right now: blue = cool, orange = warm.',
      ja: 'いま左右の耳で何が起きているか：青＝冷たい、オレンジ＝温かい。', zh: '耳机此刻在左右耳的输出：蓝色 = 凉，橙色 = 暖。', ko: '지금 양쪽 귀에서 무슨 일이 일어나는지: 파랑 = 시원함, 주황 = 따뜻함.' },
    { sel: 'aside label:has(#intensity), #intensity', en: 'Make the warm / cool effect weaker or stronger. Enjoy!', ja: '温冷の強さを調整できます。お楽しみください！', zh: '可以调节冷热的强弱。祝你玩得开心！', ko: '따뜻함 / 시원함의 세기를 조절할 수 있어요. 즐거운 시간 되세요!' },
  ];
  const BTN = { next: { en: 'Next', ja: '次へ', zh: '下一步', ko: '다음' }, back: { en: 'Back', ja: '戻る', zh: '上一步', ko: '이전' }, skip: { en: 'Skip', ja: 'スキップ', zh: '跳过', ko: '건너뛰기' },
    done: { en: 'Got it', ja: 'はじめる', zh: '开始体验', ko: '시작하기' }, help: { en: 'How to use this page', ja: '使い方', zh: '使用说明', ko: '사용법' } };
  const T = (o) => (window.MoHeatSub ? window.MoHeatSub.pick(o) : o.en) || o.en;
  const css = document.createElement('style');
  css.textContent = `
  .mg-veil { position: fixed; inset: 0; z-index: 9998; }
  .mg-hole { position: fixed; z-index: 9999; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(5, 4, 10, .66); outline: 2px solid #ffd58a; pointer-events: none; transition: all .25s ease; }
  .mg-tip { position: fixed; z-index: 10000; width: min(340px, calc(100vw - 32px)); background: #17121f; color: #f5eefb; border: 1px solid rgba(255, 213, 138, .5); border-radius: 14px;
    padding: 14px 16px 12px; font: 500 14px/1.55 Inter, "Noto Sans JP", "PingFang SC", system-ui, sans-serif; box-shadow: 0 18px 50px rgba(0, 0, 0, .55); transition: top .25s, left .25s; }
  .mg-tip p { margin: 0 0 12px; } .mg-tip .mg-n { font-size: 11px; color: #b8a9c9; letter-spacing: .06em; margin-bottom: 6px; }
  .mg-tip .mg-row { display: flex; gap: 8px; align-items: center; }
  .mg-tip button { cursor: pointer; border-radius: 999px; padding: 6px 14px; font-family: inherit; font-weight: 600; font-size: 13px; line-height: 1; border: 1px solid rgba(255, 255, 255, .25); background: transparent; color: #e9dff3; }
  .mg-tip button.mg-go { background: linear-gradient(135deg, #ffd58a, #ff9f6e); color: #2a1606; border: 0; margin-left: auto; }
  .mg-tip button.mg-skip { border: 0; color: #b8a9c9; padding-left: 0; }
  .mg-help { min-width: 30px; }
  .mg-langs { display: flex; flex-wrap: wrap; gap: 6px; margin: -4px 0 12px; } .mg-langs button { white-space: nowrap; } .mg-langs button.on { background: #f5eefb; color: #17121f; border-color: transparent; }
  .mg-tip { max-height: calc(100dvh - 16px); overflow-y: auto; box-sizing: border-box; }
  @media (max-width: 1100px), (pointer: coarse) {   /* touch: every button 44 px tall (user: the guide must be tappable on phones) */
    .mg-tip button { min-height: 44px; padding: 0 16px; font-size: 14px; } .mg-tip button.mg-skip { padding: 0 12px 0 4px; }
    .mg-langs button { flex: 1 0 auto; padding: 0 10px; } }
  @media (max-height: 500px) { .mg-tip { padding: 10px 14px 8px; } .mg-tip p { margin-bottom: 8px; } .mg-tip .mg-n { margin-bottom: 2px; } }`;
  document.head.appendChild(css);

  let i = 0, list = [], veil, hole, tip;
  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 4 && r.height > 4 && getComputedStyle(el).visibility !== 'hidden'; };
  const target = (s) => (s.sel ? s.sel.split(', ').map((q) => document.querySelector(q)).find(visible) : null);
  const root = document.documentElement, inDrawer = (el) => !!el && root.classList.contains('lay-drawer') && !!el.closest('aside.side');
  let opened = false;   // the side panel is a drawer on small screens (nav.js): the tour opens it for its steps and closes it again
  const drawer = (v) => { if (v === root.classList.contains('side-open')) return; if (v) opened = true; root.classList.toggle('side-open', v); };
  function close(done = true) {
    if (opened) { drawer(false); opened = false; }
    veil?.remove(); hole?.remove(); tip?.remove(); veil = hole = tip = null;
    removeEventListener('resize', place); removeEventListener('keydown', key, true);
    if (done) try { localStorage.setItem(KEY, 'done'); } catch {}
  }
  function key(e) {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  }
  function go(d) { i += d; if (i >= list.length) { close(); return; } if (i < 0) i = 0; render(); }
  function render() {
    const s = list[i], last = i === list.length - 1;
    tip.innerHTML = `<div class="mg-n">${i + 1} / ${list.length}</div><p></p><div class="mg-row">
      ${last ? '' : `<button type="button" class="mg-skip">${T(BTN.skip)}</button>`}${i ? `<button type="button" class="mg-back">${T(BTN.back)}</button>` : ''}
      <button type="button" class="mg-go">${T(last ? BTN.done : BTN.next)}</button></div>`;
    tip.querySelector('p').textContent = T(s);
    if (i === 0 && window.MoHeatSub) {   // step 1: choose the language first (user), the rest of the tour follows it
      const row = document.createElement('div'); row.className = 'mg-langs';
      row.innerHTML = window.MoHeatSub.langs.map((l) => `<button type="button" data-l="${l}" class="${l === window.MoHeatSub.lang ? 'on' : ''}">${window.MoHeatSub.LANGS[l]?.name || l}</button>`).join('');
      row.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { window.MoHeatSub.set(b.dataset.l); render(); }));
      tip.querySelector('p').after(row);
    }
    tip.querySelector('.mg-go').onclick = () => go(1);
    tip.querySelector('.mg-back')?.addEventListener('click', () => go(-1));
    tip.querySelector('.mg-skip')?.addEventListener('click', () => close());
    place();
    tip.querySelector('.mg-go').focus({ preventScroll: true });
    const el = s.sel && target(s); if (opened || inDrawer(el)) { drawer(inDrawer(el)); setTimeout(place, 300); }   // after the slide-in
  }
  function place() {   // the tooltip goes where it is fully on screen and covers the highlighted element least (phones too)
    if (!tip) return;
    const el = target(list[i]), W = innerWidth, H = innerHeight, tw = tip.offsetWidth, th = tip.offsetHeight, m = 8, gap = 12;
    if (!el) { Object.assign(hole.style, { left: `${W / 2}px`, top: `${H / 2}px`, width: '0px', height: '0px' }); Object.assign(tip.style, { left: `${(W - tw) / 2}px`, top: `${Math.max(m, (H - th) / 2)}px` }); return; }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });   // e.g. a card further down the side panel that scrolls inside itself (portrait / tablet)
    const b = el.getBoundingClientRect(), pad = 6;
    const r = { left: Math.max(0, b.left), top: Math.max(0, b.top), right: Math.min(W, b.right), bottom: Math.min(H, b.bottom) };   // the part on screen
    Object.assign(hole.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.right - r.left + pad * 2}px`, height: `${r.bottom - r.top + pad * 2}px` });
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, clampX = (x) => Math.max(m, Math.min(W - tw - m, x)), clampY = (y) => Math.max(m, Math.min(H - th - m, y));
    const spots = [[clampX(cx - tw / 2), r.bottom + gap], [clampX(cx - tw / 2), r.top - th - gap], [r.right + gap, clampY(cy - th / 2)], [r.left - tw - gap, clampY(cy - th / 2)],
      [clampX((W - tw) / 2), H - th - m], [clampX((W - tw) / 2), m]];   // below, above, right, left, bottom of the screen, top of the screen
    const cost = ([x, y]) => (x < m - .5 || y < m - .5 || x + tw > W - m + .5 || y + th > H - m + .5) ? Infinity
      : Math.max(0, Math.min(x + tw, r.right + pad) - Math.max(x, r.left - pad)) * Math.max(0, Math.min(y + th, r.bottom + pad) - Math.max(y, r.top - pad));
    let best = spots[4], bc = Infinity; for (const p of spots) { const c = cost(p); if (c < bc) { bc = c; best = p; } if (c === 0) break; }
    Object.assign(tip.style, { left: `${best[0]}px`, top: `${Math.max(m, best[1])}px` });
  }
  function start() {
    close(false);
    if (window.MoHeatFullscreen?.on) window.MoHeatFullscreen.set(false);
    const peek = root.classList.contains('lay-drawer') && !root.classList.contains('side-open');
    if (peek) root.classList.add('side-open');   // so the cards inside the closed drawer count as visible
    list = STEPS.filter((s) => !s.sel || target(s)); i = 0;
    if (peek) root.classList.remove('side-open');
    veil = document.createElement('div'); veil.className = 'mg-veil'; veil.addEventListener('click', (e) => e.stopPropagation());
    hole = document.createElement('div'); hole.className = 'mg-hole';
    tip = document.createElement('div'); tip.className = 'mg-tip'; tip.setAttribute('role', 'dialog');
    document.body.append(veil, hole, tip);
    addEventListener('resize', place); addEventListener('keydown', key, true);
    render();
  }
  function helpButton() {   // "?" in the top bar, before ■ STOP
    const bar = document.querySelector('header.bar'), stop = document.getElementById('estop');
    if (!bar || bar.querySelector('.mg-help')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm mg-help'; b.textContent = '?'; b.title = T(BTN.help);
    b.addEventListener('click', start);
    stop ? stop.before(b) : bar.appendChild(b);
  }
  window.MoHeatGuide = { start, close, reset: () => { try { localStorage.removeItem(KEY); } catch {} } };
  function init() {
    helpButton();
    let seen = false; try { seen = localStorage.getItem(KEY) === 'done'; } catch {}
    if (!seen) setTimeout(() => { if (!document.querySelector('.intro.hidden')) start(); }, 900);   // only on the cover, before the demo starts
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
