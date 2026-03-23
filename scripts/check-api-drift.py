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
    extract_path = script_dir / "extract-api.py"
    spec = importlib.util.spec_from_file_location("extract_api", extract_path)
    if spec is None or spec.loader is None:
        print(
            f"Error: could not create a module spec for {extract_path}",
            file=sys.stderr,
        )
        sys.exit(2)
    try:
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    except FileNotFoundError:
        print(
            f"Error: extract-api.py not found at {extract_path}",
            file=sys.stderr,
        )
        sys.exit(2)
    except Exception as exc:
        print(
            f"Error: failed to load extract-api module from {extract_path}: {exc}",
            file=sys.stderr,
        )
        sys.exit(2)
    return mod


def load_snapshot(snapshot_path):
    """Load and parse the JSON snapshot file."""
    try:
        content = Path(snapshot_path).read_text(encoding="utf-8")
    except OSError as e:
        print(f"Error reading snapshot file '{snapshot_path}': {e}", file=sys.stderr)
        sys.exit(2)

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        print(
            f"Error parsing JSON from snapshot file '{snapshot_path}': {e}",
            file=sys.stderr,
        )
        sys.exit(2)


def compare_apis(current, stored):
    """Compare current and stored API snapshots, return list of changes."""
    changes = []
    all_drivers = sorted(set(list(current.keys()) + list(stored.keys())))

    for driver in all_drivers:
        cur_classes = current.get(driver, {})
        old_classes = stored.get(driver, {})

        if driver not in stored:
            changes.append(f"### Nouveau driver : `{driver}`")
            for cls, methods in cur_classes.items():
                changes.append(f"- Classe `{cls}` avec {len(methods)} méthodes")
            continue

        if driver not in current:
            changes.append(f"### Driver supprimé : `{driver}`")
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
                driver_changes.append(f"- Classe supprimée `{cls}`")
                continue

            added = set(cur_methods) - set(old_methods)
            removed = set(old_methods) - set(cur_methods)
            common = set(cur_methods) & set(old_methods)

            for m in sorted(removed):
                driver_changes.append(
                    f"- `{cls}.{m}()` supprimée (**breaking change**)"
                )
            for m in sorted(added):
                params = ", ".join(cur_methods[m])
                driver_changes.append(f"- `{cls}.{m}({params})` ajoutée")
            for m in sorted(common):
                if cur_methods[m] != old_methods[m]:
                    old_params = ", ".join(old_methods[m])
                    new_params = ", ".join(cur_methods[m])
                    driver_changes.append(
                        f"- `{cls}.{m}()` paramètres modifiés : "
                        f"`({old_params})` -> `({new_params})`"
                    )

        if driver_changes:
            changes.append(f"### `{driver}`")
            changes.extend(driver_changes)

    return changes


def main():
    if len(sys.argv) < 3:
        print(
            f"Usage: {sys.argv[0]} <lib-dir> <snapshot-file>",
            file=sys.stderr,
        )
        sys.exit(2)

    lib_dir = sys.argv[1]
    snapshot_file = sys.argv[2]

    try:
        extract_api = load_extract_module()
        current = extract_api.scan_all_drivers(lib_dir)
        stored = load_snapshot(snapshot_file)
    except Exception as exc:
        print(f"Error while extracting API or loading snapshot: {exc}", file=sys.stderr)
        sys.exit(2)

    changes = compare_apis(current, stored)

    if not changes:
        print("No API changes detected.")
        sys.exit(0)

    report = "## Changements d'API détectés\n\n" + "\n".join(changes)
    print(report)
    sys.exit(1)


if __name__ == "__main__":
    main()
