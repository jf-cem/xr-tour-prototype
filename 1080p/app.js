/* D5 1080p: preserve SOG textures and SH3; use the direct WebGL2 renderer.
   No expanded PLY, runtime LOD generation, unified atlas or old 2K data. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('canvas'), query = new URLSearchParams(location.search);
  const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    || matchMedia('(pointer:coarse)').matches;
  if (mobile) $('resolution').querySelector('[value="1.5"]').disabled = true;
  if (['0.75', '1', '1.5'].includes(query.get('resolution')) && (!mobile || query.get('resolution') !== '1.5')) $('resolution').value = query.get('resolution');
  let app, asset, model, camera, route, segments = [], total = 0, position = 0;
  let ready = false, started = false, lost = false, walking = 0, drag = null;
  let yaw = Math.PI / 2, pitch = -.06, phone = false, anchor = null;
  let fps = 0, frames = 0, lastSample = 0, loadedMs = 0, startedAt = 0, samples = [];
  const radians = Math.PI / 180, wrap = v => Math.atan2(Math.sin(v), Math.cos(v));
  function view() {
    if (!camera) return;
    camera.setRotation(new pc.Quat().setFromAxisAngle(pc.Vec3.UP, yaw / radians)
      .mul(new pc.Quat().setFromAxisAngle(pc.Vec3.RIGHT, pitch / radians)));
  }
  function setPosition(value) {
    if (!route || !camera) return;
    position = pc.math.clamp(value, 0, total);
    let rest = position, i = 0;
    while (i < segments.length - 1 && rest > segments[i]) rest -= segments[i++];
    const t = segments[i] ? rest / segments[i] : 0;
    const a = route.stops[i].position, b = route.stops[i + 1].position;
    camera.setPosition(a[0] + (b[0] - a[0]) * t, Number($('height').value), a[2] + (b[2] - a[2]) * t);
    $('route').value = String(position / total * 1000);
    $('distance').textContent = position.toFixed(1).replace('.', ',') + ' m';
    document.querySelectorAll('[data-stop]').forEach((button, index) => button.classList.toggle('active', Math.abs(position - segments.slice(0, index).reduce((a, b) => a + b, 0)) < .2));
  }
  function resize() {
    if (!app) return;
    const chosen = Number($('resolution').value);
    // CSS-pixel scale, not devicePixelRatio (which is often 3 on phones).
    const ratio = mobile ? Math.min(chosen, 1, Math.sqrt(1000000 / (innerWidth * innerHeight))) : chosen;
    app.graphicsDevice.maxPixelRatio = ratio;
    app.resizeCanvas(innerWidth, innerHeight);
  }
  function stopPhone() {
    phone = false; anchor = null;
    window.removeEventListener('deviceorientation', orientation);
    $('phone').classList.remove('active'); $('phone').textContent = 'Olhar com telemóvel';
  }
  function orientation(event) {
    if (!ready || ![event.alpha, event.beta, event.gamma].every(Number.isFinite)) return;
    const screenAngle = screen.orientation?.angle ?? window.orientation ?? 0;
    const q = new pc.Quat().setFromAxisAngle(pc.Vec3.UP, event.alpha)
      .mul(new pc.Quat().setFromAxisAngle(pc.Vec3.RIGHT, event.beta))
      .mul(new pc.Quat().setFromAxisAngle(pc.Vec3.FORWARD, event.gamma))
      .mul(new pc.Quat().setFromAxisAngle(pc.Vec3.RIGHT, -90))
      .mul(new pc.Quat().setFromAxisAngle(pc.Vec3.FORWARD, screenAngle));
    const direction = q.transformVector(new pc.Vec3(0, 0, -1));
    const horizontal = Math.hypot(direction.x, direction.z);
    const heading = horizontal < Math.sin(5 * radians) ? (anchor?.lastYaw ?? yaw) : Math.atan2(-direction.x, -direction.z);
    const elevation = Math.atan2(direction.y, horizontal);
    if (!anchor) { anchor = {lastYaw:heading, unwrapped:heading, sensorYaw:heading, sensorPitch:elevation, yaw, pitch}; return; }
    anchor.unwrapped += wrap(heading - anchor.lastYaw); anchor.lastYaw = heading;
    yaw = anchor.yaw + anchor.unwrapped - anchor.sensorYaw;
    pitch = anchor.pitch + elevation - anchor.sensorPitch;
    view();
  }
  $('phone').onclick = async () => {
    if (phone) { stopPhone(); return; }
    try {
      if (!window.DeviceOrientationEvent) throw Error('Sensores indisponíveis neste navegador.');
      if (typeof DeviceOrientationEvent.requestPermission === 'function' && await DeviceOrientationEvent.requestPermission() !== 'granted') throw Error('Permissão de movimento recusada.');
      anchor = null; phone = true; window.addEventListener('deviceorientation', orientation);
      $('phone').classList.add('active'); $('phone').textContent = 'Desligar olhar';
      $('hint').textContent = 'Roda o telemóvel para olhar; usa o percurso para caminhar.';
    } catch (error) { $('hint').textContent = error.message; }
  };
  window.addEventListener('orientationchange', () => { anchor = null; });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', () => { walking = 0; drag = null; });
  document.addEventListener('visibilitychange', () => {
    walking = 0; drag = null; frames = 0; lastSample = performance.now();
    if (document.hidden && phone) stopPhone();
    if (app) app.autoRender = !document.hidden && !lost;
  });
  canvas.onpointerdown = event => { if (!ready || phone) return; drag = {x:event.clientX, y:event.clientY, yaw, pitch}; canvas.setPointerCapture(event.pointerId); };
  canvas.onpointermove = event => {
    if (!drag) return;
    yaw = drag.yaw - (event.clientX - drag.x) * .004;
    pitch = pc.math.clamp(drag.pitch - (event.clientY - drag.y) * .004, -Math.PI / 2, Math.PI / 2); view();
  };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { drag = null; };
  for (const [id, direction] of [['back', -1], ['forward', 1]]) {
    const button = $(id);
    button.onpointerdown = event => { if (!ready) return; walking = direction; button.setPointerCapture(event.pointerId); };
    button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => { walking = 0; };
  }
  window.addEventListener('keydown', event => {
    if (!ready || event.target.matches('input,select,button')) return;
    if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(event.key)) { event.preventDefault(); walking = ['ArrowUp', 'w'].includes(event.key) ? 1 : -1; }
  });
  window.addEventListener('keyup', () => { walking = 0; });
  $('route').oninput = () => ready && setPosition(Number($('route').value) / 1000 * total);
  $('height').onchange = () => ready && setPosition(position);
  $('resolution').onchange = resize;
  document.querySelectorAll('[data-stop]').forEach(button => { button.onclick = () => ready && setPosition(segments.slice(0, Number(button.dataset.stop)).reduce((a, b) => a + b, 0)); });
  const diagnostic = () => ({version:'1080p-1', source:'2109609102809157633', sourceBytes:15836471,
    engine:window.pc?.version, backend:app?.graphicsDevice.deviceType, representation:asset?.resource?.constructor.name,
    splats:asset?.resource?.numSplats, shBands:asset?.resource?.gsplatData?.shBands, unified:false,
    ready, contextLost:lost, mobile, loadedMs, fps, resolution:Number($('resolution').value),
    viewport:[innerWidth,innerHeight], buffer:[canvas.width,canvas.height], position, total,
    camera:camera?.getPosition().toArray(), yaw, pitch,
    textureBytes:app?.graphicsDevice._vram?.tex,
    bufferBytes:app ? ['vb','ib','ub','sb'].reduce((sum,key) => sum + (app.graphicsDevice._vram?.[key] || 0), 0) : 0,
    userAgent:navigator.userAgent, samples});
  window.xr1080Diagnostics = {diagnostic, setPosition, get app(){return app;}, get asset(){return asset;}, get camera(){return camera;}};
  $('export').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(diagnostic(), null, 2)], {type:'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'cem-xr-1080p-diagnostico.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('retry').onclick = () => location.reload();
  function fail(message) {
    ready = false; walking = 0; stopPhone();
    if (app) app.autoRender = false;
    $('loading').hidden = false; $('status').textContent = message; $('retry').hidden = false;
    document.querySelectorAll('[data-stop],#phone,#back,#forward,#route').forEach(control => { control.disabled = true; });
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; fail('O navegador perdeu os recursos gráficos. Recarrega e escolhe Imagem Leve.'); });
  $('start').onclick = async () => {
    if (started) return; started = true; startedAt = performance.now(); $('start').hidden = true;
    $('status').textContent = 'A preparar a XR 1080p…';
    try {
      if (!window.pc) throw Error('O motor gráfico não carregou.');
      route = await fetch('../route.json').then(response => { if (!response.ok) throw Error('Percurso indisponível.'); return response.json(); });
      for (let i = 1; i < route.stops.length; i++) segments.push(new pc.Vec3(...route.stops[i].position).distance(new pc.Vec3(...route.stops[i - 1].position)));
      total = segments.reduce((a, b) => a + b, 0);
      const device = await pc.createGraphicsDevice(canvas, {deviceTypes:[pc.DEVICETYPE_WEBGL2], antialias:false, alpha:false, powerPreference:'high-performance'});
      app = new pc.Application(canvas, {graphicsDevice:device});
      app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW); app.setCanvasResolution(pc.RESOLUTION_AUTO); resize();
      camera = new pc.Entity('Camera do percurso');
      camera.addComponent('camera', {fov:65, nearClip:.05, farClip:2000, clearColor:new pc.Color(.72,.83,.87), toneMapping:pc.TONEMAP_NONE});
      app.root.addChild(camera); setPosition(0); view();
      // SOG data stays quantized in textures; do not convert to float32 splats.
      asset = new pc.Asset('D5 XR 1080p', 'gsplat', {url:'./assets/d5-1080p.sog'}, {decompress:false});
      app.assets.add(asset);
      $('status').textContent = 'A carregar a nova XR (15,8 MB)…';
      await new Promise((resolve, reject) => { asset.once('load', resolve); asset.once('error', reject); app.assets.load(asset); });
      if (lost) throw Error('Contexto gráfico perdido durante o carregamento.');
      if (asset.resource.numSplats !== 973259 || asset.resource.gsplatData.shBands !== 3 || !asset.resource.constructor.name.includes('Sog')) throw Error('A fonte 1080p não carregou no formato esperado.');
      model = new pc.Entity('D5 1080p'); model.setEulerAngles(-90, 0, 0);
      model.setPosition(-route.origin_sketchup_m[0], 0, route.origin_sketchup_m[1]);
      model.addComponent('gsplat', {asset, unified:false, antiAlias:true}); app.root.addChild(model);
      asset.resource.releaseTextureSources();
      loadedMs = performance.now() - startedAt;
      app.on('update', dt => { if (ready && walking && !document.hidden) setPosition(position + walking * 1.3 * Math.min(dt, .05)); });
      app.on('postrender', () => {
        if (!ready || document.hidden) return;
        frames++; const now = performance.now();
        if (now - lastSample >= 1000) {
          fps = frames * 1000 / (now - lastSample); frames = 0; lastSample = now;
          samples.push({t:now - startedAt,fps}); if (samples.length > 120) samples.shift();
          $('stats').textContent = `${Math.round(fps)} FPS · 973 259 splats · ${canvas.width} × ${canvas.height} · WebGL2 · texturas ${(app.graphicsDevice._vram.tex / 1e6).toFixed(1)} MB (estimativa do motor)`;
        }
      });
      ready = true; lastSample = performance.now(); app.start(); app.autoRender = !document.hidden;
      $('loading').hidden = true;
      document.querySelectorAll('[data-stop],#phone,#back,#forward,#route').forEach(control => { control.disabled = false; });
      $('hint').textContent = 'Arrasta para olhar. Usa P01–P03, o percurso ou mantém Avançar premido para caminhar.';
    } catch (error) { console.error(error); fail('Não foi possível abrir a XR: ' + (error.message || error)); }
  };
})();
