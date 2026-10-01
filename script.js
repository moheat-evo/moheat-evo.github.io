const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } });
},{threshold:.12});
revealEls.forEach(el=>io.observe(el));

// Stereo audio → per-ear thermal preview.
// The slider sets the stimulus (−100 cool … 0 off … +100 warm); each channel's level decides how much of it that ear gets.
// No sound (no file yet, silence, pause, end) means Off.
const SMOOTH = .06;
const WARM = '255,99,69', COOL = '96,178,255';
const demo = document.getElementById('thermalDemo');
const temp = document.getElementById('tempRange');
const tempValue = document.getElementById('tempValue');
const channels = [0, 1].map((i) => {
  const gauge = document.querySelector(`[data-ch="${i}"]`);
  return {
    ear: document.querySelector(i ? '.right-ear' : '.left-ear'),
    aura: document.querySelector(i ? '.td-aura-r' : '.td-aura-l'),
    value: gauge.querySelector('.heat-value'),
    meter: gauge.querySelector('.td-meter i'),
    v: 0,
  };
});
const describe = (v) => {
  const a = Math.round(Math.abs(v));
  return a === 0 ? 'Off' : `${a}% ${v < 0 ? 'cooling' : 'warmth'}`;
};
const renderEar = (ch) => {
  const a = Math.round(Math.abs(ch.v));
  const cool = ch.v < 0;
  const rgb = cool ? COOL : WARM;
  ch.value.textContent = describe(ch.v);
  ch.value.classList.toggle('cool', cool && a > 0);
  ch.meter.style.width = `${a}%`;
  ch.meter.style.background = `rgb(${rgb})`;
  ch.aura.style.background = `radial-gradient(closest-side, rgba(${rgb},.45), transparent)`;
  ch.aura.style.opacity = a / 100;
  ch.ear.style.boxShadow = `0 0 35px rgba(${rgb},${a === 0 ? 0 : Math.max(.12, a/100)})`;
  ch.ear.style.background = cool
    ? `radial-gradient(circle at 50% 50%, rgba(${Math.round(224-a*.9)},${Math.round(236-a*.4)},255,1), #eee8e7 70%)`
    : `radial-gradient(circle at 50% 50%, rgba(255,${Math.round(224-a*.8)},${Math.round(212-a)},1), #eee8e7 70%)`;
};
const updateTemp = () => {
  if (Math.abs(Number(temp.value)) < 6) temp.value = 0; // snap to Off near the centre
  const v = Number(temp.value);
  tempValue.textContent = describe(v);
  tempValue.classList.toggle('cool', v < 0);
};
temp.addEventListener('input', updateTemp); updateTemp();

const audio = document.getElementById('audioPlayer');
const fileInput = document.getElementById('audioFile');
const fileName = document.getElementById('audioName');
const drop = document.querySelector('.td-drop');
const playBtn = document.getElementById('playBtn');
const seek = document.getElementById('audioSeek');
const timeLabel = document.getElementById('audioTime');
const demoStatus = document.getElementById('tdStatus');
const time = new Float32Array(2048);
let ctx, analysers, objectUrl;

const setupAudio = () => {
  ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audio);
  const splitter = ctx.createChannelSplitter(2);
  source.connect(ctx.destination);
  source.connect(splitter);
  analysers = [0, 1].map((i) => {
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    splitter.connect(an, i);
    return an;
  });
};

const channelLevel = (an) => {
  an.getFloatTimeDomainData(time);
  let sum = 0;
  for (const s of time) sum += s * s;
  const db = 10 * Math.log10(sum / time.length + 1e-12);
  return Math.min(1, Math.max(0, (db + 50) / 40)); // -50 dB → 0, -10 dB → 1
};

const tick = () => {
  const setting = Number(temp.value);
  channels.forEach((ch, i) => {
    const target = analysers && !audio.paused ? setting * channelLevel(analysers[i]) : 0;
    // Thermal inertia: temperature follows the audio slowly rather than frame by frame.
    ch.v += (target - ch.v) * SMOOTH;
    if (Math.abs(ch.v - target) < .5) ch.v = target;
    renderEar(ch);
  });
  requestAnimationFrame(tick);
};
tick();

const loadFile = (file) => {
  if (!file || (file.type && !file.type.startsWith('audio/'))) return;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  audio.src = objectUrl;
  fileName.textContent = file.name;
  playBtn.disabled = seek.disabled = false;
  if (!ctx) setupAudio();
  ctx.resume();
  audio.play();
};
fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('is-over'); loadFile(e.dataTransfer.files[0]); });

const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const syncPlayer = () => {
  const playing = !audio.paused;
  demo.classList.toggle('is-playing', playing);
  playBtn.classList.toggle('is-playing', playing);
  playBtn.textContent = playing ? '❚❚' : '▶';
  playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  demoStatus.textContent = playing ? 'Live thermal preview' : audio.ended ? 'Finished · feedback off' : audio.src ? 'Paused · feedback off' : 'Waiting for audio';
};
playBtn.addEventListener('click', () => { if (audio.paused) { ctx && ctx.resume(); audio.play(); } else audio.pause(); });
['play', 'pause', 'ended'].forEach((e) => audio.addEventListener(e, syncPlayer));
audio.addEventListener('timeupdate', () => {
  const p = audio.duration ? audio.currentTime / audio.duration : 0;
  seek.value = p * 1000;
  seek.style.setProperty('--p', `${p * 100}%`);
  timeLabel.textContent = fmt(audio.currentTime);
});
seek.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration;
  seek.style.setProperty('--p', `${seek.value / 10}%`);
});

const modal = document.getElementById('videoModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = modal.querySelector('.modal-player');
const heroVideo = document.querySelector('.campaign-video video');
document.querySelectorAll('.vid-card').forEach((card) => {
  const preview = card.querySelector('video');
  // Muted hover preview on devices that can hover; the full video opens in the modal.
  if (matchMedia('(hover: hover)').matches) {
    card.addEventListener('mouseenter', () => preview.play().catch(() => {}));
    card.addEventListener('mouseleave', () => { preview.pause(); preview.currentTime = 0; });
  }
  card.addEventListener('click', () => {
    preview.pause();
    if (heroVideo) heroVideo.pause();
    modalTitle.textContent = card.dataset.title;
    modalBody.innerHTML = `<video class="modal-video${card.classList.contains('vertical') ? ' is-vertical' : ''}" src="${card.dataset.src}" controls autoplay playsinline></video>`;
    modal.showModal();
  });
});
const closeVideoModal = () => {
  modal.close();
  modalBody.innerHTML = '';
};
document.getElementById('closeModal').addEventListener('click', closeVideoModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeVideoModal(); });
modal.addEventListener('cancel', () => { modalBody.innerHTML = ''; });

// Contact form → email via Web3Forms (static site, no backend).
// Until WEB3FORMS_KEY is set, "Send" opens the visitor's mail app with the message pre-filled to CONTACT_EMAIL.
const CONTACT_EMAIL = 'moheat-evo@outlook.com';
const WEB3FORMS_KEY = ''; // paste the Access Key from web3forms.com here
const contactForm = document.getElementById('contactForm');
const cfStatus = document.getElementById('cfStatus');
const setStatus = (html, cls = '') => { cfStatus.innerHTML = html; cfStatus.className = `cf-status ${cls}`; };
const mailtoFallback = (d) => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[MoHeat Evo] ${d.topic}`)}&body=${encodeURIComponent(`${d.message}\n\n— ${d.name} (${d.email})`)}`;

document.querySelectorAll('a[data-topic]').forEach((a) => a.addEventListener('click', () => {
  const radio = contactForm.querySelector(`input[name="topic"][value="${a.dataset.topic}"]`);
  if (radio) radio.checked = true;
}));

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(contactForm));
  let ok = true;
  contactForm.querySelectorAll('.cf-field').forEach((f) => {
    const el = f.querySelector('input, textarea');
    const bad = !el.value.trim() || (el.type === 'email' && !el.checkValidity());
    f.classList.toggle('is-invalid', bad);
    if (bad && ok) { el.focus(); ok = false; }
  });
  if (!ok) { setStatus('Please fill in your name, a valid email and a message.', 'err'); return; }
  if (d._honey) return;

  if (!WEB3FORMS_KEY) {
    window.location.href = mailtoFallback(d);
    setStatus(`Your email app should open with the message ready to send. If it doesn't, write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`, 'ok');
    return;
  }

  const btn = contactForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  setStatus('Sending…');
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `[MoHeat Evo] ${d.topic} — ${d.name}`,
        from_name: 'MoHeat Evo website',
        name: d.name, email: d.email, topic: d.topic, message: d.message,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success !== true) throw new Error(json.message || res.statusText);
    contactForm.reset();
    setStatus('Thanks! Your message has been sent — we\'ll get back to you soon.', 'ok');
  } catch (err) {
    setStatus(`Sorry, the message couldn't be sent. <a href="${mailtoFallback(d)}">Email us directly</a> instead.`, 'err');
  } finally {
    btn.disabled = false;
  }
});
contactForm.addEventListener('input', (e) => e.target.closest('.cf-field')?.classList.remove('is-invalid'));

// "Watch on this page" press cards open the matching video in the modal.
document.querySelectorAll('[data-play]').forEach((btn) => btn.addEventListener('click', () => {
  document.querySelector(`.vid-card[data-src*="${btn.dataset.play}"]`)?.click();
}));
