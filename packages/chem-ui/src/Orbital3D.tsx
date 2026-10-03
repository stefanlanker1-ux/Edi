// 3D-Orbitale (three.js, wird erst bei Bedarf geladen): Grenzflächen von ψ aus wasserstoffähnlichen Wellenfunktionen
// (@lern/chem orbitals.ts) per Marching Cubes. Farbe nach Orbitaltyp (s, p, d, f wie im Kästchenschema),
// Vorzeichen von ψ als dunkle (+) bzw. helle (−) Tönung. Ziehen dreht, Mausrad/zwei Finger zoomen.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { L_NAMES, REAL_M, orbitalGrid, psi, type OrbitalId } from "@lern/chem";
import { tr } from "@lern/i18n";

export interface OrbitalItem { o: OrbitalId; Zeff: number }

export interface Orbital3DProps {
  items: OrbitalItem[];
  /** gemeinsamer Grenzwert |ψ| (ganzes Atom); ohne: jedes Orbital mit seiner eigenen 90-%-Fläche */
  iso?: number;
  axes?: boolean;
  autoRotate?: boolean;
  /** Auflösung des Rechengitters je Achse */
  res?: number;
}

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};

export default function Orbital3D({ items, iso, axes = true, autoRotate = true, res = 56 }: Orbital3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const key = JSON.stringify([items.map(i => [i.o.n, i.o.l, i.o.m, +i.Zeff.toFixed(3)]), iso, axes, res]);

  useEffect(() => {
    const box = host.current!;
    const w = () => box.clientWidth || 1, h = () => box.clientHeight || 1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, w() / h(), 0.01, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    box.appendChild(renderer.domElement);
    const labels = new CSS2DRenderer();
    labels.setSize(w(), h());
    labels.domElement.className = "m3d-labels";
    box.appendChild(labels.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a80, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(3, 5, 6);
    scene.add(sun);

    const colorOf = (l: number) => cssColor(`--o-${L_NAMES[l]}`, ["#c0392b", "#2f6db3", "#1f8a80", "#c96d1a"][l]);
    let radius = 0.5;
    for (const { o, Zeff } of items) {
      const g = orbitalGrid(o, Zeff, 32, 0.9, iso);
      const level = iso ?? g.iso, half = g.half;
      // gleicher Typ, verschiedene Ausrichtung (px, py, pz …): etwas andere Tönung, damit man sie auseinanderhält
      const idx = REAL_M[o.l].indexOf(o.m), shade = REAL_M[o.l].length > 1 ? (idx / (REAL_M[o.l].length - 1) - 0.5) * 0.5 : 0;
      const base = colorOf(o.l).clone().offsetHSL(shade * 0.25, 0, shade * -0.3);
      for (const sign of [1, -1]) {
        const mat = new THREE.MeshPhongMaterial({
          color: sign > 0 ? base : base.clone().lerp(new THREE.Color(0xffffff), 0.55),
          // kugelförmige s-Orbitale durchscheinend, damit man sieht, was innen liegt und was herausragt
          transparent: true, opacity: o.l === 0 && items.length > 1 ? 0.16 : 0.92, side: THREE.DoubleSide, depthWrite: false, shininess: 40,
        });
        const mc = new MarchingCubes(res, mat, false, false, 60000);
        mc.isolation = level;
        // Gitter wie MarchingCubes es erwartet: Zelle i liegt bei −1 + 2i/res (×half Å)
        for (let k = 0; k < res; k++) for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
          const x = half * (-1 + (2 * i) / res), y = half * (-1 + (2 * j) / res), z = half * (-1 + (2 * k) / res);
          mc.field[k * res * res + j * res + i] = sign * psi(o, Zeff, x, y, z);
        }
        mc.update();
        mc.scale.setScalar(half);
        scene.add(mc);
      }
      radius = Math.max(radius, half);
    }
    // Kern als Punkt
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.03, radius * 0.025), 16, 12), new THREE.MeshPhongMaterial({ color: 0x555555 }));
    scene.add(nuc);
    if (axes) {
      const axisMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      const L = radius * 1.05;
      for (const [name, v] of [["x", [1, 0, 0]], ["y", [0, 1, 0]], ["z", [0, 0, 1]]] as const) {
        const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-v[0] * L, -v[1] * L, -v[2] * L), new THREE.Vector3(v[0] * L, v[1] * L, v[2] * L)]);
        scene.add(new THREE.Line(geo, axisMat));
        const el = document.createElement("span");
        el.className = "m3d-label orb-axis";
        el.textContent = name;
        const lab = new CSS2DObject(el);
        lab.position.set(v[0] * L * 1.06, v[1] * L * 1.06, v[2] * L * 1.06);
        scene.add(lab);
      }
    }

    // Abstand so, dass das ganze Atom in Höhe und Breite passt (schmale Handy-Ansicht: Breite entscheidet)
    const fit = () => {
      const v = THREE.MathUtils.degToRad(camera.fov) / 2, hz = Math.atan(Math.tan(v) * camera.aspect);
      return (radius * 1.15) / Math.sin(Math.min(v, hz));
    };
    const dir = new THREE.Vector3(0.62, 0.45, 0.64).normalize();
    camera.position.copy(dir.clone().multiplyScalar(fit()));
    camera.lookAt(0, 0, 0);
    const controls = new OrbitControls(camera, labels.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = radius * 1.2;
    controls.maxDistance = radius * 10;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = autoRotate && !reduced;
    controls.autoRotateSpeed = 1.4;
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    let raf = 0;
    const loop = () => { controls.update(); renderer.render(scene, camera); labels.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();
    let touched = false;
    controls.addEventListener("start", () => { touched = true; });
    const ro = new ResizeObserver(() => {
      camera.aspect = w() / h(); camera.updateProjectionMatrix();
      if (!touched) camera.position.setLength(fit());
      renderer.setSize(w(), h()); labels.setSize(w(), h());
    });
    ro.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse(o => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      box.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, autoRotate]);

  return <div ref={host} className="m3d orb3d" role="img" aria-label={tr("3D-Orbitale – ziehen zum Drehen, zoomen mit Mausrad oder zwei Fingern", "3D orbitals – drag to rotate, zoom with mouse wheel or two fingers")} />;
}
