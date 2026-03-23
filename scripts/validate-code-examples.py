#!/usr/bin/env python3
"""
Validate Python code examples in Markdown documentation.

Extracts ```python code blocks from docs/**/*.md and:
1. Checks syntax (compile)
2. Checks that imported classes exist in micropython-steami-lib
3. Checks that called methods exist on imported classes

Usage:
    python scripts/validate-code-examples.py [--lib-path .external/micropython-steami-lib]
"""

import ast
import glob
import re
import sys
import os
from pathlib import Path


def extract_python_blocks(md_path):
    """Extract Python code blocks from a Markdown file."""
    content = Path(md_path).read_text(encoding="utf-8")
    blocks = []
    # Match ```python ... ``` blocks (ignore file= blocks which are imported)
    pattern = re.compile(
        r"```python(?:\s+file=\S+)?\s*\n(.*?)```", re.DOTALL
    )
    for i, match in enumerate(pattern.finditer(content)):
        code = match.group(1).strip()
        # Skip file= blocks (they are validated by the source repo)
        meta_match = re.search(r"```python\s+file=", content[match.start():match.end()])
        if meta_match:
            continue
        if code and not code.startswith("# File not found"):
            line_no = content[: match.start()].count("\n") + 1
            blocks.append((code, line_no))
    return blocks


def check_syntax(code, filepath, line_no):
    """Check Python syntax by compiling."""
    try:
        compile(code, f"{filepath}:{line_no}", "exec")
        return []
    except SyntaxError as e:
        actual_line = line_no + (e.lineno or 1) - 1
        return [f"{filepath}:{actual_line}: syntax error: {e.msg}"]


def extract_imports(code):
    """Extract from X import Y statements."""
    imports = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return imports

    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            for alias in node.names:
                imports.append((node.module, alias.name))
    return imports


def extract_method_calls(code):
    """Extract variable.method() calls from code."""
    calls = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return calls

    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if isinstance(node.func.value, ast.Name):
                calls.append((node.func.value.id, node.func.attr))
    return calls


def find_class_methods(lib_path, module_name, class_name):
    """Find all methods of a class in the library source code."""
    # Map module names to paths
    module_dirs = {
        "ism330dl": "ism330dl/ism330dl",
        "lis2mdl": "lis2mdl/lis2mdl",
        "vl53l1x": "vl53l1x/vl53l1x",
        "wsen_pads": "wsen-pads/wsen_pads",
        "wsen_hids": "wsen-hids/wsen_hids",
        "apds9960": "apds9960/apds9960",
        "ssd1327": "ssd1327/ssd1327",
        "mcp23009e": "mcp23009e/mcp23009e",
        "bq27441": "bq27441/bq27441",
        "daplink_flash": "daplink_flash/daplink_flash",
        "steami_config": "steami_config/steami_config",
        "hts221": "hts221/hts221",
    }

    # Normalize module name
    mod_key = module_name.replace("-", "_")
    if mod_key not in module_dirs:
        return None  # Unknown module, skip

    device_path = os.path.join(lib_path, "lib", module_dirs[mod_key], "device.py")
    if not os.path.exists(device_path):
        return None

    try:
        source = Path(device_path).read_text(encoding="utf-8")
        tree = ast.parse(source)
    except (SyntaxError, OSError):
        return None

    methods = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == class_name:
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    methods.add(item.name)
            # Also check bases (inheritance) - simplified
            break

    return methods if methods else None


def validate_file(md_path, lib_path):
    """Validate all Python code blocks in a Markdown file."""
    errors = []
    blocks = extract_python_blocks(md_path)

    if not blocks:
        return errors

    for code, line_no in blocks:
        # 1. Syntax check
        syntax_errors = check_syntax(code, md_path, line_no)
        errors.extend(syntax_errors)
        if syntax_errors:
            continue  # Skip further checks if syntax is broken

        # 2. Check imports exist
        STDLIB = {"machine", "time", "sys", "gc", "micropython", "os", "struct", "json", "math"}
        KNOWN_MODULES = {
            "ism330dl", "lis2mdl", "vl53l1x", "wsen_pads", "wsen_hids",
            "apds9960", "ssd1327", "mcp23009e", "bq27441", "daplink_flash",
            "steami_config", "hts221",
        }
        imports = extract_imports(code)
        import_map = {}  # variable_name -> (module, class, methods)
        for module, name in imports:
            if module in STDLIB:
                continue
            mod_key = module.replace("-", "_")
            if mod_key not in KNOWN_MODULES:
                continue  # Unknown module, not a driver — skip
            methods = find_class_methods(lib_path, module, name)
            if methods is None:
                errors.append(
                    f"{md_path}:{line_no}: class '{name}' not found in module '{module}'"
                )
                continue
            # Find what variable this class is assigned to
                try:
                    tree = ast.parse(code)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Assign):
                            if (
                                isinstance(node.value, ast.Call)
                                and isinstance(node.value.func, ast.Name)
                                and node.value.func.id == name
                            ):
                                for target in node.targets:
                                    if isinstance(target, ast.Name):
                                        import_map[target.id] = (module, name, methods)
                except SyntaxError:
                    pass

        # 3. Check method calls
        calls = extract_method_calls(code)
        for var_name, method_name in calls:
            if var_name in import_map:
                module, class_name, methods = import_map[var_name]
                if method_name not in methods and not method_name.startswith("_"):
                    errors.append(
                        f"{md_path}:{line_no}: method '{class_name}.{method_name}()' "
                        f"not found in {module} (available: {', '.join(sorted(m for m in methods if not m.startswith('_')))})"
                    )

    return errors


def main():
    lib_path = ".external/micropython-steami-lib"

    # Allow override via argument
    if len(sys.argv) > 2 and sys.argv[1] == "--lib-path":
        lib_path = sys.argv[2]

    if not os.path.exists(lib_path):
        print(f"Library not found at {lib_path}. Run 'npm run prebuild' first.")
        sys.exit(1)

    md_files = sorted(glob.glob("docs/**/*.md", recursive=True))
    total_blocks = 0
    total_errors = 0
    all_errors = []

    for md_path in md_files:
        blocks = extract_python_blocks(md_path)
        total_blocks += len(blocks)
        errors = validate_file(md_path, lib_path)
        total_errors += len(errors)
        all_errors.extend(errors)

    # Report
    print(f"Checked {total_blocks} Python code blocks in {len(md_files)} files")

    if all_errors:
        print(f"\n{total_errors} error(s) found:\n")
        for error in all_errors:
            print(f"  {error}")
        sys.exit(1)
    else:
        print("All code examples are valid.")
        sys.exit(0)


if __name__ == "__main__":
    main()
