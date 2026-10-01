// MoHeat Evo output test: one bar per ear, −100 % (max cool) … 0 (off) … +100 % (max warm).
// 1–100 % maps linearly to the output range (min–max PWM), shared with control.html.
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
// v: −100 … 0 … +100  →  { mode: 'C' | 'H' | 'off', pwm }
const toOut = (v) => {
  const a = Math.abs(v);
  if (a < 1) return { mode: 'off', pwm: 0 };
  const [lo, hi] = v > 0 ? [range.heatMin, range.heatMax] : [range.coolMin, range.coolMax];
  return { mode: v > 0 ? 'H' : 'C', pwm: Math.round(lo + (a / 100) * (hi - lo)) };
};
const channels = [...document.querySelectorAll('.ch')].map((el) => ({
  el, side: el.dataset.side, v: 0,
  slider: el.querySelector('.bipolar'), presets: [...el.querySelectorAll('.presets button')],
  fill: el.querySelector('.g-fill'), pctEl: el.querySelector('.g-pct'), modeEl: el.querySelector('.g-mode'), pwmEl: el.querySelector('.ch-pwm'),
  cup: document.querySelector(el.dataset.side === 'L' ? '.cup-l' : '.cup-r'),
  aura: document.querySelector(el.dataset.side === 'L' ? '.aura-l' : '.aura-r'),
}));
const other = (ch) => channels.find((c) => c !== ch);
const active = (ch) => toOut(ch.v).pwm > 0;
const command = () => (channels.some(active)
  ? channels.map((c) => { const o = toOut(c.v); return o.pwm > 0 ? `${c.side}${o.mode}${o.pwm}` : `${c.side}H0`; }).join(' ')
  : 'stop');

function render(ch) {
  const o = toOut(ch.v), on = o.pwm > 0, a = Math.abs(ch.v);
  ch.el.classList.toggle('heat', on && o.mode === 'H');
  ch.el.classList.toggle('cool', on && o.mode === 'C');
  ch.el.classList.toggle('off', !on);
  ch.presets.forEach((b) => b.classList.toggle('on', +b.dataset.v === ch.v));
  ch.slider.value = ch.v;
  ch.pctEl.innerHTML = `${on ? a : 0}<small>%</small>`;
  ch.modeEl.textContent = !on ? 'Off' : o.mode === 'H' ? 'Heat' : 'Cool';
  ch.pwmEl.textContent = on ? `${o.mode}${o.pwm}` : 'off';
  ch.fill.style.strokeDashoffset = ARC * (1 - (on ? a : 0) / 100);
  const rgb = o.mode === 'C' ? '95,178,255' : '255,122,92';
  ch.cup.style.background = on ? (o.mode === 'C' ? '#cfe6ff' : '#ffd2c4') : '#eee8e7';
  ch.cup.style.boxShadow = on ? `0 0 ${12 + a / 3}px rgba(${rgb},${.25 + a / 140})` : 'none';
  ch.aura.style.background = `rgb(${rgb})`;
  ch.aura.style.opacity = on ? (a / 100) * .55 : 0;
  previewEl.textContent = command();
}

function update(ch, v, fromLink = false) {
  ch.v = Math.abs(v) < 4 ? 0 : Math.max(-100, Math.min(100, Math.round(v)));   // snap to Off near the centre
  render(ch);
  if ($('link').checked && !fromLink) update(other(ch), ch.v, true);
  if (!fromLink) armAutoOff();
}

channels.forEach((ch) => {
  ch.slider.addEventListener('input', () => update(ch, +ch.slider.value));
  ch.presets.forEach((b) => b.addEventListener('click', () => update(ch, +b.dataset.v)));
});
$('link').addEventListener('change', () => { if ($('link').checked) update(channels[1], channels[0].v, true); });
syncRange();

// ---------- Auto-off ----------
function setAllOff() {
  channels.forEach((ch) => { ch.v = 0; render(ch); });
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
