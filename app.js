import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from './vendor/spark.module.js';
import { createFixedLook } from './vendor/phone-look.js';

const $ = id => document.getElementById(id);
const loading = $('loading');
if(innerWidth<700) $('quality').value='250000';
const query=new URLSearchParams(location.search);
const original=query.get('quality')==='original';
if(original) $('quality').value='original';
else if(['250000','500000','1000000'].includes(query.get('quality'))) $('quality').value=query.get('quality');
if(['1','1.5','2'].includes(query.get('resolution'))) $('resolution').value=query.get('resolution');
let renderer, spark, mesh, route, ready=false;
const scene=new THREE.Scene(); scene.background=new THREE.Color('#b8d3df');
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.05,2000);
let yaw=Math.PI/2, pitch=-.06, position=0, walking=0, phone=false, drag=null;
let total=0, segments=[], fps=0, frames=0, lastStats=performance.now();
const fixedLook=createFixedLook();
function resize(){renderer.setPixelRatio(Number($('resolution').value));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
function setView(){camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));}
function setPosition(value){position=THREE.MathUtils.clamp(value,0,total);let rest=position;let index=0;while(index<segments.length-1&&rest>segments[index]){rest-=segments[index++];}const t=segments[index]?rest/segments[index]:0;camera.position.fromArray(route.stops[index].position).lerp(new THREE.Vector3().fromArray(route.stops[index+1].position),t);camera.position.y=Number($('height').value);$('route').value=String(position/total*1000);$('distance').textContent=position.toFixed(1).replace('.',',')+' m';document.querySelectorAll('[data-stop]').forEach((b,i)=>b.classList.toggle('active',Math.abs(position-segments.slice(0,i).reduce((a,b)=>a+b,0))<.2));}
function stopPhone(){phone=false;fixedLook.reset();window.removeEventListener('deviceorientation',orientation);$('phone').classList.remove('active');$('phone').textContent='Olhar com telemóvel';const e=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');pitch=e.x;yaw=e.y;}
function orientation(e){const q=fixedLook.sample(e,screen.orientation?.angle??window.orientation??0,camera.quaternion);if(q)camera.quaternion.copy(q);}
$('phone').onclick=async()=>{if(phone){stopPhone();return;}try{if(!window.DeviceOrientationEvent)throw Error('Sensores indisponíveis neste navegador.');if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')throw Error('Permissão de movimento recusada.');phone=true;fixedLook.reset();window.addEventListener('deviceorientation',orientation);$('phone').classList.add('active');$('phone').textContent='Desligar olhar';$('hint').textContent='Roda o telemóvel para olhar. O percurso controla apenas a posição.';}catch(e){$('hint').textContent=e.message;}};
window.addEventListener('orientationchange',()=>fixedLook.reanchor());
document.addEventListener('visibilitychange',()=>{walking=0;if(document.hidden&&phone)stopPhone();});
$('route').oninput=()=>ready&&setPosition(Number($('route').value)/1000*total);
$('height').onchange=()=>ready&&setPosition(position);
$('quality').onchange=()=>{if(original||$('quality').value==='original'){const url=new URL(location.href);url.searchParams.set('quality',$('quality').value);url.searchParams.set('position',String(position));url.searchParams.set('yaw',String(new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ').y));url.searchParams.set('pitch',String(new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ').x));url.searchParams.set('resolution',$('resolution').value);location.assign(url);return;}spark.lodSplatCount=Number($('quality').value);};
$('resolution').onchange=resize;
document.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>ready&&setPosition(segments.slice(0,Number(b.dataset.stop)).reduce((a,b)=>a+b,0)));
for(const [id,direction] of [['back',-1],['forward',1]]){const b=$(id);b.onpointerdown=e=>{walking=direction;b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>walking=0;}
window.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(e.key==='ArrowUp')walking=1;if(e.key==='ArrowDown')walking=-1;});window.addEventListener('keyup',()=>walking=0);
async function init(){try{route=await fetch('./route.json').then(r=>{if(!r.ok)throw Error('Não foi possível carregar o percurso.');return r.json();});for(let i=1;i<route.stops.length;i++)segments.push(new THREE.Vector3().fromArray(route.stops[i].position).distanceTo(new THREE.Vector3().fromArray(route.stops[i-1].position)));total=segments.reduce((a,b)=>a+b,0);
renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#b8d3df');$('viewport').appendChild(renderer.domElement);resize();window.addEventListener('resize',resize);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;loading.hidden=false;loading.textContent='O navegador ficou sem recursos gráficos. Recarrega o piloto e escolhe a qualidade Muito leve.';});
spark=new SparkRenderer({renderer,enableLod:!original,lodSplatCount:original?4000000:Number($('quality').value),maxPagedSplats:2097152,pagedExtSplats:true});scene.add(spark);
const canvas=renderer.domElement;canvas.onpointerdown=e=>{if(phone)return;drag={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(drag.pitch-(e.clientY-drag.y)*.004,-Math.PI/2,Math.PI/2);setView();};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
const start=Number(query.get('position'));setPosition(Number.isFinite(start)?start:0);
for(const [key,set] of [['yaw',v=>yaw=v],['pitch',v=>pitch=THREE.MathUtils.clamp(v,-Math.PI/2,Math.PI/2)]]){if(query.has(key)&&Number.isFinite(Number(query.get(key))))set(Number(query.get(key)));}setView();
const transform=new THREE.Group();transform.rotation.x=-Math.PI/2;transform.position.set(-route.origin_sketchup_m[0],0,route.origin_sketchup_m[1]);scene.add(transform);
if(original){loading.textContent='A carregar o original D5: 56 MB, quatro milhões de splats. Pode demorar.';$('hint').textContent='Original D5 sem redução de splats ou de cor. Trocar de modo recarrega a página para libertar a memória.';}
mesh=new SplatMesh(original?{url:'./assets/original.sog',extSplats:true,lod:false,enableLod:false,onProgress:e=>{loading.textContent=e.total?`A carregar o original D5… ${Math.round(e.loaded/e.total*100)}%`:'A descodificar o original D5…';}}:{url:'./assets/stream-lod-0.spz',paged:true});transform.add(mesh);
let previous=performance.now();renderer.setAnimationLoop(now=>{const dt=Math.min((now-previous)/1000,.05);previous=now;if(ready&&walking)setPosition(position+walking*1.3*dt);renderer.render(scene,camera);frames++;if(now-lastStats>1000){fps=frames*1000/(now-lastStats);frames=0;lastStats=now;$('stats').textContent=`${Math.round(fps)} FPS · ${mesh?.numSplats?.toLocaleString('pt-PT') ?? '0'} ativos · ${original?'Original D5 · SH3':`orçamento ${Number($('quality').value).toLocaleString('pt-PT')} splats`} · ${innerWidth} × ${innerHeight} · escala ${renderer.getPixelRatio()}`;}});
await mesh.initialized;ready=true;loading.hidden=true;window.xrDiagnostics={camera,mesh,spark,renderer,get position(){return position;},get fps(){return fps;},setPosition};
}catch(e){console.error(e);loading.hidden=false;loading.textContent='Não foi possível abrir a XR: '+e.message;}}
init();
