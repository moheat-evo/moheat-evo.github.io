// MoHeatIntro — the kiosk intro (user 2026-11-08, exact flow; docs/kiosk/REQUIREMENTS.md §11; DEMO_DESIGN_GUIDE §7.4). Used by the kiosk
// (kiosk/index.html, every new visitor) and outside kiosk mode by kiosk/intro.html. Readable WITHOUT sound: big pictograms, the ear diagram
// lights up on the active side (orange = warm, blue = cool), a step progress bar, one large action, short text in the display language.
//   0 sting (logo, visual only)
//   A  1 put in the noise-cancelling in-ear EARBUDS (audio only, L / R marked)
//      2 L / R check: Homura speaks on the LEFT (Yes / No → "swap the earbuds", again), Koyuki on the RIGHT
//      3 volume: Koyuki's line loops while the visitor sets a big slider   4 "Sound OK? Please tell the staff 👋" — staff "Continue"
//   B  5 hair behind the ears (user 2026-11-15: warm / cool must reach bare skin, not hair) — the visitor's "Done"
//      6 the staff places the big over-ear MoHeat Evo headset over the earbuds (pictogram) — staff "Continue"
//      6 output check: left warm, right warm, left cool, right cool (~2 s each, the ear lights up)   7 "Felt warm and cool on both sides?
//        Please tell the staff 👋" — staff "Continue" (device not connected → a big notice)
//   C  8 WARM · 9 COOL auto-calibration: slow ramp (~7 s) to the staff cap, a huge STOP; any tap / key / Esc stops at once = personal max;
//        no tap = stops at the cap; the visitor's 100 % = 80 % of that max
//     10 warm sample (焰 Homura) · 11 cool sample (小雪 Koyuki: her breath is cool) → "Did that feel natural?" Too weak / Just right / Too
//        strong (± 15 %, ↺ replay)
// AUDIO RULE: every intro voice is in the visitor's language and spatialised (Web Audio HRTF panner): the speaker starts away on the left
// and moves closer / across until she whispers right at the ear. Thermal in the samples = voice loudness × closeness at that ear.
// Voices: kiosk/media/voice/<key>_<en|ja|zh>.m4a (kiosk/scripts/voice.py, ElevenLabs). Heat PWM = 150·k, cool PWM = 35 + 45·k.
//   const intro = MoHeatIntro.mount(el, { send(line), warm, cool, capWarm, capCool, volume(), onVolume(v), lang: () => 'en', connected(),
//     onLevel({ warm, cool }), onDone({ warm, cool, maxWarm, maxCool, hit, natural: { warm, cool }, skipped }), only: ['warm', 'cool'] });
(() => {
  if (window.MoHeatIntro) return;
  const T = {
    stingSub: { en: 'Binaural ASMR × thermal haptics', ja: '立体音響 ASMR × 温冷ハプティクス', zh: '立体声 ASMR × 冷热触感' },
    wear: { en: 'Put in the noise-cancelling earbuds (L / R)', ja: 'ノイズキャンセリングイヤホンを装着', zh: '戴上降噪入耳式耳机' },
    vol: { en: 'Set the volume', ja: '音量を合わせてください', zh: '调节音量' },
    volSub: { en: 'Slide until the chime is clearly audible but soft.', ja: 'チャイムが、はっきり・やさしく聞こえるように。', zh: '拖动滑块，让提示音清楚又柔和。' },
    wearSub: { en: 'L in your left ear, R in your right. They carry the sound.', ja: 'L を左耳、R を右耳に。音はこのイヤホンから聞こえます。', zh: 'L 戴左耳，R 戴右耳。声音从这副耳机传出。' },
    ready: { en: 'They’re in', ja: 'つけました', zh: '戴好了' },
    hair: { en: 'Tuck your hair behind your ears', ja: '髪を耳にかけてください', zh: '请把头发别到耳后', ko: '머리카락을 귀 뒤로 넘겨 주세요' },
    hairSub: { en: 'Warmth and coolness need bare skin — they can’t get through hair.', ja: '温かさ・冷たさは、肌に直接ふれると感じられます。', zh: '让耳朵露出来——冷热要碰到皮肤才感觉得到。', ko: '따뜻함과 시원함은 피부에 닿아야 느껴져요.' },
    hairSubW: { en: 'Warmth needs bare skin — it can’t get through hair.', ja: '温かさは、肌に直接ふれると感じられます。', zh: '让耳朵露出来——温热要碰到皮肤才感觉得到。', ko: '따뜻함은 피부에 닿아야 느껴져요.' },   // warm only / cooling fault: never mention cool
    hairOk: { en: 'Done', ja: 'できました', zh: '好了', ko: '했어요' },
    left: { en: 'Left ear · warm', ja: '左耳 · あたたかい', zh: '左耳 · 暖' },
    leftSub: { en: 'A gentle warmth on your LEFT ear.', ja: '左耳に、じんわりとした温かさ。', zh: '左耳会感到一阵温暖。' },
    right: { en: 'Right ear · cool', ja: '右耳 · つめたい', zh: '右耳 · 凉' },
    rightSub: { en: 'Now a fresh coolness on your RIGHT ear.', ja: 'こんどは右耳に、ひんやり。', zh: '现在右耳会有一丝清凉。' },
    swap: { en: 'Hot ↔ cold, fast', ja: '温 ↔ 冷、すばやく', zh: '冷热快速切换' },
    swapSub: { en: 'Both ears flip between warm and cool.', ja: '両耳が、温かい ↔ 冷たいを行き来します。', zh: '两只耳朵在暖和凉之间来回切换。' },
    dual: { en: 'Cool + warm on the same ear', ja: '同じ耳に、冷たいと温かいを同時に', zh: '同一只耳朵，冷和热同时' },
    dualSub: { en: 'Like a warm voice in cool night air: MoHeat Evo can do both at once.', ja: '夜の冷たい空気の中の、温かい声。MoHeat Evo は両方を同時に出せます。', zh: '就像凉夜里耳边温暖的声音：MoHeat Evo 能同时做到。' },
    level: { en: 'Is the intensity comfortable?', ja: '強さはちょうどいいですか？', zh: '强度舒服吗？' },
    warmQ: { en: 'Warm on your LEFT ear is rising…', ja: '左耳の温かさが、だんだん強くなります…', zh: '左耳的暖意正在慢慢变强…' },
    coolQ: { en: 'Cool on your RIGHT ear is rising…', ja: '右耳の冷たさが、だんだん強くなります…', zh: '右耳的凉意正在慢慢变强…' },
    tapNow: { en: 'Tap when it’s ALMOST too strong', ja: '「ちょっと強すぎるかも」と思ったらタップ', zh: '快要太强的时候，点一下' },
    tapBtn: { en: 'Now!', ja: 'いま！', zh: '就是现在！' },
    gotIt: { en: '✓ Got it — your level is set', ja: '✓ OK — あなたの強さを記録しました', zh: '✓ 好的 — 已记下你的强度' },
    lrL: { en: 'Did you hear it on the LEFT?', ja: '左から聞こえましたか？', zh: '声音是从左边传来的吗？' },
    lrR: { en: 'And now on the RIGHT?', ja: 'こんどは右から聞こえましたか？', zh: '现在是从右边传来的吗？' },
    lrSub: { en: 'A voice comes close to that ear…', ja: '声が、その耳に近づいてきます…', zh: '声音正靠近那只耳朵…' },
    yes: { en: 'Yes', ja: 'はい', zh: '是' }, no: { en: 'No', ja: 'いいえ', zh: '不是' },
    turn: { en: 'Swap the earbuds: L in your left ear', ja: 'イヤホンを左右入れ替えてください（L を左耳に）', zh: '请把左右耳机换过来：L 戴左耳' },
    stop: { en: 'STOP', ja: 'ストップ', zh: '停' },
    almost: { en: 'Tap STOP when it’s almost uncomfortable', ja: '「少しつらいかも」と思ったら STOP', zh: '快要不舒服时，点「停」' },
    sampleH: { en: '…hey, it’s Homura. Is your left ear getting warm? My foxfire warmth… it comes closer with my voice.', ja: '…ねえ、ほむらだよ。左の耳、ぽかぽかしてきた？ 狐火のぬくもり…わたしの声といっしょに、近づくでしょ。', zh: '…嘿，我是焰。左耳是不是暖起来了？ 狐火的温度…会跟着我的声音靠近哦。' },
    sampleK: { en: '…it’s Koyuki. Your right ear… fuuu. My snowy breath… cool and gentle, isn’t it?', ja: '…こゆきです。右の耳に…ふぅーっ。 雪のいき…ひんやりして、気持ちいいでしょう？', zh: '…我是小雪。在你右耳边…呼——。 雪的气息…凉凉的，很舒服吧？' },
    whoH: { en: 'Homura · warm voice at your left ear', ja: '焰 · 左耳に、あたたかい声', zh: '焰 · 左耳边温暖的声音' },
    whoK: { en: 'Koyuki · cool breath at your right ear', ja: '小雪 · 右耳に、ひんやりした息', zh: '小雪 · 右耳边清凉的气息' },
    natural: { en: 'Did that feel natural?', ja: '自然に感じましたか？', zh: '感觉自然吗？' },
    weak: { en: 'Too weak', ja: '弱すぎる', zh: '太弱' }, right: { en: 'Just right', ja: 'ちょうどいい', zh: '刚刚好' }, strong: { en: 'Too strong', ja: '強すぎる', zh: '太强' },
    replay: { en: '↺ Replay', ja: '↺ もう一度', zh: '↺ 再听一次' },
    soundOk: { en: 'Sound OK? Please tell the staff 👋', ja: '音は大丈夫ですか？ スタッフに声をかけてください 👋', zh: '声音没问题吗？请告诉工作人员 👋' },
    feltOk: { en: 'Felt warm and cool on both sides? Please tell the staff 👋', ja: '左右で温かさと冷たさを感じましたか？ スタッフに声をかけてください 👋', zh: '两边都感到暖和凉了吗？请告诉工作人员 👋' },
    staffGo: { en: 'Continue (staff)', ja: '続ける（スタッフ）', zh: '继续（工作人员）' }, wrong: { en: 'Something’s wrong', ja: 'うまくいかない', zh: '有问题' },
    hintA: { en: 'Staff: check the earbuds’ Bluetooth / sound output, the system volume and that L is in the left ear, then repeat the check.', ja: 'スタッフへ：イヤホンの接続とサウンド出力・PC の音量・L が左耳か を確認して、もう一度チェックしてください。', zh: '工作人员：检查入耳式耳机的连接和声音输出、系统音量、L 是否在左耳，然后重新检查。' },
    hintB: { en: 'Staff: check that the MoHeat Evo headset sits squarely over both ears, the green device dot (top right) and the caps; repeat the check.', ja: 'スタッフへ：MoHeat Evo が両耳にしっかり掛かっているか・右上の緑の丸・上限設定を確認して、もう一度チェックしてください。', zh: '工作人员：检查 MoHeat Evo 是否端正地罩住双耳、右上角绿点、强度上限，然后重新检查。' },
    again: { en: '↺ Check again', ja: '↺ もう一度', zh: '↺ 再检查一次' },
    fit: { en: 'The staff now places the big MoHeat Evo headset over your earbuds', ja: 'スタッフが、イヤホンの上から大きな MoHeat Evo を装着します', zh: '工作人员现在把大的 MoHeat Evo 头戴设备戴在入耳式耳机外面' },
    fitSub: { en: 'The earbuds carry the sound; MoHeat Evo brings warm and cool to each ear.', ja: '音はイヤホンから、温かさと冷たさは MoHeat Evo から届きます。', zh: '声音来自入耳式耳机，冷和热来自 MoHeat Evo。' },
    check: { en: 'Output check', ja: '出力チェック', zh: '输出检查' },
    chk: { en: ['Left · warm', 'Right · warm', 'Left · cool', 'Right · cool'], ja: ['左 · あたたかい', '右 · あたたかい', '左 · つめたい', '右 · つめたい'], zh: ['左 · 暖', '右 · 暖', '左 · 凉', '右 · 凉'] },
    devMissing: { en: 'MoHeat Evo is not connected — staff: press and hold Staff (top left) → Device → Connect', ja: 'MoHeat Evo が未接続です — スタッフ：左上の「スタッフ」を長押し → Device → Connect', zh: 'MoHeat Evo 未连接 — 工作人员：长按左上角「工作人员」→ Device → Connect' },
    nextCool: { en: 'Next: cool', ja: 'つぎは冷たさ', zh: '接下来：凉' },
    levelSub: { en: 'You can change it any time during the demo.', ja: 'デモの途中でもいつでも変えられます。', zh: '体验中也可以随时调整。' },
    softer: { en: 'Softer', ja: '弱く', zh: '弱一点' }, ok: { en: 'Just right', ja: 'ちょうどいい', zh: '刚刚好' }, stronger: { en: 'Stronger', ja: '強く', zh: '强一点' },
    skip: { en: 'Skip intro', ja: 'スキップ', zh: '跳过' }, L: { en: 'L', ja: '左', zh: '左' }, R: { en: 'R', ja: '右', zh: '右' },
    noDev: { en: 'MoHeat Evo not connected: the colours show what you would feel.', ja: 'MoHeat Evo 未接続：色で温冷を表示しています。', zh: 'MoHeat Evo 未连接：用颜色显示你会感受到的冷热。' },
  };
  const css = `
  .mi { --ff: Inter, "Noto Sans JP", "PingFang SC", system-ui, sans-serif; position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.2vmin; text-align: center; color: #f6f0fa;
    font-family: Inter, "Noto Sans JP", "PingFang SC", system-ui, sans-serif; padding: 4vmin; box-sizing: border-box; }
  .mi h2 { margin: 0; font: 800 clamp(22px, 5vmin, 54px)/1.15 var(--ff); letter-spacing: .01em; }
  .mi p.sub { margin: 0; max-width: 34em; font: 500 clamp(14px, 2.4vmin, 24px)/1.45 var(--ff); color: #d6cbe2; min-height: 2.9em; }
  .mi .head { position: relative; width: min(46vmin, 380px); aspect-ratio: 1.45; }
  .mi .head svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .mi .ear { position: absolute; top: 50%; width: 26%; aspect-ratio: 1; border-radius: 50%; transform: translate(-50%, -50%); display: grid; place-items: center;
    font: 800 clamp(14px, 3vmin, 30px)/1 var(--ff); color: rgba(255,255,255,.75); background: rgba(255,255,255,.08); border: 2px solid rgba(255,255,255,.25); transition: background .5s, box-shadow .5s, border-color .5s; }
  .mi .ear.l { left: 9%; } .mi .ear.r { left: 91%; }
  .mi .ear.warm { background: radial-gradient(circle, #ffb070 0%, #ff7a3a 55%, #d8461c 100%); border-color: #ffc89a; box-shadow: 0 0 6vmin 1vmin rgba(255,120,50,.65); color: #fff; }
  .mi .ear.cool { background: radial-gradient(circle, #bfe9ff 0%, #5cb8ff 55%, #2a7ee0 100%); border-color: #cdeeff; box-shadow: 0 0 6vmin 1vmin rgba(80,170,255,.65); color: #fff; }
  .mi .ear.dual { background: conic-gradient(from 200deg, #5cb8ff 0 50%, #ff7a3a 50% 100%); border-color: #fff; box-shadow: -2vmin 0 5vmin rgba(80,170,255,.55), 2vmin 0 5vmin rgba(255,120,50,.55); color: #fff; }
  .mi .logo { font: 800 clamp(34px, 9vmin, 110px)/1 var(--ff); letter-spacing: -.02em; background: linear-gradient(90deg, #6cc4ff 0%, #6cc4ff var(--p, 0%), #ff8a4a calc(var(--p, 0%) + 18%), #ff8a4a 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .mi .logo span { font-weight: 300; }
  .mi .row { display: flex; gap: 1.6vmin; flex-wrap: wrap; justify-content: center; }
  .mi button { font: 700 clamp(15px, 2.6vmin, 26px)/1 var(--ff); min-height: 56px; padding: 0 1.4em; border-radius: 999px; border: 2px solid rgba(255,255,255,.35); background: rgba(255,255,255,.06); color: #fff; cursor: pointer; }
  .mi button.go { background: linear-gradient(135deg, #ffd58a, #ff9f6e); color: #2a1606; border-color: transparent; }
  .mi .lvl { font: 700 clamp(13px, 2vmin, 20px)/1 var(--ff); color: #ffd58a; letter-spacing: .1em; }
  .mi .lvl i { display: inline-block; width: 1.6em; height: .55em; margin: 0 .12em; border-radius: 3px; background: rgba(255,255,255,.18); vertical-align: middle; }
  .mi .lvl i.on { background: linear-gradient(90deg, #ffb070, #ff7a3a); } .mi .lvl.cool i.on { background: linear-gradient(90deg, #bfe9ff, #5cb8ff); }
  .mi .dots { position: absolute; bottom: 3.2vmin; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
  .mi .dots b { width: 5vmin; max-width: 56px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.22); } .mi .dots b.on { background: #ffd58a; }
  .mi .skip { position: absolute; right: 3vmin; bottom: 2.2vmin; font-size: clamp(14px, 2vmin, 20px); min-height: 48px; border-color: rgba(255,255,255,.2); color: #cfc3dc; }
  .mi .nodev { position: absolute; left: 3vmin; bottom: 3vmin; max-width: 40%; text-align: left; font: 500 clamp(11px, 1.6vmin, 15px)/1.35 var(--ff); color: #a99ab8; }
  .mi .vol { display: flex; align-items: center; gap: 3vmin; } .mi .vol svg { width: clamp(64px, 12vmin, 120px); }
  .mi .vol input { width: min(56vmin, 520px); height: 56px; accent-color: #ffd58a; cursor: pointer; }
  .mi .ramp { width: min(56vmin, 520px); height: 22px; border-radius: 11px; background: rgba(255,255,255,.12); overflow: hidden; }
  .mi .ramp i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #ffd0a0, #ff7a3a); transition: width .25s linear; }
  .mi .ramp.cool i { background: linear-gradient(90deg, #dff4ff, #3e9bf0); }
  .mi .tapnow { margin: 0; font: 800 clamp(22px, 4.6vmin, 50px)/1.2 var(--ff); color: #ffd58a; animation: miTap 1.2s ease-in-out infinite; }
  @keyframes miTap { 50% { transform: scale(1.06); opacity: .8; } }
  .mi button.now { min-height: 84px; min-width: 260px; font-size: clamp(22px, 4vmin, 40px); }
  .mi .got { color: #a6f0c0; font-weight: 700; }
  .mi .ear.sound { background: rgba(255, 255, 255, .9); color: #17121f; animation: miSound 1s ease-in-out infinite; } @keyframes miSound { 50% { box-shadow: 0 0 0 1.2vmin rgba(160, 215, 255, .25); } }
  .mi button.big1 { min-height: 76px; min-width: 200px; font-size: clamp(20px, 3.4vmin, 34px); }
  .mi button.stopbtn { min-height: clamp(110px, 18vmin, 180px); min-width: clamp(260px, 40vmin, 420px); font-size: clamp(34px, 7vmin, 72px); border-radius: 999px; letter-spacing: .08em; }
  .mi .sample { display: flex; align-items: center; gap: 4vmin; max-width: 92vw; } .mi .sample img { height: min(62vh, 520px); width: auto; filter: drop-shadow(0 0 30px rgba(255, 140, 60, .35)); }
  .mi .sample.cool img { filter: drop-shadow(0 0 30px rgba(110, 190, 255, .4)); } .mi .sample > div { display: flex; flex-direction: column; align-items: center; gap: 2vmin; max-width: 640px; }
  .mi .sample .who { margin: 0; font: 700 clamp(16px, 2.6vmin, 26px)/1.3 var(--ff); } .mi .sample.warm .who { color: #ffc9a0; } .mi .sample.cool .who { color: #cfeaff; }
  .mi .sample .line { margin: 0; font: 600 clamp(18px, 3vmin, 30px)/1.45 var(--ff); color: #fff; text-align: center; }
  .mi .sample .head { width: min(30vmin, 260px); } .mi .replay { background: none; border: 0; color: #cfc3dc; text-decoration: underline; min-height: 48px; }
  .mi button.picked { box-shadow: 0 0 0 5px rgba(255, 213, 138, .5); transform: scale(1.04); }
  .mi .stage-a > * { margin-left: auto; margin-right: auto; }   /* fixed-width pictures and the sub line sit in the middle (they were left of centre: critic 2026-11-11) */
  .mi .phones { position: relative; width: min(40vmin, 340px); } .mi .phones svg { width: 100%; display: block; }
  .mi .phones span { position: absolute; top: 52%; width: 24%; aspect-ratio: 1; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; }
  .mi .phones .l { left: 22%; } .mi .phones .r { left: 78%; }
  .mi .phones span.sound { box-shadow: 0 0 0 0 rgba(255, 255, 255, .6); animation: miRing 1.1s ease-out infinite; }
  @keyframes miRing { to { box-shadow: 0 0 0 4vmin rgba(255, 255, 255, 0); } }
  .mi .fitpic { width: min(50vmin, 440px); } .mi .fitpic svg { width: 100%; display: block; } .mi .fitpic .lower { animation: miLower 2.2s ease-in-out infinite; }
  @keyframes miLower { 0%, 100% { transform: translateY(-10px); } 55% { transform: translateY(14px); } }
  .mi .staffq { display: flex; flex-direction: column; align-items: center; gap: 2.4vmin; max-width: 900px; }
  .mi .staffq .wave { font-size: clamp(60px, 14vmin, 150px); animation: miWave 1.6s ease-in-out infinite; transform-origin: 70% 80%; }
  @keyframes miWave { 25% { transform: rotate(16deg); } 50% { transform: rotate(-8deg); } 75% { transform: rotate(12deg); } }
  .mi .hint { color: #ffe1a8; } .mi .devmiss { margin: 0; padding: 1.4vmin 2.4vmin; border-radius: 14px; background: #3a0f1a; border: 2px solid #ff7a90; font: 700 clamp(16px, 2.6vmin, 26px)/1.3 var(--ff); }
  .mi .chk[data-kind=warm] { color: #ffb36b; } .mi .chk[data-kind=cool] { color: #9fd8ff; }
  @media (prefers-reduced-motion: reduce) { .mi .phones span.sound, .mi .staffq .wave, .mi .fitpic .lower { animation: none; } }
  .mi .bar { width: min(50vmin, 420px); height: 6px; border-radius: 3px; background: rgba(255,255,255,.12); overflow: hidden; }
  .mi .bar i { display: block; height: 100%; width: 0; background: #ffd58a; transition: width linear; }
  @media (prefers-reduced-motion: reduce) { .mi .ear { transition: none; } }`;
  const STEPS = [
    { id: 'sting', s: 2.4 }, { id: 'wear', s: 10 }, { id: 'lr', s: 40 }, { id: 'volume', s: 15 }, { id: 'staffA', s: 180 },
    { id: 'hair', s: 120 }, { id: 'fit', s: 180 }, { id: 'check', s: 10 }, { id: 'staffB', s: 180 },
    { id: 'warm', s: 11 }, { id: 'cool', s: 12 }, { id: 'hsample', s: 30 }, { id: 'ksample', s: 30 },
  ];
  // pictograms: small in-ear earbuds (L / R) in the ears; the staff lowering the big MoHeat Evo headset (orange / blue cups) over them
  const PHONES = `<div class="phones"><svg viewBox="0 0 160 110" aria-hidden="true"><ellipse cx="80" cy="56" rx="40" ry="48" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.4)" stroke-width="2"/>
    <path d="M40 46 q-12 2 -10 16 q2 10 10 8" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/><path d="M120 46 q12 2 10 16 q-2 10 -10 8" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5"/>
    <g fill="#fff"><circle cx="36" cy="58" r="9"/><rect x="12" y="54" width="20" height="8" rx="4"/><circle cx="124" cy="58" r="9"/><rect x="128" y="54" width="20" height="8" rx="4"/></g>
    <text x="17" y="42" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">L</text><text x="143" y="42" text-anchor="middle" font-size="20" font-weight="800" fill="#fff">R</text></svg>
    <span class="l"></span><span class="r"></span></div>`;
  const FIT = `<div class="fitpic"><svg viewBox="0 0 220 150" aria-hidden="true"><ellipse cx="110" cy="96" rx="40" ry="48" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <circle cx="68" cy="98" r="6" fill="#fff"/><circle cx="152" cy="98" r="6" fill="#fff"/>
    <g class="lower"><path d="M56 62 Q56 8 110 8 Q164 8 164 62" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <rect x="38" y="52" width="32" height="56" rx="15" fill="#ff8a3d" stroke="#fff" stroke-width="3"/><rect x="150" y="52" width="32" height="56" rx="15" fill="#9fd8ff" stroke="#fff" stroke-width="3"/></g>
    <path d="M14 30 v26 M6 48 l8 8 8 -8 M206 30 v26 M198 48 l8 8 8 -8" stroke="#ffd479" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="110" y="148" text-anchor="middle" font-size="12" font-weight="700" fill="#ffd479">MoHeat Evo</text></svg></div>`;
  // hair behind the ears: a face (front), the ears bare, the hair swept back behind them (curved arrows) — white line art only
  const HAIR = `<div class="fitpic"><svg viewBox="0 0 220 150" aria-hidden="true" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="110" cy="88" rx="38" ry="48" stroke-opacity=".55" stroke-width="2"/>
    <path d="M70 82 q-12 -2 -12 12 q0 13 13 13" stroke-width="3"/><path d="M150 82 q12 -2 12 12 q0 13 -13 13" stroke-width="3"/>
    <path d="M70 74 Q64 26 110 24 Q156 26 150 74" stroke-width="4"/><path d="M74 52 Q60 66 52 98 Q50 118 60 132" stroke-width="3"/><path d="M146 52 Q160 66 168 98 Q170 118 160 132" stroke-width="3"/>
    <path d="M40 66 q-14 16 -6 38 M28 96 l6 10 10 -6" stroke="#ffd479" stroke-width="4"/><path d="M180 66 q14 16 6 38 M192 96 l-6 10 -10 -6" stroke="#ffd479" stroke-width="4"/></svg></div>`;
  const MEDIA = (() => { try { return new URL('../../kiosk/media/', document.currentScript.src).href; } catch { return '../kiosk/media/'; } })();

  // visitor option "warm only (no mist)" (kiosk start screen): device.js sends no cool at all; the guide leaves the cool steps out
  const WO = () => { try { return localStorage.getItem('moheat.warmOnly') === '1'; } catch { return false; } };
  const WOH = () => { if (WO()) return true; try { return !!JSON.parse(localStorage.getItem('moheat.kiosk.cfg') || '{}').coolFault; } catch { return false; } };   // warm only or the kiosk's cooling-fault mode
  function mount(el, o = {}) {
    if (!document.getElementById('mi-css')) { const st = document.createElement('style'); st.id = 'mi-css'; st.textContent = css; document.head.appendChild(st); }
    const send = (line) => { try { o.send?.(line); } catch {} log.push(line); };
    const log = [];
    const lang = () => (o.lang ? o.lang() : 'en');
    const tx = (k) => T[k][lang()] || T[k].en;
    let volume = Math.max(0, Math.min(1, o.volume ? o.volume() : .7)); const vol = () => volume;
    const capW = Math.max(.2, Math.min(1, o.capWarm ?? o.cap ?? 1)), capC = Math.max(.2, Math.min(1, o.capCool ?? o.cap ?? 1));
    let kW = Math.min(capW, Math.max(.2, o.warm ?? o.level ?? .5)), kC = Math.min(capC, Math.max(.2, o.cool ?? o.level ?? .5)), i = -1, timers = [], over = false, ac = null;
    const H = () => Math.round(150 * kW), C = () => Math.round(35 + 45 * kC);
    const HEADROOM = .8, RAMP_S = 7, FLOOR = .08; let maxW = null, maxC = null; const hit = {}, natural = { warm: null, cool: null };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach((x) => { if (x && x.clear) x.clear(); else { clearTimeout(x); clearInterval(x); } }); timers = []; stopTapping(); stopVoice(); };
    // a soft panned tone confirms left / right by ear too (no tone in the sting: the logo is enough)
    // soft ASMR tapping: short band-passed noise ticks at the given pan, randomly spaced (used for the L / R check and the volume loop)
    let tapT = 0;
    const tapping = (pan) => { stopTapping(); const tick = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.();
        const n = ac.createBufferSource(), b = ac.createBuffer(1, Math.round(ac.sampleRate * .05), ac.sampleRate), d = b.getChannelData(0);
        for (let x = 0; x < d.length; x++) d[x] = (Math.random() * 2 - 1) * Math.exp(-x / (ac.sampleRate * .008));
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200 + Math.random() * 1800; bp.Q.value = 1.4;
        const g = ac.createGain(); g.gain.value = .9 * vol(); n.buffer = b; n.connect(bp); bp.connect(g);
        if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(ac.destination); } else g.connect(ac.destination); n.start(); } catch {}
        tapT = setTimeout(tick, 160 + Math.random() * 260); }; tick(); };
    const stopTapping = () => { clearTimeout(tapT); tapT = 0; };
    let vEl = null, vRaf = 0, vG = null;   // vG: the playing voice's gain, so a volume change is heard at once (not from the next clip on)
    const stopVoice = () => { cancelAnimationFrame(vRaf); vG = null; if (vEl) { try { vEl.pause(); } catch {} vEl = null; } };
    const setVolume = (v) => { volume = Math.max(0, Math.min(1, v)); try { if (vG && ac) vG.gain.setTargetAtTime(2.4 * volume, ac.currentTime, .015); else if (vEl) vEl.volume = volume; } catch {} };
    const near = (t) => t * t * (3 - 2 * t);   // 0 = far … 1 = right at the ear (smoothstep: she stays away, then comes in)
    let voiceDb = null, voiceRange = [0, -99];
    const voiceAt = (url, path, onEnv, onEnd) => {
      stopVoice(); try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); } catch {}
      const a = vEl = new Audio(url); a.crossOrigin = 'anonymous'; let an = null, buf = null, pn = null, dist = null, peak = .02;
      voiceRange = [0, -99]; const RANGE = path.range ?? 30;   // dB from far to right at the ear (user: clearly quiet → clearly loud and intimate)
      try { const src = ac.createMediaElementSource(a), g = vG = ac.createGain(); g.gain.value = 2.4 * vol(); an = ac.createAnalyser(); an.fftSize = 1024; buf = new Float32Array(an.fftSize);
        pn = ac.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.rolloffFactor = 0;   // the panner gives the direction only; loudness = dist below
        dist = ac.createGain(); const lim = ac.createDynamicsCompressor(); lim.threshold.value = -4; lim.knee.value = 3; lim.ratio.value = 20; lim.attack.value = .003; lim.release.value = .12;   // no clipping right at the ear
        src.connect(an); an.connect(g); g.connect(dist); dist.connect(pn); pn.connect(lim); lim.connect(ac.destination); } catch { vG = null; a.volume = vol(); }   // no Web Audio graph: the element's own volume
      const place = (t) => { if (!pn) return; const [x0, z0] = path.from, [x1, z1] = path.to, e = near(t);
        const x = x0 + (x1 - x0) * e, z = z0 + (z1 - z0) * e; if (pn.positionX) { pn.positionX.value = x; pn.positionY.value = 0; pn.positionZ.value = z; } else pn.setPosition(x, 0, z);
        voiceDb = -RANGE * (1 - e); voiceRange = [Math.min(voiceRange[0], voiceDb), Math.max(voiceRange[1], voiceDb)];
        if (dist) { const v = Math.pow(10, voiceDb / 20); if (t === 0) dist.gain.value = v; else dist.gain.setTargetAtTime(v, ac.currentTime, .08); } };   // t = 0: already quiet on the first syllable
      place(0);
      let last = 0;
      const loop = () => { if (vEl !== a) return; vRaf = requestAnimationFrame(loop); const now = performance.now(); if (now - last < 100) return; last = now;
        const t = a.duration ? Math.min(1, a.currentTime / (a.duration * (path.arrive || .6))) : 0; place(t);
        let env = 0; if (an) { an.getFloatTimeDomainData(buf); let s2 = 0; for (const v of buf) s2 += v * v; const rms = Math.sqrt(s2 / buf.length); peak = Math.max(peak * .995, rms); env = rms / peak; }
        else env = a.paused ? 0 : .6;
        onEnv?.(env, near(t)); };   // the thermal follows the same far → near envelope as the sound
      a.addEventListener('ended', () => { if (vEl === a) { stopVoice(); onEnd?.(); } });
      a.play().then(loop).catch(() => { onEnv?.(.6, 1); timers.push(setTimeout(() => { if (vEl === a) { stopVoice(); onEnd?.(); } }, 4000)); });
    };
    const LG = () => (['en', 'ja', 'zh'].includes(lang()) ? lang() : 'en');
    const PATH = { left: { from: [-2.2, -1.6], to: [-.16, 0], arrive: .6 }, right: { from: [2.2, -1.6], to: [.16, 0], arrive: .6 },
      acrossToRight: { from: [-1.8, -1.6], to: [.16, 0], arrive: .7 },
      steady: { from: [0, -1.2], to: [0, -.5], arrive: .6, range: 6 } };   // the volume line: in front, both ears equal and nearly level, so the visitor sets the level they will really hear
    const staffScreen = (title, hint, onRepeat) => {   // big "tell the staff" screen: staff Continue + visitor "Something's wrong" → staff hint
      A.innerHTML = `<div class="staffq"><div class="wave">👋</div><h2>${tx(title)}</h2><div class="row"><button type="button" class="go big1" data-a="go">${tx('staffGo')}</button>
        <button type="button" class="big1" data-a="wrong">${tx('wrong')}</button></div><p class="sub hint" hidden>${tx(hint)}</p><button type="button" class="replay" data-a="again" hidden>${tx('again')}</button></div>`;
      A.querySelector('.staffq').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'go') show(i + 1); else if (b.dataset.a === 'wrong') { A.querySelector('.hint').hidden = false; A.querySelector('[data-a=again]').hidden = false; } else onRepeat(); });
    };
    const tone = (pan, f = 523) => {
      try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.();
        const g = ac.createGain(), os = ac.createOscillator(), p = ac.createStereoPanner ? ac.createStereoPanner() : null; os.type = 'sine'; os.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(.0001 + .2 * vol(), ac.currentTime + .05); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + 1.2);
        os.connect(g); if (p) { p.pan.value = pan; g.connect(p); p.connect(ac.destination); } else g.connect(ac.destination); os.start(); os.stop(ac.currentTime + 1.3); } catch {}
    };
    el.innerHTML = `<div class="mi" role="dialog" aria-live="polite"><div class="stage-a"></div><div class="dots">${STEPS.map(() => '<b></b>').join('')}</div>
      <button type="button" class="skip"></button><p class="nodev"></p></div>`;
    const root = el.firstElementChild, A = root.querySelector('.stage-a');
    // one answer per screen: a quick double tap must not also answer the screen that replaces it (it skipped the whole RIGHT check,
    // final4 E2E 2026-11-10). Button clicks within 350 ms of the content changing, or of the last accepted click, are ignored.
    // (The calibration STOP listens to pointerdown on the root, so it is never held back.)
    let shownAt = 0, clickedAt = 0;
    new MutationObserver(() => { shownAt = performance.now(); }).observe(A, { childList: true });
    A.addEventListener('click', (e) => { if (!e.isTrusted || !e.target.closest?.('button')) return; const n = performance.now();   // real taps only
      if (n - shownAt < 350 || n - clickedAt < 350) { e.stopImmediatePropagation(); e.preventDefault(); return; } clickedAt = n; }, true);
    root.querySelector('.skip').addEventListener('click', () => finish(true));
    const head = () => `<div class="head"><svg viewBox="0 0 145 100" aria-hidden="true"><ellipse cx="72.5" cy="52" rx="34" ry="40" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/>
      <path d="M22 44 Q22 6 72.5 6 Q123 6 123 44" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round"/></svg>
      <span class="ear l">${tx('L')}</span><span class="ear r">${tx('R')}</span></div>`;
    const ears = (l, r) => { const [a, b] = A.querySelectorAll('.ear'); if (a) a.className = `ear l ${l || ''}`; if (b) b.className = `ear r ${r || ''}`; };
    const bar = (s) => `<div class="bar"><i style="transition-duration:${s}s"></i></div>`;
    const runBar = () => requestAnimationFrame(() => requestAnimationFrame(() => { const b = A.querySelector('.bar i'); if (b) b.style.width = '100%'; }));
    const lvl = (k, cool) => { const n = Math.round(k * 10); return `<div class="lvl${cool ? ' cool' : ''}">${Array.from({ length: 10 }, (_, j) => `<i class="${j < n ? 'on' : ''}"></i>`).join('')}</div>`; };
    const paintChrome = () => {
      root.querySelector('.skip').textContent = tx('skip');
      root.querySelectorAll('.dots b').forEach((b, j) => b.classList.toggle('on', j <= i));
      root.querySelector('.nodev').textContent = o.connected && !o.connected() ? tx('noDev') : '';
    };
    function show(n) {
      clear(); i = n; if (i >= STEPS.length) return finish(false);
      if (WO() && (STEPS[i].id === 'cool' || STEPS[i].id === 'ksample')) return show(i + 1);   // warm only (no mist): no cool calibration, no cool sample
      const st = STEPS[i]; paintChrome(); root.dataset.step = st.id;
      document.documentElement.dataset.tint = { warm: 'warm', hsample: 'warm', cool: 'cool', ksample: 'cool' }[st.id] || '';   // kiosk theme B leans warm / cool
      const next = () => show(i + 1);
      if (st.id === 'sting') {
        A.innerHTML = `<div class="logo" style="--p:0%">MoHeat <span>Evo</span></div>${head()}<p class="sub">${tx('stingSub')}</p>`;
        const logo = A.querySelector('.logo');
        ears('cool', 'cool');   // visual only: MoHeat Evo is fitted later (step 5)
        let p = 0; const sweep = setInterval(() => { p = Math.min(100, p + 4); logo.style.setProperty('--p', `${p}%`); if (p >= 100) clearInterval(sweep); }, 60); timers.push(sweep);
        at(1000, () => ears('warm', 'cool')); at(1600, () => ears('warm', 'warm'));
        at(st.s * 1000, next);
      } else if (st.id === 'wear') {
        send('stop');
        A.innerHTML = `<h2>${tx('wear')}</h2>${PHONES}<p class="sub">${tx('wearSub')}</p><div class="row"><button type="button" class="go big1">${tx('ready')}</button></div>`;
        A.querySelector('.go').addEventListener('click', next);
        at(st.s * 1000, next);
      } else if (st.id === 'volume') {   // a big slider + a soft chime every second (pictogram, readable without sound)
        A.innerHTML = `<h2>${tx('vol')}</h2><div class="vol"><svg viewBox="0 0 64 48" aria-hidden="true"><path d="M6 17h10l14-11v36L16 31H6z" fill="#fff"/><path d="M38 14q8 10 0 20M45 8q14 16 0 32" stroke="#ffd58a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>
          <input type="range" min="0" max="100" value="${Math.round(volume * 100)}" aria-label="${tx('vol')}"></div><p class="sub">${tx('volSub')}</p><div class="row"><button type="button" class="go">✓</button></div>`;
        const r = A.querySelector('input'); r.addEventListener('input', () => { setVolume(+r.value / 100); o.onVolume?.(volume); clearTimeout(auto); auto = setTimeout(next, st.s * 1000); timers.push(auto); });
        A.querySelector('.go').addEventListener('click', next);
        const say = () => voiceAt(`${MEDIA}voice/koyuki_vol_${LG()}.m4a`, PATH.steady, null, () => at(900, say)); say();   // her line loops while the slider moves
        let auto = setTimeout(next, st.s * 1000); timers.push(auto);
      } else if (st.id === 'lr') {   // L / R check: Homura comes in on the LEFT, Koyuki on the RIGHT (their voices, the visitor's language)
        let side = 'L', gen = 0;
        const ask = (turn) => {
          // one voice loop at a time: a repeat of the previous side's line still waiting in its 1.2 s gap must not play after the switch
          // (it played Homura on the LEFT under "And now on the RIGHT?" and cut Koyuki off — exhibition report 2026-11-10)
          const my = ++gen, L = side === 'L', say = () => { if (my === gen) voiceAt(`${MEDIA}voice/${L ? 'homura' : 'koyuki'}_lr_${LG()}.m4a`, L ? PATH.left : PATH.right, null, () => at(1200, say)); };
          A.innerHTML = `<h2>${tx(L ? 'lrL' : 'lrR')}</h2>${PHONES}<p class="sub">${turn ? `↻ ${tx('turn')}` : tx('lrSub')}</p>
            <div class="row"><button type="button" class="go big1" data-a="y">${tx('yes')}</button><button type="button" class="big1" data-a="n">${tx('no')}</button></div>`;
          A.querySelector(`.phones .${L ? 'l' : 'r'}`)?.classList.add('sound');
          A.querySelector('.row').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
            if (b.dataset.a === 'y') { if (L) { side = 'R'; ask(false); } else next(); } else ask(true); });
          say();
        };
        ask(false); at(st.s * 1000, next);
      } else if (st.id === 'staffA') {
        staffScreen('soundOk', 'hintA', () => show(STEPS.findIndex((x) => x.id === 'lr')));
      } else if (st.id === 'hair') {   // after the earbuds, before MoHeat Evo: the warm / cool pads must touch skin
        A.innerHTML = `<h2>${tx('hair')}</h2>${HAIR}<p class="sub">${tx(WOH() ? 'hairSubW' : 'hairSub')}</p><div class="row"><button type="button" class="go big1">${tx('hairOk')}</button></div>`;
        A.querySelector('.go').addEventListener('click', next);
      } else if (st.id === 'fit') {   // the staff places the MoHeat Evo headset over the earbuds
        A.innerHTML = `<h2>${tx('fit')}</h2>${FIT}<p class="sub">${tx('fitSub')}</p><div class="row"><button type="button" class="go big1">${tx('staffGo')}</button></div>`;
        A.querySelector('.go').addEventListener('click', next);
      } else if (st.id === 'check') {   // left warm, right warm, left cool, right cool, ~2 s each
        const seq = [['l', 'warm', `LH${H()} RH0`], ['r', 'warm', `LH0 RH${H()}`], ['l', 'cool', `LC${C()} RH0`], ['r', 'cool', `LH0 RC${C()}`]].filter((x) => !(WO() && x[1] === 'cool'));
        A.innerHTML = `<h2>${tx('check')}</h2>${head()}<p class="tapnow chk"></p>${o.connected && !o.connected() ? `<p class="devmiss">⚠ ${tx('devMissing')}</p>` : ''}`;
        seq.forEach(([side, kind, cmd], k) => at(k * 2000, () => { send(cmd); ears(side === 'l' ? kind : '', side === 'r' ? kind : '');
          const c = A.querySelector('.chk'); c.textContent = tx('chk')[k]; c.dataset.kind = kind; document.documentElement.dataset.tint = kind; }));
        at(8000, () => { send('stop'); ears('', ''); next(); });
      } else if (st.id === 'staffB') {
        staffScreen('feltOk', 'hintB', () => show(STEPS.findIndex((x) => x.id === 'check')));
      } else if (st.id === 'hsample' || st.id === 'ksample') {   // a character whispers at one ear; the thermal follows her loudness
        const H = st.id === 'hsample', who = H ? 'homura' : 'koyuki', lg = LG();
        const play = () => {
          A.innerHTML = `<div class="sample ${H ? 'warm' : 'cool'}"><img src="${MEDIA}art/${who}_ear.webp" alt=""><div><p class="who">${tx(H ? 'whoH' : 'whoK')}</p>
            ${head()}<p class="line">${tx(H ? 'sampleH' : 'sampleK')}</p></div></div>`;
          // she starts away on the left and comes close to the ear; the thermal = her loudness × how close she is (a voice is warm, Koyuki's breath cool)
          voiceAt(`${MEDIA}voice/${who}_${lg}.m4a`, H ? PATH.left : PATH.right,   // each sample stays on its own side the whole time (Koyuki = right ear, as the screen and the cool say)
            (env, t) => { const e = Math.min(1, env) * t;
            if (H) { const h = env > .06 ? Math.round(150 * kW * e) : 0; send(`LH${h} RH0`); ears(h ? 'warm' : '', ''); }
            else { const cv = env > .06 ? Math.round(35 + 45 * kC * e) : 0; send(`LH0 RC${cv}`); ears('', cv ? 'cool' : ''); }
          }, ask);
        };
        const ask = () => { send('stop'); ears('', '');
          A.innerHTML = `<div class="sample ${H ? 'warm' : 'cool'}"><img src="${MEDIA}art/${who}_ear.webp" alt=""><div><h2>${tx('natural')}</h2>
            <div class="row nat"><button type="button" class="big1" data-n="weak">${tx('weak')}</button><button type="button" class="go big1" data-n="ok">${tx('right')}</button><button type="button" class="big1" data-n="strong">${tx('strong')}</button></div>
            <button type="button" class="replay">${tx('replay')}</button></div></div>`;
          A.querySelector('.replay').addEventListener('click', () => { clear(); play(); at(st.s * 1000, ask); });
          A.querySelector('.nat').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const n = b.dataset.n; natural[H ? 'warm' : 'cool'] = n;
            const f = n === 'weak' ? 1.15 : n === 'strong' ? .85 : 1;
            if (H) kW = Math.round(Math.min(capW, Math.max(FLOOR, kW * f)) * 100) / 100; else kC = Math.round(Math.min(capC, Math.max(FLOOR, kC * f)) * 100) / 100;
            o.onLevel?.({ warm: kW, cool: kC }); b.classList.add('picked'); setTimeout(() => (H ? next() : finish(false)), 600); });
        };
        play(); at(st.s * 1000, () => (H ? next() : finish(false)));
      } else if (st.id === 'warm' || st.id === 'cool') {   // auto-calibration: slow ramp, the visitor taps at "almost too strong"
        const W = st.id === 'warm', cap = W ? capW : capC;
        let k = FLOOR, ramp = 0, stopped = false;
        const out = () => send(W ? `LH${Math.round(150 * k)} RH0` : `LH0 RC${Math.round(35 + 45 * k)}`);
        const meter = () => { const m = A.querySelector('.ramp i'); if (m) m.style.width = `${Math.round(100 * k / cap)}%`; };
        const stop = (how) => {   // a tap / key / Esc, or the cap: output off at once, then record
          if (stopped) return; stopped = true; clearInterval(ramp); send('stop'); ears('', '');
          if (W) { maxW = k; kW = Math.max(FLOOR, Math.round(k * HEADROOM * 100) / 100); } else { maxC = k; kC = Math.max(FLOOR, Math.round(k * HEADROOM * 100) / 100); }
          hit[st.id] = how; o.onLevel?.({ warm: kW, cool: kC, maxWarm: maxW, maxCool: maxC });
          root.removeEventListener('pointerdown', onTap, true); removeEventListener('keydown', onKey, true);
          A.querySelector('.tapzone')?.remove(); const g = document.createElement('p'); g.className = 'sub got'; g.textContent = tx('gotIt') + (W && !only ? ` · ${tx('nextCool')}` : ''); A.appendChild(g);
          at(1600, () => (only && (!W || !only.includes('cool')) ? finish(false) : next()));   // the short pause between warm and cool, then the samples
        };
        // the tap / key that opened this step (a double tap on the staff's Continue, or on the previous step's STOP) must not stop it:
        // input in the first 350 ms of the step is ignored; after that STOP acts at once (safety)
        const armedAt = performance.now() + 350;
        const onTap = (e) => { if (e.target.closest?.('.skip')) return; e.preventDefault(); e.stopPropagation(); if (performance.now() < armedAt) return; stop('tap'); };
        const onKey = (e) => { e.preventDefault(); if (performance.now() < armedAt) return; stop('tap'); };
        A.innerHTML = `<h2>${tx(W ? 'warmQ' : 'coolQ')}</h2>${head()}<div class="ramp${W ? '' : ' cool'}"><i></i></div><p class="tapnow">${tx('almost')}</p>
          <div class="row tapzone"><button type="button" class="go now stopbtn">■ ${tx('stop')}</button></div>`;
        ears(W ? 'warm' : '', W ? '' : 'cool');
        root.addEventListener('pointerdown', onTap, true); addEventListener('keydown', onKey, true);
        timers.push({ clear: () => { clearInterval(ramp); root.removeEventListener('pointerdown', onTap, true); removeEventListener('keydown', onKey, true); } });
        const t0 = Date.now(); out(); meter();
        ramp = setInterval(() => { if (stopped) return; k = Math.min(cap, FLOOR + (cap - FLOOR) * (Date.now() - t0) / (RAMP_S * 1000)); out(); meter(); if (k >= cap) stop('cap'); }, 250);
      }
    }
    function finish(skipped) {
      if (over) return; over = true; clear(); send('stop'); document.documentElement.dataset.tint = '';
      o.onDone?.({ warm: kW, cool: kC, maxWarm: maxW, maxCool: maxC, hit, natural, level: Math.max(kW, kC), skipped, step: STEPS[i]?.id || 'end' });
    }
    const only = o.only || null;   // e.g. ['warm', 'cool']: staff self-calibration runs just those steps
    return { start: () => { over = false; show(only ? STEPS.findIndex((x) => x.id === only[0]) : 0); }, skip: () => finish(true), stop: () => { over = true; clear(); send('stop'); },
      get step() { return STEPS[i]?.id; }, get voiceDb() { return voiceDb; }, get voiceRange() { return voiceRange; }, get level() { return Math.max(kW, kC); }, get warm() { return kW; }, get cool() { return kC; }, log, repaint: () => { if (i >= 0 && !over) show(i); } };
  }
  window.MoHeatIntro = { mount, T, STEPS };
})();
