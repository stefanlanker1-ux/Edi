#!/usr/bin/env python3
"""Referenzdaten für das Kraftfeld MMFF94 (packages/chem/src/mmff) aus RDKit.

Erzeugt zufällige, chemisch gültige Moleküle (Ketten, Verzweigungen, Ringe, Aromaten, Heteroaromaten,
funktionelle Gruppen, Ionen, Stereozentren) und schreibt je Molekül eine JSON-Zeile:
  el/q/b   Elemente, Formalladungen, Bindungen (Kekulé, alle H explizit)
  t/pq     MMFF-Atomtypen und Partialladungen
  x0/e0/g0 Startkoordinaten (ETKDG), Energie und Gradient dort, dazu die Energie je Term (terms0)
  x1/e1    nach Optimierung (RDKit, BFGS)
  st       Stereo aus x1: Zentren [Atom, Nachbarn…, Vorzeichen des Spatprodukts], Doppelbindungen [a, b, c, d, cis]
Dazu alle Moleküle der App (mol3d.py) und der Organik-Beispiele.

  pip install rdkit
  python3 scripts/mmff-reference.py 100000 ziel.jsonl [Startwert]
"""
import json
import random
import sys
from multiprocessing import Pool

from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem
from rdkit.Chem.EnumerateStereoisomers import EnumerateStereoisomers, StereoEnumerationOptions

RDLogger.DisableLog("rdApp.*")

# Bausteine: „*“ = Anschlussstelle, {a}{b}… = Ringnummern (je Einsatz neu vergeben)
TERM = [
    "C", "C", "C", "CC", "C(C)C", "C(C)(C)C", "F", "Cl", "Br", "I", "O", "N", "S", "C#N", "C=O", "C(=O)O", "C(=O)OC",
    "C(=O)N", "C(=O)NC", "C(=O)Cl", "[N+](=O)[O-]", "S(=O)(=O)N", "S(=O)(=O)C", "S(=O)C", "SC", "OC", "N(C)C",
    "C(F)(F)F", "C=C", "C#C", "C=CC", "P(=O)(O)O", "OP(=O)(O)O", "C(=O)[O-]", "[NH3+]", "[N+](C)(C)C", "N=[N+]=[N-]",
    "N=C(N)N", "C=NO", "OC(=O)C", "NC(=O)C", "NC(=O)N", "OC(=O)N", "[Si](C)(C)C", "C(=O)C", "C(=O)c1ccccc1",
    "c1ccccc1", "c1ccccc1", "c1ccncc1", "c1cccnc1", "c1ccco1", "c1cccs1", "c1ccc[nH]1", "c1cn[nH]c1", "c1cnc[nH]1",
    "c1ncco1", "c1nccs1", "c1ccon1", "c1nnn[nH]1", "c1ncccn1", "c1cnccn1", "c1ccc2ccccc2c1", "c1ccc2[nH]ccc2c1",
    "c1ccc2occc2c1", "c1ccc2ncccc2c1", "C1CC1", "C1CCC1", "C1CCCC1", "C1CCCCC1", "C1CCOC1", "C1CCNCC1", "N1CCOCC1",
    "N1CCCC1=O", "C1CCC(=O)C1", "C1=CCCCC1", "C1OC(=O)CC1", "C1CCCCCCC1", "[O-]", "S(=O)(=O)[O-]", "[nH]1cccc1",
    "n1cccc1", "C(=S)N", "SS", "OO", "NN", "N=O", "C=[N+]([O-])C", "[n+]1ccccc1", "B(O)O",
]
LINK = [
    "C*", "C*", "CC*", "CC*", "O*", "N*", "NC*", "S*", "C(=O)*", "C(=O)O*", "C(=O)N*", "OC(=O)*",
    "NC(=O)*", "C=C*", "C#C*", "c{a}ccc*cc{a}*", "c{a}cccc*c{a}*", "c{a}ccccc{a}*", "C{a}CCC*CC{a}*",
    "S(=O)(=O)*", "N=N*", "C=N*", "OC(=O)N*", "c{a}ccc*o{a}*", "c{a}ccc*s{a}*", "c{a}cc*n{a}*", "C(F)(F)*",
    "C(O)*", "C(N)*", "C(Cl)*", "OCC*", "NCC*", "C(=O)C*", "P(=O)(O)*", "c{a}ccc*n{a}*", "C{a}CC{a}*",
    "[Si](C)(C)*", "C(=O)NC(=O)*", "N(C(=O)C)*", "C=CC=C*", "C(C)(C)*",
]
# Verzweigungen: jede „*“ außer der letzten wird als Klammerzweig eingesetzt
BRANCH = ["C**", "C(C)**", "N**", "C(=O)*", "c{a}cc*cc*c{a}", "C{a}CC*C*C{a}", "C=C**", "P(=O)**", "S(=O)(=O)*",
          "[N+](C)**", "C(O)**", "C(*)=C**"]
CORE = ["*", "*", "C*", "c{a}ccc*cc{a}*", "C{a}CC*CC{a}*", "c{a}cc{b}cc*ccc{b}cc{a}*", "N**", "C***",
        "c{a}cc*cc*c{a}*", "C{a}CC{b}CCC*CC{b}C{a}*", "c{a}ccc{b}[nH]c*cc{b}c{a}*", "O=C{a}CCC*N{a}*"]


def ringify(tpl):
    """Ringziffern außerhalb von [] als Platzhalter {a}/{b} schreiben (je Einsatz neu nummeriert)"""
    out, inside = "", False
    for ch in tpl:
        inside = (inside or ch == "[") and ch != "]"
        out += {"1": "{a}", "2": "{b}"}.get(ch, ch) if not inside and ch != "]" else ch
    return out


TERM = [ringify(t) for t in TERM]


def fill(tpl, ring):
    out = tpl
    for key in "ab":
        if "{" + key + "}" in out:
            ring[0] += 1
            if ring[0] > 99:
                raise ValueError("zu viele Ringe")
            out = out.replace("{" + key + "}", f"%{ring[0]:02d}" if ring[0] >= 10 else str(ring[0]))
    return out


def grow(rng, budget, ring):
    """Ersetzt ein „*“: Endgruppe, Glied (ein weiteres „*“) oder Verzweigung (zwei „*“)"""
    if budget[0] <= 0:
        return fill(rng.choice(TERM[:20]), ring)
    budget[0] -= 1
    r = rng.random()
    if r < .45:
        return fill(rng.choice(TERM), ring)
    return expand(rng, fill(rng.choice(LINK if r < .85 else BRANCH), ring), budget, ring)


def expand(rng, tpl, budget, ring):
    """„*“ ersetzen: am Ende direkt anhängen, sonst als Zweig in Klammern"""
    parts = tpl.split("*")
    out = parts[0]
    for i, p in enumerate(parts[1:]):
        g = grow(rng, budget, ring)
        last = i == len(parts) - 2 and p == ""
        out += g if last else "(" + g + ")" + p
    return out


def random_smiles(rng):
    ring = [0]
    tpl = fill(rng.choice(CORE), ring)
    budget = [rng.choice([1, 2, 3, 4, 5, 6, 8, 10])]
    return expand(rng, tpl, budget, ring)


def app_smiles():
    """Moleküle der App (Elektronenpaarbindung, Reaktionsgleichungen, Gemische, Organik-Beispiele)"""
    out = []
    try:
        src = open("scripts/mol3d.py").read()
        start = src.index("SMILES = {")
        end = src.index("}\n", start) + 1
        ns = {}
        exec(src[start:end], ns)
        out += list(ns["SMILES"].values())
    except Exception:
        pass
    return out


def stereo_of(m, conf):
    """Stereo aus den Koordinaten: Zentren mit festgelegter Chiralität, Doppelbindungen mit E/Z"""
    pos = conf.GetPositions()
    centers, bonds = [], []
    for a in m.GetAtoms():
        if a.GetChiralTag() in (Chem.ChiralType.CHI_TETRAHEDRAL_CW, Chem.ChiralType.CHI_TETRAHEDRAL_CCW):
            nb = [n.GetIdx() for n in a.GetNeighbors()][:3]
            if len(nb) < 3:
                continue
            c = pos[a.GetIdx()]
            v = [pos[i] - c for i in nb]
            vol = float(v[0][0] * (v[1][1] * v[2][2] - v[1][2] * v[2][1]) - v[0][1] * (v[1][0] * v[2][2] - v[1][2] * v[2][0]) + v[0][2] * (v[1][0] * v[2][1] - v[1][1] * v[2][0]))
            centers.append([a.GetIdx(), *nb, 1 if vol > 0 else -1])
    for b in m.GetBonds():
        if b.GetBondType() != Chem.BondType.DOUBLE or b.GetStereo() in (Chem.BondStereo.STEREONONE, Chem.BondStereo.STEREOANY):
            continue
        if b.IsInRing():
            continue
        a1, a2 = b.GetBeginAtom(), b.GetEndAtom()
        n1 = [n.GetIdx() for n in a1.GetNeighbors() if n.GetIdx() != a2.GetIdx()]
        n2 = [n.GetIdx() for n in a2.GetNeighbors() if n.GetIdx() != a1.GetIdx()]
        if not n1 or not n2:
            continue
        p = pos
        import numpy as np
        b0, b1 = p[a1.GetIdx()], p[a2.GetIdx()]
        ax = b1 - b0
        u = p[n1[0]] - b0
        w = p[n2[0]] - b1
        u = u - ax * (u @ ax) / (ax @ ax)
        w = w - ax * (w @ ax) / (ax @ ax)
        bonds.append([n1[0], a1.GetIdx(), a2.GetIdx(), n2[0], 1 if (u @ w) > 0 else 0])
    return {"c": centers, "d": bonds}


def rnd(xs, k=4):
    return [round(float(x), k) for x in xs]


def reference(args):
    idx, smi, seed = args
    try:
        m = Chem.MolFromSmiles(smi)
        if m is None or m.GetNumHeavyAtoms() > 40:
            return None
        if any(a.GetNumRadicalElectrons() for a in m.GetAtoms()):
            return None
        # nicht festgelegte Stereozentren zufällig festlegen
        opts = StereoEnumerationOptions(onlyUnassigned=True, maxIsomers=8, rand=seed, unique=True)
        isos = list(EnumerateStereoisomers(m, options=opts))
        if isos:
            m = isos[seed % len(isos)]
        m = Chem.AddHs(m)
        if not AllChem.MMFFHasAllMoleculeParams(m):
            return None
        ps = AllChem.ETKDGv3()
        ps.randomSeed = seed
        if AllChem.EmbedMolecule(m, ps) != 0:
            return None
        mp = AllChem.MMFFGetMoleculeProperties(m)
        conf = m.GetConformer()
        # Startkoordinaten gerundet übernehmen (Energie gilt für genau diese Zahlen)
        for i in range(m.GetNumAtoms()):
            p = conf.GetAtomPosition(i)
            conf.SetAtomPosition(i, [round(p.x, 4), round(p.y, 4), round(p.z, 4)])
        x0 = rnd(conf.GetPositions().flatten())
        ff = AllChem.MMFFGetMoleculeForceField(m, mp)
        e0 = ff.CalcEnergy()
        g0 = ff.CalcGrad()
        terms = {}
        names = ["Bond", "Angle", "StretchBend", "Oop", "Torsion", "VdW", "Ele"]
        for name in names:
            mp2 = AllChem.MMFFGetMoleculeProperties(m)
            for other in names:
                getattr(mp2, f"SetMMFF{other}Term")(other == name)
            terms[name] = AllChem.MMFFGetMoleculeForceField(m, mp2).CalcEnergy()
        ff.Minimize(maxIts=5000)
        for i in range(m.GetNumAtoms()):
            p = conf.GetAtomPosition(i)
            conf.SetAtomPosition(i, [round(p.x, 4), round(p.y, 4), round(p.z, 4)])
        x1 = rnd(conf.GetPositions().flatten())
        e1 = AllChem.MMFFGetMoleculeForceField(m, mp).CalcEnergy()
        mk = Chem.Mol(m)
        Chem.Kekulize(mk, clearAromaticFlags=True)
        return json.dumps({
            "id": idx, "smi": Chem.MolToSmiles(Chem.RemoveHs(m)),
            "el": [a.GetSymbol() for a in mk.GetAtoms()],
            "q": [a.GetFormalCharge() for a in mk.GetAtoms()],
            "b": [[b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())] for b in mk.GetBonds()],
            "t": [mp.GetMMFFAtomType(i) for i in range(m.GetNumAtoms())],
            "pq": rnd([mp.GetMMFFPartialCharge(i) for i in range(m.GetNumAtoms())], 5),
            "x0": x0, "e0": round(e0, 6), "g0": rnd(g0, 5), "terms0": {k: round(v, 6) for k, v in terms.items()},
            "x1": x1, "e1": round(e1, 6), "st": stereo_of(m, conf),
        }, separators=(",", ":"))
    except Exception:
        return None


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    path = sys.argv[2] if len(sys.argv) > 2 else "mmff-ref.jsonl"
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    rng = random.Random(seed)
    seen = set()
    jobs = []
    for smi in app_smiles():
        jobs.append(smi)
    # Kandidaten erzeugen (eindeutig nach kanonischem SMILES)
    while len(jobs) < n * 1.6:
        try:
            smi = random_smiles(rng)
        except ValueError:
            continue
        m = Chem.MolFromSmiles(smi)
        if m is None:
            continue
        can = Chem.MolToSmiles(m)
        if can in seen:
            continue
        seen.add(can)
        jobs.append(can)
    done = 0
    with open(path, "w") as out, Pool() as pool:
        for line in pool.imap(reference, [(i, s, seed * 1000003 + i) for i, s in enumerate(jobs)], chunksize=64):
            if line is None:
                continue
            out.write(line + "\n")
            done += 1
            if done % 5000 == 0:
                print(done, flush=True)
            if done >= n:
                pool.terminate()
                break
    print(f"{done} Moleküle → {path}")


if __name__ == "__main__":
    main()
