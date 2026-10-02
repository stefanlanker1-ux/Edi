#!/usr/bin/env python3
"""Prüfung der Benennung im Modul organik gegen unabhängige Werkzeuge und eine eigene Umsetzung der Regeln.

Ablauf
  1. Moleküle erzeugen und mit der App benennen (vitest: modules/organik/src/chem/check/export.test.ts, ORACLE_OUT=Datei).
  2. Name → Struktur: der englische Name (aus dem deutschen übersetzt) geht an OPSIN; die Struktur muss der gezeichneten
     gleichen (RDKit, E/Z aus der Zeichnung). Ebenso die weiteren Namen (cis/trans, ältere Schreibweise, Schul- und Trivialnamen).
  3. Regeln (IUPAC 2013, hier unabhängig von der App umgesetzt): Hauptgruppe; Stammsystem = meiste Hauptgruppen, Ring vor Kette,
     Ring mit N vor O vor S vor Carbocyclus, größerer Ring, längste Kette (C der Gruppe in der Kette vor „-carbonsäure“),
     meiste Mehrfach-, dann Doppelbindungen; Nummern = kleinste für Hauptgruppen, Mehrfachbindungen, Doppelbindungen; dann
     meiste Vorsilben, kleinste Nummern der Vorsilben, der alphabetisch ersten Vorsilbe, Z vor E. Die Wahl der App muss die beste sein.
  4. Alphabetische Reihenfolge der Vorsilben, Summenformel, Zahl der E/Z-Angaben, Eindeutigkeit (gleiche Struktur → gleicher
     Name, verschiedene Strukturen → verschiedene Namen).

Voraussetzungen: Node mit installierten Paketen, Python 3 mit RDKit (pip install rdkit), Java 11 oder neuer.
OPSIN: --opsin JAR oder Umgebungsvariable OPSIN_JAR; sonst wird das Jar aus dem PyPI-Paket py2opsin in ~/.cache/organik-oracle geladen.
Aufruf (im Wurzelordner): python3 scripts/organik-oracle.py [--out ORDNER] [--seed N] [--show N] [--no-export]
Ergebnis: Zusammenfassung auf der Konsole, alle Befunde in ORDNER/report.txt; Rückgabewert 1 bei Fehlern.
"""

import argparse
import collections
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
import zipfile

from rdkit import Chem, RDLogger
from rdkit.Chem import rdCIPLabeler, rdMolDescriptors

RDLogger.DisableLog("rdApp.*")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── OPSIN ────────────────────────────────────────────────────────────────────


def find_opsin(arg):
    jar = arg or os.environ.get("OPSIN_JAR")
    if jar:
        return jar
    cache = os.path.expanduser("~/.cache/organik-oracle")
    found = glob.glob(os.path.join(cache, "**", "opsin*.jar"), recursive=True)
    if found:
        return found[0]
    os.makedirs(cache, exist_ok=True)
    subprocess.run([sys.executable, "-m", "pip", "download", "py2opsin", "--no-deps", "-q", "-d", cache], check=True)
    for whl in glob.glob(os.path.join(cache, "py2opsin*.whl")):
        with zipfile.ZipFile(whl) as z:
            for n in z.namelist():
                if n.endswith(".jar"):
                    z.extract(n, cache)
    found = glob.glob(os.path.join(cache, "**", "opsin*.jar"), recursive=True)
    if not found:
        sys.exit("OPSIN-Jar nicht gefunden (--opsin JAR)")
    return found[0]


def opsin(jar, names, workdir):
    """Namen → SMILES (None, wenn OPSIN den Namen nicht versteht)"""
    src, dst = os.path.join(workdir, "names.txt"), os.path.join(workdir, "smiles.txt")
    with open(src, "w") as f:
        f.write("\n".join(n.replace("\n", " ") for n in names) + "\n")
    subprocess.run(["java", "-jar", jar, "-osmi", src, dst], check=True, stderr=subprocess.DEVNULL)
    with open(dst) as f:
        out = f.read().split("\n")
    return [(out[i].strip() or None) if i < len(out) else None for i in range(len(names))]


# ── Strukturen ───────────────────────────────────────────────────────────────


def canon(m, stereo=True):
    """kanonisches SMILES ohne R/S; über ein frisch gelesenes SMILES (zwischengespeicherte CIP-Angaben ändern sonst die Reihenfolge)"""
    m = Chem.Mol(m)
    for a in m.GetAtoms():
        a.SetChiralTag(Chem.ChiralType.CHI_UNSPECIFIED)
    if not stereo:
        Chem.RemoveStereochemistry(m)
    return Chem.MolToSmiles(Chem.MolFromSmiles(Chem.MolToSmiles(m)))


RANK = ["saeure", "ester", "amid", "nitril", "al", "on", "ol", "thiol", "amin"]
C_TYPE = {"saeure", "ester", "amid", "nitril", "al"}
HETERO_CLASS = {"N": 0, "O": 1, "S": 2}


class Mol:
    """Molekül aus dem Molfile: Kekulé-Bindungen, Ringe, Gruppen – eigene Erkennung, unabhängig von der App"""

    def __init__(self, molblock):
        m = Chem.MolFromMolBlock(molblock)
        self.rd = m
        self.arom_atoms = {a.GetIdx() for a in m.GetAtoms() if a.GetIsAromatic()}
        k = Chem.Mol(m)
        Chem.Kekulize(k, clearAromaticFlags=True)
        self.n = k.GetNumAtoms()
        self.el = [a.GetSymbol() for a in k.GetAtoms()]
        self.q = [a.GetFormalCharge() for a in k.GetAtoms()]
        self.h = [a.GetTotalNumHs() for a in k.GetAtoms()]
        self.nb = [[] for _ in range(self.n)]
        self.order = {}
        for b in k.GetBonds():
            a, c, o = b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())
            self.nb[a].append(c)
            self.nb[c].append(a)
            self.order[(a, c)] = self.order[(c, a)] = o
        self.rings = [list(r) for r in k.GetRingInfo().AtomRings()]
        self.ring_atoms = {a for r in self.rings for a in r}
        # E/Z (CIP) aus der Zeichnung – an einer Kopie, damit das Molekül selbst unverändert bleibt
        lab = Chem.Mol(m)
        rdCIPLabeler.AssignCIPLabels(lab)
        self.ez = {}
        for b in lab.GetBonds():
            code = b.GetPropsAsDict().get("_CIPCode")
            if code in ("E", "Z"):
                self.ez[frozenset((b.GetBeginAtomIdx(), b.GetEndAtomIdx()))] = code
        self.nitroN = {i for i in range(self.n) if self.el[i] == "N" and self.q[i] == 1}
        self.nitroO = {o for nn in self.nitroN for o in self.nb[nn] if self.el[o] == "O"}
        self.groups = self.detect()

    def o(self, a, b):
        return self.order.get((a, b), 0)

    def ring_order(self, ring):
        """Atome eines Rings in Ringreihenfolge (RDKit liefert sie schon so)"""
        return list(ring)

    def detect(self):
        """funktionelle Gruppen: (Art, C, Atome der Endung, Extra)"""
        groups, used = [], set()
        for c in range(self.n):
            if self.el[c] != "C":
                continue
            n3 = [x for x in self.nb[c] if self.el[x] == "N" and self.o(c, x) == 3]
            if n3:
                groups.append({"kind": "nitril", "c": c, "atoms": [n3[0]]})
                used.add(n3[0])
                continue
            dO = [x for x in self.nb[c] if self.el[x] == "O" and self.o(c, x) == 2 and x not in self.nitroO]
            if not dO:
                continue
            o = dO[0]
            used.add(o)
            if c in self.ring_atoms:
                groups.append({"kind": "on", "c": c, "atoms": [o]})
                continue
            others = [x for x in self.nb[c] if x != o]
            het = [x for x in others if self.el[x] != "C"]
            cs = [x for x in others if self.el[x] == "C"]
            if not het:
                groups.append({"kind": "on" if len(cs) >= 2 else "al", "c": c, "atoms": [o]})
                continue
            h = het[0]
            if self.el[h] == "O":
                rest = [x for x in self.nb[h] if x != c]
                if not rest:
                    groups.append({"kind": "saeure", "c": c, "atoms": [o, h]})
                else:
                    groups.append({"kind": "ester", "c": c, "atoms": [o, h], "s": h, "r": rest[0]})
                used.add(h)
            elif self.el[h] == "N":
                groups.append({"kind": "amid", "c": c, "atoms": [o, h], "n": h})
                used.add(h)
        for a in range(self.n):
            if a in used or a in self.nitroO or a in self.nitroN:
                continue
            e = self.el[a]
            if e in ("O", "S") and len(self.nb[a]) == 1 and self.h[a] == 1:
                groups.append({"kind": "ol" if e == "O" else "thiol", "c": self.nb[a][0], "atoms": [a]})
            elif e == "N" and a not in self.ring_atoms:
                groups.append({"kind": "amin", "c": -1, "atoms": [a], "n": a})
        return groups


# ── Stammsystem und Nummerierung (eigene Umsetzung der Regeln) ──────────────


def sort_key(name):
    """alphabetische Ordnung: Buchstaben (ohne Nummern, Klammern, Bindestriche, E/Z), bei Gleichstand die Nummern, dann Z vor E"""
    plain = re.sub(r"\((?:\d*[EZ],?)+\)-", "", name)
    letters = re.sub(r"[\d,'′″‴\-()\[\]{}\s]", "", plain).lower()
    nums = [int(x) for x in re.findall(r"\d+", plain)]
    ez = "".join(re.findall(r"[EZ]", "".join(re.findall(r"\((?:\d*[EZ],?)+\)", name)))).replace("Z", "0").replace("E", "1")
    return (letters, nums, ez)


class Candidate:
    def __init__(self, mol, kind, seq, mode, KG, ring=None, names=None):
        self.kind, self.seq, self.mode, self.ring = kind, seq, mode, ring
        pos = {a: i + 1 for i, a in enumerate(seq)}
        sset = set(seq)
        counted, plocs, suffix = [], [], set()
        for g in KG:
            a = anchor(mol, g, sset, mode)
            if a is None:
                continue
            counted.append(g)
            plocs.append(pos[a])
            suffix.update(g["atoms"])
            if g["kind"] in C_TYPE and mode == "att":
                suffix.add(g["c"])
        self.counted = counted
        self.plocs = sorted(plocs)
        # Vorsilben: (Atom am Stamm, erstes Atom, Nummer)
        pre = []
        for g in counted:
            if "n" in g:
                for x in mol.nb[g["n"]]:
                    if x not in sset and x != g["c"]:
                        pre.append((g["n"], x, "N"))
        for i, a in enumerate(seq):
            for x in mol.nb[a]:
                if x in sset or x in suffix:
                    continue
                pre.append((a, x, i + 1))
        self.prefixes = pre
        # Mehrfachbindungen im Stamm
        en, yn = [], []
        aromatic = ring is not None and all(a in mol.arom_atoms for a in seq)
        bonds = [(seq[i], seq[i + 1], i + 1) for i in range(len(seq) - 1)]
        if ring is not None:
            bonds.append((seq[-1], seq[0], len(seq)))
        if not aromatic:
            for a, b, loc in bonds:
                o = mol.o(a, b)
                if o == 2:
                    en.append(loc)
                elif o == 3:
                    yn.append(loc)
        nmult = sum(1 for a, b, _ in bonds if mol.o(a, b) > 1)
        ndbl = sum(1 for a, b, _ in bonds if mol.o(a, b) == 2)
        self.en, self.yn = en, yn
        if ring is None:
            structural = (1, 0 if mode == "incl" else 1, -len(seq), -nmult, -ndbl)
        else:
            het = [mol.el[a] for a in seq if mol.el[a] != "C"]
            cls = min((HETERO_CLASS.get(e, 3) for e in het), default=3)
            structural = (0, cls, -len(seq), -nmult, -ndbl)
        numeric = sorted(p[2] for p in pre if p[2] != "N")
        self.key = ((-len(counted),) + structural, self.plocs, sorted(en + yn), en, -len(pre), numeric)
        # alphabetisch erste Vorsilbe (Namen aus der App, je Anknüpfung)
        self.alpha = None
        if names is not None:
            named = [(names.get((a, x)), loc) for a, x, loc in pre]
            if all(n is not None for n, _ in named):
                self.alpha = [loc for _, loc in sorted(((sort_key(n), loc if loc != "N" else 0) for n, loc in named)) if loc != 0]
        # Z vor E: Nummern der Z-Doppelbindungen im Stamm
        z = []
        for pair, code in mol.ez.items():
            a, b = tuple(pair)
            if code != "Z" or (a not in pos and b not in pos):
                continue
            z.append(min(pos[a], pos[b]) if a in pos and b in pos else pos.get(a, pos.get(b)))
        self.z = sorted(z)


def anchor(mol, g, sset, mode):
    k = g["kind"]
    if k == "amin":
        hits = [x for x in mol.nb[g["n"]] if x in sset]
        return hits[0] if hits else None
    if k in C_TYPE:
        if mode == "incl":
            return g["c"] if g["c"] in sset else None
        if g["c"] in sset:
            return None
        hits = [x for x in mol.nb[g["c"]] if x in sset and x not in g["atoms"]]
        return hits[0] if hits else None
    return g["c"] if g["c"] in sset else None


def principal_kind(groups):
    for k in RANK:
        if any(g["kind"] == k for g in groups):
            return k
    return None


def ester_scope(mol, groups, prefer=None):
    """Ester: Säureteil = Teil mit den meisten Ester-C (dann den meisten C) nach Trennen aller O–R-Bindungen"""
    esters = [g for g in groups if g["kind"] == "ester"]

    def comp(start, cuts):
        seen, stack = {start}, [start]
        while stack:
            v = stack.pop()
            for x in mol.nb[v]:
                if x not in seen and frozenset((v, x)) not in cuts:
                    seen.add(x)
                    stack.append(x)
        return seen

    cut = {frozenset((g["s"], g["r"])) for g in esters}
    opts = []
    for g in esters:
        c = comp(g["c"], cut)
        cs = [x for x in esters if x["c"] in c]
        opts.append((len(cs), sum(1 for a in c if mol.el[a] == "C"), cs))
    top = max((n, c) for n, c, _ in opts)
    out = []
    for n, c, cs in opts:
        if (n, c) == top:
            out.append((comp(cs[0]["c"], {frozenset((g["s"], g["r"])) for g in cs}), cs))
    # gleichwertige Säureteile: die App wählt einen davon (Regel hier nicht festgelegt)
    hits = [o for o in out if prefer and set(prefer) <= o[0]]
    return hits[0] if hits else out[0]


def candidates(mol, names, prefer=None):
    K = principal_kind(mol.groups)
    allowed = set(range(mol.n))
    KG = [g for g in mol.groups if g["kind"] == K]
    if K == "ester":
        allowed, KG = ester_scope(mol, mol.groups, prefer)
    out = []
    for ring in mol.rings:
        if not all(a in allowed for a in ring):
            continue
        cyc = mol.ring_order(ring)
        het = [a for a in cyc if mol.el[a] != "C"]
        n = len(cyc)
        for s in range(n):
            for d in (1, -1):
                seq = [cyc[(s + d * j) % n] for j in range(n)]
                if het and seq[0] != het[0]:
                    continue
                out.append(Candidate(mol, "ring", seq, "att", KG, ring=ring, names=names))
    nitrile_ok = K == "nitril"
    nitrileC = {g["c"] for g in mol.groups if g["kind"] == "nitril"}
    cs = [a for a in range(mol.n) if a in allowed and mol.el[a] == "C" and a not in mol.ring_atoms and (nitrile_ok or a not in nitrileC)]
    cset = set(cs)
    groupC = {g["c"] for g in KG if g["kind"] in C_TYPE}
    att = K in C_TYPE
    paths = []

    def walk(p):
        paths.append(list(p))
        for x in mol.nb[p[-1]]:
            if x in cset and x not in p:
                p.append(x)
                walk(p)
                p.pop()

    for s in cs:
        walk([s])
    for seq in paths:
        out.append(Candidate(mol, "chain", seq, "incl", KG, names=names))
        if att and not any(a in groupC for a in seq):
            c = Candidate(mol, "chain", seq, "att", KG, names=names)
            if c.counted:
                out.append(c)
    return K, KG, out


# ── Prüfungen ───────────────────────────────────────────────────────────────


def check_rules(mol, s, findings):
    names = {(a, b): n for a, b, n in s.get("allSubs", [])}
    names.update({(x["at"], x["first"]): x["name"] for x in s["subs"]})
    K, KG, cands = candidates(mol, names, s["parent"]["atoms"])
    if not cands:
        findings.append(("regel", s, "kein Stammsystem gefunden"))
        return
    seq = s["parent"]["atoms"]
    kind = s["parent"]["kind"]
    mode = "incl" if any(g["c"] in seq for g in KG if g["kind"] in C_TYPE) else "att"
    if kind == "chain" and K not in C_TYPE:
        mode = "incl"
    ours = Candidate(mol, kind, seq, mode, KG, ring=(seq if kind == "ring" else None), names=names)
    if (s["principal"] or None) != (K if ours.counted else None):
        findings.append(("hauptgruppe", s, f"App: {s['principal']}, Regel: {K}"))
    best = min(c.key for c in cands)
    if ours.key != best:
        b = next(c for c in cands if c.key == best)
        findings.append(("stamm", s, f"App {describe(mol, ours)} ≠ besser {describe(mol, b)}"))
        return
    tied = [c for c in cands if c.key == best]
    known = [c.alpha for c in tied if c.alpha is not None]
    if ours.alpha is not None and known and ours.alpha != min(known):
        b = next(c for c in tied if c.alpha == min(known))
        findings.append(("alphabet-nummer", s, f"App {describe(mol, ours)} alpha {ours.alpha} ≠ {describe(mol, b)} alpha {b.alpha}"))
        return
    ranks = list(Chem.CanonicalRankAtoms(mol.rd, breakTies=False))
    sigs = {tuple(ranks[a] for a in c.seq) for c in tied if c.alpha is not None}
    if any(c.alpha is None and tuple(ranks[a] for a in c.seq) not in sigs for c in tied):
        findings.append(("hinweis-alpha", s, "gleichwertiges anderes Stammsystem, Vorsilben unbekannt"))
    tied2 = [c for c in tied if c.alpha == ours.alpha or c.alpha is None]
    if tied2 and ours.z != min(c.z for c in tied2):
        findings.append(("z-vor-e", s, f"Z-Nummern App {ours.z}, möglich {min(c.z for c in tied2)}"))


def describe(mol, c):
    k = c.key
    return (f"[{c.kind} {c.mode} {len(c.seq)} Atome, Hauptgruppen {len(c.counted)} bei {c.plocs}, "
            f"Mehrfach {sorted(c.en + c.yn)}, Doppel {c.en}, Vorsilben {len(c.prefixes)} bei {k[5]}]")


def check_alphabet(s, findings):
    skip = {"stereo", "parent", "principal", "alkyl"}
    keys = [p["key"] for p in s["parts"] if p.get("key") and p["key"] not in skip]
    ks = [sort_key(k) for k in keys]
    if ks != sorted(ks):
        findings.append(("alphabet", s, " · ".join(keys)))


def ez_matches(m, s):
    """E/Z der App je Doppelbindung = CIP-Bezeichnung von RDKit (und keine Doppelbindung fehlt)"""
    ours = {frozenset((a, b)): d for a, b, d in s.get("ez", [])}
    return all(ours.get(k) == v for k, v in m.ez.items()) and all(d is None or m.ez.get(k) == d for k, d in ours.items())


def ez_count(name):
    """Zahl der E/Z-Angaben; in bis[(E)-…] doppelt"""
    total = 0
    for m in re.finditer(r"\((?:\d*[EZ],?)+\)", name):
        mult = re.search(r"(bis|tris|tetrakis)[\[\{\(]$", name[: m.start()], re.I)
        total += len(re.findall(r"[EZ]", m.group())) * ({"bis": 2, "tris": 3, "tetrakis": 4}[mult.group(1).lower()] if mult else 1)
    return total


CORPUS_ALL = ("alkan", "mehrfach", "trivial", "ez")


def write_corpus(path, samples, mols, bad):
    """Korpus: je Struktur ein geprüfter Name (Kekulé-SMILES mit E/Z); kleine Familien ganz, sonst jedes 6. Molekül"""
    seen, lines = set(), []
    for i, (s, m) in enumerate(zip(samples, mols)):
        if m is None or s["id"] in bad or any(x["desc"] is None for x in s["stereo"]):
            continue
        fam = s["family"]
        if not (fam in CORPUS_ALL or fam.startswith("gruppe-") or i % 6 == 0):
            continue
        k = Chem.Mol(m.rd)
        for a in k.GetAtoms():
            a.SetChiralTag(Chem.ChiralType.CHI_UNSPECIFIED)
        Chem.Kekulize(k, clearAromaticFlags=True)
        smi = Chem.MolToSmiles(k, kekuleSmiles=True)
        if smi in seen:
            continue
        seen.add(smi)
        lines.append(f"{smi}\t{s['de']}")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"Korpus: {len(lines)} Moleküle → {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--opsin")
    ap.add_argument("--out", default=os.path.join(tempfile.gettempdir(), "organik-oracle"))
    ap.add_argument("--seed", default="1")
    ap.add_argument("--show", type=int, default=6)
    ap.add_argument("--no-export", action="store_true", help="vorhandene samples.jsonl verwenden")
    ap.add_argument("--corpus", help="geprüfte Paare (SMILES, Name) in diese Datei schreiben (Regressionstest)")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    jsonl = os.path.join(args.out, "samples.jsonl")
    if not args.no_export:
        env = dict(os.environ, ORACLE_OUT=jsonl, ORACLE_SEED=args.seed)
        r = subprocess.run(["npx", "vitest", "run", "src/chem/check/export.test.ts"], cwd=os.path.join(ROOT, "modules", "organik"),
                           env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if r.returncode:
            print(r.stdout[-3000:])
            sys.exit("Export fehlgeschlagen")
    samples = [json.loads(line) for line in open(jsonl) if line.strip()]
    stats = json.load(open(jsonl.replace(".jsonl", ".stats.json")))
    jar = find_opsin(args.opsin)

    findings = []
    mols = []
    for s in samples:
        try:
            m = Mol(s["molblock"])
        except Exception as e:  # noqa: BLE001
            findings.append(("molfile", s, str(e)))
            m = None
        mols.append(m)

    # Name → Struktur (OPSIN)
    queries = []
    for i, s in enumerate(samples):
        if s.get("enError"):
            findings.append(("englisch", s, s["enError"]))
        elif s["en"]:
            queries.append((i, "name", s["en"]))
        for a in s["alts"]:
            if a["en"]:
                queries.append((i, a["de"], a["en"]))
    smiles = opsin(jar, [q[2] for q in queries], args.out)
    for (i, which, en), smi in zip(queries, smiles):
        s, m = samples[i], mols[i]
        if m is None:
            continue
        undetermined = any(x["desc"] is None for x in s["stereo"])
        label = "name" if which == "name" else "weitere"
        if smi is None:
            findings.append((f"opsin-{label}", s, f"OPSIN versteht nicht: {en}" + ("" if which == "name" else f" ({which})")))
            continue
        om = Chem.MolFromSmiles(smi)
        if om is None:
            findings.append((f"opsin-{label}", s, f"ungültige Struktur von OPSIN für {en}: {smi}"))
            continue
        same = canon(om) == canon(m.rd)
        if not same and (undetermined or which != "name"):
            same = canon(om, False) == canon(m.rd, False)
        if not same and canon(om, False) == canon(m.rd, False) and ez_matches(m, s):
            # nur E/Z verschieden, die App stimmt aber Bindung für Bindung mit RDKit (CIP 2013) überein: OPSIN wertet die Rangfolge anders
            findings.append(("hinweis-opsin-cip", s, f"{en} → {canon(om)}; RDKit bestätigt die App"))
            continue
        if not same:
            findings.append((f"struktur-{label}", s, f"{en} → {canon(om)} ≠ gezeichnet {canon(m.rd)}" + ("" if which == "name" else f" ({which})")))

    # Regeln, Alphabet, Formel, E/Z-Zahl
    for s, m in zip(samples, mols):
        if m is None:
            continue
        try:
            check_rules(m, s, findings)
        except Exception as e:  # noqa: BLE001
            findings.append(("regel-absturz", s, repr(e)))
        check_alphabet(s, findings)
        f = rdMolDescriptors.CalcMolFormula(m.rd)
        if f != s["formula"]:
            findings.append(("formel", s, f"App {s['formula']} ≠ {f}"))
        if not any(x["desc"] is None for x in s["stereo"]) and ez_count(s["de"]) != len(m.ez):
            findings.append(("ez-zahl", s, f"{ez_count(s['de'])} Angaben im Namen, {len(m.ez)} Doppelbindungen mit E/Z"))
        if "ez" in s and not any(d is None for _, _, d in s["ez"]) and not ez_matches(m, s):
            findings.append(("ez-cip", s, f"App {[(a, b, d) for a, b, d in s['ez']]} ≠ RDKit {[(tuple(k), v) for k, v in m.ez.items()]}"))

    # Eindeutigkeit
    by_struct, by_name = collections.defaultdict(set), collections.defaultdict(set)
    first = {}
    for s, m in zip(samples, mols):
        if m is None or any(x["desc"] is None for x in s["stereo"]):
            continue
        c = canon(m.rd)
        by_struct[c].add(s["de"])
        by_name[s["de"]].add(c)
        first.setdefault(c, s)
        first.setdefault(s["de"], s)
    for c, ns in by_struct.items():
        if len(ns) > 1:
            findings.append(("eindeutig-struktur", first[c], f"{c}: {' | '.join(sorted(ns))}"))
    for n, cs in by_name.items():
        if len(cs) > 1:
            findings.append(("eindeutig-name", first[n], f"{n}: {' | '.join(sorted(cs))}"))

    # Bericht
    cats = collections.Counter(f[0] for f in findings)
    notes = {"hinweis-alpha", "hinweis-opsin-cip"}
    errors = sum(v for k, v in cats.items() if k not in notes)
    lines = [f"Moleküle: {stats['total']} erzeugt, {len(samples)} benannt, {sum(stats['fail'].values())} nicht benennbar",
             f"Namen an OPSIN: {len(queries)}, Strukturen verschieden: {len(set(by_struct))}",
             "Nicht benennbar (Grund: Anzahl): " + ", ".join(f"{k}: {v}" for k, v in sorted(stats["fail"].items(), key=lambda x: -x[1]))]
    for k in ("shuffle", "relayout"):
        if stats.get(k):
            lines.append(f"{k}: {len(stats[k])} abweichend, z. B. {stats[k][:3]}")
            errors += len(stats[k])
    lines.append("Befunde: " + (", ".join(f"{k} {v}" for k, v in cats.most_common()) or "keine"))
    full = list(lines)
    for cat, _ in cats.most_common():
        items = [f for f in findings if f[0] == cat]
        full.append(f"\n== {cat} ({len(items)})")
        for _, s, msg in items:
            full.append(f"{s['id']}\t{s['de']}\t{msg}")
        lines.append(f"\n== {cat} ({len(items)})")
        for _, s, msg in items[: args.show]:
            lines.append(f"  {s['id']}  {s['de']}\n      {msg}")
    with open(os.path.join(args.out, "report.txt"), "w") as f:
        f.write("\n".join(full) + "\n")
    if args.corpus:
        write_corpus(args.corpus, samples, mols, {f[1]["id"] for f in findings if f[0] not in notes})
    print("\n".join(lines))
    print(f"\nBericht: {os.path.join(args.out, 'report.txt')}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
