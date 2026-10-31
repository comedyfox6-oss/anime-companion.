import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
const $=id=>document.getElementById(id), messages=$('messages'), input=$('message-input');
let history=[],busy=false;
function add(role,content){const a=document.createElement('article'),s=document.createElement('small'),p=document.createElement('p');a.className='message '+role;s.textContent=role==='user'?'ТЫ':'ОН';p.textContent=content;a.append(s,p);messages.append(a);messages.scrollTop=messages.scrollHeight;}
function lock(v){busy=v;$('send-button').disabled=v;input.disabled=v;$('typing').hidden=!v;$('chat-subtitle').textContent=v?'Подбирает слова…':'Можно начать с любого слова';}
async function send(text){if(!text||busy)return;add('user',text);history.push({role:'user',content:text});input.value='';lock(true);try{const r=await fetch(import.meta.env.VITE_API_URL||'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-20),max_tokens:500})});if(!r.ok)throw Error('Сервер ответил '+r.status+': '+(await r.text()).slice(0,160));const d=await r.json(),reply=d.reply||d.choices?.[0]?.message?.content;if(typeof reply!=='string'||!reply.trim())throw Error('Пустой ответ AI');history.push({role:'assistant',content:reply});add('assistant',reply);$('connection-state').textContent='AI подключён';}catch(e){history.pop();add('assistant','Не получилось получить ответ: '+e.message+' Проверь AI-сервер.');$('connection-state').textContent='нет соединения';}finally{lock(false);input.focus();}}
$('chat-form').addEventListener('submit',e=>{e.preventDefault();send(input.value.trim());});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('chat-form').requestSubmit();}});
$('clear-chat').addEventListener('click',()=>{history=[];messages.replaceChildren();add('assistant','Начнём сначала. Я слушаю.');});
// Genuine VRM viewer; reference image is never passed off as 3D.
const canvas=$('vrm-canvas'),renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.1,100);camera.position.set(0,1.35,3.6);
scene.add(new THREE.HemisphereLight(0xc8d8ff,0x171322,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1.5,3,2);scene.add(light);
let vrm=null,motion=true;const clock=new THREE.Clock();
function resize(){const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas.parentElement);resize();
const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
$('vrm-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;$('model-state').textContent='Загрузка…';try{const url=URL.createObjectURL(file);let gltf;try{gltf=await loader.loadAsync(url);}finally{URL.revokeObjectURL(url);}const next=gltf.userData.vrm;if(!next)throw Error('VRM-модель не найдена в файле.');if(vrm){scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);}vrm=next;VRMUtils.rotateVRM0(vrm);vrm.scene.position.y=-1.05;vrm.scene.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});scene.add(vrm.scene);$('model-state').textContent='VRM загружена';$('stage-caption').textContent=file.name;$('stage').classList.add('has-vrm');}catch(err){$('model-state').textContent='Ошибка модели';$('stage-caption').textContent=err.message;}});
$('motion-toggle').addEventListener('click',()=>{motion=!motion;$('motion-toggle').textContent='Анимация: '+(motion?'вкл.':'выкл.');});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(vrm){if(motion&&!reduced){const t=clock.elapsedTime;vrm.scene.rotation.y=Math.sin(t*.35)*.035;const head=vrm.humanoid?.getNormalizedBoneNode('head');if(head)head.rotation.y=Math.sin(t*.55)*.06;vrm.expressionManager?.setValue('blink',Math.max(0,Math.sin(t*.7)-.96)*20);}vrm.update(dt);}renderer.render(scene,camera);});
addEventListener('beforeunload',()=>{if(vrm)VRMUtils.deepDispose(vrm.scene);renderer.dispose();});