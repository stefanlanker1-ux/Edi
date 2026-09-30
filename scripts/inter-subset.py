# Erzeugt packages/ui/src/fonts/inter.woff2 aus der vollständigen Inter (npm-Paket inter-ui, SIL OFL 1.1):
#   python3 scripts/inter-subset.py   (braucht fonttools und brotli)
# - optische Größe fest auf Textgröße 14 (wie bisher), Strichstärke 100–900 bleibt variabel
# - Zeichen: Latein, Griechisch (δ, Ω), hoch-/tiefgestellte Ziffern (H₂O, Fe³⁺), Pfeile, Rechenzeichen
# - alle OpenType-Varianten bleiben erhalten; genutzt werden cv05 (l mit Bogen) und cv08 (I mit Serifen),
#   damit Cl (Chlor) und CI (Kohlenstoff, Iod) nicht zu verwechseln sind
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

root = Path(__file__).resolve().parent.parent
src = root / "node_modules/inter-ui/variable/InterVariable.woff2"
out = root / "packages/ui/src/fonts/inter.woff2"

font = TTFont(src)

ranges = [
    (0x0000, 0x00FF), (0x0131, 0x0131), (0x0152, 0x0153), (0x02BB, 0x02BC), (0x02C6, 0x02C6), (0x02DA, 0x02DA), (0x02DC, 0x02DC),
    (0x0304, 0x0304), (0x0308, 0x0308), (0x0329, 0x0329),
    (0x0370, 0x03FF),            # Griechisch
    (0x2000, 0x206F),            # Satzzeichen, Leerzeichen
    (0x2070, 0x209F),            # hoch- und tiefgestellte Ziffern und Zeichen
    (0x20AC, 0x20AC), (0x2122, 0x2122),
    (0x2190, 0x21FF),            # Pfeile
    (0x2200, 0x22FF),            # Rechenzeichen (−, ≈, ≠, ·)
    (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD),
]
unicodes = [u for a, b in ranges for u in range(a, b + 1)]

opts = subset.Options()
opts.layout_features = ["*"]
opts.flavor = "woff2"
opts.name_IDs = ["*"]
opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(unicodes=unicodes)
sub.subset(font)
font = instantiateVariableFont(font, {"opsz": 14})
out.parent.mkdir(parents=True, exist_ok=True)
font.flavor = "woff2"
font.save(out)
print(out, out.stat().st_size, "Bytes")
