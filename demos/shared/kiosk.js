// MoHeatKiosk — exhibition (kiosk) mode (TASKS #54, user 2026-11-08; DEMO_DESIGN_GUIDE §7.4 "展示模式", staff guide docs/kiosk.md).
// One computer, visitor after visitor. This file is the shared core:
//   · storage (localStorage, every access in try / catch): flag 'moheat.kiosk' = '1', staff settings 'moheat.kiosk.cfg',
//     anonymous local stats 'moheat.kiosk.stats' (never sent anywhere), the current visit in sessionStorage 'moheat.kiosk.visit'.
//   · resetVisitor(): device stop, language back to the staff default, intensity back to the gentle start level (≤ cap),
//     mode back to INTERACTIVE (the default; pure is the option), thermal on, subtitles M, no reduced motion; the previous visitor's visit is dropped.
//   · stats: visitor(), started(dir, mode), finished(dir), card(dir, { stars, moment, comment }), table(), csv(), json().
// On a DEMO page (loaded by shared/nav.js only while kiosk mode is on, or with ?kiosk=1) it also:
//   · hides the demo switcher / page guide / site links, adds a big "End" button, auto-connects the authorised device,
//     caps the intensity slider, records started / finished + mode, collects the demo's thermal moments (chapter × #cmd),
//   · end of the demo (its own cover comes back) → the experience card (kiosk/#card); no input for idle s on the cover / paused
//     (3 × idle while an interactive story waits; never while a pure story plays) → reset → welcome; 5 taps top-left → staff panel.
// The kiosk app itself is kiosk/index.html (+ kiosk/app.js); this file is loaded there as a library.
(() => {
  if (window.MoHeatKiosk) return;
  const QS = new URLSearchParams(location.search);
  const LSg = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const LSs = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const SSg = (k, d) => { try { const v = sessionStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const SSs = (k, v) => { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const flag = () => { try { return localStorage.getItem('moheat.kiosk') === '1'; } catch { return false; } };
  if (QS.get('kiosk') === '1') { try { localStorage.setItem('moheat.kiosk', '1'); } catch {} }

  // ---------------------------------------------------------------- staff settings
  const DEF = { lang: 'en', cap: 80, start: 50, idle: 60, demos: null, pin: '0000', site: 'https://moheat-evo.github.io/', newsUrl: '', langs: ['en', 'ja', 'zh'], currency: 'auto', bands: {}, cut: 'full', hygiene: true, pickUrl: '',
    // queue screen (window 2): 'live' (attract + thermal view) | 'promo' (looping video + QR badge) | 'alt' (switch every altMin minutes)
    queue: true, maxDemos: 0, maxMin: 0,   // queue on = the visit ends after one demo (staff: long-press the tiny dot bottom-left or key Q)
    queueMode: 'promo', altMin: 3, promoSrc: '', promoSound: false, promoNow: true, qrSize: 'l', qrCorner: 'br' };
  // purchase-intent card: price bands per currency (staff can replace them in the panel; 'auto' = from the display language)
  const BANDS = { JPY: ['≤ ¥10,000', '¥10,000–20,000', '¥20,000–30,000', '¥30,000+'], USD: ['≤ $70', '$70–140', '$140–200', '$200+'],
    CNY: ['≤ ¥500', '¥500–1,000', '¥1,000–1,500', '¥1,500+'], EUR: ['≤ €65', '€65–130', '€130–190', '€190+'], KRW: ['≤ ₩100,000', '₩100,000–200,000', '₩200,000–300,000', '₩300,000+'] };
  // "where would you use it?" — fixed order, pick up to 2 (user 2026-11-08)
  const SCENES = [
    { id: 'asmr', en: 'ASMR · sleep & relaxing', ja: 'ASMR・睡眠・リラックス', zh: 'ASMR · 睡眠放松' },
    { id: 'romance', en: 'Romance · character voices', ja: '恋愛・キャラボイス', zh: '恋爱 · 角色语音' },
    { id: 'games', en: 'Games & VR', ja: 'ゲーム・VR', zh: '游戏 · VR' },
    { id: 'comfort', en: 'Comfort · family, pets', ja: '安心・家族・ペット', zh: '陪伴 · 家人宠物' },
    { id: 'brand', en: 'Brand & event experiences', ja: 'ブランド・イベント体験', zh: '品牌 · 活动体验' },
    { id: 'travel', en: 'Travel & sightseeing', ja: '旅行・観光', zh: '旅行 · 观光' },
    { id: 'focus', en: 'Focus · sleep aid', ja: '集中・睡眠サポート', zh: '专注 · 助眠' },
    { id: 'other', en: 'Other', ja: 'その他', zh: '其他' },
  ];
  const CUR_OF = { ja: 'JPY', zh: 'CNY', 'zh-Hant': 'CNY', ko: 'KRW', en: 'USD' };
  const currency = (lang) => { const c = { ...DEF, ...LSg('moheat.kiosk.cfg', {}) }; return c.currency && c.currency !== 'auto' ? c.currency : CUR_OF[lang] || 'USD'; };
  // bands are stored as an array; the staff field shows them with ' | ' between (a band can hold a comma: ¥10,000). Older builds split the
  // field on every comma ("≤ ¥10,000" → "≤ ¥10" + "000"): a piece that starts with three digits is glued back to the one before it
  const mendBands = (a) => a.reduce((o, x) => { x = String(x).trim(); if (!x) return o; if (o.length && /^\d{3}(\D|$)/.test(x)) o[o.length - 1] += `,${x}`; else o.push(x); return o; }, []);
  const splitBands = (text) => mendBands(String(text || '').includes('|') ? String(text).split('|') : String(text || '').split(/,(?!\d{3})/));
  // a saved list with a piece that starts with three digits was cut by that old split (and maybe also cut short to 6 pieces): it cannot be
  // trusted, so the default bands are used (and the staff field shows them, so the next save stores them)
  const broken = (a) => a.some((x) => /^\s*\d{3}(\D|$)/.test(String(x)));
  const bands = (cur) => { const c = { ...DEF, ...LSg('moheat.kiosk.cfg', {}) }, a = c.bands && c.bands[cur]; return (a?.length && !broken(a) ? mendBands(a) : BANDS[cur]) || BANDS.USD; };
  // warm and cool have their own cap + start (REQUIREMENTS §10); older settings with one cap / start fill both
  const cfg = () => { const c = { ...DEF, ...LSg('moheat.kiosk.cfg', {}) };
    c.capWarm ??= c.cap; c.capCool ??= c.cap; c.startWarm = Math.min(c.startWarm ?? c.start, c.capWarm); c.startCool = Math.min(c.startCool ?? c.start, c.capCool); return c; };
  // the visitor's two scales (0–1) from the intro, applied to every heat / cool value sent on the demo pages (the page's own intensity
  // slider stays a master on top); always within the staff caps
  const scales = () => { const c = cfg(); return { warm: Math.min(c.capWarm / 100, LSg('moheat.warmScale', c.startWarm / 100)), cool: Math.min(c.capCool / 100, LSg('moheat.coolScale', c.startCool / 100)) }; };
  const setScales = (o) => { const c = cfg(); if (o.warm != null) LSs('moheat.warmScale', Math.round(Math.min(c.capWarm / 100, o.warm) * 100) / 100); if (o.cool != null) LSs('moheat.coolScale', Math.round(Math.min(c.capCool / 100, o.cool) * 100) / 100); };
  // "LH120 RC60" / "DUAL LC.. LH.. RC.. RH.." → heat × warm, cool 35 + (n − 35) × cool (35 = the coolest-off threshold, 0 stays 0)
  const scaleLine = (line, s = scales()) => String(line).replace(/\b([LR])([HC])(\s*)(\d+)/g, (m, e, k, sp, n) => { n = +n; if (!n) return m;
    return `${e}${k}${sp}${k === 'H' ? Math.round(n * s.warm) : Math.max(35, Math.round(35 + (n - 35) * s.cool))}`; });
  const setCfg = (patch) => LSs('moheat.kiosk.cfg', { ...LSg('moheat.kiosk.cfg', {}), ...patch });

  // ---------------------------------------------------------------- local anonymous stats (per day)
  const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const SK = 'moheat.kiosk.stats';
  const load = () => { const s = LSg(SK, null); return s && s.days ? s : { v: 1, days: {} }; };
  const edit = (fn) => { const s = load(), d = s.days[day()] ||= { visitors: 0, plays: {}, cards: 0, skipped: 0, comments: [] }; fn(d); LSs(SK, s); };
  const play = (d, dir) => { const p = d.plays[dir] ||= { started: 0, finished: 0, pure: 0, interactive: 0, stars: 0, rated: 0, moments: {} }; p.buy ||= { yes: 0, maybe: 0, no: 0 }; p.price ||= {}; p.scenes ||= {}; return p; };
  const stats = {
    visitor: () => edit((d) => { d.visitors++; }),
    started: (dir, mode) => edit((d) => { const p = play(d, dir); p.started++; p[mode === 'interactive' ? 'interactive' : 'pure']++; }),
    finished: (dir) => edit((d) => { play(d, dir).finished++; }),
    card: (dir, r) => edit((d) => {
      if (!r || (!r.stars && !r.moment && !r.comment && !r.buy && !(r.scenes || []).length)) { d.skipped++; return; }
      d.cards++; const p = play(d, dir);
      if (r.buy) { p.buy[r.buy] = (p.buy[r.buy] || 0) + 1; }
      if (r.price && r.buy !== 'no') { p.price[r.price] = (p.price[r.price] || 0) + 1; d.cross ||= {}; const k = `${r.buy}|${r.price}`; d.cross[k] = (d.cross[k] || 0) + 1; }
      if (r.stars) { p.stars += r.stars; p.rated++; }
      for (const sc of (r.scenes || []).slice(0, 2)) { p.scenes[sc] = (p.scenes[sc] || 0) + 1; d.sceneBuy ||= {}; const k = `${sc}|${r.buy || 'unanswered'}`; d.sceneBuy[k] = (d.sceneBuy[k] || 0) + 1; }
      if (r.moment) p.moments[r.moment] = (p.moments[r.moment] || 0) + 1;
      if (r.comment) { d.comments.push({ t: new Date().toISOString().slice(11, 16), dir, stars: r.stars || null, text: String(r.comment).slice(0, 120) }); if (d.comments.length > 500) d.comments.shift(); }
    }),
    // the visitor's auto-calibration (personal max, 0–1 of the full device scale; 'tap' or 'cap' = nobody tapped before the staff cap)
    calib: (r) => edit((d) => { if (r?.maxWarm == null && r?.maxCool == null && !r?.natural?.warm && !r?.natural?.cool) return; (d.calib ||= []).push({ w: r.maxWarm ?? null, c: r.maxCool ?? null, hw: r.hit?.warm || null, hc: r.hit?.cool || null, nw: r.natural?.warm || null, nc: r.natural?.cool || null });
      if (d.calib.length > 3000) d.calib.shift(); }),
    // rows per demo: { dir, started, finished, pure, interactive, avg, rated, top } for today ('today') or all days ('all')
    table(which = 'today') {
      const s = load(), days = which === 'all' ? Object.values(s.days) : [s.days[which === 'today' ? day() : which]].filter(Boolean), m = {};
      let visitors = 0, cards = 0, skipped = 0; const buy = { yes: 0, maybe: 0, no: 0 }, cross = {}, scenes = {}, sceneBuy = {};
      for (const d of days) { visitors += d.visitors; cards += d.cards; skipped += d.skipped;
        for (const [k, n] of Object.entries(d.cross || {})) cross[k] = (cross[k] || 0) + n;
        for (const [k, n] of Object.entries(d.sceneBuy || {})) sceneBuy[k] = (sceneBuy[k] || 0) + n;
        for (const [dir, p] of Object.entries(d.plays)) { const r = m[dir] ||= { dir, started: 0, finished: 0, pure: 0, interactive: 0, stars: 0, rated: 0, moments: {}, buy: { yes: 0, maybe: 0, no: 0 }, price: {}, scenes: {} };
          for (const k of ['started', 'finished', 'pure', 'interactive', 'stars', 'rated']) r[k] += p[k];
          for (const [k, n] of Object.entries(p.buy || {})) { r.buy[k] += n; buy[k] += n; }
          for (const [k, n] of Object.entries(p.price || {})) r.price[k] = (r.price[k] || 0) + n;
          for (const [k, n] of Object.entries(p.scenes || {})) { r.scenes[k] = (r.scenes[k] || 0) + n; scenes[k] = (scenes[k] || 0) + n; }
          for (const [k, n] of Object.entries(p.moments)) r.moments[k] = (r.moments[k] || 0) + n; } }
      const rows = Object.values(m).map((r) => ({ ...r, avg: r.rated ? Math.round(r.stars / r.rated * 10) / 10 : null,
        top: Object.entries(r.moments).sort((a, b) => b[1] - a[1])[0]?.[0] || '' })).sort((a, b) => b.started - a.started || b.finished - a.finished);
      const cal = days.flatMap((d) => d.calib || []), avg = (k) => { const v = cal.map((x) => x[k]).filter((x) => x != null); return v.length ? Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length) / 100 : null; };
      const calib = { n: cal.length, warm: avg('w'), cool: avg('c'), warmCapHits: cal.filter((x) => x.hw === 'cap').length, coolCapHits: cal.filter((x) => x.hc === 'cap').length,
        natural: Object.fromEntries(['nw', 'nc'].map((k) => [k === 'nw' ? 'warm' : 'cool', Object.fromEntries(['weak', 'ok', 'strong'].map((a) => [a, cal.filter((x) => x[k] === a).length]))])) };
      return { visitors, cards, skipped, rows, buy, cross, scenes, sceneBuy, calib };
    },
    json: () => JSON.stringify({ exported: new Date().toISOString(), note: 'MoHeat Evo kiosk · anonymous local counts (this browser only)', ...load() }, null, 1),
    csv() {
      const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
      const fmt = (o) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}: ${n}`).join('; ');
      const out = [['date', 'visitors_that_day', 'demo', 'started', 'finished', 'pure', 'interactive', 'ratings', 'avg_rating', 'top_moment', 'buy_yes', 'buy_maybe', 'buy_no', 'price_bands', 'scenes', 'cards_that_day', 'skipped_cards_that_day'].join(',')];
      const days = Object.entries(load().days).sort();
      for (const [date, d] of days) {
        const ps = Object.entries(d.plays); if (!ps.length) out.push([date, d.visitors, '', 0, 0, 0, 0, 0, '', '', 0, 0, 0, '', '', d.cards, d.skipped].map(q).join(','));
        for (const [dir, p] of ps) out.push([date, d.visitors, dir, p.started, p.finished, p.pure, p.interactive, p.rated, p.rated ? (p.stars / p.rated).toFixed(2) : '',
          Object.entries(p.moments).sort((a, b) => b[1] - a[1])[0]?.[0] || '', p.buy?.yes || 0, p.buy?.maybe || 0, p.buy?.no || 0, fmt(p.price), fmt(p.scenes), d.cards, d.skipped].map(q).join(','));
      }
      out.push('', 'purchase intent x price band (all days)', 'date,intent,price_band,count');
      for (const [date, d] of days) for (const [k, n] of Object.entries(d.cross || {})) { const [b, pr] = k.split('|'); out.push([date, b, pr, n].map(q).join(',')); }
      out.push('', 'auto-calibration: personal max per visitor (0-1 of the full device scale; cap = no tap before the staff cap)', 'date,max_warm,max_cool,warm_stop,cool_stop,warm_sample_feel,cool_sample_feel');
      for (const [date, d] of days) for (const c of d.calib || []) out.push([date, c.w ?? '', c.c ?? '', c.hw ?? '', c.hc ?? '', c.nw ?? '', c.nc ?? ''].map(q).join(','));
      out.push('', 'scene x purchase intent (all days)', 'date,scene,intent,count');
      for (const [date, d] of days) for (const [k, n] of Object.entries(d.sceneBuy || {})) { const [sc, b] = k.split('|'); out.push([date, sc, b, n].map(q).join(',')); }
      return out.join('\n') + '\n';
    },
    commentsCsv() {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`, out = ['date,time,demo,stars,comment'];
      for (const [date, d] of Object.entries(load().days).sort()) for (const c of d.comments) out.push([date, c.t, c.dir, c.stars ?? '', c.text].map(q).join(','));
      return out.join('\n') + '\n';
    },
    clear: () => LSs(SK, { v: 1, days: {} }),
  };

  // ---------------------------------------------------------------- per-visitor reset
  const stopDevice = () => { try { window.MoHeatDevice?.current?.send('stop'); } catch {} };
  // mode: interactive is the default (user 2026-11-08; pure = the option, taps always work)
  function resetVisitor() {
    const c = cfg(); stopDevice();
    try { localStorage.removeItem('moheat.warmOnly'); } catch {}   // "warm only (no mist)" is one visitor's choice
    LSs('moheat.mode', 'interactive'); LSs('moheat.heat', true); LSs('moheat.intensity', 100); LSs('moheat.warmScale', c.startWarm / 100); LSs('moheat.coolScale', c.startCool / 100); LSs('moheat.subs', 'm'); LSs('moheat.reduce', false);
    LSs('moheat.volume', .2);   // 0–1, the same scale as shell.js — each visitor starts at 20 % (user 2026-11-15)
    try { localStorage.setItem('moheat.guide', 'done'); } catch {}   // the kiosk intro replaces the page tour
    SSs('moheat.kiosk.visit', null); SSs('moheat.kiosk.level', null);
    try { if (c.lang && c.lang !== 'en') sessionStorage.setItem('moheat.sublang', c.lang); else sessionStorage.removeItem('moheat.sublang'); sessionStorage.removeItem('moheat.voicelang'); } catch {}   // the voice language is per visitor too
  }
  function enter() { try { if (localStorage.getItem('moheat.kiosk') !== '1') { LSs('moheat.kiosk.guidePrev', localStorage.getItem('moheat.guide')); localStorage.setItem('moheat.kiosk', '1'); } } catch {} }
  function exit() {
    stopDevice();
    try { const g = LSg('moheat.kiosk.guidePrev', null); if (g) localStorage.setItem('moheat.guide', g); else localStorage.removeItem('moheat.guide');
      localStorage.removeItem('moheat.kiosk'); localStorage.removeItem('moheat.kiosk.guidePrev'); } catch {}
  }
  const visit = { get: () => SSg('moheat.kiosk.visit', null), set: (v) => SSs('moheat.kiosk.visit', v), patch: (p) => SSs('moheat.kiosk.visit', { ...(SSg('moheat.kiosk.visit', {}) || {}), ...p }) };
  // ---------------------------------------------------------------- the offered list, numbers, top 3, the queue pick link (one place)
  // numbers = position in the staff's offered list; the phone page gets the list as demo numbers (?o=28.1.2…), stable across nav.js re-sorts
  const dnum = (d) => +((d.dir.match(/^Demo(\d+)/) || [])[1] || 0);
  const offered = (DEMOS) => { const c = cfg(); return DEMOS.filter((d) => !c.demos || c.demos.includes(d.dir)); };
  const num = (DEMOS, d) => offered(DEMOS).indexOf(d) + 1;
  // "try these first": staff-featured, then the thermal-use score (tools/qa/thermal_score.py → nav.js HEAT), then list order
  const top3 = (DEMOS) => { const H = window.MoHeatOrder?.HEAT || {}, o = offered(DEMOS);
    return [...o.filter((d) => d.featured), ...o.filter((d) => !d.featured).sort((a, b) => (H[b.dir] || 0) - (H[a.dir] || 0))].slice(0, 3); };
  const pickUrl = (DEMOS) => { const c = cfg(), base = (c.site || DEF.site).replace(/\/?$/, '/');
    return `${c.pickUrl || `${base}kiosk/pick.html`}?o=${offered(DEMOS).map(dnum).join('.')}&top=${top3(DEMOS).map(dnum).join('.')}`; };
  // ---------------------------------------------------------------- window 1 ↔ window 2 (queue screen), same computer: BroadcastChannel
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('moheat-kiosk') : null;
  let queueSeen = 0; bc?.addEventListener('message', (e) => { if (e.data?.t === 'hello') queueSeen = Date.now(); });
  const post = (m) => { try { bc?.postMessage(m); } catch {} };
  const thermalOf = (s) => { const th = { l: { h: 0, c: 0 }, r: { h: 0, c: 0 } };   // device text → 0–1 per ear (heat 0–200, cool 35–80)
    for (const m of String(s).matchAll(/\b([LR])([HC])\s*(\d+)/g)) { const n = +m[3], e = th[m[1].toLowerCase()]; if (m[2] === 'H') e.h = Math.min(1, n / 200); else e.c = n ? Math.max(0, Math.min(1, (n - 35) / 45)) : 0; } return th; };
  // a local file the staff picked (promo video) → IndexedDB 'moheat-kiosk' / store 'files' (this machine only)
  const idb = { open: () => new Promise((res, rej) => { const r = indexedDB.open('moheat-kiosk', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }),
    async put(k, v) { const db = await idb.open(); return new Promise((res, rej) => { const t = db.transaction('files', 'readwrite'); t.objectStore('files').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
    async get(k) { try { const db = await idb.open(); return await new Promise((res) => { const r = db.transaction('files').objectStore('files').get(k); r.onsuccess = () => res(r.result || null); r.onerror = () => res(null); }); } catch { return null; } } };
  // ================================================================ cooling-mist refill reminder (user 2026-11-11): after every N visitor
  // experiences (a demo played and back on the start page; N = cfg.mistEvery, default 3, staff panel − / +) a quiet staff card top left,
  // under the staff button: "check / refill the mist liquid" + a big 補充しました button that resets the count. Persists across reloads.
  const MIST_K = 'moheat.kiosk.mist', MTX = {
    ja: { t: (n) => `冷却ミストの液を確認・補充してください（${n} 名体験ごと）`, b: '補充しました' }, en: { t: (n) => `Please check / refill the cooling-mist liquid (every ${n} visitors)`, b: 'Done' },
    zh: { t: (n) => `请检查并补充冷却雾的液体（每 ${n} 位体验后）`, b: '已补充' }, ko: { t: (n) => `냉각 미스트 액을 확인·보충해 주세요 (${n}명 체험마다)`, b: '보충했어요' } };
  const mistGet = () => { try { return JSON.parse(localStorage.getItem(MIST_K)) || { n: 0, due: false }; } catch { return { n: 0, due: false }; } };
  const mistSet = (v) => { try { localStorage.setItem(MIST_K, JSON.stringify(v)); } catch {} mistPaint(); };
  const mistEvery = () => Math.max(1, Math.min(20, Math.round(+cfg().mistEvery || 3)));
  // + the headphone wipe (user 2026-11-11, needs cfg.hygiene, on by default): after every visitor who played a demo, before the next one —
  // a SOFT gate: Start still works, the card stays until staff tap Done. When both are due, one card lists both and one Done clears both.
  const WIPE_K = 'moheat.kiosk.wipe', WTX = { ja: '次の方の前に、アルコール綿でヘッドホン（イヤーパッド・バンド）を拭いてください', en: 'Before the next visitor, wipe the headphones (ear pads and band) with an alcohol wipe',
    zh: '下一位体验前，请用酒精棉擦拭耳机（耳垫和头梁）', ko: '다음 분 전에 알코올 솜으로 헤드폰(이어패드·밴드)을 닦아 주세요' }, WB = { ja: '拭きました', en: 'Done', zh: '已擦拭', ko: '닦았어요' }, BOTH = { ja: 'どちらも済みました', en: 'Both done', zh: '都完成了', ko: '둘 다 했어요' };
  const wipeDue = () => { try { return !!cfg().hygiene && localStorage.getItem(WIPE_K) === '1'; } catch { return false; } };
  const wipeSet = (on) => { try { on ? localStorage.setItem(WIPE_K, '1') : localStorage.removeItem(WIPE_K); } catch {} mistPaint(); };
  // cool test after a refill (user 2026-11-15): after 補充しました — and from the open / resume checklists (MoHeatKiosk.coolTest()) — the
  // staff wear the headset and run a short cool pulse, left then right (~3 s each, at the staff's own cool cap). Not cool → turn the cotton
  // wick a little and test again; two misses → offer the cooling-fault mode (cfg.coolFault: warm only for every visitor).
  const CT = {
    ja: { h: 'ヘッドホンをつけて、冷たさをテスト', go: '冷たさテスト ▶', run: '左 → 右 の順に、約 3 秒ずつ冷たくなります…', q: '冷たさを感じましたか？', ok: '冷たかった', ng: '冷たくない',
      hint: '綿棒を少し回して角度を変えてから、もう一度テストしてください。', again: 'もう一度テスト ▶', fault: '2 回とも冷たくなければ、冷却故障モードにしてください（温かさだけで体験を続けられます）。',
      faultGo: '冷却故障モードにする', later: 'あとで', nodev: 'ヘッドセットが未接続です。接続してからテストしてください。', set: '冷却故障モードにしました' },
    en: { h: 'Put on the headset and test the cooling', go: 'Test cooling ▶', run: 'Left, then right — about 3 s each…', q: 'Did you feel it cool?', ok: 'Yes, cool', ng: 'Not cool',
      hint: 'Turn the cotton wick a little to change its angle, then test again.', again: 'Test again ▶', fault: 'Still not cool after two tries? Switch on the cooling-fault mode (visitors carry on with warmth only).',
      faultGo: 'Cooling-fault mode on', later: 'Later', nodev: 'The headset is not connected. Connect it, then test.', set: 'Cooling-fault mode is on' },
    zh: { h: '戴上耳机，测试一下凉感', go: '测试凉感 ▶', run: '先左后右，各约 3 秒……', q: '感觉到凉了吗？', ok: '凉了', ng: '不凉',
      hint: '把棉棒稍微转一下、换个角度，再测一次。', again: '再测一次 ▶', fault: '两次都不凉的话，请打开冷却故障模式（访客可以只用温热继续体验）。',
      faultGo: '打开冷却故障模式', later: '稍后', nodev: '头戴设备未连接。请连接后再测试。', set: '已打开冷却故障模式' },
    ko: { h: '헤드폰을 쓰고 시원함을 테스트해 주세요', go: '시원함 테스트 ▶', run: '왼쪽, 그다음 오른쪽 — 각각 약 3초…', q: '시원함이 느껴졌나요?', ok: '시원했어요', ng: '안 시원해요',
      hint: '면봉을 조금 돌려 각도를 바꾼 뒤 다시 테스트해 주세요.', again: '다시 테스트 ▶', fault: '두 번 다 시원하지 않으면 냉각 고장 모드를 켜 주세요 (따뜻함만으로 체험을 이어 갈 수 있어요).',
      faultGo: '냉각 고장 모드 켜기', later: '나중에', nodev: '헤드셋이 연결되지 않았어요. 연결한 뒤 테스트해 주세요.', set: '냉각 고장 모드를 켰어요' } };
  let ct = null;   // { phase: 'start' | 'run' | 'ask' | 'hint' | 'fault' | 'nodev' | 'set', fails, timers }
  const coolTest = () => { ct = { phase: 'start', fails: 0, timers: [] }; mistPaint(); };
  const ctEnd = () => { if (ct) ct.timers.forEach(clearTimeout); ct = null; mistPaint(); };
  function ctRun() {
    const dev = window.MoHeatDevice?.current; if (!dev || !dev.isConnected?.()) { ct.phase = 'nodev'; return mistPaint(); }
    const k = Math.max(.2, Math.min(1, (+cfg().capCool || 100) / 100)), pwm = Math.round(35 + 45 * k), send = (l) => { try { dev.send(l); } catch {} };
    ct.phase = 'run'; mistPaint(); send(`LC${pwm} RH0`);
    ct.timers.push(setTimeout(() => send(`LH0 RC${pwm}`), 3000), setTimeout(() => { send('stop'); if (ct) { ct.phase = 'ask'; mistPaint(); } }, 6000));
  }
  let mistEl = null;
  function mistPaint() {
    if (!document.body) return; const m = mistGet(), w = wipeDue();
    if (!m.due && !w && !ct) { if (mistEl) mistEl.hidden = true; return; }
    if (!mistEl) { const st = document.createElement('style'); st.textContent = `
      .mk-mist { position: fixed; z-index: 2147482998; left: 10px; top: 86px; width: min(400px, 80vw); padding: 14px 16px; border-radius: 20px; border: 1px solid rgba(255,255,255,.22); background: rgba(24,20,30,.82);
        -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); color: #f4efe6; font: 600 17px/1.4 Inter, "Noto Sans JP", "PingFang SC", "Apple SD Gothic Neo", sans-serif; box-shadow: 0 8px 28px rgba(0,0,0,.4); }
      .mk-mist[hidden] { display: none; } .mk-mist p { margin: 0 0 4px; } .mk-mist p + p { margin-top: 10px; } .mk-mist small { display: block; margin-bottom: 4px; opacity: .65; font-size: 13px; font-weight: 500; }
      .mk-mist button { width: 100%; min-height: 64px; margin-top: 8px; border-radius: 999px; border: 0; background: #f4efe6; color: #161214; font: 700 20px/1 Inter, "Noto Sans JP", "PingFang SC", sans-serif; cursor: pointer; touch-action: manipulation; }
      .mk-mist .mk-row { display: flex; gap: 8px; } .mk-mist .mk-row button { flex: 1; } .mk-mist button.alt { background: transparent; color: #f4efe6; border: 1.5px solid rgba(244,239,230,.6); }`;
      document.head.appendChild(st); mistEl = document.createElement('div'); mistEl.className = 'mk-mist'; mistEl.setAttribute('role', 'status'); document.body.appendChild(mistEl);
      mistEl.addEventListener('click', (e) => { e.stopPropagation(); const btn = e.target.closest('button'); if (!btn) return; const act = btn.dataset.a;
        if (act === 'go') return ctRun();
        if (act === 'ok' || act === 'later') return ctEnd();
        if (act === 'ng') { ct.fails++; ct.phase = ct.fails >= 2 ? 'fault' : 'hint'; return mistPaint(); }
        if (act === 'fault') { setCfg({ coolFault: true }); ct.phase = 'set'; mistPaint(); ct.timers.push(setTimeout(ctEnd, 2500)); return; }
        const refilled = mistGet().due; if (refilled) mistSet({ n: 0, due: false }); wipeSet(false); if (refilled) coolTest(); }); }
    let l = 'ja'; try { l = localStorage.getItem('moheat.staff.lang') || 'ja'; } catch {} if (!MTX[l]) l = 'ja';
    if (ct) { const T = CT[l] || CT.ja, E = CT.en, sub = (k) => (l !== 'en' ? `<small>${E[k]}</small>` : ''), btn = (a, k, alt) => `<button type="button" data-a="${a}"${alt ? ' class="alt"' : ''}>${T[k]}</button>`;
      const body = { start: `<p>${T.h}</p>${sub('h')}${btn('go', 'go')}`, run: `<p>${T.run}</p>${sub('run')}`, ask: `<p>${T.q}</p>${sub('q')}<div class="mk-row">${btn('ok', 'ok')}${btn('ng', 'ng', 1)}</div>`,
        hint: `<p>${T.hint}</p>${sub('hint')}${btn('go', 'again')}`, fault: `<p>${T.fault}</p>${sub('fault')}<div class="mk-row">${btn('fault', 'faultGo')}${btn('later', 'later', 1)}</div>`,
        nodev: `<p>${T.nodev}</p>${sub('nodev')}<div class="mk-row">${btn('go', 'go')}${btn('later', 'later', 1)}</div>`, set: `<p>${T.set}</p>` }[ct.phase];
      mistEl.innerHTML = body; mistEl.dataset.items = 'cooltest ' + ct.phase; mistEl.hidden = false; return; }
    const n = mistEvery(), en = l !== 'en', items = [...(w ? [[WTX[l], WTX.en]] : []), ...(m.due ? [[MTX[l].t(n), MTX.en.t(n)]] : [])];
    mistEl.innerHTML = items.map(([a, b]) => `<p>${a}</p>${en ? `<small>${b}</small>` : ''}`).join('') + `<button type="button" class="mk-mist-ok">${items.length > 1 ? BOTH[l] : w ? WB[l] : MTX[l].b}</button>`;
    mistEl.dataset.items = (w ? 'wipe ' : '') + (m.due ? 'mist' : ''); mistEl.hidden = false;
  }
  const mistCount = () => { const m = mistGet(); m.n = (m.n || 0) + 1; if (m.n >= mistEvery()) m.due = true; mistSet(m); };
  addEventListener('storage', (e) => { if (e.key === MIST_K || e.key === WIPE_K || e.key === 'moheat.kiosk.cfg') mistPaint(); });
  // ================================================================ always-there controls (exhibition, user 2026-11-11): ■ STOP + staff button
  // ■ STOP (top right, red, ≥ 64 px, visitors may use it): on PRESS (pointerdown — no waiting for the click) every warm / cool output goes off
  // and the demo pauses; the same function as the demo's own ■ STOP (whose bar button is hidden in kiosk mode, so there is one STOP only).
  // After a stop on a demo page it reads "↺ 再開" (re-arm, the demo's own behaviour); taps in the first 1.5 s after a stop never re-arm.
  // Staff (top left, small, low contrast, a drawn gear — no emoji in the kiosk texts, check_symbols.py): press and HOLD 1.5 s (a ring fills) → password keypad → staff screen. 5 quick taps still work.
  //   controls({ stop(), rearm?(), tripped?(), staff(), lang() })   — kiosk/app.js (start · guide · card · standby · break) and the demo pages below.
  const CTX = { stop: { ja: '停止', en: 'Stop', zh: '停止', ko: '정지' }, stopped: { ja: '温冷を止めました', en: 'Warm & cool stopped', zh: '冷热已停止', ko: '온냉을 멈췄어요' },
    rearm: { ja: '温冷を再開', en: 'Resume warm & cool', zh: '恢复冷热', ko: '온냉 다시 켜기' }, staff: { ja: 'スタッフ', en: 'Staff', zh: '工作人员', ko: '스태프' } };
  function controls(o) {
    if (document.querySelector('.mk-stop')) return;
    const st = document.createElement('style'); st.textContent = `
    .mk-stop { position: fixed; z-index: 2147483000; right: 14px; top: 14px; min-width: 120px; min-height: 64px; padding: 6px 18px; border-radius: 18px; border: 2px solid rgba(255,255,255,.7); background: #d92c2c; color: #fff;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-shadow: 0 6px 24px rgba(0,0,0,.45); cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
      font-family: Inter, "Noto Sans JP", "PingFang SC", "Apple SD Gothic Neo", sans-serif; }
    .mk-stop b { font: 800 22px/1 Inter, "Noto Sans JP", "PingFang SC", "Apple SD Gothic Neo", sans-serif; letter-spacing: .04em; } .mk-stop small { font: 700 14px/1 Inter, "Noto Sans JP", "PingFang SC", "Apple SD Gothic Neo", sans-serif; opacity: .9; }
    .mk-stop:active, .mk-stop.hit { background: #ff3b3b; transform: scale(.97); }
    .mk-stop.armed { background: #3a2a2e; border-color: #ff7a7a; } .mk-stop.armed b { font-size: 18px; }
    .mk-stop-note { position: fixed; z-index: 2147483000; right: 14px; top: 86px; padding: 10px 16px; border-radius: 14px; background: rgba(20,12,24,.92); color: #fff; font: 700 17px/1.2 Inter, "Noto Sans JP", sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.45); }
    .mk-stop-note[hidden] { display: none; }
    .mk-staff { position: fixed; z-index: 2147482999; left: 10px; top: 10px; width: 64px; height: 64px; border-radius: 50%; border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.05); color: rgba(255,255,255,.38);
      display: grid; place-items: center; padding: 0; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
      font: 600 11px/1.1 Inter, "Noto Sans JP", sans-serif; --p: 0; }
    .mk-staff::before { content: ""; position: absolute; inset: -3px; border-radius: 50%; background: conic-gradient(rgba(255,255,255,.85) calc(var(--p) * 1turn), transparent 0); -webkit-mask: radial-gradient(circle, transparent 29px, #000 30px); mask: radial-gradient(circle, transparent 29px, #000 30px); }
    .mk-staff i { font-style: normal; display: flex; justify-content: center; line-height: 0; } .mk-staff span { display: block; text-align: center; margin-top: 2px; }
    .mk-staff.holding { color: rgba(255,255,255,.85); background: rgba(255,255,255,.12); }
    .estop { display: none !important; }
    header.bar { padding-right: 150px !important; }   /* the demo's top bar keeps its own items clear of ■ STOP */
    .panel.staff > header { padding-right: 150px; }`;
    document.head.appendChild(st);
    const L = () => { const l = o.lang?.() || 'ja'; return CTX.stop[l] ? l : 'ja'; }, t = (k) => CTX[k][L()];
    const s = document.createElement('button'); s.type = 'button'; s.className = 'mk-stop'; s.setAttribute('aria-label', 'STOP');
    const note = document.createElement('div'); note.className = 'mk-stop-note'; note.hidden = true; note.setAttribute('role', 'status');
    let at = 0, noteT = 0;
    const paint = () => { const armed = !!o.tripped?.() && Date.now() - at > 1500; s.classList.toggle('armed', armed); s.innerHTML = armed ? `<b>↺</b><small>${t('rearm')}</small>` : `<b>■ STOP</b><small>${t('stop')}</small>`; };
    const press = () => { const armed = s.classList.contains('armed');
      if (armed && Date.now() - at > 1500) { o.rearm?.(); paint(); return; }
      at = Date.now(); o.stop(); s.classList.add('hit'); setTimeout(() => s.classList.remove('hit'), 180);
      note.textContent = t('stopped'); note.hidden = false; clearTimeout(noteT); noteT = setTimeout(() => { note.hidden = true; paint(); }, 2500); paint(); };
    let viaPointer = 0;
    s.addEventListener('pointerdown', (e) => { if (e.button > 0) return; viaPointer = Date.now(); e.preventDefault(); press(); });
    s.addEventListener('click', (e) => { e.stopPropagation(); if (Date.now() - viaPointer > 800) press(); });   // keyboard / assistive tech: no pointerdown
    const f = document.createElement('button'); f.type = 'button'; f.className = 'mk-staff'; f.setAttribute('aria-label', 'Staff');
    const lab = () => { f.innerHTML = `<i><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/></svg></i><span>${t('staff')}</span>`; paint(); };
    let raf = 0, t0 = 0, taps = [];
    const stopHold = () => { cancelAnimationFrame(raf); raf = 0; f.classList.remove('holding'); f.style.setProperty('--p', 0); };
    f.addEventListener('pointerdown', (e) => { e.preventDefault(); try { f.setPointerCapture(e.pointerId); } catch {} t0 = performance.now(); f.classList.add('holding');
      const step = () => { const p = Math.min(1, (performance.now() - t0) / 1500); f.style.setProperty('--p', p); if (p >= 1) { stopHold(); o.staff(); return; } raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) f.addEventListener(ev, () => { if (raf) stopHold(); });
    f.addEventListener('click', (e) => { e.stopPropagation(); const n = Date.now(); taps = taps.filter((x) => n - x < 3000).concat(n); if (taps.length >= 5) { taps = []; o.staff(); } });   // backup: 5 quick taps
    f.addEventListener('contextmenu', (e) => e.preventDefault()); s.addEventListener('contextmenu', (e) => e.preventDefault());
    lab(); addEventListener('moheat:sublang', lab); setInterval(paint, 1000);
    document.body.append(s, note, f);
    mistPaint();
    // the demo's ⚙ panel (UI v2) gets the visitor's "warm only (no mist)" switch while the kiosk runs (device.js zeroes every cool value)
    const WOL = { ja: 'あたたかさだけ（ミストなし）', en: 'Warm only (no mist)', zh: '只要温热（不喷雾）', ko: '따뜻함만 (미스트 없음)' }, OO = { ja: ['オン', 'オフ'], en: ['On', 'Off'], zh: ['开', '关'], ko: ['켜기', '끄기'] };
    const woOn = () => { try { return localStorage.getItem('moheat.warmOnly') === '1'; } catch { return false; } };
    const woRow = () => { const set = document.querySelector('.u2-set'); if (!set || set.querySelector('.mk-wo')) return; const l = (o.lang?.() || 'ja'), k = WOL[l] ? l : 'ja';
      const r = document.createElement('div'); r.className = 'u2-line mk-wo'; r.innerHTML = `<span>${WOL[k]}</span><button type="button" class="u2-btn2" aria-pressed="${woOn()}">${OO[k][woOn() ? 0 : 1]}</button>`;
      r.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); const on = !woOn(); try { on ? localStorage.setItem('moheat.warmOnly', '1') : localStorage.removeItem('moheat.warmOnly'); } catch {} if (on) stopDevice(); const b = e.currentTarget; b.setAttribute('aria-pressed', on); b.textContent = OO[k][on ? 0 : 1]; });
      set.prepend(r); };
    new MutationObserver(woRow).observe(document.body, { childList: true, subtree: true });
  }
  const K = window.MoHeatKiosk = { controls, mistCount, mistPaint, mistEvery, coolTest, wipeSet, idb, currency, bands, splitBands, BANDS, SCENES, on: flag, cfg, setCfg, stats, resetVisitor, enter, exit, visit, day, DEF, stopDevice,
    offered, num, top3, pickUrl, dnum, post, thermalOf, scales, setScales, scaleLine, get queueOn() { return Date.now() - queueSeen < 6000; } };

  // ================================================================ demo pages (kiosk mode on)
  const kioskApp = /\/kiosk\/(index\.html)?$/.test(location.pathname) || document.documentElement.dataset.kioskApp != null;
  if (kioskApp || !flag() || ['cover', 'render', 'embed', 'auto'].some((k) => QS.has(k))) return;
  const ROOT = (() => { const m = location.pathname.match(/^(.*\/)demos\/[^/]+\/[^/]+\//); return m ? m[1] : '/'; })();
  const HOME = `${ROOT}kiosk/`;
  // real time: shell.js freezes Date.now / setTimeout while paused (and speeds them up while seeking) — idle reset must not freeze
  const RN = () => +new Date();
  const RT = (() => { try { const f = document.createElement('iframe'); f.hidden = true; f.setAttribute('aria-hidden', 'true'); document.documentElement.appendChild(f); const w = f.contentWindow;
    return { st: w.setTimeout.bind(w), si: w.setInterval.bind(w) }; } catch { return { st: setTimeout, si: setInterval }; } })();
  try { localStorage.setItem('moheat.guide', 'done'); } catch {}
  const dir = (location.pathname.match(/\/demos\/[^/]+\/([^/]+)\//) || [])[1] || '';
  const c = cfg();
  const L = () => window.MoHeatSub?.lang || (() => { try { return sessionStorage.getItem('moheat.sublang'); } catch { return null; } })() || 'en';
  const TX = { end: { en: 'End', ja: '終わる', zh: '结束' }, vol: { en: 'Volume', ja: '音量', zh: '音量' },
    lost: { en: 'MoHeat Evo disconnected', ja: 'MoHeat Evo の接続が切れました', zh: 'MoHeat Evo 已断开' }, lostS: { en: 'Please ask the staff — the story keeps playing.', ja: 'スタッフにお声がけください（物語はそのまま続きます）。', zh: '请联系工作人员（故事会继续播放）。' },
    rest: { en: 'A short thermal pause for comfort', ja: '快適さのため、温冷を少しお休み', zh: '为了舒适，冷热短暂休息' },
    cut: { en: 'Highlights', ja: 'ハイライト', zh: '精华' } };
  // ---------------------------------------------------------------- volume for the whole page (media elements + Web Audio): installed
  // before the demo builds its audio graph (graphs are built on Start), every connection to the speakers goes through one gain per context
  // 'moheat.volume' is shared with shell.js: 0–1 (older kiosk builds wrote 0–100)
  const vol0 = +LSg('moheat.volume', .2) || 0; let vol = Math.max(0, Math.min(1, vol0 > 1 ? vol0 / 100 : vol0));
  const vgains = new Map();
  // MoHeatShell.setVolume = the shell applies the level (no second gain stage here). The big slider stays until UI v2's control bar is really on
  // the page (.u2 volume control): having the API does not mean the visitor has a control (REQUIREMENTS §3)
  const SHELL_VOL = () => typeof window.MoHeatShell?.setVolume === 'function';
  if (window.AudioNode && !SHELL_VOL()) {
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (dst, ...a) {
      if (dst instanceof AudioDestinationNode && !this.__mkVol) { let g = vgains.get(dst.context); if (!g) { g = dst.context.createGain(); g.__mkVol = true; g.gain.value = vol; connect.call(g, dst); vgains.set(dst.context, g); } return connect.call(this, g, ...a); }
      return connect.call(this, dst, ...a);
    };
  }
  const setVol = (v) => { vol = v; if (SHELL_VOL()) { try { window.MoHeatShell.setVolume(v); } catch {} LSs('moheat.volume', Math.round(v * 100) / 100); return; } LSs('moheat.volume', Math.round(v * 100) / 100); vgains.forEach((g) => { try { g.gain.value = v; } catch {} });
    document.querySelectorAll('audio, video').forEach((m) => { try { m.volume = v; } catch {} }); };
  setInterval(() => document.querySelectorAll('audio, video').forEach((m) => { if (Math.abs(m.volume - vol) > .01) try { m.volume = vol; } catch {} }), 1000);
  const tx = (o) => o[L()] || o.en;

  const css = document.createElement('style');
  css.textContent = `.dnav, .dn-panel, .mg-help, .mg-veil, .mg-hole, .mg-tip { display: none !important; }
  header.bar a.brand, #credits a, .dn-foot a { pointer-events: none; }
  .mk-vol { position: fixed; z-index: 9990; right: 14px; bottom: 14px; display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 12px; min-height: 56px; border-radius: 999px;
    background: rgba(20,12,24,.9); border: 2px solid rgba(255,255,255,.45); color: #fff; font: 700 16px/1 Inter, "Noto Sans JP", "PingFang SC", sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.45); }
  .mk-vol[hidden] { display: none; } .mk-vol span { font-size: 24px; } .mk-vol input { width: clamp(120px, 14vw, 220px); height: 44px; accent-color: #ffd58a; cursor: pointer; }
  .mk-end { position: fixed; z-index: 9990; right: 14px; bottom: 82px; min-height: 52px; min-width: 52px; padding: 0 20px; border-radius: 999px; border: 2px solid rgba(255,255,255,.5);
    background: rgba(20,12,24,.85); color: #fff; font: 700 17px/1 Inter, "Noto Sans JP", "PingFang SC", sans-serif; cursor: pointer; box-shadow: 0 6px 24px rgba(0,0,0,.45); }
  /* End + Volume sit in the middle of the top bar (empty in kiosk mode): bottom-right they covered the thermal output numbers (final4 E2E, 1920 / 1366) */
  .mk-vol, .mk-end { top: 2px; bottom: auto; right: auto; } .mk-vol { left: 50%; transform: translateX(calc(-100% + 30px)); min-height: 52px; padding-top: 2px; padding-bottom: 2px; } .mk-end { left: calc(50% + 42px); top: 4px; }
  .mk-cut { position: fixed; z-index: 9990; left: 14px; bottom: 14px; padding: 10px 16px; border-radius: 999px; background: rgba(20,12,24,.85); color: #ffd58a; font: 700 15px/1 Inter, "Noto Sans JP", "PingFang SC", sans-serif; }
  html.mk-fade body { opacity: 0; transition: opacity 1.3s ease; }
  .mk-note { position: fixed; z-index: 9992; left: 50%; top: 70px; transform: translateX(-50%); padding: 10px 18px; border-radius: 12px; background: rgba(30,40,60,.92); color: #d6f1ff; font: 600 16px/1.3 Inter, "Noto Sans JP", "PingFang SC", sans-serif; }
  .mk-note[hidden], .mk-alert[hidden] { display: none; }
  .mk-alert { position: fixed; z-index: 9995; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(720px, 92vw); padding: 28px 30px; border-radius: 22px; background: #3a0f1a; border: 3px solid #ff7a90;
    color: #fff; text-align: center; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 20px 80px rgba(0,0,0,.7); font: 600 20px/1.35 Inter, "Noto Sans JP", "PingFang SC", sans-serif; }
  .mk-alert b { font-size: clamp(26px, 4vw, 40px); }
  .mk-corner { position: fixed; z-index: 9991; left: 0; top: 0; width: 56px; height: 56px; }`;
  document.head.appendChild(css);

  // the end button + the hidden staff corner
  const ui = () => {
    if (document.querySelector('.mk-end')) return;
    document.querySelector('.dnav')?.remove();   // ← / → on the cover would switch demos through these links (shell.js)
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mk-end'; b.addEventListener('click', () => leave('card'));
    const lab = () => { b.textContent = tx(TX.end); vb.title = tx(TX.vol); vb.querySelector('span').textContent = tx(TX.vol); vb.querySelector('input').setAttribute('aria-label', tx(TX.vol)); };
    const vb = document.createElement('label'); vb.className = 'mk-vol'; vb.innerHTML = `<span></span><input type="range" min="0" max="100" step="1" value="${Math.round(vol * 100)}">`;
    vb.querySelector('input').addEventListener('input', (e) => setVol(+e.target.value / 100));
    lab(); addEventListener('moheat:sublang', lab); document.body.appendChild(b); document.body.appendChild(vb); setVol(vol);
    RT.si(() => { vb.hidden = !!document.querySelector('.u2 [data-k=vol]'); }, 1000);
    const corner = document.createElement('div'); corner.className = 'mk-corner'; corner.setAttribute('aria-hidden', 'true'); document.body.appendChild(corner);
    let taps = []; corner.addEventListener('click', () => { const n = Date.now(); taps = taps.filter((t) => n - t < 3000).concat(n); if (taps.length >= 5) leave('staff'); });
    // ■ STOP + staff button (always there): STOP = the demo's own ■ STOP (trip + pause) and a direct device stop; staff → start page → password
    const est = () => document.getElementById('estop');
    controls({ lang: L, stop: () => { stopDevice(); const b = est(); if (b && !b.classList.contains('tripped')) b.click(); else try { window.MoHeatShell?.pause?.(true); } catch {} stopDevice(); }, tripped: () => !!est()?.classList.contains('tripped'), rearm: () => est()?.click(), staff: () => leave('staff') });
    // full-screen demo (user 2026-11-11): the picture alone fills the screen under the top bar; the side panel (sounds around you, warm /
    // cool output, intensity) is a drawer opened by the デバイス出力 button left of ■ STOP, closed again by it or a tap outside; hidden on every page load
    if (document.querySelector('aside.side')) {
      document.documentElement.classList.add('mk-full');
      const fs = document.createElement('style'); fs.textContent = `
      html.mk-full .layout { display: block !important; max-width: none !important; grid-template-columns: none !important; }
      html.mk-full .stage-col { width: 100% !important; max-width: none !important; }
      html.mk-full body:not(.cover-only) .stage { width: min(100%, calc((100dvh - var(--fit-bar, 0px) - var(--fit-pad, 0px) - var(--fit-below, 0px) - 8px) * 16 / 9)) !important; margin-left: auto !important; margin-right: auto !important; }
      html.mk-full aside.side { display: flex !important; flex-direction: column; gap: 10px; position: fixed !important; z-index: 2147482990; top: 0; right: 0; bottom: 0; left: auto !important; width: min(440px, 92vw) !important; max-width: none !important;
        height: auto !important; margin: 0 !important; overflow: auto; padding: 92px 14px 14px; background: rgba(14,12,20,.95); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: -12px 0 40px rgba(0,0,0,.5);
        transform: translateX(105%); visibility: hidden; transition: transform .25s ease, visibility 0s linear .25s; }
      html.mk-full.mk-side-open aside.side { transform: none; visibility: visible; transition: transform .25s ease; }
      html.mk-full aside.side > .card { flex: none; }
      html.mk-full header.bar { padding-right: 330px !important; }
      html.mk-full .bar .mside-btn { display: none !important; }
      .mk-out { position: fixed; z-index: 2147482999; right: 148px; top: 14px; min-height: 64px; min-width: 64px; padding: 0 16px; display: inline-flex; align-items: center; gap: 10px; border-radius: 18px;
        border: 1px solid rgba(255,255,255,.3); background: rgba(20,16,26,.82); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); color: #f4efe6; cursor: pointer; touch-action: manipulation;
        font: 700 16px/1.1 Inter, "Noto Sans JP", "PingFang SC", "Apple SD Gothic Neo", sans-serif; }
      .mk-out[aria-pressed="true"] { background: #f4efe6; color: #161214; }
      .mk-out svg { flex: 0 0 auto; }`;
      document.head.appendChild(fs);
      const OUT = { ja: 'デバイス出力', en: 'Output', zh: '设备输出', ko: '출력' };
      const ob = document.createElement('button'); ob.type = 'button'; ob.className = 'mk-out';
      const paintOut = () => { const on = document.documentElement.classList.contains('mk-side-open'); ob.setAttribute('aria-pressed', on);
        ob.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5 20V12M10 20V6M15 20V10M20 20V4"/></svg><span>${OUT[L()] || OUT.ja}</span>`; };
      const setOut = (on) => { const r = document.documentElement; r.classList.toggle('mk-side-open', on); r.classList.toggle('side-open', on && r.classList.contains('lay-drawer')); paintOut(); dispatchEvent(new Event('resize')); };
      ob.addEventListener('click', (e) => { e.stopPropagation(); setOut(!document.documentElement.classList.contains('mk-side-open')); });
      document.addEventListener('click', (e) => { if (document.documentElement.classList.contains('mk-side-open') && !e.target.closest('aside.side, .mk-out')) setOut(false); }, true);
      paintOut(); addEventListener('moheat:sublang', paintOut); document.body.appendChild(ob);
      setTimeout(() => dispatchEvent(new Event('resize')), 50);
    }
    // intensity cap on the page's slider (the shell already restored the visitor's level)
    const inten = document.getElementById('intensity');
    // the caps live in the two scales (scaleLine below); the page slider is a master the visitor may lower
    guardDevice();   // the port itself: device.js reconnects silently (MoHeatDevice.state, 'moheat:device') — no Connect click here (it raced → 'error')
    try { navigator.wakeLock?.request('screen').catch(() => {}); } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
  addEventListener('load', () => { document.querySelector('.dnav')?.remove(); });

  // ---------------------------------------------------------------- started / finished, thermal moments
  const v0 = visit.get(); if (!v0 || v0.dir !== dir) visit.set({ dir, t0: Date.now(), started: false, finished: false, mode: null, moments: [] });
  const intro = () => document.getElementById('intro');
  const playing = () => { const i = intro(); return !!i && i.classList.contains('hidden'); };
  let wasPlaying = false, ended = false;
  const chapterLabels = () => {
    const S = window.MoHeatShell;
    if (S?.chapters?.length) return S.chapters.map((ch) => ch.label || ch.en || '');
    return [...document.querySelectorAll('#steps li')].map((li) => li.textContent.split(' · ')[0].trim());
  };
  const chapterNow = () => { try { return window.MoHeatShell?.chapter ? window.MoHeatShell.chapter() : -1; } catch { return -1; } };
  const per = new Map();   // chapter index → { w: max warm, c: max cool }
  const parse = (s) => { let w = 0, cl = 0; for (const m of String(s).matchAll(/\b([LR])([HC])\s*(\d+)/g)) { const n = +m[3]; if (m[2] === 'H') w = Math.max(w, n); else cl = Math.max(cl, n); } return { w, cl }; };
  setInterval(() => {
    const p = playing();
    if (p && !wasPlaying) {   // playback (re)starts
      const v = visit.get() || {}; if (!v.started) { stats.started(dir, window.MoHeatPlay?.mode || 'pure'); visit.patch({ started: true, mode: window.MoHeatPlay?.mode || 'pure' }); }
      if (CUT && !cutStarted) startCut();
    }
    if (!p && wasPlaying && intro() && !ended) {   // its own cover came back = the end
      ended = true; const v = visit.get() || {}; if (!v.finished) { stats.finished(dir); visit.patch({ finished: true }); }
      setTimeout(() => leave('card'), 1800);
    }
    wasPlaying = p;
    if (p) {
      const cmd = document.getElementById('cmd')?.textContent || '', { w, cl } = parse(cmd), k = chapterNow();
      post({ t: 'thermal', th: thermalOf(rest ? '' : scaleLine(cmd)) });
      if (k >= 0 && (w || cl)) learn(k, w / 200 + Math.max(0, cl - 35) / 45);
      // a moment = a chapter; demos without chapters: the scene name in the sound-map card (#posInfo, §7.3)
      const key = k >= 0 ? k : (document.getElementById('posInfo')?.textContent || '').trim().slice(0, 40);
      if ((key || key === 0) && (w || cl)) { const e = per.get(key) || { w: 0, c: 0, n: per.size }; e.w = Math.max(e.w, w); e.c = Math.max(e.c, cl); per.set(key, e); saveMoments(); }
    }
  }, 500);
  let lastSave = 0;
  function saveMoments(force) {
    if (!force && Date.now() - lastSave < 3000) return; lastSave = Date.now();
    const labels = chapterLabels(), list = [];
    per.forEach((e, k) => { const label = typeof k === 'number' ? labels[k] : k; if (!label) return; const kind = e.w > 40 && e.c > 30 ? 'dual' : e.w >= e.c * 1.5 ? 'warm' : 'cool';
      list.push({ k: e.n, label, kind, s: e.w / 200 + Math.max(0, e.c - 35) / 45 }); });
    list.sort((a, b) => b.s - a.s); list.splice(6); list.sort((a, b) => a.k - b.k);   // the 6 strongest, in story order
    visit.patch({ moments: list, title: document.querySelector('.intro h1')?.textContent?.trim() || document.title });
  }

  // ---------------------------------------------------------------- idle reset
  let last = RN(), idleP = null;
  for (const e of ['pointerdown', 'keydown', 'touchstart', 'wheel']) addEventListener(e, () => { last = RN(); }, { capture: true, passive: true });
  RT.si(() => {
    if (playing() !== idleP) { idleP = playing(); last = RN(); }   // start / end of the demo counts as activity: a long untouched demo (Demo03, a concert) ending on its cover is the end, not idle (it skipped the end sting)
    const idle = (RN() - last) / 1000, p = playing(), paused = !!window.MoHeatShell?.paused, pure = window.MoHeatPlay?.mode !== 'interactive';
    const limit = !p || paused ? c.idle : pure ? Infinity : c.idle * 3;
    if (idle > limit) leave(p || (visit.get() || {}).started ? 'card' : 'reset');
  }, 1000);

  let leaving = false;
  function leave(where) {
    if (leaving) return; leaving = true; saveMoments(true); stopDevice();
    try { window.MoHeatShell?.pause?.(true); } catch {}
    document.querySelectorAll('audio, video').forEach((m) => { try { m.pause(); } catch {} });
    RT.st(() => { location.href = `${HOME}#${where}`; }, 150);   // the stop line goes out first
  }
  K.leave = leave;

  // ---------------------------------------------------------------- show cut (60–90 s of the demo's best thermal moments; a staff option, default OFF: full demo)
  // the start chapter = staff data (SHOWCUT) → else the chapter with the strongest thermal output learned from earlier plays on this
  // machine ('moheat.kiosk.heat.<dir>', every play teaches it) → else chapter 2 when there are ≥ 3 (skips the slow opening), else the start.
  // Then CUT_S seconds of real playback, a fade and the experience card (counted as finished).
  const SHOWCUT = {};   // { DemoNN_Name: { from: chapter index, secs: 80 } } — optional per-demo picks
  const CUT = (() => { try { return (sessionStorage.getItem('moheat.kiosk.cut') || c.cut || 'full') === 'show'; } catch { return false; } })();   // user 2026-11-08: one COMPLETE demo per visitor; the show cut is a staff option
  const CUT_S = (SHOWCUT[dir]?.secs) || 80;
  const HK = `moheat.kiosk.heat.${dir}`, heatMap = LSg(HK, {});
  let learnT = 0; function learn(k, v) { heatMap[k] = Math.max(heatMap[k] || 0, Math.round(v * 100) / 100); if (Date.now() - learnT > 4000) { learnT = Date.now(); LSs(HK, heatMap); } }
  let cutStarted = false, cutEnd = 0, chip = null;
  function startCut() {
    cutStarted = true;
    setTimeout(() => {   // after the shell has registered its chapters
      const n = chapterLabels().length, best = Object.entries(heatMap).sort((a, b) => b[1] - a[1])[0];
      let from = SHOWCUT[dir]?.from ?? (best ? +best[0] : n >= 3 ? 1 : 0);
      from = Math.max(0, Math.min(from, n - 1)); if (n > 1 && from >= n - 1 && n > 2) from = n - 2;   // leave room to play
      if (from > 0) { try { window.MoHeatShell?.seekTo?.(from); } catch {} }
      const t0 = RN(), go = () => { if (window.MoHeatShell?.chapter && from > 0 && window.MoHeatShell.chapter() < from && RN() - t0 < 10000) return realT(go, 500); cutEnd = Date.now() + CUT_S * 1000; tick(); };   // a seek that never arrives (shell changes) must not stall the cut
      realT(go, 600);
    }, 400);
    chip = document.createElement('div'); chip.className = 'mk-cut'; chip.textContent = tx(TX.cut); document.body.appendChild(chip);
  }
  const realT = (fn, ms) => setTimeout(fn, ms);   // the story's own clock: a paused show cut does not run out
  function tick() {
    if (leaving) return; const left = Math.max(0, Math.round((cutEnd - Date.now()) / 1000));
    if (chip) chip.textContent = `${tx(TX.cut)} · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    if (left <= 0) { const v = visit.get() || {}; if (!v.finished) { stats.finished(dir); visit.patch({ finished: true, cut: true }); }
      document.documentElement.classList.add('mk-fade'); return RT.st(() => leave('card'), 1500); }
    realT(tick, 500);
  }

  // ---------------------------------------------------------------- device safety: duty-cycle pause + big disconnected alert
  // continuous thermal output for DUTY_ON s → "stop" and a DUTY_OFF s pause (the demo's commands are held back meanwhile)
  const DUTY_ON = 120, DUTY_OFF = 10; let onSince = 0, rest = false, alertBox = null;
  function guardDevice(n = 0) {
    const d = window.MoHeatDevice?.current; if (!d) { if (n < 40) setTimeout(() => guardDevice(n + 1), 500); return; }
    if (d.__mk) return; d.__mk = true; const send = d.send;
    d.send = (line) => {
      if (/^stop$/i.test(line)) { onSince = 0; return send(line); }
      if (rest) return undefined;
      const active = /\b[LR][HC]\s*[1-9]/.test(line); if (!active) onSince = 0; else if (!onSince) onSince = RN();
      if (onSince && RN() - onSince > DUTY_ON * 1000) { rest = true; onSince = 0; send('stop'); note(tx(TX.rest)); RT.st(() => { rest = false; note(''); }, DUTY_OFF * 1000); return undefined; }
      return send(scaleLine(line));   // the visitor's warm / cool scales (intro), within the staff caps
    };
  }
  let noteEl = null; function note(t) { if (!noteEl) { noteEl = document.createElement('div'); noteEl.className = 'mk-note'; document.body.appendChild(noteEl); } noteEl.textContent = t; noteEl.hidden = !t; }
  const alertShow = (on) => { if (!alertBox) { alertBox = document.createElement('div'); alertBox.className = 'mk-alert'; alertBox.setAttribute('role', 'alert'); document.body.appendChild(alertBox); }
    alertBox.innerHTML = `<b>${tx(TX.lost)}</b><span>${tx(TX.lostS)}</span>`; alertBox.hidden = !on; };
  // ONE source of truth: device.js's state (connected / reconnecting / lost / off / error) → the alert here + the queue screen
  const devState = () => ({ t: 'device', ...(window.MoHeatDevice?.state || { state: 'off' }) });
  addEventListener('moheat:device', (e) => { alertShow(e.detail?.state === 'lost'); post({ t: 'device', ...e.detail }); });
  addEventListener('click', (e) => { if (alertBox && !alertBox.hidden && e.target.closest('.mk-alert')) alertBox.hidden = true; });

  // ---------------------------------------------------------------- the queue screen (window 2): state, subtitles, a mirror of the picture
  setInterval(() => { post({ t: 'state', view: 'demo', dir, device: window.MoHeatDevice?.state || null }); post(devState()); }, 2000); post({ t: 'state', view: 'demo', dir });
  let lastSub = '';
  setInterval(() => {
    const s = document.querySelector('#subs .one, #subs .line, #bubble')?.textContent?.trim() || ''; if (s !== lastSub) { lastSub = s; post({ t: 'sub', text: s }); }
    if (!K.queueOn || !playing()) return;
    const st = document.querySelector('.stage-col .stage') || document.querySelector('.stage');
    const src = [...(st?.querySelectorAll('canvas, video') || [])].sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
    if (!src || src.clientWidth < 200) return;
    try { const cv = (K.__cv ||= document.createElement('canvas')); cv.width = 640; cv.height = 360; cv.getContext('2d').drawImage(src, 0, 0, 640, 360); post({ t: 'frame', url: cv.toDataURL('image/jpeg', .62) }); } catch {}
  }, 450);
})();
