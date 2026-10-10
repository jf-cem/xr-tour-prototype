/* PlayCanvas 2.23.0: retain the original compressed SOG texture representation. */
(async()=>{
const $=id=>document.getElementById(id), canvas=$('canvas'), loading=$('loading');
const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(mobile){loading.textContent='Este ensaio de qualidade original é apenas para computador. A estabilidade móvel ainda não foi validada.';return;}
const started=performance.now();let app,asset,model,camera;
try{
const route=await fetch('../route.json').then(r=>{if(!r.ok)throw Error('Percurso indisponível');return r.json();});
const query=new URLSearchParams(location.search),preferGpu=query.get('backend')!=='webgl';
const device=await pc.createGraphicsDevice(canvas,{deviceTypes:preferGpu?[pc.DEVICETYPE_WEBGPU,pc.DEVICETYPE_WEBGL2]:[pc.DEVICETYPE_WEBGL2],antialias:false,alpha:false,powerPreference:'high-performance'});
app=new pc.Application(canvas,{graphicsDevice:device});
if(device.isWebGPU)app.scene.gsplat.renderer=query.get('pipeline')==='compute'?pc.GSPLAT_RENDERER_COMPUTE:pc.GSPLAT_RENDERER_AUTO;
else $('note').textContent='WebGL2 ativo. WebGPU não está disponível ou foi desativado neste ensaio; a fluidez pode ser inferior.';
app.graphicsDevice.maxPixelRatio=1;app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);app.setCanvasResolution(pc.RESOLUTION_AUTO);
const size=()=>{app.graphicsDevice.maxPixelRatio=Number($('resolution').value);app.resizeCanvas();};window.addEventListener('resize',size);$('resolution').onchange=size;
app.scene.gsplat.splatBudget=4000000;
camera=new pc.Entity('P01 camera');camera.addComponent('camera',{fov:65,nearClip:.05,farClip:2000,clearColor:new pc.Color(.72,.83,.87),toneMapping:pc.TONEMAP_NONE});app.root.addChild(camera);
let yaw=90,pitch=-.06*180/Math.PI;const start=new pc.Vec3(...route.stops[0].position);camera.setPosition(start);
function view(){camera.setRotation(new pc.Quat().setFromAxisAngle(pc.Vec3.UP,yaw).mul(new pc.Quat().setFromAxisAngle(pc.Vec3.RIGHT,pitch)));}
view();let drag=null;canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*.004*180/Math.PI;pitch=pc.math.clamp(drag.pitch-(e.clientY-drag.y)*.004*180/Math.PI,-89.9,89.9);view();};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
const keys=new Set(),buttons=new Set();window.addEventListener('keydown',e=>{if(e.target.matches('select,input,button'))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();buttons.clear();});
for(const id of ['back','forward','left','right']){const b=$(id);b.onpointerdown=e=>{buttons.add(id);b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>buttons.delete(id);}
$('reset').onclick=()=>{keys.clear();buttons.clear();yaw=90;pitch=-.06*180/Math.PI;camera.setPosition(start);view();};
let ready=false,frames=0,last=performance.now(),fps=0,samples=[],loadedMs=0;
const diagnostic=()=>({engine:pc.version,backend:app.graphicsDevice.deviceType,splats:asset?.resource?.numSplats,shBands:asset?.resource?.gsplatData?.shBands,representation:asset?.resource?.constructor.name,ready,loadedMs,resolution:Number($('resolution').value),viewport:[innerWidth,innerHeight],buffer:[canvas.width,canvas.height],camera:camera.getPosition().toArray(),fps,textureBytes:app.graphicsDevice._vram?.tex,bufferBytes:app.graphicsDevice._vram?.vb+app.graphicsDevice._vram?.ib,samples});
$('export').onclick=()=>{const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(diagnostic(),null,2)],{type:'application/json'}));a.href=url;a.download='cem-playcanvas-p01.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
app.on('update',dt=>{if(!ready)return;const f=(keys.has('w')||keys.has('arrowup')||buttons.has('forward')?1:0)-(keys.has('s')||keys.has('arrowdown')||buttons.has('back')?1:0),s=(keys.has('d')||keys.has('arrowright')||buttons.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||buttons.has('left')?1:0);if(f||s){const angle=yaw*Math.PI/180,v=new pc.Vec3(-Math.sin(angle)*f+Math.cos(angle)*s,0,-Math.cos(angle)*f-Math.sin(angle)*s).normalize().mulScalar(Math.min(dt,.05)*1.3),p=camera.getPosition().clone().add(v),offset=p.clone().sub(start);offset.y=0;if(offset.length()>3)p.copy(start).add(offset.normalize().mulScalar(3));camera.setPosition(p);}frames++;const now=performance.now();if(now-last>=1000){fps=frames*1000/(now-last);frames=0;last=now;samples.push({t:now-started,fps});if(samples.length>120)samples.shift();$('stats').textContent=`${fps.toFixed(0)} FPS · ${asset.resource.numSplats.toLocaleString('pt-PT')} splats · SH${asset.resource.gsplatData.shBands} · ${app.graphicsDevice.deviceType} · resolução ${$('resolution').value}× · texturas ${(app.graphicsDevice._vram.tex/1e6).toFixed(0)} MB (estimativa do motor)`;}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;loading.hidden=false;loading.textContent='O browser perdeu o contexto gráfico. O ensaio não passou neste dispositivo.';});
app.start();loading.textContent='A carregar o SOG original (56 MB), sem converter para splats expandidos…';
asset=new pc.Asset('D5 Original','gsplat',{url:'../assets/original.sog'},{decompress:false});app.assets.add(asset);
await new Promise((resolve,reject)=>{asset.once('load',resolve);asset.once('error',reject);app.assets.load(asset);});
if(asset.resource.numSplats!==4000000||asset.resource.gsplatData.shBands!==3)throw Error('A fonte não preservou os quatro milhões de splats e SH3.');
model=new pc.Entity('D5 source');model.setEulerAngles(-90,0,0);model.setPosition(-route.origin_sketchup_m[0],0,route.origin_sketchup_m[1]);model.addComponent('gsplat',{asset,unified:true,antiAlias:true});app.root.addChild(model);
asset.resource.releaseTextureSources();loadedMs=performance.now()-started;ready=true;loading.hidden=true;window.pcDiagnostics={app,asset,model,camera,diagnostic};
}catch(e){console.error(e);loading.hidden=false;loading.textContent='O ensaio não abriu: '+(e.message||e);if(app)app.autoRender=false;}
})();
