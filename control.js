// MoHeat Evo device control: YouTube (tab audio) or an audio file → per-ear level → serial commands.
// Firmware protocol (arduino/MoHeatEvoArduino.ino): one line per command, e.g. "LH120 RC50\n"; "stop" turns everything off.

// ---------- Mapping (same parameters as the firmware) ----------
const HEAT_MAX = 200;           // HOT_PWM_MAX
const COOL_MIN = 35;            // COLD_PWM_MIN
const COOL_MAX = 80;            // COLD_PWM_MAX
const SEND_INTERVAL = 100;      // ms → 10 commands per second at most
const TICK = 50;                // ms between level updates
const SMOOTH = .18;             // thermal inertia per tick
const SPP_UUID = '00001101-0000-1000-8000-00805f9b34fb';
let lastSent = '', lastSendAt = 0;   // last serial command and when it went out

// v: −100 (max cool) … 0 (off) … +100 (max warm)
const toPwm = (v) => {
  const a = Math.min(1, Math.abs(v) / 100);
  if (a < .01) return { type: 'H', pwm: 0 };
  if (v > 0) return { type: 'H', pwm: Math.round(a * HEAT_MAX) };
  return { type: 'C', pwm: Math.round(COOL_MIN + a * (COOL_MAX - COOL_MIN)) };
};
const buildCommand = (l, r) => {
  const L = toPwm(l), R = toPwm(r);
  if (L.pwm === 0 && R.pwm === 0) return 'stop';
  return `L${L.type}${L.pwm} R${R.type}${R.pwm}`;
};
const levelFrom = (an, buf) => {
  an.getFloatTimeDomainData(buf);
  let sum = 0;
  for (const s of buf) sum += s * s;
  const db = 10 * Math.log10(sum / buf.length + 1e-12);
  return Math.min(1, Math.max(0, (db + 50) / 40)); // −50 dB → 0, −10 dB → 1
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
const audioFile = $('audioFile'), audioEl = $('audioPlayer');
const temp = $('tempRange'), tempValue = $('tempValue'), lastCmdEl = $('lastCmd'), logEl = $('log');
const ears = [...document.querySelectorAll('.ear-card')].map((card) => ({
  card, val: card.querySelector('.ear-val'), meter: card.querySelector('.meter i'), level: card.querySelector('.ear-level'), v: 0, lv: 0,
}));

const setStatus = (el, text, cls = '') => { el.className = `status ${cls}`; el.querySelector('span').textContent = text; };
const log = (line) => {
  const t = new Date().toLocaleTimeString([], { hour12: false });
  logEl.textContent = (`${t}  ${line}\n` + logEl.textContent).split('\n').slice(0, 200).join('\n');
};

const supported = 'serial' in navigator && !!navigator.mediaDevices?.getDisplayMedia;
if (!supported) {
  $('unsupported').hidden = false;
  addPortBtn.disabled = connectBtn.disabled = true;
}

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
    portSelect.add(new Option('No authorized devices — click “Add device…”', ''));
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
    setStatus(deviceStatus, `Connected · ${portLabel(p, ports.indexOf(p))}`, 'ok');
    log('connected');
    connectBtn.textContent = 'Disconnect';
    connectBtn.classList.add('is-on');
  } catch (e) {
    setStatus(deviceStatus, `Could not open port: ${e.message}`, 'err');
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

// ---------- Audio sources ----------
let ctx = null, mode = null;                 // mode: 'youtube' | 'file'
let tabStream = null, tabAnalysers = null;   // YouTube via tab capture
let fileAnalysers = null;                    // audio file via <audio>
let ytPlayer = null, ytPlaying = false, ytApiReady = false, pendingVideo = null;
const timeBuf = new Float32Array(2048);

const makeAnalysers = (source) => {
  const splitter = ctx.createChannelSplitter(2);
  source.connect(splitter);
  return [0, 1].map((i) => { const an = ctx.createAnalyser(); an.fftSize = 2048; splitter.connect(an, i); return an; });
};
const ensureCtx = () => { ctx ??= new AudioContext(); return ctx.resume(); };

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
  playerWrap.classList.add('has-video');
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
  setStatus(sourceStatus, tabAnalysers ? 'Thermal sync on — play the video' : 'Video loaded — start thermal sync, then play', tabAnalysers ? 'ok' : '');
}

function onYtState(state) {
  const was = ytPlaying;
  ytPlaying = state === YT.PlayerState.PLAYING;
  if (was && !ytPlaying) { send('stop'); lastSent = 'stop'; }
}

ytForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = parseYouTube(ytUrl.value);
  if (!v) { setStatus(sourceStatus, 'That doesn’t look like a YouTube video link', 'err'); return; }
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
    setStatus(sourceStatus, 'No audio shared — choose “This tab” and turn on “Share tab audio”', 'err'); return;
  }
  tabStream = stream;
  tabAnalysers = makeAnalysers(ctx.createMediaStreamSource(new MediaStream([track])));
  track.addEventListener('ended', stopSync);
  const ch = track.getSettings().channelCount;
  useMode('youtube');
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
  send('stop'); lastSent = 'stop';
}
syncBtn.addEventListener('click', () => (tabStream ? stopSync() : startSync()));

audioFile.addEventListener('change', async () => {
  const f = audioFile.files[0];
  if (!f) return;
  await ensureCtx();
  if (!fileAnalysers) {
    const src = ctx.createMediaElementSource(audioEl);
    src.connect(ctx.destination);
    fileAnalysers = makeAnalysers(src);
  }
  if (audioEl.src) URL.revokeObjectURL(audioEl.src);
  audioEl.src = URL.createObjectURL(f);
  audioEl.hidden = false;
  if (tabStream) stopSync();
  ytPlayer?.pauseVideo?.();
  useMode('file');
  setStatus(sourceStatus, `Audio file · ${f.name}`, 'ok');
  audioEl.play();
});
['pause', 'ended'].forEach((ev) => audioEl.addEventListener(ev, () => { send('stop'); lastSent = 'stop'; }));

function useMode(m) {
  mode = m;
  if (m !== 'file' && !audioEl.paused) audioEl.pause();
}

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
    : mode === 'file' && fileAnalysers && !audioEl.paused ? fileAnalysers : null;
  ears.forEach((e, i) => {
    e.lv = an ? levelFrom(an[i], timeBuf) : 0;
    const target = setting * e.lv;
    e.v += (target - e.v) * SMOOTH;
    if (Math.abs(e.v - target) < .5) e.v = target;
  });
  const now = performance.now();
  if (now - lastSendAt >= SEND_INTERVAL) {
    const cmd = buildCommand(ears[0].v, ears[1].v);
    if (cmd !== lastSent) { send(cmd); lastSent = cmd; lastSendAt = now; }
  }
}, TICK);

const render = () => {
  ears.forEach((e) => {
    const a = Math.round(Math.abs(e.v)), cool = e.v < 0, p = toPwm(e.v);
    e.val.textContent = describe(e.v);
    e.val.classList.toggle('cool', cool && a > 0);
    e.meter.style.width = `${a}%`;
    e.meter.style.background = cool ? 'var(--cool)' : 'var(--warm)';
    e.card.style.boxShadow = a ? `0 0 ${10 + a / 3}px ${cool ? 'rgba(95,178,255,.35)' : 'rgba(255,122,92,.35)'}` : 'none';
    e.level.textContent = `level ${Math.round(e.lv * 100)}% · ${p.pwm ? p.type + p.pwm : 'off'}`;
  });
  requestAnimationFrame(render);
};
requestAnimationFrame(render);

// ---------- Safety ----------
$('estop').addEventListener('click', () => {
  temp.value = 0; updateTemp();
  ears.forEach((e) => { e.v = 0; });
  ytPlayer?.pauseVideo?.();
  audioEl.pause();
  if (tabStream) stopSync();
  send('stop'); lastSent = 'stop';
  log('EMERGENCY STOP');
});
addEventListener('pagehide', () => { if (writer) writer.write(enc.encode('stop\n')).catch(() => {}); });

// Exposed for testing
window.MoHeatControl = { toPwm, buildCommand, parseYouTube };
