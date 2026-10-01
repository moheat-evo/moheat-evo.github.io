// MoHeat Evo device control: YouTube (tab audio) or an uploaded video/audio file → per-ear level → serial commands.
// Firmware protocol (arduino/MoHeatEvoArduino.ino): one line per command, e.g. "LH120 RC50\n"; "stop" turns everything off.

// ---------- Constants ----------
const SEND_INTERVAL = 100;      // ms → at most 10 commands per second
const TICK = 50;                // ms between level updates
const SMOOTH = .18;             // thermal inertia per tick
const PEAK_DECAY = .004;        // auto-normalize: reference level falls ~0.08/s after a loud passage
const PEAK_FLOOR = .25;         // never treat near-silence as "loudest"
const SPP_UUID = '00001101-0000-1000-8000-00805f9b34fb';
const DEFAULT_RANGE = { heatMin: 0, heatMax: 200, coolMin: 35, coolMax: 80 };   // firmware HOT_PWM_MIN/MAX, COLD_PWM_MIN/MAX
let lastSent = '', lastSendAt = 0;

// ---------- Mapping ----------
// v: −100 (max cool) … 0 (off) … +100 (max warm)
const toPwm = (v, r) => {
  const a = Math.min(1, Math.abs(v) / 100);
  if (a < .01) return { type: 'H', pwm: 0 };
  if (v > 0) return { type: 'H', pwm: Math.round(r.heatMin + a * (r.heatMax - r.heatMin)) };
  return { type: 'C', pwm: Math.round(r.coolMin + a * (r.coolMax - r.coolMin)) };
};
const buildCommand = (l, rgt, r) => {
  const L = toPwm(l, r), R = toPwm(rgt, r);
  if (L.pwm === 0 && R.pwm === 0) return 'stop';
  return `L${L.type}${L.pwm} R${R.type}${R.pwm}`;
};
// Raw loudness 0…1 (−50 dB → 0, −10 dB → 1)
const levelFrom = (an, buf) => {
  an.getFloatTimeDomainData(buf);
  let sum = 0;
  for (const s of buf) sum += s * s;
  const db = 10 * Math.log10(sum / buf.length + 1e-12);
  return Math.min(1, Math.max(0, (db + 50) / 40));
};
// Raw levels → drive 0…1, so the loudest part of the content can reach full output.
const shape = (raw, st, cfg) => {
  const gate = cfg.gate;
  if (cfg.auto) {
    st.peak = Math.max(st.peak - PEAK_DECAY, ...raw, PEAK_FLOOR);
    return raw.map((x) => Math.min(1, Math.max(0, (x - gate) / Math.max(.05, st.peak - gate))));
  }
  return raw.map((x) => Math.min(1, Math.max(0, (x - gate) / (1 - gate) * cfg.gain)));
};
const describe = (v) => {
  const a = Math.round(Math.abs(v));
  return a === 0 ? 'Off' : `${a}% ${v < 0 ? 'cooling' : 'warmth'}`;
};

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const portSelect = $('portSelect'), addPortBtn = $('addPort'), connectBtn = $('connectBtn');
const deviceStatus = $('deviceStatus'), sourceStatus = $('sourceStatus');
const ytForm = $('ytForm'), ytUrl = $('ytUrl'), playerWrap = $('playerWrap'), syncBtn = $('syncBtn');
const mediaFile = $('mediaFile'), mediaEl = $('mediaEl');
const temp = $('tempRange'), tempValue = $('tempValue'), lastCmdEl = $('lastCmd'), logEl = $('log');
const autoNorm = $('autoNorm'), gain = $('gain'), gate = $('gate');
const rangeInputs = { heatMin: $('heatMin'), heatMax: $('heatMax'), coolMin: $('coolMin'), coolMax: $('coolMax') };
const ears = [...document.querySelectorAll('.ear')].map((card) => ({
  card, val: card.querySelector('.ear-val'), meter: card.querySelector('.meter i'), pwm: card.querySelector('.ear-pwm'), v: 0,
}));

const setStatus = (el, text, cls = '') => { el.className = `status ${cls}`; el.querySelector('span').textContent = text; };
const log = (line) => {
  const t = new Date().toLocaleTimeString([], { hour12: false });
  logEl.textContent = (`${t}  ${line}\n` + logEl.textContent).split('\n').slice(0, 200).join('\n');
};
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(`moheat.${k}`)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(`moheat.${k}`, JSON.stringify(v)); } catch {} },
};

const supported = 'serial' in navigator && !!navigator.mediaDevices?.getDisplayMedia;
if (!supported) {
  $('unsupported').hidden = false;
  addPortBtn.disabled = connectBtn.disabled = true;
}

// ---------- Settings: output range + level response ----------
let range = { ...DEFAULT_RANGE, ...store.get('range', {}) };
const clampPwm = (n) => Math.min(255, Math.max(0, Math.round(+n || 0)));
const syncRangeInputs = () => Object.entries(rangeInputs).forEach(([k, el]) => { el.value = range[k]; });
Object.entries(rangeInputs).forEach(([k, el]) => el.addEventListener('change', () => {
  range[k] = clampPwm(el.value);
  if (range.heatMin > range.heatMax) range.heatMin = range.heatMax;
  if (range.coolMin > range.coolMax) range.coolMin = range.coolMax;
  syncRangeInputs(); store.set('range', range); lastSent = '';
}));
$('resetRange').addEventListener('click', () => { range = { ...DEFAULT_RANGE }; syncRangeInputs(); store.set('range', range); lastSent = ''; });
syncRangeInputs();

const resp = { auto: store.get('auto', true), gain: store.get('gain', 1), gate: store.get('gate', 8) / 100 };
const peakState = { peak: PEAK_FLOOR };
autoNorm.checked = resp.auto; gain.value = resp.gain; gate.value = Math.round(resp.gate * 100);
const updateResp = () => {
  resp.auto = autoNorm.checked; resp.gain = +gain.value; resp.gate = +gate.value / 100;
  $('gainValue').textContent = `×${resp.gain.toFixed(1)}`;
  $('gateValue').textContent = `${gate.value}%`;
  $('gainField').classList.toggle('disabled', resp.auto);
  gain.disabled = resp.auto;
  store.set('auto', resp.auto); store.set('gain', resp.gain); store.set('gate', +gate.value);
};
[autoNorm, gain, gate].forEach((el) => el.addEventListener('input', updateResp));
updateResp();

// ---------- Serial ----------
const VENDORS = { 0x10c4: 'Silicon Labs CP210x', 0x1a86: 'WCH CH340', 0x303a: 'Espressif', 0x0403: 'FTDI', 0x2341: 'Arduino' };
let ports = [], port = null, writer = null, reader = null, readClosed = null, writeChain = Promise.resolve();
const enc = new TextEncoder();

const portLabel = (p, i) => {
  const info = p.getInfo();
  if (info.bluetoothServiceClassId) return `#${i + 1} Bluetooth serial`;
  if (info.usbVendorId != null) {
    const hex = (n) => n.toString(16).padStart(4, '0');
    return `#${i + 1} ${VENDORS[info.usbVendorId] || 'USB serial'} (${hex(info.usbVendorId)}:${hex(info.usbProductId)})`;
  }
  return `#${i + 1} Serial port`;
};

async function refreshPorts(prefer) {
  if (!supported) return;
  const keep = prefer || ports[portSelect.selectedIndex];
  ports = await navigator.serial.getPorts();
  portSelect.innerHTML = '';
  if (!ports.length) {
    portSelect.add(new Option('No authorized device — click “+ Add”', ''));
    portSelect.disabled = true;
  } else {
    ports.forEach((p, i) => portSelect.add(new Option(portLabel(p, i) + (p === port ? ' — connected' : ''), i)));
    portSelect.disabled = !!port;
    const idx = ports.indexOf(keep);
    if (idx >= 0) portSelect.selectedIndex = idx;
  }
  connectBtn.disabled = !port && !ports.length;
}

const send = (line) => {
  lastCmdEl.textContent = line;
  if (!writer) return writeChain;
  writeChain = writeChain.then(() => writer.write(enc.encode(line + '\n'))).then(() => log(`→ ${line}`)).catch((e) => log(`! write failed: ${e.message}`));
  return writeChain;
};
const stopOutput = () => { send('stop'); lastSent = 'stop'; };

async function readLoop() {
  const decoder = new TextDecoderStream();
  readClosed = port.readable.pipeTo(decoder.writable).catch(() => {});
  reader = decoder.readable.getReader();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let n;
      while ((n = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, n).trim(); buf = buf.slice(n + 1);
        if (line) log(`← ${line}`);
      }
    }
  } catch { /* port closed */ }
}

async function connect() {
  const p = ports[portSelect.selectedIndex];
  if (!p) return;
  connectBtn.disabled = true;
  setStatus(deviceStatus, 'Connecting…', 'busy');
  try {
    await p.open({ baudRate: 115200 });
    // Keep the ESP32 out of reset/boot mode on boards with auto-reset wiring.
    await p.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
    port = p;
    writer = port.writable.getWriter();
    readLoop();
    lastSent = '';
    setStatus(deviceStatus, 'Connected', 'ok');
    log(`connected · ${portLabel(p, ports.indexOf(p))}`);
    connectBtn.textContent = 'Disconnect';
    connectBtn.classList.add('is-on');
  } catch (e) {
    setStatus(deviceStatus, `Could not open: ${e.message}`, 'err');
    port = null;
  }
  connectBtn.disabled = false;
  refreshPorts(p);
}

async function disconnect(lost = false) {
  const p = port;
  if (!p) return;
  if (!lost) await send('stop');
  try { await writeChain; } catch {}
  try { await reader?.cancel(); } catch {}
  try { await readClosed; } catch {}
  try { writer?.releaseLock(); } catch {}
  try { if (!lost) await p.close(); } catch {}
  port = writer = reader = null;
  connectBtn.textContent = 'Connect';
  connectBtn.classList.remove('is-on');
  setStatus(deviceStatus, lost ? 'Device disconnected' : 'Not connected', lost ? 'err' : '');
  log(lost ? 'device lost' : 'disconnected');
  refreshPorts(p);
}

if (supported) {
  addPortBtn.addEventListener('click', async () => {
    try {
      const p = await navigator.serial.requestPort({ allowedBluetoothServiceClassIds: [SPP_UUID] });
      await refreshPorts(p);
    } catch { /* picker dismissed */ }
  });
  connectBtn.addEventListener('click', () => (port ? disconnect() : connect()));
  navigator.serial.addEventListener('connect', () => refreshPorts());
  navigator.serial.addEventListener('disconnect', (e) => { if (e.target === port) disconnect(true); else refreshPorts(); });
  refreshPorts();
}

// ---------- Sources ----------
let ctx = null, mode = null;                 // 'youtube' | 'file'
let tabStream = null, tabAnalysers = null;   // YouTube via tab-audio capture
let fileAnalysers = null;                    // uploaded file via <video>
let ytPlayer = null, ytPlaying = false, ytApiReady = false, pendingVideo = null;
const timeBuf = new Float32Array(2048);

const ensureCtx = () => { ctx ??= new AudioContext(); return ctx.resume(); };
const makeAnalysers = (source) => {
  const splitter = ctx.createChannelSplitter(2);
  source.connect(splitter);
  return [0, 1].map((i) => { const an = ctx.createAnalyser(); an.fftSize = 2048; splitter.connect(an, i); return an; });
};

function useMode(m) {
  mode = m;
  peakState.peak = PEAK_FLOOR;
  playerWrap.classList.add('has-media');
  const yt = m === 'youtube';
  mediaEl.hidden = yt;
  const frame = ytPlayer?.getIframe?.();
  if (frame) frame.style.display = yt ? '' : 'none';
  syncBtn.hidden = !yt;
  if (yt) { if (!mediaEl.paused) mediaEl.pause(); }
  else { ytPlayer?.pauseVideo?.(); if (tabStream) stopSync(); }
}

const parseYouTube = (raw) => {
  try {
    const u = new URL(raw.trim());
    let id = null;
    if (u.hostname.endsWith('youtu.be')) id = u.pathname.slice(1);
    else if (u.searchParams.get('v')) id = u.searchParams.get('v');
    else { const m = u.pathname.match(/\/(embed|shorts|live|v)\/([^/?#]+)/); if (m) id = m[2]; }
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const t = u.searchParams.get('t') || u.searchParams.get('start') || '0';
    return { id, start: parseInt(t, 10) || 0 };
  } catch { return null; }
};

window.onYouTubeIframeAPIReady = () => { ytApiReady = true; if (pendingVideo) loadVideo(pendingVideo); };

function loadVideo(v) {
  if (!ytApiReady) { pendingVideo = v; setStatus(sourceStatus, 'Loading YouTube player…', 'busy'); return; }
  pendingVideo = null;
  if (ytPlayer) ytPlayer.loadVideoById({ videoId: v.id, startSeconds: v.start });
  else {
    ytPlayer = new YT.Player('ytPlayer', {
      videoId: v.id, host: 'https://www.youtube-nocookie.com',
      playerVars: { rel: 0, playsinline: 1, start: v.start },
      events: { onStateChange: (e) => onYtState(e.data) },
    });
  }
  useMode('youtube');
  syncBtn.disabled = !supported;
  setStatus(sourceStatus, tabAnalysers ? 'Thermal sync on — play the video' : 'Start thermal sync, then play', tabAnalysers ? 'ok' : '');
}

function onYtState(state) {
  const was = ytPlaying;
  ytPlaying = state === YT.PlayerState.PLAYING;
  if (ytPlaying && !was) peakState.peak = PEAK_FLOOR;
  if (was && !ytPlaying) stopOutput();
}

ytForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = parseYouTube(ytUrl.value);
  if (!v) { setStatus(sourceStatus, 'Not a YouTube video link', 'err'); return; }
  loadVideo(v);
});

async function startSync() {
  await ensureCtx();
  let stream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 2, suppressLocalAudioPlayback: false },
      preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude', systemAudio: 'exclude',
    });
  } catch {
    setStatus(sourceStatus, 'Sharing was cancelled', 'err'); return;
  }
  const track = stream.getAudioTracks()[0];
  if (!track) {
    stream.getTracks().forEach((t) => t.stop());
    setStatus(sourceStatus, 'No audio — choose “This tab” and turn on “Share tab audio”', 'err'); return;
  }
  tabStream = stream;
  tabAnalysers = makeAnalysers(ctx.createMediaStreamSource(new MediaStream([track])));
  track.addEventListener('ended', stopSync);
  const ch = track.getSettings().channelCount;
  syncBtn.textContent = 'Stop thermal sync';
  syncBtn.classList.add('is-on');
  setStatus(sourceStatus, `Thermal sync on · ${ch === 1 ? 'mono (both ears equal)' : 'stereo'} — play the video`, 'ok');
  log(`tab audio captured (${ch || '?'} ch)`);
}

function stopSync() {
  tabStream?.getTracks().forEach((t) => t.stop());
  tabStream = tabAnalysers = null;
  syncBtn.textContent = 'Start thermal sync';
  syncBtn.classList.remove('is-on');
  if (mode === 'youtube') setStatus(sourceStatus, 'Thermal sync off');
  stopOutput();
}
syncBtn.addEventListener('click', () => (tabStream ? stopSync() : startSync()));

mediaFile.addEventListener('change', async () => {
  const f = mediaFile.files[0];
  if (!f) return;
  await ensureCtx();
  if (!fileAnalysers) {
    const src = ctx.createMediaElementSource(mediaEl);
    src.connect(ctx.destination);
    fileAnalysers = makeAnalysers(src);
  }
  if (mediaEl.src) URL.revokeObjectURL(mediaEl.src);
  mediaEl.src = URL.createObjectURL(f);
  useMode('file');
  setStatus(sourceStatus, `${f.type.startsWith('video/') ? 'Video' : 'Audio'} · ${f.name}`, 'ok');
  mediaEl.play().catch(() => {});
});
mediaEl.addEventListener('play', () => { peakState.peak = PEAK_FLOOR; });
['pause', 'ended'].forEach((ev) => mediaEl.addEventListener(ev, stopOutput));

// ---------- Temperature slider ----------
const updateTemp = () => {
  if (Math.abs(+temp.value) < 6) temp.value = 0;
  const v = +temp.value;
  tempValue.textContent = describe(v);
  tempValue.classList.toggle('cool', v < 0);
};
temp.addEventListener('input', updateTemp); updateTemp();

// ---------- Main loop ----------
setInterval(() => {
  const setting = +temp.value;
  const an = mode === 'youtube' && tabAnalysers && ytPlaying ? tabAnalysers
    : mode === 'file' && fileAnalysers && !mediaEl.paused ? fileAnalysers : null;
  const drive = an ? shape(an.map((a) => levelFrom(a, timeBuf)), peakState, resp) : [0, 0];
  ears.forEach((e, i) => {
    const target = setting * drive[i];
    e.v += (target - e.v) * SMOOTH;
    if (Math.abs(e.v - target) < .5) e.v = target;
  });
  const now = performance.now();
  if (now - lastSendAt >= SEND_INTERVAL) {
    const cmd = buildCommand(ears[0].v, ears[1].v, range);
    if (cmd !== lastSent) { send(cmd); lastSent = cmd; lastSendAt = now; }
  }
}, TICK);

const render = () => {
  ears.forEach((e) => {
    const a = Math.round(Math.abs(e.v)), cool = e.v < 0, p = toPwm(e.v, range);
    e.val.textContent = describe(e.v);
    e.val.classList.toggle('cool', cool && a > 0);
    e.meter.style.width = `${a}%`;
    e.meter.style.background = cool ? 'var(--cool)' : 'var(--warm)';
    e.card.style.boxShadow = a ? `0 0 ${10 + a / 3}px ${cool ? 'rgba(95,178,255,.35)' : 'rgba(255,122,92,.35)'}` : 'none';
    e.pwm.textContent = p.pwm ? `${p.type}${p.pwm}` : 'off';
  });
  requestAnimationFrame(render);
};
requestAnimationFrame(render);

// ---------- Safety ----------
$('estop').addEventListener('click', () => {
  temp.value = 0; updateTemp();
  ears.forEach((e) => { e.v = 0; });
  ytPlayer?.pauseVideo?.();
  mediaEl.pause();
  if (tabStream) stopSync();
  stopOutput();
  log('EMERGENCY STOP');
});
addEventListener('pagehide', () => { if (writer) writer.write(enc.encode('stop\n')).catch(() => {}); });
