// scene.js — сцена, камера, рендер, окружение
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
window.scene = scene;

// Звёзды
const sg = new THREE.BufferGeometry();
const sa = new Float32Array(900);
for (let i=0;i<900;i+=3){sa[i]=(Math.random()-0.5)*600;sa[i+1]=Math.random()*250+50;sa[i+2]=(Math.random()-0.5)*600;}
sg.setAttribute('position',new THREE.BufferAttribute(sa,3));
scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:0.3})));

// Свет
scene.add(new THREE.AmbientLight(0x606080));
const sun = new THREE.DirectionalLight(0xffffff,1);
sun.position.set(20,30,10);
scene.add(sun);

// ЗЕМЛЯ — ОГРОМНАЯ
const SIZE = 200, DIVS = 40;
const gnd = new THREE.Mesh(new THREE.PlaneGeometry(SIZE,SIZE,DIVS,DIVS),new THREE.MeshStandardMaterial({color:0x4a7c3f,roughness:0.9}));
gnd.rotation.x=-Math.PI/2;gnd.position.y=-5;
scene.add(gnd);
const grid = new THREE.GridHelper(SIZE,DIVS,0x2d5a1e,0x2d5a1e);
grid.position.y=-4.99;
scene.add(grid);

// Взлётка
const rw = new THREE.Mesh(new THREE.PlaneGeometry(6,40),new THREE.MeshStandardMaterial({color:0x444444,roughness:0.8}));
rw.rotation.x=-Math.PI/2;rw.position.set(0,-4.98,15);
scene.add(rw);
for(let i=0;i<=30;i+=3){
  const st=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.3),new THREE.MeshStandardMaterial({color:0xffffff}));
  st.rotation.x=-Math.PI/2;st.position.set(0,-4.97,i);scene.add(st);
}

// Холмы
for(let i=0;i<30;i++){
  const h=new THREE.Mesh(new THREE.SphereGeometry(2+Math.random()*5,6,4),new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(0.25+Math.random()*0.1,0.6,0.3+Math.random()*0.2)}));
  h.position.set((Math.random()-0.5)*120,-5.5,(Math.random()-0.5)*120);
  h.scale.y=0.3+Math.random()*0.5;scene.add(h);
}

// Камера
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.3,600);
camera.position.set(15,10,20);camera.lookAt(0,0,0);
window.camera=camera;

// Рендеры
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.body.appendChild(renderer.domElement);
window.renderer=renderer;

const lr=new CSS2DRenderer();
lr.setSize(innerWidth,innerHeight);lr.domElement.style.position='absolute';lr.domElement.style.top='0';lr.domElement.style.pointerEvents='none';
document.body.appendChild(lr.domElement);
window.labelRenderer=lr;

// OrbitControls
const controls=new OrbitControls(camera,renderer.domElement);
window.controls=controls;
controls.enableDamping=true;controls.dampingFactor=0.08;controls.target.set(0,0.3,0);
controls.rotateSpeed=isMobile?0.7:0.6;controls.zoomSpeed=isMobile?1.0:1.2;
controls.minDistance=5;controls.maxDistance=50;controls.maxPolarAngle=Math.PI*0.8;
controls.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
controls.update();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);lr.setSize(innerWidth,innerHeight);
});
