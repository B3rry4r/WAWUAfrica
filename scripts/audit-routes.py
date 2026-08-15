#!/usr/bin/env python3
"""
Navigation audit: dead links, unreachable routes, and duplicate route
collisions (two files resolving to the same URL — Next.js/Vercel builds can
pass locally and fail on Vercel's trace step for this specific bug).

Run from repo root: python3 scripts/audit-routes.py
Exits non-zero if it finds dead links or duplicate routes (not for the
unreachable-routes list, since that has expected false positives — see below).
"""
import re, glob, sys
from collections import defaultdict

def normalize(f: str) -> str:
    r = f.replace("src/app/", "")
    if r.endswith("/page.tsx"):
        r = r[: -len("/page.tsx")]
    elif r == "page.tsx":
        r = ""
    r = re.sub(r"\((app|auth|marketing)\)/?", "", r)
    return ("/" + r.strip("/")).rstrip("/") or "/"

def route_re(r: str) -> str:
    return "^" + re.sub(r"\[[^\]]+\]", r"[^/]+", r) + "$"

# ---- duplicate routes (two files resolving to the same path) --------------
by_route = defaultdict(list)
for f in glob.glob("src/app/**/page.tsx", recursive=True):
    by_route[normalize(f)].append(f)
duplicates = {r: fs for r, fs in by_route.items() if len(fs) > 1}

routes = sorted(by_route.keys())

# ---- dead links (href targets that don't match any route) -----------------
targets = defaultdict(set)
for f in glob.glob("src/**/*.tsx", recursive=True):
    txt = open(f).read()
    for m in re.finditer(r'href=\{?["`](/[^"`?#]*)', txt):
        link = re.sub(r"\$\{[^}]*\}", "X", m.group(1))
        targets[(link.rstrip("/") or "/")].add(f.replace("src/", ""))

dead = {l: s for l, s in targets.items()
        if not any(re.match(route_re(r), l) for r in routes)}

# ---- unreachable routes (no href points at them) ---------------------------
# NOTE: this under-reports on purpose. It only sees href="...". It will not
# see router.push(), redirect(), config objects passed to a nav component, or
# routes reached only from another app (e.g. deep links). Treat this list as
# "check these by hand", not "these are broken".
linked = {r for r in routes for l in targets if re.match(route_re(r), l)}
ENTRY = {"/", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"}
orphans = [r for r in routes if r not in linked and r not in ENTRY]

print(f"ROUTES: {len(routes)}   LINK TARGETS: {len(targets)}")
print(f"\nDUPLICATE ROUTES: {len(duplicates)}")
for r, fs in duplicates.items():
    print(f"   {r}")
    for f in fs:
        print(f"      {f}")

print(f"\nDEAD LINKS: {len(dead)}")
for l in sorted(dead):
    print(f"   {l:<32} <- {', '.join(sorted(dead[l]))}")

print(f"\nUNREACHABLE BY href= (verify by hand, false positives expected): {len(orphans)}")
for r in orphans:
    print(f"   {r}")

sys.exit(1 if (dead or duplicates) else 0)
