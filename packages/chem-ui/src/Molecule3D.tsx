// 3D-Ansicht eines Moleküls (three.js): frei drehen (ziehen), zoomen (Mausrad / zwei Finger).
// Kugel-Stab-Modell (Stäbe zweifarbig, je Hälfte in der Atomfarbe) oder Kalottenmodell (Van-der-Waals-Radien).
// Atomsymbol erscheint beim Antippen eines Atoms. Optional Bindungswinkel, freie Elektronenpaare (Wolken) und Dipol (δ+/δ−, Pfeil).
// Wird nur bei Bedarf geladen: import("@lern/chem-ui/3d").

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { DIPOLE_MIN, embed3D, embedComputed, embedMol3D, dipoleVector, polarBonds, en, type AngleMode, type Mol3D, type Molecule, type Vec } from "@lern/chem";
import { tr } from "@lern/i18n";

// Farbfamilien nach CPK, Werte aus der gemeinsamen Palette (tokens.css --hue-*; three.js braucht feste Zahlen)
const CPK: Record<string, number> = { H: 0xf4f4f0, C: 0x3a3a3a, N: 0x4a78bf, O: 0xdd5444, F: 0xa9c46a, Cl: 0x7fb55a, Br: 0xa2503f, I: 0x83569e, S: 0xedc242, P: 0xea9146, B: 0xe0a08f, Si: 0xc2b28c };
const RADIUS: Record<string, number> = { H: 0.26, C: 0.38, N: 0.36, O: 0.35, F: 0.34, Cl: 0.46, Br: 0.5, I: 0.56, S: 0.46, P: 0.46, B: 0.4, Si: 0.5 };
/** Van-der-Waals-Radien (Å) für das Kalottenmodell */
const VDW: Record<string, number> = { H: 1.1, C: 1.7, N: 1.55, O: 1.52, F: 1.47, Cl: 1.75, Br: 1.85, I: 1.98, S: 1.8, P: 1.8, B: 1.92, Si: 2.1 };
export type Look = "ball" | "fill";
const v3 = (v: Vec) => new THREE.Vector3(v[0], v[1], v[2]);

function label(text: string, cls: string) {
  const el = document.createElement("span");
  el.className = `m3d-label ${cls}`;
  el.textContent = text;
  return new CSS2DObject(el);
}

// ein gemeinsamer Zylinder (Radius 1, Höhe 1), je Stab nur skaliert – viel weniger Geometrie bei großen Molekülen (Zucker)
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 16);
function cylinder(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(UNIT_CYL, mat);
  m.scale.set(r, d.length(), r);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  return m;
}

export interface Molecule3DProps {
  /** Molekül vom Raster (Elektronenpaarbindung) … */
  mol?: Molecule;
  /** … oder fertige Lage aus den Daten (mol3d.ts), z. B. für Stoffe in Reaktionsgleichungen */
  data?: Mol3D;
  /** berechnete Lage (Kraftfeld) zu `mol` – Winkel als Näherung beschriftet */
  computed?: Mol3D;
  showAngles?: boolean;
  showLonePairs?: boolean;
  showDipole?: boolean;
  /** Dipolpfeil zeichnen (nur sinnvoll bei kleinen Molekülen; Teilladungen erscheinen trotzdem) */
  dipoleArrow?: boolean;
  autoRotate?: boolean;
  /** „real“ = gemessene Winkel (H₂O 104,5°), „ideal“ = Idealwinkel des EPA-Modells (109,5°) */
  angleMode?: AngleMode;
  /** Kugel-Stab (Standard) oder Kalotte */
  look?: Look;
}

export default function Molecule3D({ mol, data, computed, showAngles = true, showLonePairs = false, showDipole = false, dipoleArrow = true, autoRotate = true, angleMode = "real", look = "ball" }: Molecule3DProps) {
  const host = useRef<HTMLDivElement>(null);
  // Blickrichtung bleibt beim Umschalten (Winkel, Paare, Dipol, real/ideal) erhalten – nur ein neues Molekül setzt sie zurück
  const view = useRef<{ key: Molecule | Mol3D | undefined; look: Look; pos: THREE.Vector3; auto: boolean } | null>(null);
  const key = data ?? mol;

  useEffect(() => {
    const box = host.current!;
    const w = () => box.clientWidth, h = () => box.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w() / h(), 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio < 2, alpha: true }); // hochauflösende Handys: Kantenglättung unnötig, spart viel Rechenzeit
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w(), h());
    box.appendChild(renderer.domElement);
    const labels = new CSS2DRenderer();
    labels.setSize(w(), h());
    labels.domElement.className = "m3d-labels";
    box.appendChild(labels.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a80, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(3, 5, 6);
    scene.add(sun);

    const e = data ? embedMol3D(data) : computed ? embedComputed(mol!, computed, angleMode) : embed3D(mol!, angleMode);
    const group = new THREE.Group();
    scene.add(group);
    const pos = new Map(e.atoms.map(a => [a.id, v3(a.pos)]));
    const extra: THREE.Vector3[] = [];

    const fill = look === "fill";
    const rOf = (el: string) => (fill ? VDW[el] ?? 1.6 : RADIUS[el] ?? 0.4);
    // Atome; Symbol erst beim Antippen (sonst verdecken die Buchstaben das Modell)
    const mats = new Map<string, THREE.MeshStandardMaterial>();
    const matOf = (el: string) => {
      if (!mats.has(el)) mats.set(el, new THREE.MeshStandardMaterial({ color: CPK[el] ?? 0xaaaaaa, roughness: 0.5, metalness: 0.02 }));
      return mats.get(el)!;
    };
    // Kugel je Element nur einmal; Symbole hängen erst beim Antippen in der Szene (jede Beschriftung kostet in jedem Bild)
    const spheres = new Map<string, THREE.SphereGeometry>();
    const sphereOf = (el: string) => {
      if (!spheres.has(el)) spheres.set(el, new THREE.SphereGeometry(rOf(el), 32, 20));
      return spheres.get(el)!;
    };
    const atomMeshes: THREE.Mesh[] = [];
    for (const a of e.atoms) {
      const mesh = new THREE.Mesh(sphereOf(a.el), matOf(a.el));
      mesh.position.copy(pos.get(a.id)!);
      group.add(mesh);
      const l = label(a.el, a.el === "H" ? "sym light" : "sym");
      l.position.copy(pos.get(a.id)!);
      mesh.userData.label = l;
      atomMeshes.push(mesh);
    }
    // Bindungen: je Hälfte in der Farbe ihres Atoms (Mehrfachbindungen als parallele Stäbe); im Kalottenmodell keine
    const elOf = new Map(e.atoms.map(a => [a.id, a.el]));
    for (const b of fill ? [] : e.bonds) {
      const A = pos.get(b.a)!, B = pos.get(b.b)!;
      const axis = new THREE.Vector3().subVectors(B, A).normalize();
      // Mehrfachbindung in der Ebene der Nachbarbindungen (übliche Zeichnung: C=O im Ring in der Ringebene), sonst beliebig quer
      let side = new THREE.Vector3();
      for (const o of e.bonds) {
        if (o === b) continue;
        const [at, nb] = o.a === b.a || o.a === b.b ? [o.a, o.b] : o.b === b.a || o.b === b.b ? [o.b, o.a] : [-1, -1];
        if (at < 0) continue;
        const d = new THREE.Vector3().subVectors(pos.get(nb)!, pos.get(at)!);
        d.addScaledVector(axis, -d.dot(axis));
        if (d.lengthSq() > 1e-4) { side = d; break; }
      }
      if (side.lengthSq() < 1e-6) side = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 0, 1));
      if (side.lengthSq() < 1e-6) side = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0));
      side.normalize();
      const offs = b.order === 1 ? [0] : b.order === 2 ? [-0.1, 0.1] : [-0.15, 0, 0.15];
      const mid = A.clone().add(B).multiplyScalar(0.5);
      for (const o of offs) {
        const a2 = A.clone().addScaledVector(side, o), b2 = B.clone().addScaledVector(side, o), m2 = mid.clone().addScaledVector(side, o);
        const r = b.order === 1 ? 0.11 : 0.065;
        group.add(cylinder(a2, m2, r, matOf(elOf.get(b.a)!)));
        group.add(cylinder(m2, b2, r, matOf(elOf.get(b.b)!)));
      }
    }
    // Freie Elektronenpaare als Wolken
    if (showLonePairs && !fill) {
      const lpMat = new THREE.MeshStandardMaterial({ color: 0x4a78bf, transparent: true, opacity: 0.32, roughness: 0.3, depthWrite: false });
      for (const lp of e.lonePairs) {
        const d = v3(lp.dir).normalize();
        const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 18), lpMat);
        lobe.scale.set(0.75, 1.45, 0.75);
        lobe.position.copy(pos.get(lp.atom)!).addScaledVector(d, 0.72);
        lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        group.add(lobe);
        for (const s of [-0.09, 0.09]) {
          const perp = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0.3, 1, 0.2)).normalize();
          const dotMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), new THREE.MeshStandardMaterial({ color: 0x4a78bf }));
          dotMesh.position.copy(pos.get(lp.atom)!).addScaledVector(d, 0.78).addScaledVector(perp, s);
          group.add(dotMesh);
        }
      }
    }
    // Bindungswinkel: Bogen + Beschriftung je Zentralatom
    if (showAngles && !fill) {
      for (const ang of e.angles) {
        const C = pos.get(ang.center)!;
        const u = new THREE.Vector3().subVectors(pos.get(ang.a)!, C).normalize();
        const v = new THREE.Vector3().subVectors(pos.get(ang.b)!, C).normalize();
        const r = 0.62;
        const pts: THREE.Vector3[] = [];
        const theta = u.angleTo(v);
        let n = new THREE.Vector3().crossVectors(u, v);
        if (n.lengthSq() < 1e-8) n = new THREE.Vector3().crossVectors(u, new THREE.Vector3(0, 0, 1));
        n.normalize();
        for (let i = 0; i <= 32; i++) pts.push(C.clone().add(u.clone().applyAxisAngle(n, (theta * i) / 32).multiplyScalar(r)));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xdd5444 })));
        if (!ang.label) continue;
        const mid = u.clone().applyAxisAngle(n, theta / 2);
        const l = label(ang.label, "angle");
        // im Ring nahe an der Ecke, sonst überlagern sich die Zahlen in der Ringmitte
        l.position.copy(C).addScaledVector(mid, ang.ring ? r : r + 0.35);
        group.add(l);
      }
    }
    // Teilladungen und Dipolpfeil
    if (showDipole && mol) {
      const signs = new Map<number, string>();
      for (const p of polarBonds(mol)) { signs.set(p.plus, "δ+"); signs.set(p.minus, "δ−"); }
      for (const [id, s] of signs) {
        const l = label(s, s === "δ+" ? "delta plus" : "delta minus");
        l.position.copy(pos.get(id)!).add(new THREE.Vector3(0.32, 0.38, 0));
        group.add(l);
      }
      const d = v3(dipoleVector(e, en));
      // Schwelle für den Pfeil aus @lern/chem (DIPOLE_MIN) – eine Stelle für App und Tests
      if (dipoleArrow && d.length() > DIPOLE_MIN) {
        const dir = d.clone().normalize();
        // Pfeil wie üblich mitten durch das Molekül (von δ+ nach δ−), an beiden Enden etwas überstehend
        const along = [...pos.values()].map(p => p.dot(dir));
        const start = dir.clone().multiplyScalar(Math.min(...along) - 0.75);
        const tip = dir.clone().multiplyScalar(Math.max(...along) + 0.95);
        extra.push(start, tip);
        const arrowMat = new THREE.MeshStandardMaterial({ color: 0x2f7a68, roughness: 0.5 });
        group.add(cylinder(start, tip.clone().addScaledVector(dir, -0.3), 0.06, arrowMat));
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 24), arrowMat);
        cone.position.copy(tip).addScaledVector(dir, -0.17);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        group.add(cone);
        let side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
        if (side.lengthSq() < 1e-6) side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
        side.normalize();
        const l = label(tr("Dipol", "Dipole"), "dipole");
        l.position.copy(tip).addScaledVector(side, 0.45);
        group.add(l);
      }
    }

    // Kamera so setzen, dass das ganze Molekül (samt Dipolpfeil) sichtbar ist
    const radius = Math.max(1.2, ...e.atoms.map(a => pos.get(a.id)!.length() + (fill ? rOf(a.el) : 0.8)), ...extra.map(p => p.length() + 0.3));
    // Blick schräg von vorn, aber quer zum Dipol (sonst zeigt der Pfeil auf den Betrachter und verdeckt das Molekül)
    const viewDir = new THREE.Vector3(0.9, 0.7, 2.2).normalize();
    const dip = v3(dipoleVector(e, en));
    if (dip.length() > 0.2) {
      dip.normalize();
      viewDir.addScaledVector(dip, -viewDir.dot(dip));
      if (viewDir.lengthSq() < 1e-4) viewDir.set(0, 0, 1);
      viewDir.normalize();
      camera.up.copy(dip); // Dipol zeigt am Bildschirm nach oben; gedreht wird um die Pfeilachse
    }
    // Abstand so, dass das Molekül auch auf schmalen (Hochformat-)Flächen ganz ins Bild passt
    // (bei jeder Größenänderung neu, solange niemand gedreht/gezoomt hat – das Blatt ist beim Öffnen noch nicht fertig groß)
    const frame = () => {
      const half = Math.min(THREE.MathUtils.degToRad(20), Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) * (w() > 0 && h() > 0 ? w() / h() : 1)));
      const dir = camera.position.lengthSq() > 0 ? camera.position.clone().normalize() : viewDir;
      camera.position.copy(dir).multiplyScalar(radius / Math.sin(half) * (fill ? 1.15 : 0.95));
      camera.lookAt(0, 0, 0);
    };
    frame();
    let touched = false;

    const controls = new OrbitControls(camera, labels.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = radius * 1.2;
    controls.maxDistance = radius * 8;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = autoRotate && !reduced;
    controls.autoRotateSpeed = 1.6;
    controls.addEventListener("start", () => { controls.autoRotate = false; touched = true; });
    const saved = view.current && view.current.key === key && view.current.look === look ? view.current : null;
    if (saved) { camera.position.copy(saved.pos); controls.autoRotate = saved.auto; controls.update(); touched = true; }

    // Antippen (ohne Ziehen) eines Atoms: Symbol ein/aus
    const ray = new THREE.Raycaster(), down = { x: 0, y: 0 };
    const onDown = (ev: PointerEvent) => { down.x = ev.clientX; down.y = ev.clientY; };
    const onUp = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 6) return;
      const r = box.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(atomMeshes)[0];
      if (hit) { const l = hit.object.userData.label as CSS2DObject; if (l.parent) { group.remove(l); l.element.remove(); } else group.add(l); }
    };
    labels.domElement.addEventListener("pointerdown", onDown);
    labels.domElement.addEventListener("pointerup", onUp);

    let raf = 0;
    const loop = () => { controls.update(); renderer.render(scene, camera); labels.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();
    const ro = new ResizeObserver(() => {
      camera.aspect = w() / h(); camera.updateProjectionMatrix();
      if (!touched) frame();
      renderer.setSize(w(), h()); labels.setSize(w(), h());
    });
    ro.observe(box);

    return () => {
      view.current = { key, look, pos: camera.position.clone(), auto: controls.autoRotate };
      cancelAnimationFrame(raf);
      labels.domElement.removeEventListener("pointerdown", onDown);
      labels.domElement.removeEventListener("pointerup", onUp);
      ro.disconnect();
      controls.dispose();
      scene.traverse(o => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
          if (o.geometry !== UNIT_CYL) o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        }
      });
      renderer.dispose();
      // WebGL-Kontext sofort freigeben: Browser erlauben nur etwa 16 gleichzeitig (häufiges Umschalten → „Too many active WebGL contexts“)
      renderer.forceContextLoss();
      box.innerHTML = "";
    };
  }, [key, mol, data, computed, showAngles, showLonePairs, showDipole, dipoleArrow, autoRotate, angleMode, look]);

  return <div ref={host} className="m3d" role="img" aria-label={tr("3D-Modell des Moleküls – ziehen zum Drehen, zoomen mit Mausrad oder zwei Fingern, Atom antippen zeigt das Symbol", "3D model of the molecule – drag to rotate, zoom with mouse wheel or two fingers, tap an atom to show its symbol")} />;
}
