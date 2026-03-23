#!/usr/bin/env python3
"""Compare current micropython-steami-lib API against a stored snapshot.

Detects added, removed, and modified methods in each driver.

Usage:
    python scripts/check-api-drift.py <lib-dir> <snapshot-file>

Exit codes:
    0 — no changes detected
    1 — changes detected (prints a Markdown report to stdout)
    2 — error
"""

import importlib.util
import json
import sys
from pathlib import Path


def load_extract_module():
    """Dynamically load extract-api.py (name contains a hyphen)."""
    script_dir = Path(__file__).parent
    spec = importlib.util.spec_from_file_location(
        "extract_api", script_dir / "extract-api.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def load_snapshot(snapshot_path):
    return json.loads(Path(snapshot_path).read_text(encoding="utf-8"))


def main():
    if len(sys.argv) < 3:
        print(
            f"Usage: {sys.argv[0]} <lib-dir> <snapshot-file>",
            file=sys.stderr,
        )
        sys.exit(2)

    lib_dir = sys.argv[1]
    snapshot_file = sys.argv[2]

    extract_api = load_extract_module()
    current = extract_api.scan_all_drivers(lib_dir)
    stored = load_snapshot(snapshot_file)

    changes = []
    all_drivers = sorted(set(list(current.keys()) + list(stored.keys())))

    for driver in all_drivers:
        cur_classes = current.get(driver, {})
        old_classes = stored.get(driver, {})

        if driver not in stored:
            changes.append(f"### Nouveau driver : `{driver}`")
            for cls, methods in cur_classes.items():
                changes.append(f"- Classe `{cls}` avec {len(methods)} methodes")
            continue

        if driver not in current:
            changes.append(f"### Driver supprime : `{driver}`")
            continue

        all_classes = sorted(set(list(cur_classes.keys()) + list(old_classes.keys())))
        driver_changes = []

        for cls in all_classes:
            cur_methods = cur_classes.get(cls, {})
            old_methods = old_classes.get(cls, {})

            if cls not in old_classes:
                driver_changes.append(f"- Nouvelle classe `{cls}`")
                continue
            if cls not in cur_classes:
                driver_changes.append(f"- Classe supprimee `{cls}`")
                continue

            added = set(cur_methods) - set(old_methods)
            removed = set(old_methods) - set(cur_methods)
            common = set(cur_methods) & set(old_methods)

            for m in sorted(removed):
                driver_changes.append(
                    f"- `{cls}.{m}()` supprimee (**breaking change**)"
                )
            for m in sorted(added):
                params = ", ".join(cur_methods[m])
                driver_changes.append(f"- `{cls}.{m}({params})` ajoutee")
            for m in sorted(common):
                if cur_methods[m] != old_methods[m]:
                    old_params = ", ".join(old_methods[m])
                    new_params = ", ".join(cur_methods[m])
                    driver_changes.append(
                        f"- `{cls}.{m}()` parametres modifies : "
                        f"`({old_params})` -> `({new_params})`"
                    )

        if driver_changes:
            changes.append(f"### `{driver}`")
            changes.extend(driver_changes)

    if not changes:
        print("No API changes detected.")
        sys.exit(0)

    report = "## Changements d'API detectes\n\n" + "\n".join(changes)
    print(report)
    sys.exit(1)


if __name__ == "__main__":
    main()
