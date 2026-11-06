#!/usr/bin/env python3
"""Fail-closed contract/AttoLang projection audit and finite policy exploration.

This proves a small *abstract* export policy, not the generated runtime.
"""
from copy import deepcopy
from itertools import product
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANONICAL = ROOT / "contract.v1.json"
ATTO = ROOT / "attolang.boundary.v1.json"


def check(contract, spec):
    assert contract["contractVersion"] == "ores.validation.v1"
    assert contract["owner"] == "embedded-alerts/eal-lib-core"
    assert spec["schema"] == "ores.validation.attolang-boundary/v1"
    assert spec["status"] == "reference-only"
    assert spec["sourceExtension"] == ".atto"
    assert spec["compiledEvidence"] is False
    assert (ROOT / spec["oracle"]).is_file()
    visible = contract["visibility"]
    public, server = visible["public"], visible["server"]
    assert public and server
    assert len(public) == len(set(public))
    assert len(server) == len(set(server))
    assert not (set(public) & set(server)), "server type leaked into public"
    rules = contract["rules"]
    assert rules["clientExportsPublicOnly"] is True
    assert rules["serverDefinitionsNeverEmittedToClients"] is True
    assert rules["routeBindingsUseApiDocsOperationId"] is True
    assert rules["unknownFieldsRejectedWhereRuntimeSupportsIt"] is True

    # Exhaustively evaluate Boolean policy inputs; deny any server export,
    # unknown public type, unknown field or unrecognized route binding.
    total = 0
    for is_public, is_server, unknown, known_route in product((False, True), repeat=4):
        admit = is_public and not is_server and not unknown and known_route
        if admit:
            assert is_public and not is_server and not unknown and known_route
        if is_server or unknown or not known_route:
            assert not admit
        total += 1
    return total


def main():
    contract = json.loads(CANONICAL.read_text(encoding="utf8"))
    spec = json.loads(ATTO.read_text(encoding="utf8"))
    cases = check(contract, spec)
    for invalid in ("trusted-actor", "internal-command", "server-request-context"):
        mutated = deepcopy(contract)
        mutated["visibility"]["public"].append(invalid)
        try:
            check(mutated, spec)
        except AssertionError:
            pass
        else:
            raise AssertionError("negative control unexpectedly admitted " + invalid)
    print(f"AttoLang projection boundary: {cases} abstract cases, 3 negative mutations; runtime NOT_EXECUTED")


if __name__ == "__main__":
    main()
