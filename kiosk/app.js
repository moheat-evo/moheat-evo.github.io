// MoHeat Evo exhibition (kiosk) app — kiosk/index.html (DEMO_DESIGN_GUIDE §7.4, staff guide docs/kiosk.md).
// attract (idle, thermal off) → welcome (language, pictograms) → 30 s intro (shared/thermintro.js) → menu → demo page (shared/kiosk.js)
// → #card (rating, buy?, price band, favourite moment, comment, QR) → reset → welcome. Staff: long-press the Staff button top-left + PIN.
// Routes (hash): #welcome (default) · #attract · #card · #staff · #reset. Storage + stats: shared/kiosk.js (MoHeatKiosk).
(() => {
  const K = window.MoHeatKiosk, D = window.MoHeatDemos || { DEMOS: [] }, S = window.MoHeatSigns;
  const QS = new URLSearchParams(location.search);
  if (QS.get('kiosk') === '0') { K.exit(); location.replace('../'); return; }
  K.enter();
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let cfg = K.cfg();
  const LANG_NAMES = { en: 'English', ja: '日本語', zh: '中文', ko: '한국어' };
  const lang = () => { try { return sessionStorage.getItem('moheat.sublang') || cfg.lang || 'en'; } catch { return cfg.lang || 'en'; } };
  const setLang = (l) => { try { if (l === 'en') sessionStorage.removeItem('moheat.sublang'); else sessionStorage.setItem('moheat.sublang', l); } catch {}
    document.documentElement.lang = l; paint(); intro?.repaint(); };
  const T = {
    tag: { en: 'Feel warm and cool on each ear — with sound in 3D.', ja: '立体音響とともに、左右の耳で温かさと冷たさを。', zh: '立体声的同时，左右耳感受冷与热。' },
    p1: { en: 'Earbuds → hair behind ears → MoHeat Evo', ja: 'イヤホン → 髪を耳にかける → MoHeat Evo', zh: '入耳式耳机 → 头发别到耳后 → MoHeat Evo', ko: '이어폰 → 머리는 귀 뒤로 → MoHeat Evo' }, p2: { en: 'Feel warm & cool', ja: '温かい・冷たいを感じる', zh: '感受冷与热' },
    p3: { en: 'Pick a story', ja: '物語を選ぶ', zh: '选一个故事' },
    rec: { en: 'Try these first', ja: 'まずはこちら', zh: '推荐先体验' }, more: { en: 'More stories →', ja: 'ほかの物語 →', zh: '更多故事 →' },
    hygiene: { en: 'Earbuds and ear pads cleaned for every visitor · disposable covers available', ja: 'イヤホンとイヤーパッドは毎回消毒 · 使い捨てカバーあります', zh: '耳机和耳罩每位访客消毒 · 可提供一次性耳罩套' },
    numsH: { en: 'Picked a number while waiting? Tap it:', ja: '待っている間に選んだ番号をタップ：', zh: '排队时选好了号码？点这里：' },
    qq: { en: 'Scan to choose while you wait', ja: '待っている間にスキャンして選ぼう', zh: '排队时扫码先选' },
    start: { en: '▶ Start', ja: '▶ はじめる', zh: '▶ 开始' }, skipIntro: { en: 'I know MoHeat Evo — skip the 30-second intro', ja: '使ったことがある — 30 秒の案内をとばす', zh: '我用过 — 跳过 30 秒引导' },
    pick: { en: 'Pick a story', ja: '物語を選んでください', zh: '选择一个故事' }, replay: { en: '↺ Intro again', ja: '↺ 案内をもう一度', zh: '↺ 再看一次引导' },
    thanks: { en: 'Thank you!', ja: 'ありがとうございました！', zh: '谢谢体验！' },
    quick: { en: 'a few quick taps — thank you!', ja: 'かんたんな質問にタップで — ありがとう！', zh: '点几下就好 — 谢谢！' },
    thanksBig: { en: 'Thank you — enjoy the show!', ja: 'ありがとうございました！', zh: '谢谢你的体验！' },
    back: { en: '‹ back', ja: '‹ もどる', zh: '‹ 上一题' },
    addComment: { en: '+ add a comment', ja: '+ ひとこと書く', zh: '+ 写一句话' }, skipAll: { en: 'Skip all', ja: 'すべてスキップ', zh: '全部跳过' },
    rate: { en: 'How was the warm / cool?', ja: '温かさ・冷たさは、どうでしたか？', zh: '冷热的感觉怎么样？' },
    buy: { en: 'Would you want MoHeat Evo as a product?', ja: 'MoHeat Evo が製品になったら、ほしいですか？', zh: '如果 MoHeat Evo 成为产品，你会想要吗？' },
    yes: { en: 'Yes', ja: 'はい', zh: '想' }, maybe: { en: 'Maybe', ja: 'たぶん', zh: '也许' }, no: { en: 'No', ja: 'いいえ', zh: '不想' },
    price: { en: 'If it were sold, what price would feel fair?', ja: 'もし販売されるなら、いくらが妥当だと思いますか？', zh: '如果出售，你觉得多少钱比较合适？' },
    scenes: { en: 'Where would you use it? (up to 2)', ja: 'どんな場面で使いたい？（2 つまで）', zh: '你会在什么场景用它？（最多 2 个）' },
    fav: { en: 'Your favourite moment', ja: 'いちばん良かった瞬間', zh: '最喜欢的瞬间' },
    comment: { en: 'One line (optional)', ja: 'ひとこと（任意）', zh: '一句话（可选）' },
    done: { en: 'Done', ja: '送信', zh: '完成' }, skip: { en: 'Skip', ja: 'スキップ', zh: '跳过' },
    scan: { en: 'Scan to take home what you just experienced', ja: 'スキャンして、いまの体験をおみやげに', zh: '扫码带走刚才的体验小结' },
    contact: { en: 'Any questions? Scan to get in touch.', ja: '気になることがあれば、QRコードからお気軽にご連絡ください。', zh: '有问题？扫码就能联系我，随时欢迎。', ko: '궁금한 점이 있나요? QR 코드로 편하게 연락 주세요.' },
    nodata: { en: 'No personal data is collected.', ja: '個人情報は集めません。', zh: '不收集任何个人信息。' },
    news: { en: 'Product news? (optional, your choice)', ja: '製品ニュース（任意）', zh: '产品消息？（可选）' },
    lost: { en: 'MoHeat Evo disconnected', ja: 'MoHeat Evo の接続が切れました', zh: 'MoHeat Evo 已断开' }, bat: { en: 'MoHeat Evo battery low', ja: 'MoHeat Evo の電池が少なくなっています', zh: 'MoHeat Evo 电量低' },
    staffHelp: { en: 'Please ask the staff.', ja: 'スタッフにお声がけください。', zh: '请联系工作人员。' },
    moreH: { en: 'Want to try another story?', ja: 'ほかの物語も体験しますか？', zh: '想再体验一个故事吗？' },
    moreAll: { en: 'All stories', ja: 'すべての物語', zh: '全部故事' }, finish: { en: 'Finish', ja: 'おわる', zh: '结束' },
    endA: { en: 'Please take off the MoHeat Evo headset first', ja: 'まず MoHeat Evo を外してください', zh: '请先取下 MoHeat Evo 头戴设备' },
    endASub: { en: 'The warm / cool output is already off. Please tell the staff.', ja: '温冷の出力はもう止まっています。スタッフに声をかけてください。', zh: '冷热输出已经停止。请告诉工作人员。' },
    endB: { en: 'Now remove the earbuds', ja: 'つぎにイヤホンを外してください', zh: '现在请取下入耳式耳机' },
    endBSub: { en: 'Then a few quick taps about your experience.', ja: 'そのあと、かんたんなアンケートにタップで答えてください。', zh: '然后点几下，告诉我们你的感受。' },
    staffGo: { en: 'Continue (staff)', ja: '続ける（スタッフ）', zh: '继续（工作人员）' }, done2: { en: 'Done', ja: 'できた', zh: '好了' },
    touch: { en: 'Touch to start · タッチしてスタート · 点击开始', ja: 'Touch to start · タッチしてスタート · 点击开始', zh: 'Touch to start · タッチしてスタート · 点击开始' },
  };
  const t = (k) => (T[k] && (T[k][lang()] || T[k].en)) || '';
  const CONTACT = 'https://moheat-evo.github.io/moheat-evo-links.html';   // the after-survey QR: how to reach the author
  function paint() {
    $$('[data-t]').forEach((e) => { e.textContent = t(e.dataset.t); });
    $('#startVisit').textContent = t('start'); $('#skipIntro').textContent = t('skipIntro');
    $$('.langs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.l === lang())));
    renderRec(); $('#hygiene').hidden = !cfg.hygiene; signs();
    if (!$('#v-menu').hidden) renderMenu();
    if (!$('#v-card').hidden) renderCard(false);
  }
  $('.langs').innerHTML = (cfg.langs || ['en', 'ja', 'zh']).map((l) => `<button type="button" data-l="${l}">${LANG_NAMES[l] || l}</button>`).join('');
  $('.langs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setLang(b.dataset.l); });

  // ---------------------------------------------------------------- device (authorised once in the staff panel, then auto)
  // ONE connection state (device.js MoHeatDevice.state + window event 'moheat:device', user 2026-11-09): the staff panel status (#deviceStatus,
  // painted by device.js), the visitor screen (#devdot, big "disconnected" alert on state 'lost') and the queue screen ({t:'device'} over the
  // BroadcastChannel) all follow it — no own copy, no own auto-connect (device.js reconnects silently to the port staff connected once).
  const dev = MoHeatDevice.create({ select: $('#portSelect'), addBtn: $('#addPort'), connectBtn: $('#connectBtn'), status: $('#deviceStatus') },
    { // firmware replies: a battery report such as "BAT 14" / "battery: 14%" → the big low-battery alert under 15 % (if the firmware sends one)
      log: (l) => { const m = /^← .*\bbat(?:tery)?\D{0,3}(\d{1,3})/i.exec(l); if (m && +m[1] < 15) alert_('bat'); } });
  function alert_(k) { let el = $('#alertBig'); if (!el) { el = document.createElement('div'); el.id = 'alertBig'; el.className = 'alert-big'; el.setAttribute('role', 'alert'); document.body.appendChild(el); el.addEventListener('click', () => { el.hidden = true; }); }
    el.hidden = !k; if (k) el.innerHTML = k === 'lost' ? `<b>${t('lost')}</b><span>${t('staffHelp')}</span>` : `<b>${t('bat')}</b><span>${t('staffHelp')}</span>`; }
  let thermalOn = true;   // false in the attract loop: nothing goes out
  const send = (line) => { if ((thermalOn && S.attended()) || /^stop$/i.test(line)) dev.send(line); if (view === 'intro') K.post({ t: 'thermal', th: K.thermalOf(/^stop$/i.test(line) ? '' : line) }); };
  setInterval(() => K.post({ t: 'state', view, dir: pending || (view === 'card' ? (K.visit.get() || {}).dir : null) }), 2000);
  const devPaint = (st = MoHeatDevice.state) => { const d = $('#devdot'); d.className = `devdot ${st.connected ? 'ok' : /connecting|reconnecting/.test(st.state) ? 'busy' : /lost|error/.test(st.state) ? 'err' : ''}`;
    d.dataset.state = st.state; d.title = `MoHeat Evo: ${st.state}`;
    if (st.state === 'lost') alert_('lost'); else if (st.connected || st.state === 'off') alert_(null);
    K.post({ t: 'device', ...st }); };
  addEventListener('moheat:device', (e) => devPaint(e.detail)); devPaint();
  setInterval(() => K.post({ t: 'device', ...MoHeatDevice.state }), 2000);   // a queue screen opened later learns the state too
  try { navigator.wakeLock?.request('screen').catch(() => {}); document.addEventListener('visibilitychange', () => { if (!document.hidden) navigator.wakeLock?.request('screen').catch(() => {}); }); } catch {}

  // ---------------------------------------------------------------- views
  let view = '', tapAt = 0;
  // visitor screens: a quick double tap answers once (the second tap must not land on the screen that replaces the first, or toggle a pick
  // back off — final4 E2E 2026-11-10). A click on a visitor button within 350 ms of the last accepted tap is ignored (a first tap on a new
  // screen always counts).
  // Not the staff panel / PIN / corner, and not the guide (shared/thermintro.js has its own guard).
  document.addEventListener('click', (e) => { const b = e.target.closest?.('button'); if (!e.isTrusted || !b || !b.closest('.view') || b.closest('.intro-host')) return;   // real taps only (a script's click() is never a double tap)
    const n = performance.now(); if (n - tapAt < 350) { e.stopImmediatePropagation(); e.preventDefault(); return; } tapAt = n; }, true);
  function go(v) {
    view = v; $$('.view').forEach((s) => { s.hidden = s.id !== `v-${v}`; });
    K.post({ t: 'state', view: v, dir: pending || (v === 'card' ? (K.visit.get() || {}).dir : null) });
    if (v !== 'intro') K.post({ t: 'thermal', th: K.thermalOf('') });
    thermalOn = v !== 'attract';
    if (v !== 'intro') intro?.stop();
    if (v === 'attract') { send('stop'); startAttract(); } else stopAttract();
    if (v === 'menu') renderMenu();
    document.documentElement.dataset.view = v; last = Date.now(); signs();
  }
  function newVisitor() { pending = null; try { if ((JSON.parse(sessionStorage.getItem('moheat.kiosk.session')) || {}).n > 0) K.wipeSet?.(true); } catch {}   // a visitor played a demo → wipe the headphones before the next one (kiosk.js card)
    try { sessionStorage.removeItem('moheat.kiosk.session'); } catch {} K.resetVisitor(); cfg = K.cfg(); document.documentElement.lang = lang(); paint(); }
  function reset(toAttract = false) { send('stop'); newVisitor(); go(toAttract ? 'attract' : 'welcome'); }

  // default volume 20 % (user 2026-11-15). Once per station: a saved value that is still the old booth default (30 %) moves to 20 %; any
  // other saved value was chosen by someone and stays.
  try { if (localStorage.getItem('moheat.volDef') !== '20') { const v = JSON.parse(localStorage.getItem('moheat.volume')); if (v != null && (Math.abs(+v - .3) < .001 || +v === 30)) localStorage.setItem('moheat.volume', '0.2'); localStorage.setItem('moheat.volDef', '20'); } } catch {}
  const volGet = () => { try { const v = JSON.parse(localStorage.getItem('moheat.volume')); return v == null ? .2 : Math.min(1, v > 1 ? v / 100 : +v); } catch { return .2; } };   // 0–1, shared with shell.js
  const volSet = (v) => { try { localStorage.setItem('moheat.volume', JSON.stringify(Math.round(v * 100) / 100)); } catch {} };
  // welcome → intro → menu
  let intro = null;
  const calib = () => { const s = K.scales(); return { warm: s.warm, cool: s.cool, capWarm: cfg.capWarm / 100, capCool: cfg.capCool / 100, onLevel: (o) => K.setScales(o) }; };
  function begin(withIntro) {
    K.stats.visitor(); sessionStorage.setItem('moheat.kiosk.counted', '1');
    if (!withIntro) return go('menu');
    go('intro');
    intro = MoHeatIntro.mount($('.intro-host'), { send, volume: volGet, onVolume: volSet, ...calib(), lang, connected: () => dev.isConnected(),
      onDone: (r) => { K.setScales(r); if (!r.skipped) K.stats.calib(r); if (pending) openDemo(pending); else go('menu'); } });
    intro.start();
  }
  $('#startVisit').addEventListener('click', () => begin(true));
  $('#skipIntro').addEventListener('click', () => begin(false));
  $('#replayIntro').addEventListener('click', () => { go('intro'); intro = MoHeatIntro.mount($('.intro-host'), { send, volume: volGet, onVolume: volSet, ...calib(), lang, connected: () => dev.isConnected(),
    onDone: (r) => { K.setScales(r); go('menu'); } }); intro.start(); });

  // menu: the demos staff offer (default all), thumbnails in the display language
  // numbers = position in the offered list (the same numbers on the phone pick page, its QR carries the list: no server)
  const woOn = () => { try { return localStorage.getItem('moheat.warmOnly') === '1'; } catch { return false; } }, woPick = () => cfg.warmPick || 'Demo49_NaomiSummer';   // the recommended warm-only demo (one setting: swap the folder name)
  const woFirst = (list) => (woOn() ? [...list.filter((d) => d.dir === woPick()), ...list.filter((d) => d.dir !== woPick())] : list);
  const offered = () => woFirst(K.offered(D.DEMOS)), num = (d) => K.num(D.DEMOS, d), top3 = () => { const t = K.top3(D.DEMOS); if (!woOn()) return t; const pk = K.offered(D.DEMOS).find((d) => d.dir === woPick()); return pk ? [pk, ...t.filter((d) => d.dir !== pk.dir)].slice(0, Math.max(3, t.length)) : t; }, pickUrl = () => K.pickUrl(D.DEMOS);
  const title = (d) => d[lang()] || d.en;
  const pitch = (d) => { const p = (window.MOHEAT_PITCH || {})[d.dir]; return p ? { line: p[lang()] || p.en, hot: p.hot ? p.hot[lang()] || p.hot.en : '' } : { line: '', hot: '' }; };
  const thumb = (d, l) => `../assets/images/demos/${d.dir}${l ? '.' + l : ''}.jpg`;
  // the picture without the cover's own title (the tile prints the title; the titled cover thumbnail was cropped): assets/images/demos/art/
  // (the homepage menu uses the same); the titled thumbnail if it is missing (not cached offline yet)
  const img = (d) => `<img alt="" src="../assets/images/demos/art/${d.dir}.webp" onerror="this.onerror=null;this.src='${thumb(d, lang())}'">`;
  const tile = (d, big) => { const p = pitch(d); return `<button type="button" data-dir="${d.dir}"><span class="no">${num(d)}</span>${woOn() && d.dir === woPick() ? `<i class="wo-rec">${({ ja: 'おすすめ：あたたかさだけ', en: 'Recommended: warm only', zh: '推荐：只要温热', ko: '추천: 따뜻함만' })[lang()] || 'おすすめ：あたたかさだけ'}</i>` : ''}${img(d)}<b>${title(d)}</b>${big && p.line ? `<small>${p.line}</small>` : ''}${big && p.hot ? `<em>${p.hot}</em>` : ''}</button>`; };
  function renderRec() { $('.rec-row').innerHTML = top3().map((d) => tile(d, true)).join('');
    $('.nums-row').innerHTML = offered().map((d) => `<button type="button" data-dir="${d.dir}" title="${title(d).replace(/"/g, '&quot;')}">${num(d)}</button>`).join(''); qr($('#qq .qr'), pickUrl()); }
  function renderMenu() {
    $('.menu-top').innerHTML = top3().map((d) => tile(d, true)).join('');
    $('.menu-grid').innerHTML = offered().map((d) => tile(d, false)).join('');
  }
  let pending = null;   // a demo picked on the welcome screen: intro first, then straight to it
  const openDemo = (dir) => { const d = D.DEMOS.find((x) => x.dir === dir); if (!d) return;
    K.visit.set({ dir: d.dir, t0: Date.now(), started: false, finished: false, mode: null, moments: [] }); send('stop');
    try { sessionStorage.setItem('moheat.kiosk.cut', cfg.cut || 'full'); } catch {}
    location.href = `../demos/${d.cat}/${d.dir}/`; };
  for (const sel of ['.menu-grid', '.menu-top']) $(sel).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openDemo(b.dataset.dir); });
  $('.rec-row').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { pending = b.dataset.dir; begin(true); } });
  $('#moreDemos').addEventListener('click', () => begin(true));   // new visitors get the intro too, then the full menu
  $('.nums-row').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { pending = b.dataset.dir; begin(true); } });

  // ---------------------------------------------------------------- experience card: one question per screen, a tap = answer + next
  // rating → buy? → fair price (only after yes / maybe) → where would you use it (≤ 2; auto-next on the 2nd tap or 1.6 s after the 1st)
  // → favourite moment (only when the demo had thermal moments). Skip (this question) + Skip all on every screen; 15 s without input
  // closes the card (answers so far are kept, none = skipped); thank-you ≤ 2 s; the comment hides behind a small link.
  const answer = { stars: 0, buy: null, price: null, moment: null, scenes: [] };
  const ICON = { warm: '#ff8a3d', cool: '#6fb7ff', dual: 'linear-gradient(90deg, #ff8a3d 50%, #6fb7ff 50%)' };   // a plain coloured dot (no emoji, user 2026-11-09)
  // pacing (user 2026-11-08, REQUIREMENTS §10): the picked option stays lit ~0.8 s with a soft confirm pulse, a question stays at least
  // 1.5 s before an answer can move on (no accidental double taps), "‹ back" goes one question back; 15 s idle still closes the card
  const CONFIRM = 800, DWELL = 1500;
  let qi = 0, sceneT = 0, shownAt = 0;
  const schedule = (ms) => { clearTimeout(sceneT); sceneT = setTimeout(nextQ, Math.max(ms, DWELL - (Date.now() - shownAt))); };
  const qs = () => { const v = K.visit.get() || {}; const q = ['rate', 'buy'];
    if (answer.buy === 'yes' || answer.buy === 'maybe') q.push('price'); q.push('scenes'); if ((v.moments || []).length) q.push('fav'); return q; };
  function renderCard(fresh = true) {
    const v = K.visit.get() || {}, d = D.DEMOS.find((x) => x.dir === v.dir);
    if (fresh) { Object.assign(answer, { stars: 0, buy: null, price: null, moment: null, scenes: [] }); qi = 0; shownAt = Date.now(); $('#comment').value = ''; $('#comment').hidden = true; $('#addComment').hidden = false; $('.q-thanks').hidden = true; $('.card-wrap').hidden = false; }
    $('.card-title').textContent = d ? title(d) : 'MoHeat Evo';
    const list = qs(), k = list[qi];
    $('.q-dots').innerHTML = list.map((_, j) => `<i class="${j < qi ? 'done' : j === qi ? 'now' : ''}"></i>`).join('');
    const opts = (items, sel) => `<div class="chips big-chips">${items.map(([val, label]) => `<button type="button" data-v="${String(val).replace(/"/g, '&quot;')}" aria-pressed="${sel(val)}">${label}</button>`).join('')}</div>`;
    let html = `<h2>${t(k)}</h2>`;
    if (k === 'rate') html += `<div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-v="${n}" aria-label="${n}" class="${n === answer.stars ? 'sel ' : ''}${n <= answer.stars ? 'on' : ''}">★</button>`).join('')}</div>`;
    if (k === 'buy') html += opts(['yes', 'maybe', 'no'].map((x) => [x, t(x)]), (x) => answer.buy === x);
    if (k === 'price') { const cur = K.currency(lang()); html += opts(K.bands(cur).map((b) => [`${cur} ${b}`, b]), (x) => answer.price === x); }
    if (k === 'scenes') html += opts(K.SCENES.map((s) => [s.id, s[lang()] || s.en]), (x) => answer.scenes.includes(x));
    if (k === 'fav') html += opts((v.moments || []).slice(0, 6).map((m) => [m.label, `<i style="display:inline-block;width:.6em;height:.6em;border-radius:50%;margin-right:.45em;background:${ICON[m.kind] || 'transparent'}"></i>${m.label}`]), (x) => answer.moment === x);
    $('.q').innerHTML = html; $('.q').dataset.q = k;
    $('#cardSkip').textContent = t('skip'); $('#cardBack').textContent = t('back'); $('#cardBack').hidden = qi === 0;
    qr($('.card-qr .qr'), summaryUrl(v));
    let news = $('.card-qr .news'); if (cfg.newsUrl) { if (!news) { news = document.createElement('div'); news.className = 'news'; news.innerHTML = '<div class="qr"></div><p></p>'; $('.card-qr').appendChild(news); }
      qr($('.qr', news), cfg.newsUrl); $('p', news).textContent = t('news'); } else news?.remove();
  }
  const nextQ = () => { clearTimeout(sceneT); qi++; if (qi >= qs().length) return closeCard(true); shownAt = Date.now(); renderCard(false); };
  const prevQ = () => { clearTimeout(sceneT); if (qi > 0) { qi--; shownAt = Date.now(); renderCard(false); } };
  $('.q').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const k = $('.q').dataset.q, v = b.dataset.v;
    if (k === 'rate') answer.stars = +v; if (k === 'buy') { answer.buy = v; if (v === 'no') answer.price = null; } if (k === 'price') answer.price = v; if (k === 'fav') answer.moment = v;
    if (k === 'scenes') { const a = answer.scenes; if (a.includes(v)) a.splice(a.indexOf(v), 1); else a.push(v); renderCard(false); clearTimeout(sceneT);
      if (a.length >= 2) schedule(CONFIRM); else if (a.length) schedule(2400); return; }   // up to 2: a second pick moves on, one pick waits a little
    renderCard(false); schedule(CONFIRM);   // the pick stays lit, then the next question
  });
  $('#addComment').addEventListener('click', () => { $('#addComment').hidden = true; $('#comment').hidden = false; $('#comment').focus(); });
  $('#comment').addEventListener('keydown', (e) => { if (e.key === 'Enter') nextQ(); });
  let carded = false;
  // ---------------------------------------------------------------- end of a demo / of the visit (REQUIREMENTS §11)
  // nobody queuing (staff toggle) and within the staff's max demos / minutes → "another story?" keeping the calibration (no intro);
  // otherwise the ending: (a) take off MoHeat Evo (output already stopped, staff Continue) → (b) remove the earbuds → card → thanks + QR
  const sess = { get: () => { try { return JSON.parse(sessionStorage.getItem('moheat.kiosk.session')) || { n: 0, t0: Date.now() }; } catch { return { n: 0, t0: Date.now() }; } },
    set: (v) => { try { sessionStorage.setItem('moheat.kiosk.session', JSON.stringify(v)); } catch {} } };
  function afterDemo() {
    const se = sess.get(); se.n++; sess.set(se); K.mistCount?.(); cfg = K.cfg();   // mistCount: one more experience for the mist refill reminder
    const over = (cfg.maxDemos && se.n >= cfg.maxDemos) || (cfg.maxMin && Date.now() - se.t0 > cfg.maxMin * 60000);
    if (!cfg.queue && !over) { go('more'); $('#v-more .rec-row').innerHTML = top3().map((d) => tile(d, true)).join(''); paint(); } else endSeq();
  }
  $('#v-more').addEventListener('click', (e) => { const b = e.target.closest('.rec-row button'); if (b) openDemo(b.dataset.dir); });
  $('#moreAll').addEventListener('click', () => go('menu'));
  $('#moreFinish').addEventListener('click', () => endSeq());
  const PIC_EVO = `<svg viewBox="0 0 220 150" aria-hidden="true"><ellipse cx="110" cy="96" rx="40" ry="48" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.5)" stroke-width="2"/><circle cx="68" cy="98" r="6" fill="#fff"/><circle cx="152" cy="98" r="6" fill="#fff"/>
    <g class="lift"><path d="M56 56 Q56 4 110 4 Q164 4 164 56" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><rect x="38" y="46" width="32" height="56" rx="15" fill="#ff8a3d" stroke="#fff" stroke-width="3"/><rect x="150" y="46" width="32" height="56" rx="15" fill="#9fd8ff" stroke="#fff" stroke-width="3"/></g>
    <path d="M14 58 v-26 M6 40 l8 -8 8 8 M206 58 v-26 M198 40 l8 -8 8 8" stroke="#ffd479" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const PIC_PHONES = `<svg viewBox="0 0 220 130" aria-hidden="true"><ellipse cx="110" cy="70" rx="40" ry="50" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <g class="lift" fill="#fff"><circle cx="58" cy="70" r="10"/><rect x="30" y="66" width="24" height="8" rx="4"/><circle cx="162" cy="70" r="10"/><rect x="166" y="66" width="24" height="8" rx="4"/></g>
    <path d="M34 50 h-22 M20 42 l-8 8 8 8 M186 50 h22 M200 42 l8 8 -8 8" stroke="#ffd479" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function endSeq(phase = 'a') {
    send('stop'); go('end'); const a = phase === 'a';
    $('.endpic').innerHTML = a ? PIC_EVO : PIC_PHONES; $('.end-h').textContent = t(a ? 'endA' : 'endB'); $('.end-sub').textContent = t(a ? 'endASub' : 'endBSub');
    $('#endGo').textContent = t(a ? 'staffGo' : 'done2'); $('#endGo').onclick = () => (a ? endSeq('b') : (carded = false, go('card'), renderCard(true), paint(), last = Date.now()));
  }
  function closeCard(save) {
    if (carded) return; carded = true; clearTimeout(sceneT);
    const v = K.visit.get() || {}, r = { ...answer, comment: $('#comment').value.trim() };
    if (v.dir) K.stats.card(v.dir, save ? r : null);
    $('.card-wrap').hidden = true; $('.q-thanks').hidden = false; qr($('.thanks-qr'), CONTACT);   // thank-you + a contact QR (the links page: email, LinkedIn, Instagram; user 2026-11-15), then the next visitor
    const done = () => { clearTimeout(tq); $('.q-thanks').removeEventListener('click', done); reset(); }, tq = setTimeout(done, 20000);   /* time to take out a phone and scan */ $('.q-thanks').addEventListener('click', done);
  }
  $('#cardBack').addEventListener('click', prevQ);
  $('#cardSkip').addEventListener('click', () => nextQ());
  $('#cardSkipAll').addEventListener('click', () => closeCard(true));   // keeps what was already tapped (nothing = skipped)
  function summaryUrl(v) {
    const base = (cfg.site || K.DEF.site).replace(/\/?$/, '/');
    const p = new URLSearchParams({ d: v.dir || '', l: lang() }); if (answer.moment) p.set('m', answer.moment);
    return `${base}kiosk/summary.html?${p}`;
  }
  function qr(el, text) {
    if (!el) return; if (el.dataset.q === text) return; el.dataset.q = text;
    try { const q = qrcode(0, 'M'); q.addData(unescape(encodeURIComponent(text))); q.make(); el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { el.textContent = text; }
  }

  // ---------------------------------------------------------------- attract loop (thermal off)
  let attT = 0, attI = 0;
  function startAttract() {
    const box = $('.att-slides'), ds = offered(); if (!ds.length) return;
    $('.att-tag').textContent = `${T.tag.en} · ${T.tag.ja}`; $('.att-touch').textContent = T.touch.en;
    if (!box.children.length || box.dataset.n !== String(ds.length)) { box.dataset.n = ds.length; box.innerHTML = ds.map((d) => { const c = `../demos/${d.cat}/${d.dir}/media/cover/`, set = (l) => `${c}${l}.w1280.webp 1280w, ${c}${l}.w1920.webp 1920w`;
      // the finished cover at full size, always Japanese on standby (exhibition default; was the 480×270 menu thumbnail, blown up 4–7× on a
      // 1080p screen). Missing → the English cover → the thumbnail.
      return `<img alt="" src="${c}ja.w1920.webp" srcset="${set('ja')}" sizes="100vw" decoding="async" data-en="${set('en')}" data-th="${thumb(d)}"
        onerror="if(this.dataset.en){this.srcset=this.dataset.en;this.src=this.dataset.en.split(' ')[2];this.dataset.en=''}else{this.onerror=null;this.removeAttribute('srcset');this.src=this.dataset.th}">`; }).join(''); }
    const show = () => { const im = box.children; [...im].forEach((x, j) => x.classList.toggle('on', j === attI % im.length)); attI++; };
    clearInterval(attT); show(); attT = setInterval(show, 6000);
  }
  // the blurred backdrop behind a cover shown whole on a narrow screen (kiosk.css .att-slides::before) follows the cover on screen
  new MutationObserver(() => { const on = $('.att-slides img.on'); if (on) $('.att-slides').style.backgroundImage = `url("${on.currentSrc || on.src}")`; }).observe($('.att-slides'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  function stopAttract() { clearInterval(attT); attT = 0; }
  $('#v-attract').addEventListener('click', () => reset(false));

  // ---------------------------------------------------------------- idle: intro / menu / card → reset; welcome → attract
  let last = Date.now();
  for (const e of ['pointerdown', 'keydown', 'touchstart', 'input']) addEventListener(e, () => { last = Date.now(); }, { capture: true, passive: true });
  setInterval(() => {
    if (!$('#staff').hidden || !$('#pinBox').hidden) return;
    if (!S.attended()) { if (view !== 'attract') reset(true); return; }   // unattended: carousel under the do-not-touch screen
    const idle = (Date.now() - last) / 1000;
    if (view === 'intro') return;   // the intro runs by itself and ends on the menu
    if (view === 'card' && idle > 15) return closeCard(true);   // never block the next visitor
    if ((view === 'menu') && idle > cfg.idle) return (sess.get().n ? endSeq() : reset());
    if (view === 'more' && idle > cfg.idle) return endSeq();
    if (view === 'end' && idle > 180) { carded = false; return closeCard(false); }
    if (view === 'welcome' && idle > cfg.idle) go('attract');
  }, 1000);

  // ---------------------------------------------------------------- queue toggle (no PIN): long-press the tiny dot bottom-left or key Q
  const qpaint = () => { $('#qdot').classList.toggle('on', !!K.cfg().queue); };
  const qtoggle = () => { K.setCfg({ queue: !K.cfg().queue }); cfg = K.cfg(); qpaint(); const q = $('#qdot'); q.classList.add('flash'); setTimeout(() => q.classList.remove('flash'), 900); };
  let qT = 0; $('#qdot').addEventListener('pointerdown', () => { qT = setTimeout(qtoggle, 800); }); for (const e of ['pointerup', 'pointerleave', 'pointercancel']) $('#qdot').addEventListener(e, () => clearTimeout(qT));
  addEventListener('keydown', (e) => { if ((e.key === 'q' || e.key === 'Q') && !/input|textarea|select/i.test(e.target.tagName) && view !== 'intro') qtoggle(); });
  qpaint();
  // ---------------------------------------------------------------- signs + staff "attended / unattended" (REQUIREMENTS §12; kiosk/signs.js)
  // attended (default) = touch-OK badge; unattended = the full "staff will be back soon · please do not touch" screen, warm / cool off,
  // taps and keys ignored except the staff ways back: long-press the second dot (or key S), the 5-tap corner + PIN. Synced to the queue
  // screen through the settings (storage event) + BroadcastChannel; periods logged per day (S.ensure / S.summary / S.csv).
  function signs() {
    const b = $('#msBadge'), on = S.attended();
    if (on && view === 'welcome') { b.classList.remove('big'); S.render(b, { langs: [lang()], sub: false, place: 'Welcome' }); }
    else if (on && view === 'attract') { b.classList.add('big'); S.render(b, { langs: ['en', 'ja'], sub: false, place: 'Attract' }); }
    else b.hidden = true;
    const a = $('#msAway'); a.hidden = on; if (!on) S.away(a, cfg.langs || ['en', 'ja', 'zh']);
    $('#sdot').classList.toggle('off', !on);
  }
  function applyStaff(was) {
    const on = S.attended(); cfg = K.cfg(); signs();
    if (!on) { send('stop'); intro?.stop(); if (view !== 'attract' && $('#staff').hidden) reset(true); }
    else if (was === false && view === 'attract' && $('#staff').hidden) reset(false);   // staff back → welcome for the next visitor
  }
  const stoggle = () => { const was = S.attended(); S.setAttended(!was); applyStaff(was); const d = $('#sdot'); d.classList.add('flash'); setTimeout(() => d.classList.remove('flash'), 900); };
  let sT = 0; $('#sdot').addEventListener('pointerdown', () => { sT = setTimeout(stoggle, 800); }); for (const e of ['pointerup', 'pointerleave', 'pointercancel']) $('#sdot').addEventListener(e, () => clearTimeout(sT));
  addEventListener('keydown', (e) => { if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && !/input|textarea|select/i.test(e.target.tagName) && view !== 'intro' && $('#staff').hidden && $('#pinBox').hidden) stoggle(); });
  // unattended: every other key is swallowed (capture phase, before the page's own key handlers); the PIN box / staff panel still type
  addEventListener('keydown', (e) => { if (S.attended() || e.key === 's' || e.key === 'S' || !$('#staff').hidden || !$('#pinBox').hidden) return; e.stopImmediatePropagation(); e.preventDefault(); }, true);
  addEventListener('storage', (e) => { if (e.key === 'moheat.kiosk.cfg') { const was = $('#msAway').hidden; applyStaff(was); } });
  S.ensure(); setInterval(() => S.ensure(), 60000);
  // ---------------------------------------------------------------- staff: Staff long-press top-left (+ the quick-tap corner) + PIN
  let taps = [];
  $('#corner').addEventListener('click', () => { const n = Date.now(); taps = taps.filter((x) => n - x < 3000).concat(n); if (taps.length >= 5) { taps = []; askPin(); } });
  function askPin() { $('#pinBox').hidden = false; $('#pin').value = ''; $('#pinErr').textContent = ''; setTimeout(() => $('#pin').focus(), 50); }
  const tryPin = () => { if ($('#pin').value === String(cfg.pin)) { $('#pinBox').hidden = true; openStaff(); } else { $('#pinErr').textContent = 'Wrong PIN'; $('#pin').value = ''; } };
  $('#pinOk').addEventListener('click', tryPin); $('#pin').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryPin(); });
  $('#pinCancel').addEventListener('click', () => { $('#pinBox').hidden = true; if (location.hash === '#staff') reset(); });
  // touch only at the booth (no keyboard): an on-screen keypad under the PIN (OK = its ✓ key), − / + and a keypad pop-up for the staff panel's numbers (kiosk/numpad.js)
  if (window.MoHeatNumpad) { MoHeatNumpad.inline($('#pin'), { okBtn: $('#pinOk') }); MoHeatNumpad.steppers($('#staff')); }
  // operator checklists (kiosk/checklist.js): before the first visitor of the day (LED 26 V, mist tube) and at the end of the day (LED off, mist off + tube out)
  if (window.MoHeatChecklist) { MoHeatChecklist.guard($('#staffClose'), 'open'); MoHeatChecklist.guard($('#exitKiosk'), 'close'); }
  // staff break (kiosk/break.js): covers loop silently, notice in 4 languages, taps / keys ignored, thermal stopped; out = corner + password + opening checklist
  if (window.MoHeatBreak) MoHeatBreak.init({ go, send, reset: () => reset(false), checkPin: (v) => v === String(cfg.pin), beforeEnter: () => { saveStaff(); $('#staff').hidden = true; } });
  // ■ STOP + staff button on every screen of the start page (start · guide · card · standby · break): demos/shared/kiosk.js controls()
  // the headphone wipe reminder needs cfg.hygiene: on once for every booth (a setting saved before 2026-11-11 had it off); staff can still turn it off
  try { if (!localStorage.getItem('moheat.kiosk.hygV')) { K.setCfg({ hygiene: true }); cfg = K.cfg(); localStorage.setItem('moheat.kiosk.hygV', '1'); } } catch {}
  K.controls?.({ lang: () => document.documentElement.lang || 'ja', stop: () => { send('stop'); if (view === 'intro') { try { intro?.stop?.(); } catch {} reset(false); } send('stop'); },
    staff: () => { if (window.MoHeatBreak?.active()) return MoHeatBreak.askPin(); if (!$('#staff').hidden || !$('#pinBox').hidden) return; if (view !== 'welcome') reset(false); askPin(); } });
  // visitor option "warm only (no mist)" on the start screen (some visitors dislike the alcohol mist): device.js zeroes every cool value,
  // the guide leaves out the cool steps, the menu shows the recommended warm-only demo first; cleared for the next visitor (kiosk.js)
  { const WOL = { ja: 'あたたかさだけ（ミストなし）', en: 'Warm only (no mist)', zh: '只要温热（不喷雾）', ko: '따뜻함만 (미스트 없음)' };
    const st = document.createElement('style'); st.textContent = `.wo-toggle { display: inline-flex; align-items: center; gap: 14px; min-height: 64px; padding: 0 26px; border-radius: 999px; border: 1px solid rgba(255,255,255,.3); background: rgba(255,255,255,.07);
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: #f4efe6; font: 600 clamp(17px, 2.2vh, 22px)/1.2 Inter, "Noto Sans JP", "PingFang SC", "Apple SD Gothic Neo", sans-serif; cursor: pointer; touch-action: manipulation; margin: 1.2vh auto 0; }
      .wo-toggle i { width: 30px; height: 30px; border-radius: 9px; border: 2px solid rgba(255,255,255,.7); flex: 0 0 auto; position: relative; }
      .wo-toggle[aria-pressed="true"] { background: rgba(255,170,110,.18); border-color: #ffb36b; } .wo-toggle[aria-pressed="true"] i { background: #ffb36b; border-color: #ffb36b; }
      .wo-toggle[aria-pressed="true"] i::after { content: ""; position: absolute; left: 9px; top: 3px; width: 8px; height: 15px; border: solid #2a1606; border-width: 0 4px 4px 0; transform: rotate(45deg); }
      .menu-grid button, .menu-top button, .rec-row button { position: relative; } .wo-rec { position: absolute; z-index: 2; left: 10px; top: 10px; padding: 6px 12px; border-radius: 999px; background: #ffb36b; color: #2a1606; font: 700 clamp(13px, 1.6vh, 17px)/1 Inter, "Noto Sans JP", sans-serif; font-style: normal; }`;
    document.head.appendChild(st);
    const b = document.createElement('button'); b.type = 'button'; b.id = 'warmOnly'; b.className = 'wo-toggle';
    const paintWO = () => { b.setAttribute('aria-pressed', woOn()); b.innerHTML = `<i aria-hidden="true"></i><span>${WOL[lang()] || WOL.ja}</span>`; };
    b.addEventListener('click', (e) => { e.stopPropagation(); try { woOn() ? localStorage.removeItem('moheat.warmOnly') : localStorage.setItem('moheat.warmOnly', '1'); } catch {} if (woOn()) send('stop'); paintWO(); try { renderMenu(); renderRec(); } catch {} });
    const at = $('#v-welcome .langs'); if (at) { at.after(b); paintWO(); new MutationObserver(paintWO).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
      addEventListener('storage', (e) => { if (e.key === 'moheat.warmOnly') paintWO(); }); setInterval(() => { if (b.getAttribute('aria-pressed') !== String(woOn())) paintWO(); }, 1000); } }
  // full screen: the package starts Chrome with --kiosk; if the window is not full screen (started by hand, or staff left it), the next tap on the
  // standby / start screen asks for it again (the browser only allows it from a tap)
  addEventListener('pointerdown', () => { if ((view === 'attract' || view === 'welcome') && !document.fullscreenElement && screen.height - innerHeight > 4 && $('#staff').hidden) document.documentElement.requestFullscreen?.().catch(() => {}); }, true);
  // staff setting: the mist refill reminder every N experiences (− / + and the keypad, like the other numbers)
  { const lab = $('#sIdle')?.closest('label'); if (lab && !$('#sMist')) { const l = document.createElement('label'); l.innerHTML = '冷却ミスト補充の通知 / Mist refill reminder: <input type="number" id="sMist" min="1" max="20" step="1" /> 名ごと / visitors'; lab.after(l);
      $('#sMist').addEventListener('change', (e) => { e.stopPropagation(); K.setCfg({ mistEvery: Math.max(1, Math.min(20, Math.round(+e.target.value) || 3)) }); K.mistPaint?.(); });
      new MutationObserver(() => { if (!$('#staff').hidden) $('#sMist').value = K.mistEvery?.() || 3; }).observe($('#staff'), { attributes: true, attributeFilter: ['hidden'] }); $('#sMist').value = K.mistEvery?.() || 3;
      window.MoHeatNumpad?.steppers($('#staff')); } }
  let statWhich = 'today';
  function openStaff() {
    send('stop'); cfg = K.cfg(); $('#staff').hidden = false;
    $('#sLang').innerHTML = (cfg.langs || ['en', 'ja', 'zh']).map((l) => `<option value="${l}"${l === cfg.lang ? ' selected' : ''}>${LANG_NAMES[l] || l}</option>`).join('');
    $('#sCapW').value = cfg.capWarm; $('#sStartW').value = cfg.startWarm; $('#sCapC').value = cfg.capCool; $('#sStartC').value = cfg.startCool; $('#sIdle').value = cfg.idle; $('#sSite').value = cfg.site; $('#sNews').value = cfg.newsUrl || '';
    $('#sCur').value = cfg.currency || 'auto'; bandsField(); $('#sCut').value = cfg.cut || 'full'; $('#sHyg').checked = !!cfg.hygiene; $('#sPick').value = cfg.pickUrl || ''; $('#sQueue').checked = !!cfg.queue; $('#sMaxD').value = cfg.maxDemos || 0; $('#sAttended').checked = S.attended();
    { const g = S.cfg(); $('#sSignTouch').checked = g.signTouch; $('#sSignPhoto').value = g.signPhoto; $('#sSignWelcome').checked = g.signWelcome; $('#sSignAttract').checked = g.signAttract; $('#sSignQueue').checked = g.signQueue; $('#sSignPos').value = g.signPos; } $('#sMaxM').value = cfg.maxMin || 0;
    $('#sQMode').value = cfg.queueMode; $('#sAlt').value = cfg.altMin; $('#sPromo').value = cfg.promoSrc === 'idb' ? '' : cfg.promoSrc || ''; $('#sPromo').placeholder = cfg.promoSrc === 'idb' ? 'local file in use (pick another or type a URL)' : 'empty = kiosk/media/promo.mp4 · or a URL';
    $('#sPromoSound').checked = !!cfg.promoSound; $('#sPromoNow').checked = !!cfg.promoNow; $('#sQrSize').value = cfg.qrSize; $('#sQrCorner').value = cfg.qrCorner;
    $('#sDemos').innerHTML = D.DEMOS.map((d, i) => `<label><input type="checkbox" value="${d.dir}"${!cfg.demos || cfg.demos.includes(d.dir) ? ' checked' : ''}> ${i + 1} · ${d.en}</label>`).join('');
    capLabels(); renderStats();
  }
  const bandsField = () => { const cur = K.currency(cfg.lang); $('#sCurNow').textContent = cur; $('#sBands').value = K.bands(cur).join(' | '); $('#sBands').dataset.cur = cur; };   // '|' between bands: a band itself can hold a comma (¥10,000)
  const capLabels = () => { for (const k of ['W', 'C']) { $(`#sCap${k}V`).textContent = `${$(`#sCap${k}`).value}%`; $(`#sStart${k}V`).textContent = `${Math.min(+$(`#sStart${k}`).value, +$(`#sCap${k}`).value)}%`; } };
  function saveStaff() {
    const demos = $$('#sDemos input').filter((x) => x.checked).map((x) => x.value), pin = $('#sPin').value.trim();
    const cur = $('#sBands').dataset.cur, list = K.splitBands($('#sBands').value);
    const bands = { ...(K.cfg().bands || {}) }; if (cur && list.length >= 2) bands[cur] = list.slice(0, 6);
    K.setCfg({ lang: $('#sLang').value, capWarm: +$('#sCapW').value, startWarm: Math.min(+$('#sStartW').value, +$('#sCapW').value), capCool: +$('#sCapC').value, startCool: Math.min(+$('#sStartC').value, +$('#sCapC').value), idle: Math.max(20, +$('#sIdle').value || 60),
      site: $('#sSite').value.trim() || K.DEF.site, cut: $('#sCut').value, hygiene: $('#sHyg').checked, pickUrl: $('#sPick').value.trim(), queue: $('#sQueue').checked, maxDemos: Math.max(0, +$('#sMaxD').value || 0), maxMin: Math.max(0, +$('#sMaxM').value || 0),
      queueMode: $('#sQMode').value, altMin: Math.max(1, +$('#sAlt').value || 3), promoSrc: $('#sPromo').value.trim() || (K.cfg().promoSrc === 'idb' ? 'idb' : ''),
      promoSound: $('#sPromoSound').checked, promoNow: $('#sPromoNow').checked, qrSize: $('#sQrSize').value, qrCorner: $('#sQrCorner').value, newsUrl: $('#sNews').value.trim(), currency: $('#sCur').value, bands,
      demos: demos.length === D.DEMOS.length ? null : demos, ...(/^\d{4,8}$/.test(pin) ? { pin } : {}),
      signTouch: $('#sSignTouch').checked, signPhoto: $('#sSignPhoto').value, signWelcome: $('#sSignWelcome').checked, signAttract: $('#sSignAttract').checked, signQueue: $('#sSignQueue').checked, signPos: $('#sSignPos').value });
    if ($('#sAttended').checked !== S.attended()) S.setAttended($('#sAttended').checked);
    cfg = K.cfg(); capLabels(); K.post({ t: 'staff', attended: S.attended() });
  }
  $('#staff').addEventListener('change', (e) => { if (e.target.id === 'sCur') { K.setCfg({ currency: e.target.value }); cfg = K.cfg(); bandsField(); } saveStaff(); });
  $('#staff').addEventListener('input', (e) => { if (e.target.type === 'range') capLabels(); });
  $('#dAll').addEventListener('click', () => { $$('#sDemos input').forEach((x) => { x.checked = true; }); saveStaff(); });
  $('#dNone').addEventListener('click', () => { $$('#sDemos input').forEach((x) => { x.checked = false; }); saveStaff(); });
  $('#staffClose').addEventListener('click', () => { saveStaff(); $('#staff').hidden = true; reset(!S.attended()); signs(); });
  $$('#staff [data-w]').forEach((b) => b.addEventListener('click', () => { statWhich = b.dataset.w; $$('#staff [data-w]').forEach((x) => x.classList.toggle('on', x === b)); renderStats(); }));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderStats() {
    const s = K.stats.table(statWhich), name = (dir) => { const i = D.DEMOS.findIndex((d) => d.dir === dir); return i >= 0 ? `${i + 1} · ${D.DEMOS[i].en}` : dir; };
    const b = s.buy, nb = b.yes + b.maybe + b.no, pct = (n) => (nb ? `${Math.round(100 * n / nb)}%` : '–');
    const topPrice = Object.entries(s.cross).sort((a, c) => c[1] - a[1])[0];
    $('#statSum').innerHTML = `<div><b>${s.visitors}</b>visitors</div><div><b>${s.rows.reduce((a, r) => a + r.started, 0)}</b>plays</div><div><b>${s.cards}</b>cards (${s.skipped} skipped)</div>`
      + `<div><b>${pct(b.yes)} / ${pct(b.maybe)} / ${pct(b.no)}</b>buy: yes / maybe / no (${nb})</div><div><b>${topPrice ? esc(topPrice[0].split('|')[1]) : '–'}</b>top price band</div>`
      + `<div><b>${s.calib.n ? `${Math.round(s.calib.warm * 100)}% / ${Math.round(s.calib.cool * 100)}%` : '–'}</b>avg personal max warm / cool (${s.calib.n}; hit cap ${s.calib.warmCapHits} / ${s.calib.coolCapHits})</div>`
      + (() => { const p = S.summary(statWhich); return `<div><b>${S.dur(p.attended)} / ${S.dur(p.unattended)}</b>staffed / unattended (h:mm)</div>`; })()
      + `<div><b>${esc(Object.entries(s.scenes).sort((a, c) => c[1] - a[1]).slice(0, 2).map(([k, n]) => `${(K.SCENES.find((x) => x.id === k) || { en: k }).en} ${n}`).join(' · ') || '–')}</b>top use scenes</div>`;
    $('#statBody').innerHTML = s.rows.map((r, i) => `<tr><td class="n">${i + 1}</td><td>${esc(name(r.dir))}</td><td class="n">${r.started}</td><td class="n">${r.finished}</td><td class="n">${r.pure} / ${r.interactive}</td><td class="n">${r.avg ?? '–'}${r.rated ? ` (${r.rated})` : ''}</td><td>${esc(r.top)}</td></tr>`).join('')
      || '<tr><td colspan="7">No plays yet</td></tr>';
    const all = JSON.parse(K.stats.json()), days = statWhich === 'all' ? Object.entries(all.days) : Object.entries(all.days).filter(([d]) => d === K.day());
    const cs = days.flatMap(([d, x]) => x.comments.map((c) => `${d} ${c.t} · ${name(c.dir)}${c.stars ? ` · ${'★'.repeat(c.stars)}` : ''}: ${c.text}`));
    $('#statComments').innerHTML = cs.length ? cs.slice(-30).reverse().map((c) => `<div>${esc(c)}</div>`).join('') : '';
  }
  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  $('#exCsv').addEventListener('click', () => download(`moheat-kiosk-${K.day()}.csv`, '﻿' + K.stats.csv() + S.csv(), 'text/csv'));
  $('#exCom').addEventListener('click', () => download(`moheat-kiosk-comments-${K.day()}.csv`, '﻿' + K.stats.commentsCsv(), 'text/csv'));
  $('#exJson').addEventListener('click', () => download(`moheat-kiosk-${K.day()}.json`, JSON.stringify({ ...JSON.parse(K.stats.json()), presence: S.log() }, null, 1), 'application/json'));
  $('#exClear').addEventListener('click', () => { if (confirm('Delete all kiosk statistics in this browser? Export them first.')) { K.stats.clear(); renderStats(); } });
  $('#fsBtn').addEventListener('click', () => { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch?.(() => {}); });
  $('#attractBtn').addEventListener('click', () => { saveStaff(); $('#staff').hidden = true; go('attract'); });
  $('#signBtn').addEventListener('click', () => { saveStaff(); window.open('sign.html', 'moheat-sign'); });
  // staff self-calibration: the same ramp on a staff member, up to the full device scale → the warm / cool caps (rounded to 5 %)
  $('#selfCal').addEventListener('click', () => { saveStaff(); $('#staff').hidden = true; go('intro');
    intro = MoHeatIntro.mount($('.intro-host'), { send, only: ['warm', 'cool'], capWarm: 1, capCool: 1, lang, connected: () => dev.isConnected(),
      onDone: (r) => { const r5 = (x) => Math.max(30, Math.min(100, Math.round(x * 20) * 5));
        if (!r.skipped) K.setCfg({ ...(r.maxWarm != null ? { capWarm: r5(r.maxWarm) } : {}), ...(r.maxCool != null ? { capCool: r5(r.maxCool) } : {}) });
        cfg = K.cfg(); go('welcome'); openStaff(); } }); intro.start(); });
  $('#sPromoFile').addEventListener('change', async (e) => { const f = e.target.files?.[0]; if (!f) return;
    try { await K.idb.put('promo', f); K.setCfg({ promoSrc: 'idb' }); cfg = K.cfg(); K.post({ t: 'promo' }); $('#offlineOut').textContent = `Promo video saved on this machine: ${f.name} (${Math.round(f.size / 1048576)} MB)`; }
    catch (err) { $('#offlineOut').textContent = `Could not store the video: ${err.message}`; } });
  $('#queueBtn').addEventListener('click', () => { window.open('queue.html', 'moheat-queue', 'popup,width=1280,height=720'); });
  $('#posterBtn').addEventListener('click', () => { window.open('poster.html', 'moheat-poster'); });
  $('#reportBtn').addEventListener('click', () => { window.open('report.html', 'moheat-report'); });
  $('#cardBtn').addEventListener('click', () => { window.open('staff_card.html', 'moheat-staff-card'); });
  $('#offlineBtn').addEventListener('click', () => offline());
  async function offline() {
    const out = $('#offlineOut'); if (!('serviceWorker' in navigator)) { out.textContent = 'This browser has no service worker support.'; return; }
    try {
      const reg = await navigator.serviceWorker.register('../kiosk-sw.js', { scope: '../' }); await navigator.serviceWorker.ready;
      const list = await (await fetch('precache.json', { cache: 'no-store' })).json();
      const files = [...list.shared, ...offered().flatMap((d) => list.demos[d.dir] || [])];   // shared files + only the demos on offer
      const ch = new MessageChannel(); ch.port1.onmessage = (e) => { const m = e.data; out.textContent = m.done ? `${m.ok} files saved for offline (${m.fail} failed) · ${Math.round(m.bytes / 1048576)} MB` : `Saving… ${m.n} / ${files.length}`; };
      (reg.active || navigator.serviceWorker.controller)?.postMessage({ t: 'precache', files }, [ch.port2]); out.textContent = `Saving… 0 / ${files.length}`;
    } catch (e) { out.textContent = `Offline save failed: ${e.message}`; }
  }
  $('#exitKiosk').addEventListener('click', () => { if (!confirm('Exit kiosk mode on this browser?')) return; send('stop'); K.exit();
    try { navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.active?.scriptURL.endsWith('kiosk-sw.js') && r.unregister())); caches?.delete('moheat-kiosk-v1'); } catch {} location.href = '../'; });

  // ---------------------------------------------------------------- route
  addEventListener('pagehide', () => send('stop'));
  const route = () => {
    const h = location.hash.slice(1); history.replaceState(null, '', location.pathname + location.search);
    if (h === 'card' && (K.visit.get() || {}).dir) { send('stop'); afterDemo(); }
    else if (h === 'staff') { reset(); askPin(); }
    else if (h === 'attract') reset(true);
    else reset();
  };
  window.MoHeatKioskApp = { go, reset, stoggle, signs, get view() { return view; }, get intro() { return intro; }, answer, closeCard, openStaff, dev };
  route(); applyStaff();
})();
