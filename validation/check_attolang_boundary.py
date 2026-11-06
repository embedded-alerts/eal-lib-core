#!/usr/bin/env python3
"""Fail-closed finite *abstract* AttoLang projection checker.

The gate is intentionally independent of Python's optional assert statements:
it must reject invalid contracts when invoked as 'python -O'.
No AttoLang compiler or production runtime is executed by this checker.
"""
from copy import deepcopy
from itertools import product
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANONICAL = ROOT / "contract.v1.json"
ATTO = ROOT / "attolang.boundary.v1.json"
EXPECTED_PUBLIC = "embedded-alerts/eal-interfaces"
EXPECTED_ROUTES = "ORESoftware/api-docs"
LANGUAGES = frozenset(("typescript", "rust", "golang", "gleam"))


class BoundaryError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise BoundaryError(message)


def admission(is_public, is_server, unknown, known_route):
    return is_public and not is_server and not unknown and known_route


def check(contract, spec):
    require(isinstance(contract, dict) and isinstance(spec, dict),
            "both contracts must be objects")
    require(contract.get("contractVersion") == "ores.validation.v1",
            "unsupported canonical version")
    require(contract.get("owner") == "embedded-alerts/eal-lib-core",
            "wrong canonical owner")
    require(spec.get("schema") == "ores.validation.attolang-boundary/v1",
            "unsupported AttoLang boundary version")
    require(spec.get("owner") == contract["owner"], "AttoLang owner mismatch")
    require(spec.get("status") == "reference-only",
            "AttoLang reference is not a compiled binding")
    require(spec.get("sourceExtension") == ".atto", "invalid source extension")
    require(spec.get("compiledEvidence") is False,
            "unverified compiler evidence cannot be promoted")
    require(spec.get("oracle") == "attolang_projection.atto",
            "oracle must remain a fixed, local source file")
    require((ROOT / "attolang_projection.atto").is_file() and
            not (ROOT / "attolang_projection.atto").is_symlink(),
            "missing or symlinked oracle")
    require(spec.get("publicAuthority") == EXPECTED_PUBLIC,
            "AttoLang public authority mismatch")
    require(spec.get("routeAuthority") == EXPECTED_ROUTES,
            "AttoLang route authority mismatch")
    require(contract.get("publicAuthority") ==
            "https://github.com/embedded-alerts/eal-interfaces/tree/main/validation",
            "canonical public authority mismatch")
    require(contract.get("routeAuthority") ==
            "https://github.com/ORESoftware/api-docs",
            "canonical route authority mismatch")

    visible = contract.get("visibility")
    require(isinstance(visible, dict), "missing visibility")
    public, server = visible.get("public"), visible.get("server")
    for label, entries in (("public", public), ("server", server)):
        require(isinstance(entries, list) and len(entries) > 0,
                f"{label} definitions must be a nonempty list")
        require(all(isinstance(item, str) and item and item.strip() == item
                    for item in entries), f"invalid {label} definition")
        require(len(entries) == len(set(entries)),
                f"duplicate {label} definition")
    require(not (set(public) & set(server)),
            "server definition leaked into public exports")
    require({"trusted-actor", "server-request-context", "internal-command"} <= set(server),
            "required server-only definitions missing")

    rules = contract.get("rules")
    require(isinstance(rules, dict), "missing rules")
    for key in ("clientExportsPublicOnly", "serverDefinitionsNeverEmittedToClients",
                "routeBindingsUseApiDocsOperationId",
                "unknownFieldsRejectedWhereRuntimeSupportsIt"):
        require(rules.get(key) is True, f"unsafe policy: {key}")
    bindings = contract.get("languageBindings")
    require(isinstance(bindings, dict) and LANGUAGES <= set(bindings),
            "existing language authorities missing")
    for lang in LANGUAGES:
        entry = bindings[lang]
        require(isinstance(entry, dict) and
                isinstance(entry.get("publicPackage"), str) and
                isinstance(entry.get("serverPackage"), str) and
                entry["publicPackage"] != entry["serverPackage"],
                f"server/public package boundary collapsed: {lang}")

    explored = 0
    allowed = 0
    for is_public, is_server, unknown, known_route in product((False, True), repeat=4):
        admitted = admission(is_public, is_server, unknown, known_route)
        if admitted:
            allowed += 1
            require(is_public and not is_server and not unknown and known_route,
                    "admitted unsafe projected request")
        if is_server or unknown or not known_route:
            require(not admitted, "unsafe export admitted")
        explored += 1
    require(explored == 16 and allowed == 1, "vacuous finite model")
    return explored


def main():
    contract = json.loads(CANONICAL.read_text(encoding="utf8"))
    spec = json.loads(ATTO.read_text(encoding="utf8"))
    cases = check(contract, spec)
    controls = 0
    for invalid in ("trusted-actor", "internal-command", "server-request-context"):
        mutated = deepcopy(contract)
        mutated["visibility"]["public"].append(invalid)
        try:
            check(mutated, spec)
        except BoundaryError:
            controls += 1
        else:
            raise BoundaryError("negative control admitted " + invalid)
    require(controls == 3, "missing server leak negative controls")
    print(f"AttoLang boundary: {cases} finite abstract cases, {controls} rejected leaks; compiler NOT_EXECUTED")


if __name__ == "__main__":
    main()
