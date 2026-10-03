#!/usr/bin/env python3
"""3D-Koordinaten für alle Beispielmoleküle (Elektronenpaarbindung, Reaktionsgleichungen, Gemische).

Verfahren: Konformere erzeugen (RDKit ETKDG), mit dem Kraftfeld MMFF94 optimieren,
das energieärmste nehmen; gemessene Bindungslängen und -winkel (MEASURED, REAL_ANGLES, DIATOMIC, FIXED)
werden dabei festgehalten. Ergebnis: packages/chem/src/mol3d.ts (reine Daten, offline).
In den Apps gilt: hinterlegte Struktur zuerst, alle übrigen Moleküle rechnet MMFF94 (nur Android/iOS).
Neu erzeugen:  pip install rdkit && python3 scripts/mol3d.py
"""
from pathlib import Path
import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem

# Schlüssel = Formel wie in KNOWN (Elektronenpaarbindung) bzw. REACTIONS (ASCII)
SMILES = {
    "H2": "[H][H]", "O2": "O=O", "N2": "N#N", "Cl2": "ClCl", "F2": "FF", "HCl": "Cl", "HF": "F",
    "H2O": "O", "H2S": "S", "NH3": "N", "PH3": "P", "CH4": "C", "CCl4": "ClC(Cl)(Cl)Cl", "CH3Cl": "CCl",
    "CO2": "O=C=O", "CO": "[C-]#[O+]", "HCN": "C#N", "CH2O": "C=O", "H2O2": "OO",
    "C2H2": "C#C", "C2H4": "C=C", "C2H6": "CC", "C3H8": "CCC", "C4H10": "CCCC", "C5H12": "CCCCC", "C8H18": "CCCCCCCC",
    "CH3OH": "CO", "C2H5OH": "CCO", "C6H12O6": "OC[C@H]1O[C@@H](O)[C@H](O)[C@@H](O)[C@@H]1O",
    "SO2": "O=S=O", "SO3": "O=S(=O)=O", "H2SO4": "OS(=O)(=O)O", "H3PO4": "OP(=O)(O)O", "HNO3": "O[N+](=O)[O-]",
    "NO": "[N]=O", "NO2": "[O]N=O", "P4": "P12P3P1P23", "P4O10": "O=P12OP3(=O)OP(=O)(O1)OP(=O)(O2)O3",
    "P2O5": "O=P(=O)OP(=O)=O",
    # Gemische: Ozon, Öl (vereinfacht als Dodecan), Haushaltszucker (Saccharose)
    "O3": "[O-][O+]=O", "C12H26": "CCCCCCCCCCCC", "H2CO3": "OC(=O)O",
    "C12H22O11": "OC[C@H]1O[C@@](CO)(O[C@H]2O[C@H](CO)[C@@H](O)[C@H](O)[C@H]2O)[C@@H](O)[C@@H]1O",
    # weitere Moleküle (Unter- und Oberstufe)
    "Br2": "BrBr", "I2": "II", "HBr": "Br", "HI": "I", "CS2": "S=C=S", "NF3": "FN(F)F", "PCl3": "ClP(Cl)Cl",
    "CHCl3": "ClC(Cl)Cl", "CH2Cl2": "ClCCl", "SiH4": "[SiH4]", "SiCl4": "Cl[Si](Cl)(Cl)Cl", "N2H4": "NN",
    "BF3": "FB(F)F", "BCl3": "ClB(Cl)Cl", "PCl5": "ClP(Cl)(Cl)(Cl)Cl", "SF6": "FS(F)(F)(F)(F)F", "S8": "S1SSSSSSS1",
    "C6H6": "c1ccccc1", "CH3CHO": "CC=O", "HCOOH": "OC=O", "CH3COOH": "CC(=O)O", "CH3COCH3": "CC(C)=O",
    "CO(NH2)2": "NC(N)=O", "NH2CH2COOH": "NCC(=O)O",
}

# Gemessene Werte (wie REAL_ANGLES in molecules.ts): hier hält das Kraftfeld sie fest.
# Winkel „Zentrum:Nachbarn“ → Grad (gilt für das Paar gleicher Partner bzw. die genannten Partner)
REAL_ANGLES = {
    "O:H,H": 104.5, "S:H,H": 92.1, "N:H,H,H": 107.0, "P:H,H,H": 93.5,
    "O:C,H": 108.9, "O:H,O": 94.8, "C:C,H,H": 117.4, "C:H,H,O": 116.5,
}
# Zweiatomige Moleküle: gemessene Bindungslängen in Å (MMFF kennt z. B. N≡N nicht richtig)
DIATOMIC = {"H2": .741, "O2": 1.208, "N2": 1.098, "Cl2": 1.988, "F2": 1.412, "HCl": 1.275, "HF": .917, "CO": 1.128, "NO": 1.151,
            "Br2": 2.281, "I2": 2.666, "HBr": 1.414, "HI": 1.609}


# Gemessene Bindungslängen (Å, Schlüssel „A-B“ alphabetisch nach Element) und Winkel (Schlüssel „Zentrum:A,B“ = alle Winkel A–Zentrum–B)
# je Molekül; das Kraftfeld hält sie fest, alles Übrige (Verdrillungen, H-Lagen) ergibt sich aus MMFF94.
MEASURED = {
    "H2O": {"H-O": .958}, "H2S": {"H-S": 1.336}, "NH3": {"H-N": 1.012}, "PH3": {"H-P": 1.420}, "CH4": {"C-H": 1.087},
    "NF3": {"F-N": 1.365, "N:F,F": 102.2}, "PCl3": {"Cl-P": 2.043, "P:Cl,Cl": 100.3}, "CCl4": {"C-Cl": 1.767}, "SiH4": {"H-Si": 1.480}, "SiCl4": {"Cl-Si": 2.019},
    "CH3Cl": {"C-Cl": 1.785, "C-H": 1.090, "C:H,H": 110.5},
    "CH2Cl2": {"C-Cl": 1.765, "C-H": 1.087, "C:Cl,Cl": 112.0, "C:H,H": 111.5},
    "CHCl3": {"C-Cl": 1.758, "C-H": 1.080, "C:Cl,Cl": 111.3},
    "HCN": {"C-H": 1.066, "C-N": 1.153},
    "H2O2": {"O-O": 1.475, "H-O": .950},
    "N2H4": {"N-N": 1.447, "H-N": 1.008, "N:H,H": 106.0, "N:H,N": 112.0},
    "CH2O": {"C-O": 1.205, "C-H": 1.111},
    "CH3OH": {"C-O": 1.427, "H-O": .956, "C-H": 1.094},
    "C2H6": {"C-C": 1.535, "C-H": 1.094, "C:C,H": 111.2},
    "C2H4": {"C-C": 1.339, "C-H": 1.086},
    "C2H2": {"C-C": 1.203, "C-H": 1.063},
    "C6H6": {"C-C": 1.397, "C-H": 1.084},
    "C2H5OH": {"C-C": 1.512, "C-O": 1.431},
    "CH3CHO": {"C-O": 1.210, "C-C": 1.501, "C:C,O": 123.9},
    "HCOOH": {"C-O=2": 1.202, "C-O=1": 1.343, "H-O": .972, "C-H": 1.097, "C:O,O": 124.9, "O:C,H": 106.3},
    "CH3COOH": {"C-O=2": 1.214, "C-O=1": 1.364, "C-C": 1.517},
    "CH3COCH3": {"C-O": 1.213, "C-C": 1.520, "C:C,C": 116.7},
    "H2SO4": {"O-S=2": 1.422, "O-S=1": 1.574, "H-O": .970, "S:O=2,O=2": 123.3, "S:O=1,O=1": 101.3},
    "P4": {"P-P": 2.21},
    "P4O10": {"O-P=1": 1.604, "O-P=2": 1.429, "O:P,P": 123.5},
}


# Gemessene Verdrillung (Diederwinkel) H–O–O–H im Wasserstoffperoxid
DIHEDRAL = {"H2O2": 111.5}


def real_constraints(m, ff, skip=frozenset()):
    for a in m.GetAtoms():
        nbs = [n for n in a.GetNeighbors()]
        if len(nbs) < 2:
            continue
        key = f"{a.GetSymbol()}:{','.join(sorted(n.GetSymbol() for n in nbs))}"
        if key not in REAL_ANGLES or any(k.split(":")[0] == a.GetSymbol() for k in skip):
            continue
        pairs = [(x, y) for i, x in enumerate(nbs) for y in nbs[i + 1:] if x.GetSymbol() == y.GetSymbol()] or [(nbs[0], nbs[1])]
        for x, y in pairs:
            ff.MMFFAddAngleConstraint(x.GetIdx(), a.GetIdx(), y.GetIdx(), False, REAL_ANGLES[key], REAL_ANGLES[key], 1e6)


def measured_constraints(m, ff, meas):
    """Bindungslängen und Winkel aus MEASURED festhalten (Schlüssel „A-B“ bzw. „A-B=Ordnung“, „Z:A,B“ bzw. „Z:A=1,B=2“)"""
    def bkey(b, order=False):
        k = "-".join(sorted([b.GetBeginAtom().GetSymbol(), b.GetEndAtom().GetSymbol()]))
        return f"{k}={int(b.GetBondTypeAsDouble())}" if order else k
    for b in m.GetBonds():
        r = meas.get(bkey(b, True), meas.get(bkey(b)))
        if r:
            ff.MMFFAddDistanceConstraint(b.GetBeginAtomIdx(), b.GetEndAtomIdx(), False, r, r, 1e5)
    for a in m.GetAtoms():
        nbs = list(a.GetNeighbors())
        for i, x in enumerate(nbs):
            for y in nbs[i + 1:]:
                def part(n, order):
                    if not order:
                        return n.GetSymbol()
                    return f"{n.GetSymbol()}={int(m.GetBondBetweenAtoms(a.GetIdx(), n.GetIdx()).GetBondTypeAsDouble())}"
                for order in (True, False):
                    k = f"{a.GetSymbol()}:{','.join(sorted([part(x, order), part(y, order)]))}"
                    if k in meas:
                        ff.MMFFAddAngleConstraint(x.GetIdx(), a.GetIdx(), y.GetIdx(), False, meas[k], meas[k], 1e5)
                        break


def embed(smi: str, key: str):
    m = Chem.AddHs(Chem.MolFromSmiles(smi))
    if m.GetNumAtoms() == 1:
        return m, [(0.0, 0.0, 0.0)]
    ids = list(AllChem.EmbedMultipleConfs(m, numConfs=30, randomSeed=42))
    if not ids:
        AllChem.EmbedMolecule(m, randomSeed=42, useRandomCoords=True); ids = [0]
    if AllChem.MMFFHasAllMoleculeParams(m):
        res = AllChem.MMFFOptimizeMoleculeConfs(m, maxIters=5000)
    else:  # Radikale (NO, NO₂) u. ä.: UFF
        res = AllChem.UFFOptimizeMoleculeConfs(m, maxIters=5000)
    best = min(range(len(ids)), key=lambda i: res[i][1])
    if set(smi) == {"C"} and len(smi) >= 4:
        # Kettenmoleküle (Butan, Pentan, Octan): gestreckte Form (alle Bindungen „anti“) – im Teilchenbild eine gerade Kette
        ends = [a.GetIdx() for a in m.GetAtoms() if a.GetSymbol() == "C" and a.GetDegree() - sum(1 for n in a.GetNeighbors() if n.GetSymbol() == "H") == 1]
        def span(i):
            c = m.GetConformer(ids[i]); p, q = c.GetAtomPosition(ends[0]), c.GetAtomPosition(ends[1])
            return (p - q).Length()
        best = max(range(len(ids)), key=lambda i: (round(span(i), 1), -res[i][1]))
    if AllChem.MMFFHasAllMoleculeParams(m):
        ff = AllChem.MMFFGetMoleculeForceField(m, AllChem.MMFFGetMoleculeProperties(m), confId=ids[best])
        meas = MEASURED.get(key, {})
        real_constraints(m, ff, {k for k in meas if ":" in k})
        measured_constraints(m, ff, meas)
        if key in DIHEDRAL:
            chain = [a.GetIdx() for a in m.GetAtoms() if a.GetSymbol() == "O"]
            h = [next(n.GetIdx() for n in m.GetAtomWithIdx(o).GetNeighbors() if n.GetSymbol() == "H") for o in chain]
            ff.MMFFAddTorsionConstraint(h[0], chain[0], chain[1], h[1], False, DIHEDRAL[key], DIHEDRAL[key], 1e6)
        ff.Minimize(maxIts=5000)
    c = m.GetConformer(ids[best])
    pos = [tuple(c.GetAtomPosition(i)) for i in range(m.GetNumAtoms())]
    if key in DIATOMIC:
        pos = [(-DIATOMIC[key] / 2, 0.0, 0.0), (DIATOMIC[key] / 2, 0.0, 0.0)]
    return m, pos

import math


def planar(center, ligs):
    """Zentralatom im Ursprung, Liganden (Element, Länge Å, Winkel in der Ebene °)"""
    return [(center, 0.0, 0.0, 0.0)] + [(el, r * math.cos(math.radians(t)), r * math.sin(math.radians(t)), 0.0) for el, r, t in ligs]


def p2o5():
    # O₂P–O–PO₂ (Schulformel P₂O₅): Brücke 1,60 Å / 123°, P=O 1,45 Å, je P eben (120°), senkrecht zur Brückenebene
    a = math.radians(123 / 2)
    Ps = [(-1.60 * math.sin(a), -1.60 * math.cos(a)), (1.60 * math.sin(a), -1.60 * math.cos(a))]
    atoms = [("O", 0.0, 0.0, 0.0)]
    bonds = []
    for px, py in Ps:
        atoms.append(("P", px, py, 0.0)); ip = len(atoms) - 1; bonds.append((0, ip, 1))
        ux, uy = -px / 1.60, -py / 1.60
        for sgn in (1, -1):
            c, s_ = math.cos(math.radians(120)), math.sin(math.radians(120)) * sgn
            atoms.append(("O", px + 1.45 * c * ux, py + 1.45 * c * uy, 1.45 * s_)); bonds.append((ip, len(atoms) - 1, 2))
    return atoms, bonds


def s8():
    # S₈ als Krone: S–S 2,051 Å, S–S–S 107,9° (Diederwinkel ≈ 98° ergibt sich daraus)
    d, t = 2.051, math.radians(107.9)
    R = 2 * d * math.sin(t / 2) / (2 * math.sin(math.radians(45)))
    h = math.sqrt(d * d - (2 * R * math.sin(math.radians(22.5))) ** 2) / 2
    atoms = [("S", R * math.cos(math.radians(45 * k)), R * math.sin(math.radians(45 * k)), h if k % 2 else -h) for k in range(8)]
    return atoms, [(k, (k + 1) % 8, 1) for k in range(8)]


# Kleine anorganische Moleküle, für die MMFF keine passenden Werte hat: gemessene Struktur (NIST CCCBDB) direkt
FIXED = {
    "CO2": (planar("C", [("O", 1.160, 0), ("O", 1.160, 180)]), [(0, 1, 2), (0, 2, 2)]),
    "SO2": (planar("S", [("O", 1.431, 90 - 59.75), ("O", 1.431, 90 + 59.75)]), [(0, 1, 2), (0, 2, 2)]),
    "SO3": (planar("S", [("O", 1.420, 90), ("O", 1.420, 210), ("O", 1.420, 330)]), [(0, 1, 2), (0, 2, 2), (0, 3, 2)]),
    "NO2": (planar("N", [("O", 1.197, 90 - 67.15), ("O", 1.197, 90 + 67.15)]), [(0, 1, 2), (0, 2, 1)]),
    # HNO₃ eben: N–O(H) 1,406 Å, N=O 1,199/1,211 Å, O–N–O 115,9° / 113,9° / 130,2°, N–O–H 102,2°
    "HNO3": (planar("N", [("O", 1.406, 0), ("O", 1.199, 115.9), ("O", 1.211, -113.9)])
             + [("H", 1.406 + 0.964 * math.cos(math.radians(180 - 102.2)), 0.964 * math.sin(math.radians(180 - 102.2)), 0.0)],
             [(0, 1, 1), (0, 2, 2), (0, 3, 1), (1, 4, 1)]),
    "P2O5": p2o5(),
    "CS2": (planar("C", [("S", 1.553, 0), ("S", 1.553, 180)]), [(0, 1, 2), (0, 2, 2)]),
    "BF3": (planar("B", [("F", 1.307, 90), ("F", 1.307, 210), ("F", 1.307, 330)]), [(0, 1, 1), (0, 2, 1), (0, 3, 1)]),
    "BCl3": (planar("B", [("Cl", 1.742, 90), ("Cl", 1.742, 210), ("Cl", 1.742, 330)]), [(0, 1, 1), (0, 2, 1), (0, 3, 1)]),
    # PCl₅ trigonal-bipyramidal: axial 2,124 Å, äquatorial 2,023 Å
    "PCl5": (planar("P", [("Cl", 2.023, 90), ("Cl", 2.023, 210), ("Cl", 2.023, 330)]) + [("Cl", 0.0, 0.0, 2.124), ("Cl", 0.0, 0.0, -2.124)],
             [(0, i, 1) for i in range(1, 6)]),
    # SF₆ oktaedrisch: 1,561 Å
    "SF6": ([("S", 0.0, 0.0, 0.0)] + [("F", *(1.561 * s_ if j == ax else 0.0 for j in range(3))) for ax in range(3) for s_ in (1, -1)],
            [(0, i, 1) for i in range(1, 7)]),
    "S8": s8(),
    # Ozon gewinkelt: O–O 1,278 Å, 116,8°
    "O3": (planar("O", [("O", 1.278, 90 - 58.4), ("O", 1.278, 90 + 58.4)]), [(0, 1, 2), (0, 2, 1)]),
}

def cage_flat(m):
    """P₄O₁₀ als feste Standard-Zeichnung (eben geht der Käfig nicht mit gleich langen Bindungen):
    drei P im Dreieck, das vierte in der Mitte, auf jeder P–P-Kante eine O-Brücke, endständige O nach außen
    bzw. beim mittleren P zum Betrachter (über dem P). Außenkanten sind länger – dort liegt das O frei zwischen zwei P."""
    P = [a.GetIdx() for a in m.GetAtoms() if a.GetSymbol() == "P"]
    c = P[0]
    R = 1.7
    pos = {c: (0.0, 0.0)}
    for k, p in enumerate(P[1:]):
        t = math.radians(90 + 120 * k)
        pos[p] = (R * math.cos(t), R * math.sin(t))
    for a in m.GetAtoms():
        if a.GetSymbol() != "O" or a.GetDegree() != 2:
            continue
        n1, n2 = [n.GetIdx() for n in a.GetNeighbors()]
        (x1, y1), (x2, y2) = pos[n1], pos[n2]
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if c not in (n1, n2):
            r = math.hypot(mx, my); mx, my = mx / r * (r + .2), my / r * (r + .2)
        pos[a.GetIdx()] = (mx, my)
    for a in m.GetAtoms():
        if a.GetSymbol() != "O" or a.GetDegree() != 1:
            continue
        p = a.GetNeighbors()[0].GetIdx()
        x, y = pos[p]
        if p == c:
            # zeigt zum Betrachter: leicht versetzt über dem mittleren P (wird vorn gezeichnet)
            pos[a.GetIdx()] = (0.42 * math.cos(math.radians(150)), 0.42 * math.sin(math.radians(150)))
        else:
            r = math.hypot(x, y); pos[a.GetIdx()] = (x / r * (r + 1), y / r * (r + 1))
    return [pos[i] for i in range(m.GetNumAtoms())]


out = ["// Erzeugt von scripts/mol3d.py (RDKit, Kraftfeld MMFF94) – nicht von Hand ändern.",
       "// Je Molekül: Atome [Element, x, y, z] in Å, Bindungen [Index, Index, Ordnung]; flat = ebene Zeichnung wie eine Strukturformel [x, y] (Bindung = 1), flatFixed = feste Zeichnung ohne Nachrechnen.",
       "", "export interface Mol3D { atoms: [string, number, number, number][]; bonds: [number, number, number][]; flat?: [number, number][]; flatFixed?: boolean }", "",
       "export const MOL3D: Record<string, Mol3D> = {"]
for key, smi in SMILES.items():
    flat = None
    if key in FIXED:
        (els, bl) = FIXED[key]
        syms, pos, blist = [a[0] for a in els], [a[1:] for a in els], bl
    else:
        m, pos = embed(smi, key)
        # ebene Zeichnung (für das Teilchenbild, wenn räumlich ein Atom verdeckt wäre)
        m2 = Chem.Mol(m); AllChem.Compute2DCoords(m2)
        c2 = m2.GetConformer()
        flat = [(c2.GetAtomPosition(i).x / 1.5, c2.GetAtomPosition(i).y / 1.5) for i in range(m2.GetNumAtoms())]
        if key == "P4O10":
            flat = cage_flat(m)
        syms = [a.GetSymbol() for a in m.GetAtoms()]
        mk = Chem.Mol(m); Chem.Kekulize(mk, clearAromaticFlags=True)  # Benzol: abwechselnd Einfach- und Doppelbindungen
        blist = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())) for b in mk.GetBonds()]
    # Hauptachsen: größte Ausdehnung → x, kleinste → z (ebene Moleküle liegen genau in der xy-Ebene)
    X = np.array(pos, dtype=float); X -= X.mean(axis=0)
    if len(X) > 1:
        w, v = np.linalg.eigh(X.T @ X)
        R = v[:, ::-1]
        if np.linalg.det(R) < 0: R[:, 2] *= -1
        X = X @ R
    X[np.abs(X) < 5e-4] = 0.0
    atoms = ", ".join(f'["{el}", {p[0]:.3f}, {p[1]:.3f}, {p[2]:.3f}]' for el, p in zip(syms, X))
    bonds = ", ".join(f"[{a}, {b}, {o}]" for a, b, o in blist)
    extra = ""
    if flat and len(flat) > 2:
        extra = ", flat: [" + ", ".join(f"[{x:.3f}, {y:.3f}]" for x, y in flat) + "]"
        if key == "P4O10":
            extra += ", flatFixed: true"
    out.append(f'  "{key}": {{ atoms: [{atoms}], bonds: [{bonds}]{extra} }},')
out.append("};")
Path(__file__).resolve().parent.parent.joinpath("packages/chem/src/mol3d.ts").write_text("\n".join(out) + "\n")
print(len(SMILES), "Moleküle")
