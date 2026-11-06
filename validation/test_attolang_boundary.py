"""Negative controls for the reference-only AttoLang projection boundary."""
import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from check_attolang_boundary import BoundaryError, admission, check  # noqa: E402

CANONICAL = json.loads((ROOT / "contract.v1.json").read_text())
REFERENCE = json.loads((ROOT / "attolang.boundary.v1.json").read_text())


class AttolangBoundaryTests(unittest.TestCase):
    def test_current_authorities_pass_and_only_one_boolean_case_admits(self):
        self.assertEqual(check(CANONICAL, REFERENCE), 16)
        accepted = [
            bits for bits in __import__("itertools").product((False, True), repeat=4)
            if admission(*bits)
        ]
        self.assertEqual(accepted, [(True, False, False, True)])

    def test_rejects_every_public_server_overlap(self):
        for server_type in CANONICAL["visibility"]["server"]:
            with self.subTest(server_type=server_type):
                mutated = copy.deepcopy(CANONICAL)
                mutated["visibility"]["public"].append(server_type)
                with self.assertRaises(BoundaryError):
                    check(mutated, REFERENCE)

    def test_rejects_duplicate_or_malformed_public_or_server_defs(self):
        for list_name in ("public", "server"):
            for mutation in ("duplicate", "empty", "nonstring", "not-list"):
                with self.subTest(list_name=list_name, mutation=mutation):
                    contract = copy.deepcopy(CANONICAL)
                    entries = contract["visibility"][list_name]
                    if mutation == "duplicate":
                        entries.append(entries[0])
                    elif mutation == "empty":
                        entries.clear()
                    elif mutation == "nonstring":
                        entries.append(25)
                    else:
                        contract["visibility"][list_name] = "not-a-list"
                    with self.assertRaises(BoundaryError):
                        check(contract, REFERENCE)

    def test_all_four_safety_rules_are_mandatory(self):
        for key in (
            "clientExportsPublicOnly",
            "serverDefinitionsNeverEmittedToClients",
            "routeBindingsUseApiDocsOperationId",
            "unknownFieldsRejectedWhereRuntimeSupportsIt",
        ):
            for value in (False, None, "true"):
                with self.subTest(key=key, value=value):
                    contract = copy.deepcopy(CANONICAL)
                    contract["rules"][key] = value
                    with self.assertRaises(BoundaryError):
                        check(contract, REFERENCE)

    def test_refuses_oracle_path_escape_and_fake_execution(self):
        for field, value in (
            ("oracle", "../../sensitive.atto"),
            ("oracle", "/tmp/attolang_projection.atto"),
            ("oracle", "some_other.atto"),
            ("sourceExtension", ".ores"),
            ("status", "active"),
            ("compiledEvidence", True),
            ("compiledEvidence", "false"),
            ("owner", "some-other-org"),
            ("publicAuthority", "wrong-authority"),
            ("routeAuthority", "wrong-authority"),
            ("schema", "new-unreviewed-version"),
        ):
            with self.subTest(field=field, value=value):
                reference = copy.deepcopy(REFERENCE)
                reference[field] = value
                with self.assertRaises(BoundaryError):
                    check(CANONICAL, reference)

    def test_mismatched_existing_language_packages_rejected(self):
        for lang in ("typescript", "rust", "golang", "gleam"):
            with self.subTest(lang=lang):
                contract = copy.deepcopy(CANONICAL)
                contract["languageBindings"][lang]["serverPackage"] = (
                    contract["languageBindings"][lang]["publicPackage"]
                )
                with self.assertRaises(BoundaryError):
                    check(contract, REFERENCE)

    def test_missing_required_server_type_rejected(self):
        mutated = copy.deepcopy(CANONICAL)
        mutated["visibility"]["server"].remove("internal-command")
        with self.assertRaises(BoundaryError):
            check(mutated, REFERENCE)

    def test_authority_drift_rejected(self):
        for field in ("owner", "publicAuthority", "routeAuthority", "contractVersion"):
            with self.subTest(field=field):
                mutated = copy.deepcopy(CANONICAL)
                mutated[field] = "unreviewed"
                with self.assertRaises(BoundaryError):
                    check(mutated, REFERENCE)

    def test_unknown_route_and_fields_always_deny(self):
        for unknown in (False, True):
            for known_route in (False, True):
                for is_server in (False, True):
                    if unknown or not known_route or is_server:
                        self.assertFalse(admission(True, is_server, unknown, known_route))


if __name__ == "__main__":
    unittest.main()
