// MoHeat Evo output test: set each ear to Off / Heat / Cool with a raw PWM value (0–255).
// Sends "L<H|C><pwm> R<H|C><pwm>" (at most 10×/s, only on change); both off → "stop".
const FIRMWARE = { heatMax: 200, coolMin: 35, coolMax: 80 };   // HOT_PWM_MAX, COLD_PWM_MIN/MAX
const PRESETS = { H: [50, 100, 150, 200], C: [35, 50, 65, 80] };
const SEND_INTERVAL = 100;

const $ = (id) => document.getElementById(id);
const logEl = $('log'), lastCmdEl = $('lastCmd'), countdownEl = $('countdown');
const log = (line) => {
  const t = new Date().toLocaleTimeString([], { hour12: false });
  logEl.textContent = (`${t}  ${line}\n` + logEl.textContent).split('\n').slice(0, 300).join('\n');
};

if (!MoHeatDevice.supported) $('unsupported').hidden = false;
const device = MoHeatDevice.create(
  { select: $('portSelect'), addBtn: $('addPort'), connectBtn: $('connectBtn'), status: $('deviceStatus') },
  { log, onConnect: () => { lastSent = ''; }, onDisconnect: () => setAllOff() },
);
let lastSent = '', lastSendAt = 0, offTimer = null, offAt = 0;
const send = (line) => { lastCmdEl.textContent = line; return device.send(line); };

// ---------- Channels ----------
const clamp = (n) => Math.min(255, Math.max(0, Math.round(+n || 0)));
const channels = [...document.querySelectorAll('.ch')].map((el) => ({
  el, side: el.dataset.side, mode: 'off', pwm: 100,
  out: el.querySelector('.ch-out'), seg: [...el.querySelectorAll('.seg button')],
  range: el.querySelector('.pwm-range'), num: el.querySelector('.pwm-num'),
  presets: el.querySelector('.presets'), warn: el.querySelector('.warn'),
}));
const other = (ch) => channels.find((c) => c !== ch);
const part = (ch) => (ch.mode === 'off' ? `${ch.side}H0` : `${ch.side}${ch.mode}${ch.pwm}`);
const command = () => (channels.every((c) => c.mode === 'off' || c.pwm === 0) ? 'stop' : channels.map(part).join(' '));

function render(ch) {
  ch.el.classList.toggle('heat', ch.mode === 'H');
  ch.el.classList.toggle('cool', ch.mode === 'C');
  ch.el.classList.toggle('off', ch.mode === 'off');
  ch.seg.forEach((b) => b.classList.toggle('on', b.dataset.mode === ch.mode));
  ch.range.value = ch.num.value = ch.pwm;
  ch.out.textContent = ch.mode === 'off' || ch.pwm === 0 ? 'Off' : `${ch.mode}${ch.pwm}`;
  ch.presets.innerHTML = ch.mode === 'off' ? '' : PRESETS[ch.mode].map((v) => `<button type="button" data-v="${v}">${v}</button>`).join('');
  let warn = '';
  if (ch.mode === 'H' && ch.pwm > FIRMWARE.heatMax) warn = `Above the firmware heat maximum (${FIRMWARE.heatMax}). Check skin temperature.`;
  if (ch.mode === 'C' && ch.pwm > FIRMWARE.coolMax) warn = `Above the firmware cool maximum (${FIRMWARE.coolMax}).`;
  if (ch.mode === 'C' && ch.pwm > 0 && ch.pwm < FIRMWARE.coolMin) warn = `Below ${FIRMWARE.coolMin} the mist is usually not perceptible.`;
  ch.warn.textContent = warn; ch.warn.hidden = !warn;
}

function update(ch, patch, fromLink = false) {
  Object.assign(ch, patch);
  render(ch);
  if ($('link').checked && !fromLink) update(other(ch), patch, true);
  if (!fromLink) armAutoOff();
}

channels.forEach((ch) => {
  ch.seg.forEach((b) => b.addEventListener('click', () => update(ch, { mode: b.dataset.mode })));
  ch.range.addEventListener('input', () => update(ch, { pwm: clamp(ch.range.value) }));
  ch.num.addEventListener('change', () => update(ch, { pwm: clamp(ch.num.value) }));
  ch.presets.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) update(ch, { pwm: +b.dataset.v }); });
  render(ch);
});
$('link').addEventListener('change', () => { if ($('link').checked) update(channels[1], { mode: channels[0].mode, pwm: channels[0].pwm }, true); });

// ---------- Auto-off ----------
function setAllOff() {
  channels.forEach((ch) => { ch.mode = 'off'; render(ch); });
  clearTimeout(offTimer); offTimer = null; countdownEl.textContent = '';
}
function armAutoOff() {
  clearTimeout(offTimer); offTimer = null; countdownEl.textContent = '';
  if (!$('autoOff').checked || command() === 'stop') return;
  const sec = Math.min(600, Math.max(1, +$('autoOffSec').value || 10));
  offAt = performance.now() + sec * 1000;
  offTimer = setTimeout(() => { setAllOff(); log('auto-off'); }, sec * 1000);
}
setInterval(() => {
  countdownEl.textContent = offTimer ? `Auto-off in ${Math.ceil((offAt - performance.now()) / 1000)} s` : '';
}, 250);
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
  lastSent = command();   // don't overwrite it; the next slider change takes over again
});

// ---------- Send loop ----------
setInterval(() => {
  const now = performance.now();
  if (now - lastSendAt < SEND_INTERVAL) return;
  const cmd = command();
  if (cmd !== lastSent) { send(cmd); lastSent = cmd; lastSendAt = now; }
}, 25);
