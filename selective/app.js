import * as THREE from 'three';
import {SparkRenderer,SplatMesh} from '../vendor/spark.module.js';

const $=id=>document.getElementById(id), query=new URLSearchParams(location.search);
const original=query.get('mode')==='original';$('mode').value=original?'original':'selective';
if(['300000','500000','800000'].includes(query.get('budget')))$('budget').value=query.get('budget');
if(query.get('resolution')==='2')$('resolution').value='2';
if(original){$('background-label').hidden=true;$('hint').textContent='Comparação: original completo com quatro milhões de splats e SH3. A posição e o olhar são mantidos ao trocar de modo.';}
const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)||matchMedia('(pointer:coarse)').matches;
let renderer,spark,critical,background,ready=false,fps=0,manifest;
let yaw=Math.PI/2,pitch=-.06,drag=null;const keys=new Set(),held=new Set();
const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d3df');
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.05,2000);camera.position.set(0,3,0);
for(const name of ['yaw','pitch'])if(query.has(name)&&Number.isFinite(Number(query.get(name)))){if(name==='yaw')yaw=Number(query.get(name));else pitch=THREE.MathUtils.clamp(Number(query.get(name)),-Math.PI/2,Math.PI/2);}
for(const name of ['x','z'])if(query.has(name)&&Number.isFinite(Number(query.get(name))))camera.position[name]=Number(query.get(name));
if(Math.hypot(camera.position.x,camera.position.z)>3){const factor=3/Math.hypot(camera.position.x,camera.position.z);camera.position.x*=factor;camera.position.z*=factor;}
function view(){camera.quaternion.setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));}view();
function resize(){if(!renderer)return;renderer.setPixelRatio(Number($('resolution').value));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
function switchMode(){const url=new URL(location.href);url.searchParams.set('mode',$('mode').value);url.searchParams.set('budget',$('budget').value);url.searchParams.set('resolution',$('resolution').value);url.searchParams.set('yaw',String(yaw));url.searchParams.set('pitch',String(pitch));url.searchParams.set('x',String(camera.position.x));url.searchParams.set('z',String(camera.position.z));location.assign(url);}
$('mode').onchange=switchMode;$('resolution').onchange=resize;$('budget').onchange=()=>{if(spark)spark.lodSplatCount=Number($('budget').value);};
$('reset').onclick=()=>{keys.clear();held.clear();camera.position.set(0,3,0);yaw=Math.PI/2;pitch=-.06;view();};
for(const id of ['back','forward','left','right']){const b=$(id);b.onpointerdown=e=>{held.add(id);b.setPointerCapture(e.pointerId);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>held.delete(id);}
window.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){e.preventDefault();keys.add(key);}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();held.clear();});document.addEventListener('visibilitychange',()=>{keys.clear();held.clear();});
let loadedMs=0,started=performance.now(),samples=[];
const diagnostic=()=>({mode:original?'original':'selective',resolution:Number($('resolution').value),viewport:[innerWidth,innerHeight],buffer:renderer?[renderer.domElement.width,renderer.domElement.height]:null,loadedMs,fps,criticalSplats:critical?.numSplats,backgroundActive:background?.numSplats,backgroundBudget:original?0:Number($('budget').value),activeSplats:spark?.activeSplats,shBands:3,camera:camera.position.toArray(),yaw,pitch,ready,sourceCount:manifest?.sourceCount,regions:manifest?.criticalRegionsWorld,samples});
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(diagnostic(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cem-p01-detail-zones.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
async function init(){if(mobile){$('loading').textContent='Este ensaio preserva muito detalhe e ainda é apenas para computador. Não foi validado no iPhone.';return;}try{
manifest=await fetch('./assets/partition.json').then(r=>{if(!r.ok)throw Error('Manifesto indisponível');return r.json();});
renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;$('viewport').appendChild(renderer.domElement);resize();window.addEventListener('resize',resize);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;$('loading').hidden=false;$('loading').textContent='O browser perdeu o contexto gráfico. Este ensaio não passou neste dispositivo.';});
spark=new SparkRenderer({renderer,enableLod:!original,lodSplatCount:Number($('budget').value),maxPagedSplats:1048576,pagedExtSplats:true,numLodFetchers:2,minSortIntervalMs:0,coneFov0:90,coneFov:130,coneFoveate:.6,behindFoveate:.25});scene.add(spark);
const transform=new THREE.Group();transform.rotation.x=-Math.PI/2;transform.position.set(-5.615692355105627,0,76.44565836716178);scene.add(transform);
$('loading').textContent=original?'A carregar o original completo (56 MB)…':'A carregar cartazes e percurso originais (13 MB) e o fundo adaptativo…';
critical=new SplatMesh({url:original?'../assets/original.sog':'./assets/critical.sog',extSplats:true,lod:false,enableLod:false});transform.add(critical);
if(!original){background=new SplatMesh({url:'./assets/background-lod-0.spz',paged:true});transform.add(background);}
const canvas=renderer.domElement;canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(drag.pitch-(e.clientY-drag.y)*.004,-Math.PI/2,Math.PI/2);view();};canvas.onpointerup=canvas.onpointercancel=()=>drag=null;
let previous=performance.now(),lastStats=previous,frames=0;
renderer.setAnimationLoop(now=>{const dt=Math.min((now-previous)/1000,.15);previous=now;if(ready){const f=(keys.has('w')||keys.has('arrowup')||held.has('forward')?1:0)-(keys.has('s')||keys.has('arrowdown')||held.has('back')?1:0),s=(keys.has('d')||keys.has('arrowright')||held.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||held.has('left')?1:0);if(f||s){const v=new THREE.Vector3(-Math.sin(yaw)*f+Math.cos(yaw)*s,0,-Math.cos(yaw)*f-Math.sin(yaw)*s).normalize().multiplyScalar(dt*1.3);camera.position.add(v);const d=Math.hypot(camera.position.x,camera.position.z);if(d>3){camera.position.x*=3/d;camera.position.z*=3/d;}}}
renderer.render(scene,camera);frames++;if(now-lastStats>=1000){fps=frames*1000/(now-lastStats);frames=0;lastStats=now;if(ready){samples.push({t:now-started,fps});if(samples.length>120)samples.shift();}$('stats').textContent=`${Math.round(fps)} FPS · ${critical?.numSplats?.toLocaleString('pt-PT')??0} originais + ${background?.numSplats?.toLocaleString('pt-PT')??0} no fundo · SH3 · imagem ${$('resolution').value}×`;}});
await Promise.all([critical.initialized,...(background?[background.initialized]:[])]);if(critical.numSplats!==(original?4000000:manifest.counts.critical))throw Error('Contagem de splats protegidos incorreta');
loadedMs=performance.now()-started;ready=true;$('loading').hidden=true;window.zoneDiagnostics={renderer,spark,camera,critical,background,diagnostic};
}catch(e){console.error(e);$('loading').hidden=false;$('loading').textContent='Não foi possível abrir P01: '+e.message;}}
init();
