// MoHeat Evo output test: each ear is Off / Heat / Cool at 0–100 %.
// 0 % is off; 1–100 % maps linearly to the output range (min–max PWM), shared with control.html.
// Sends "L<H|C><pwm> R<H|C><pwm>" (≤10×/s, only on change); both off → "stop".
const DEFAULT_RANGE = { heatMin: 0, heatMax: 200, coolMin: 35, coolMax: 80 };   // firmware HOT_PWM_MIN/MAX, COLD_PWM_MIN/MAX
const FIRMWARE_MAX = { heat: 200, cool: 80 };
const SEND_INTERVAL = 100;
const ARC = 377;   // gauge arc length (270° of r = 80)

const $ = (id) => document.getElementById(id);
const logEl = $('log'), lastCmdEl = $('lastCmd'), countdownEl = $('countdown'), previewEl = $('cmdPreview');
const log = (line) => {
  const t = new Date().toLocaleTimeString([], { hour12: false });
  logEl.textContent = (`${t}  ${line}\n` + logEl.textContent).split('\n').slice(0, 300).join('\n');
};
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(`moheat.${k}`)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(`moheat.${k}`, JSON.stringify(v)); } catch {} },
};

let lastSent = '', lastSendAt = 0, offTimer = null, offAt = 0;
if (!MoHeatDevice.supported) $('unsupported').hidden = false;
const device = MoHeatDevice.create(
  { select: $('portSelect'), addBtn: $('addPort'), connectBtn: $('connectBtn'), status: $('deviceStatus') },
  { log, onConnect: () => { lastSent = ''; }, onDisconnect: () => setAllOff() },
);
const send = (line) => { lastCmdEl.textContent = line; return device.send(line); };

// ---------- Output range (shared with control.html) ----------
let range = { ...DEFAULT_RANGE, ...store.get('range', {}) };
const rangeInputs = { heatMin: $('heatMin'), heatMax: $('heatMax'), coolMin: $('coolMin'), coolMax: $('coolMax') };
const clampPwm = (n) => Math.min(255, Math.max(0, Math.round(+n || 0)));
function syncRange() {
  Object.entries(rangeInputs).forEach(([k, el]) => { el.value = range[k]; });
  const over = range.heatMax > FIRMWARE_MAX.heat || range.coolMax > FIRMWARE_MAX.cool;
  const note = $('rangeNote');
  note.textContent = over
    ? `Above the firmware maximum (heat ${FIRMWARE_MAX.heat} / cool ${FIRMWARE_MAX.cool}) — check skin temperature.`
    : '0% is off · 1–100% maps to min–max · shared with Media control';
  note.classList.toggle('warn', over);
  channels.forEach(render);
}
Object.entries(rangeInputs).forEach(([k, el]) => el.addEventListener('change', () => {
  range[k] = clampPwm(el.value);
  if (range.heatMin > range.heatMax) range.heatMin = range.heatMax;
  if (range.coolMin > range.coolMax) range.coolMin = range.coolMax;
  store.set('range', range); syncRange();
}));
$('resetRange').addEventListener('click', () => { range = { ...DEFAULT_RANGE }; store.set('range', range); syncRange(); });

// ---------- Channels ----------
const toPwm = (mode, pct) => {
  if (mode === 'off' || pct <= 0) return 0;
  const [lo, hi] = mode === 'H' ? [range.heatMin, range.heatMax] : [range.coolMin, range.coolMax];
  return Math.round(lo + (pct / 100) * (hi - lo));
};
const channels = [...document.querySelectorAll('.ch')].map((el) => ({
  el, side: el.dataset.side, mode: 'off', pct: 50,
  seg: [...el.querySelectorAll('.seg button')], slider: el.querySelector('.pct'),
  presets: [...el.querySelectorAll('.presets button')],
  fill: el.querySelector('.g-fill'), pctEl: el.querySelector('.g-pct'), modeEl: el.querySelector('.g-mode'), pwmEl: el.querySelector('.ch-pwm'),
  cup: document.querySelector(el.dataset.side === 'L' ? '.cup-l' : '.cup-r'),
  aura: document.querySelector(el.dataset.side === 'L' ? '.aura-l' : '.aura-r'),
}));
const other = (ch) => channels.find((c) => c !== ch);
const active = (ch) => ch.mode !== 'off' && toPwm(ch.mode, ch.pct) > 0;
const command = () => (channels.some(active)
  ? channels.map((c) => (active(c) ? `${c.side}${c.mode}${toPwm(c.mode, c.pct)}` : `${c.side}H0`)).join(' ')
  : 'stop');

function render(ch) {
  const on = active(ch), pwm = toPwm(ch.mode, ch.pct);
  ch.el.classList.toggle('heat', on && ch.mode === 'H');
  ch.el.classList.toggle('cool', on && ch.mode === 'C');
  ch.el.classList.toggle('off', ch.mode === 'off');
  ch.seg.forEach((b) => b.classList.toggle('on', b.dataset.mode === ch.mode));
  ch.presets.forEach((b) => b.classList.toggle('on', ch.mode !== 'off' && +b.dataset.p === ch.pct));
  ch.slider.value = ch.pct;
  const shown = ch.mode === 'off' ? 0 : ch.pct;
  ch.pctEl.innerHTML = `${shown}<small>%</small>`;
  ch.modeEl.textContent = !on ? 'Off' : ch.mode === 'H' ? 'Heat' : 'Cool';
  ch.pwmEl.textContent = on ? `${ch.mode}${pwm}` : 'off';
  ch.fill.style.strokeDashoffset = ARC * (1 - shown / 100);
  const rgb = ch.mode === 'C' ? '95,178,255' : '255,122,92', a = on ? .25 + shown / 140 : 0;
  ch.cup.style.background = on ? (ch.mode === 'C' ? '#cfe6ff' : '#ffd2c4') : '#eee8e7';
  ch.cup.style.boxShadow = on ? `0 0 ${12 + shown / 3}px rgba(${rgb},${a})` : 'none';
  ch.aura.style.background = `rgb(${rgb})`;
  ch.aura.style.opacity = on ? (shown / 100) * .55 : 0;
  previewEl.textContent = command();
}

function update(ch, patch, fromLink = false) {
  Object.assign(ch, patch);
  render(ch);
  if ($('link').checked && !fromLink) update(other(ch), patch, true);
  if (!fromLink) armAutoOff();
}

channels.forEach((ch) => {
  ch.seg.forEach((b) => b.addEventListener('click', () => update(ch, { mode: b.dataset.mode })));
  ch.slider.addEventListener('input', () => update(ch, { pct: +ch.slider.value }));
  ch.presets.forEach((b) => b.addEventListener('click', () => update(ch, { pct: +b.dataset.p, ...(ch.mode === 'off' ? { mode: 'H' } : {}) })));
});
$('link').addEventListener('change', () => { if ($('link').checked) update(channels[1], { mode: channels[0].mode, pct: channels[0].pct }, true); });
syncRange();

// ---------- Auto-off ----------
function setAllOff() {
  channels.forEach((ch) => { ch.mode = 'off'; render(ch); });
  clearTimeout(offTimer); offTimer = null;
}
function armAutoOff() {
  clearTimeout(offTimer); offTimer = null;
  if (!$('autoOff').checked || command() === 'stop') return;
  const sec = Math.min(600, Math.max(1, +$('autoOffSec').value || 10));
  offAt = performance.now() + sec * 1000;
  offTimer = setTimeout(() => { setAllOff(); log('auto-off'); }, sec * 1000);
}
setInterval(() => {
  countdownEl.textContent = offTimer ? `Auto-off in ${Math.max(0, Math.ceil((offAt - performance.now()) / 1000))} s` : '';
}, 200);
$('autoOff').addEventListener('change', armAutoOff);
$('autoOffSec').addEventListener('change', armAutoOff);
$('allOff').addEventListener('click', () => { setAllOff(); send('stop'); lastSent = 'stop'; });
$('estop').addEventListener('click', () => { setAllOff(); send('stop'); lastSent = 'stop'; log('EMERGENCY STOP'); });

// ---------- Raw command ----------
$('rawForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const line = $('raw').value.trim();
  if (!line) return;
  send(line);
  lastSent = command();   // don't overwrite it; the next change takes over again
});

// ---------- Send loop ----------
setInterval(() => {
  const now = performance.now();
  if (now - lastSendAt < SEND_INTERVAL) return;
  const cmd = command();
  if (cmd !== lastSent) { send(cmd); lastSent = cmd; lastSendAt = now; }
}, 25);
