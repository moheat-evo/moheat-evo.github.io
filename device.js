// Shared Web Serial connection for the MoHeat Evo pages (control.html, test.html).
// Lists authorized ports, refreshes on plug/unplug, opens at 115200 baud, writes lines in order and logs replies.
window.MoHeatDevice = (() => {
  const SPP_UUID = '00001101-0000-1000-8000-00805f9b34fb';   // Bluetooth Serial Port Profile
  const VENDORS = { 0x10c4: 'Silicon Labs CP210x', 0x1a86: 'WCH CH340', 0x303a: 'Espressif', 0x0403: 'FTDI', 0x2341: 'Arduino' };
  const supported = 'serial' in navigator;

  const portLabel = (p, i) => {
    const info = p.getInfo();
    if (info.bluetoothServiceClassId) return `#${i + 1} Bluetooth serial`;
    if (info.usbVendorId != null) {
      const hex = (n) => n.toString(16).padStart(4, '0');
      return `#${i + 1} ${VENDORS[info.usbVendorId] || 'USB serial'} (${hex(info.usbVendorId)}:${hex(info.usbProductId)})`;
    }
    return `#${i + 1} Serial port`;
  };
  const setStatus = (el, text, cls = '') => { el.className = `status ${cls}`; el.querySelector('span').textContent = text; };

  // ui: { select, addBtn, connectBtn, status }  hooks: { log, onConnect, onDisconnect }
  function create(ui, hooks = {}) {
    const log = hooks.log || (() => {});
    const enc = new TextEncoder();
    let ports = [], port = null, writer = null, reader = null, readClosed = null, chain = Promise.resolve();

    async function refresh(prefer) {
      if (!supported) return;
      const keep = prefer || ports[ui.select.selectedIndex];
      ports = await navigator.serial.getPorts();
      ui.select.innerHTML = '';
      if (!ports.length) {
        ui.select.add(new Option('No authorized device — click “+ Add”', ''));
        ui.select.disabled = true;
      } else {
        ports.forEach((p, i) => ui.select.add(new Option(portLabel(p, i) + (p === port ? ' — connected' : ''), i)));
        ui.select.disabled = !!port;
        const idx = ports.indexOf(keep);
        if (idx >= 0) ui.select.selectedIndex = idx;
      }
      ui.connectBtn.disabled = !port && !ports.length;
    }

    const send = (line) => {
      if (!writer) return chain;
      chain = chain.then(() => writer.write(enc.encode(line + '\n'))).then(() => log(`→ ${line}`)).catch((e) => log(`! write failed: ${e.message}`));
      return chain;
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
      const p = ports[ui.select.selectedIndex];
      if (!p) return;
      ui.connectBtn.disabled = true;
      setStatus(ui.status, 'Connecting…', 'busy');
      try {
        await p.open({ baudRate: 115200 });
        // Keep the ESP32 out of reset/boot mode on boards with auto-reset wiring.
        await p.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
        port = p;
        writer = port.writable.getWriter();
        readLoop();
        setStatus(ui.status, 'Connected', 'ok');
        log(`connected · ${portLabel(p, ports.indexOf(p))}`);
        ui.connectBtn.textContent = 'Disconnect';
        ui.connectBtn.classList.add('is-on');
        hooks.onConnect?.();
      } catch (e) {
        setStatus(ui.status, `Could not open: ${e.message}`, 'err');
        port = null;
      }
      ui.connectBtn.disabled = false;
      refresh(p);
    }

    async function disconnect(lost = false) {
      const p = port;
      if (!p) return;
      if (!lost) await send('stop');
      try { await chain; } catch {}
      try { await reader?.cancel(); } catch {}
      try { await readClosed; } catch {}
      try { writer?.releaseLock(); } catch {}
      try { if (!lost) await p.close(); } catch {}
      port = writer = reader = null;
      ui.connectBtn.textContent = 'Connect';
      ui.connectBtn.classList.remove('is-on');
      setStatus(ui.status, lost ? 'Device disconnected' : 'Not connected', lost ? 'err' : '');
      log(lost ? 'device lost' : 'disconnected');
      hooks.onDisconnect?.(lost);
      refresh(p);
    }

    if (supported) {
      ui.addBtn.addEventListener('click', async () => {
        try { await refresh(await navigator.serial.requestPort({ allowedBluetoothServiceClassIds: [SPP_UUID] })); }
        catch { /* picker dismissed */ }
      });
      ui.connectBtn.addEventListener('click', () => (port ? disconnect() : connect()));
      navigator.serial.addEventListener('connect', () => refresh());
      navigator.serial.addEventListener('disconnect', (e) => { if (e.target === port) disconnect(true); else refresh(); });
      // Best effort: turn the outputs off when the page goes away.
      addEventListener('pagehide', () => { if (writer) writer.write(enc.encode('stop\n')).catch(() => {}); });
      refresh();
    } else {
      ui.addBtn.disabled = ui.connectBtn.disabled = true;
    }

    return { send, isConnected: () => !!writer };
  }

  return { create, supported };
})();
