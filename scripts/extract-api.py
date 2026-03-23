#!/usr/bin/env python3
"""Extract public API signatures from micropython-steami-lib drivers.

Parses each driver's device.py (and other public modules) using the ast
module and outputs a JSON snapshot of all public classes and their public
methods with parameter lists.

Usage:
    python scripts/extract-api.py <lib-dir> [--output <file>]

Example:
    python scripts/extract-api.py /path/to/micropython-steami-lib/lib
    python scripts/extract-api.py /path/to/micropython-steami-lib/lib --output scripts/api-snapshot.json
"""

import ast
import json
import sys
from pathlib import Path


def extract_methods(cls_node):
    """Extract public method signatures from a class AST node."""
    methods = {}
    for item in cls_node.body:
        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if item.name.startswith("_"):
                continue
            args = []
            for arg in item.args.args:
                if arg.arg == "self":
                    continue
                args.append(arg.arg)
            methods[item.name] = args
    return methods


def extract_classes(source_path):
    """Extract public classes and their methods from a Python file."""
    try:
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(source_path))
    except (SyntaxError, UnicodeDecodeError):
        return {}

    classes = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
            methods = extract_methods(node)
            if methods:
                classes[node.name] = methods
    return classes


def scan_driver(driver_dir):
    """Scan a driver directory for all public Python modules."""
    result = {}
    # Look for the inner package directory (e.g., lib/ism330dl/ism330dl/)
    for subdir in sorted(driver_dir.iterdir()):
        if subdir.is_dir() and not subdir.name.startswith((".", "examples", "__")):
            for py_file in sorted(subdir.glob("*.py")):
                if py_file.name.startswith("_") or py_file.name == "const.py":
                    continue
                classes = extract_classes(py_file)
                result.update(classes)
    return result


def scan_all_drivers(lib_dir):
    """Scan all drivers in the lib directory."""
    lib_path = Path(lib_dir)
    snapshot = {}
    for driver_dir in sorted(lib_path.iterdir()):
        if not driver_dir.is_dir() or driver_dir.name.startswith("."):
            continue
        classes = scan_driver(driver_dir)
        if classes:
            snapshot[driver_dir.name] = classes
    return snapshot


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <lib-dir> [--output <file>]", file=sys.stderr)
        sys.exit(1)

    lib_dir = sys.argv[1]
    output_file = None
    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            output_file = sys.argv[idx + 1]

    snapshot = scan_all_drivers(lib_dir)
    result = json.dumps(snapshot, indent=2, ensure_ascii=False, sort_keys=True)

    if output_file:
        Path(output_file).write_text(result + "\n", encoding="utf-8")
        print(f"Snapshot written to {output_file} ({len(snapshot)} drivers)")
    else:
        print(result)


if __name__ == "__main__":
    main()
