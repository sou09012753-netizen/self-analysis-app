import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const N_PTC = 6000;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

class SENScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.W = this.H = 0;
    this._mx = 0; this._my = 0;
    this.t = 0;
    this.curPos  = new Float32Array(N_PTC * 3);
    this.toPos   = null;
    this.fromPos = null;
    this._disp   = new Float32Array(N_PTC * 3);
    this.scP     = new Float32Array(N_PTC * 4);
    this.phase   = 'scatter';
    this.phaseT0 = 0;
    this.phaseDur = 99999;
    this._alive  = true;
  }

  _makeCircleTex() {
    const sz = 64, cv = document.createElement('canvas');
    cv.width = cv.height = sz;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.35,'rgba(255,255,255,0.85)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.25)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,sz,sz);
    return new THREE.CanvasTexture(cv);
  }

  _sampleSEN() {
    const W = 900, H = 300;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.floor(H * 0.86)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SEN', W/2, H/2);
    ctx.fillText('SEN', W/2 + 1, H/2);
    ctx.fillText('SEN', W/2, H/2 + 1);
    const px = ctx.getImageData(0,0,W,H).data;
    const pts = [];
    const step = 2;
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (px[(y*W+x)*4] > 128) pts.push([x,y]);
    const out = new Float32Array(N_PTC * 3);
    const scaleY = 1.6;
    const scaleX = scaleY * (W/H);
    for (let i = 0; i < N_PTC; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      out[i*3]   = (p[0]/W - 0.5) * scaleX;
      out[i*3+1] = -(p[1]/H - 0.5) * scaleY;
      out[i*3+2] = (Math.random() - 0.5) * 0.1;
    }
    return out;
  }

  _scatterRMax() {
    const halfH = Math.tan(21 * Math.PI / 180) * 5;
    const halfW = halfH * (this.W / this.H);
    return Math.min(halfW, halfH) * 1.5;
  }

  _resetScatter() {
    const rMax = this._scatterRMax();
    const yMax = Math.tan(21 * Math.PI / 180) * 5 * 1.1;
    for (let i = 0; i < N_PTC; i++) {
      const th = Math.random() * Math.PI * 2;
      const r  = 0.3 + Math.random() * rMax;
      const y  = (Math.random() - 0.5) * yMax * 2;
      this.scP[i*4]   = th;
      this.scP[i*4+1] = r;
      this.scP[i*4+2] = (Math.random() - 0.5) * 0.005;
      this.scP[i*4+3] = 0.002 + Math.random() * 0.004;
      this.curPos[i*3]   = Math.cos(th) * r;
      this.curPos[i*3+1] = y;
      this.curPos[i*3+2] = Math.sin(th) * r;
    }
  }

  _ease(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

  _setPhase(name, dur) {
    this.phase = name; this.phaseT0 = performance.now(); this.phaseDur = dur;
    if (name === 'assemble' || name === 'dissolve') {
      this.fromPos = this.curPos.slice();
      this._disp.fill(0);
    }
    if (name === 'dissolve') {
      this.toPos = new Float32Array(N_PTC * 3);
      for (let i = 0; i < N_PTC; i++) {
        const th = Math.random() * Math.PI * 2, r = 0.5 + Math.random() * 3.5;
        this.toPos[i*3]   = Math.cos(th)*r;
        this.toPos[i*3+1] = (Math.random()-0.5)*4;
        this.toPos[i*3+2] = Math.sin(th)*r;
      }
    }
  }

  _init() {
    this.W = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.H = this.canvas.parentElement?.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.W, this.H);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, this.W/this.H, 0.1, 100);
    this.camera.position.set(0, 0, 5);
    const rp    = new RenderPass(this.scene, this.camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(this.W, this.H), 0.5, 0.6, 0.75);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(rp); this.composer.addPass(bloom);

    this._onResize = () => this._resize();
    this._onMouseMove = e => {
      this._mx = (e.clientX/this.W - 0.5) * 2;
      this._my = (e.clientY/this.H - 0.5) * 2;
    };
    this._onTouchMove = e => {
      const t = e.touches[0];
      this._mx = (t.clientX/this.W - 0.5) * 2;
      this._my = (t.clientY/this.H - 0.5) * 2;
    };
    window.addEventListener('resize', this._onResize);
    window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    window.addEventListener('touchmove', this._onTouchMove, { passive: true });

    this._resetScatter();

    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.curPos, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    const col = new Float32Array(N_PTC * 3);
    for (let i = 0; i < N_PTC; i++) {
      const f = Math.random();
      col[i*3]   = 0.9 + f * 0.1;
      col[i*3+1] = 0.78 + f * 0.14;
      col[i*3+2] = 0.3 + f * 0.45;
    }
    this.colAttr = new THREE.BufferAttribute(col, 3);
    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('color',    this.colAttr);
    this.pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.022, map: this._makeCircleTex(), vertexColors: true,
      transparent: true, opacity: 0.92, depthWrite: false,
      blending: THREE.AdditiveBlending, sizeAttenuation: true, alphaTest: 0.001,
    }));
    this.scene.add(this.pts);
    this.phaseT0 = performance.now();
  }

  _resize() {
    this.W = this.canvas.parentElement?.clientWidth || window.innerWidth;
    this.H = this.canvas.parentElement?.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    this.renderer.setSize(this.W, this.H);
    this.renderer.setPixelRatio(dpr);
    this.camera.aspect = this.W/this.H;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(this.W, this.H);
    if (this.phase === 'hold') this.toPos = this._sampleSEN();
  }

  update() {
    if (!this._alive) return;
    this.t += 0.007;
    const elapsed = performance.now() - this.phaseT0;
    const p = this._ease(Math.min(1, elapsed / this.phaseDur));
    const boost = 1 + Math.abs(this._mx)*0.8 + Math.abs(this._my)*0.8;

    if (this.phase === 'scatter') {
      const ang = 0.007 * boost;
      for (let i = 0; i < N_PTC; i++) {
        const r = this.scP[i*4+1];
        this.scP[i*4]      += ang * (1.5/(r+0.5));
        this.scP[i*4+1]    += this.scP[i*4+3] * boost * 0.25;
        this.curPos[i*3+1] += this.scP[i*4+2];
        this.curPos[i*3]    = Math.cos(this.scP[i*4]) * this.scP[i*4+1];
        this.curPos[i*3+2]  = Math.sin(this.scP[i*4]) * this.scP[i*4+1];
        if (this.scP[i*4+1] > this._scatterRMax() || Math.abs(this.curPos[i*3+1]) > 2.4) {
          this.scP[i*4]      = Math.random()*Math.PI*2;
          this.scP[i*4+1]    = Math.random()*0.4;
          this.curPos[i*3+1] = (Math.random()-0.5)*1.2;
        }
      }
      this.posAttr.needsUpdate = true;
    } else if (this.phase === 'assemble') {
      const f = this.fromPos, to = this.toPos;
      for (let i = 0; i < N_PTC*3; i++) this.curPos[i] = f[i]*(1-p) + to[i]*p;
      this.posAttr.needsUpdate = true;
    } else if (this.phase === 'hold' && this.toPos) {
      const halfH = Math.tan(21*Math.PI/180)*5;
      const halfW = halfH*(this.W/this.H);
      const mwx = this._mx * halfW, mwy = -this._my * halfH;
      const RADIUS = 0.7, STRENGTH = 0.09, DAMPING = 0.88, amp = 0.005;
      for (let i = 0; i < N_PTC; i++) {
        const ph = (i*2.39996)%(Math.PI*2);
        const w  = Math.sin(this.t*1.8+ph)*amp;
        const tx = this.toPos[i*3]   + w*Math.cos(ph);
        const ty = this.toPos[i*3+1] + w*Math.sin(ph);
        const tz = this.toPos[i*3+2] + w*0.3;
        const dx = tx - mwx, dy = ty - mwy;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < RADIUS && dist > 0.001) {
          const f2 = STRENGTH * Math.pow(1-dist/RADIUS, 2);
          this._disp[i*3]   += (dx/dist)*f2;
          this._disp[i*3+1] += (dy/dist)*f2;
        }
        this._disp[i*3]   *= DAMPING;
        this._disp[i*3+1] *= DAMPING;
        this._disp[i*3+2] *= DAMPING;
        this.curPos[i*3]   = tx + this._disp[i*3];
        this.curPos[i*3+1] = ty + this._disp[i*3+1];
        this.curPos[i*3+2] = tz + this._disp[i*3+2];
      }
      this.posAttr.needsUpdate = true;
    } else if (this.phase === 'dissolve') {
      const f = this.fromPos, to = this.toPos;
      for (let i = 0; i < N_PTC*3; i++) this.curPos[i] = f[i]*(1-p) + to[i]*p;
      this.posAttr.needsUpdate = true;
    }

    const tx = this._my * -0.02, ty = this._mx * 0.025;
    this.camera.rotation.x += (tx - this.camera.rotation.x)*0.03;
    this.camera.rotation.y += (ty - this.camera.rotation.y)*0.03;
    this.composer.render();
  }

  destroy() {
    this._alive = false;
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('touchmove', this._onTouchMove);
    this.renderer?.dispose();
  }

  async start() {
    this._init();
    const loop = () => { if (!this._alive) return; this.update(); requestAnimationFrame(loop); };
    loop();
    while (this._alive) {
      this.toPos = this._sampleSEN();
      this._setPhase('scatter', 800);
      await wait(800);
      if (!this._alive) break;
      this._setPhase('assemble', 2400);
      await wait(2600);
      if (!this._alive) break;
      this._setPhase('hold', 8000);
      await wait(8000);
      if (!this._alive) break;
      this._setPhase('dissolve', 1600);
      await wait(1800);
      if (!this._alive) break;
      for (let i = 0; i < N_PTC; i++) {
        const x = this.curPos[i*3], z = this.curPos[i*3+2];
        const r = Math.sqrt(x*x+z*z);
        this.scP[i*4]   = Math.atan2(z,x);
        this.scP[i*4+1] = Math.max(0.1, r);
      }
    }
  }
}

export default function SENParticle() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new SENScene(canvas);
    scene.start();
    return () => scene.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
