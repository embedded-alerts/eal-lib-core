# AttoLang validation binding: proof-status contract

This repository separates **public** validation shapes (owned by
`eal-interfaces`) from **server-only** shapes. A future AttoLang binding
must not accidentally export `trusted-actor`, `server-request-context`, or
`internal-command` into client-visible packages, and route names must use the
authoritative API Docs `operationId`.

Run `python3 validation/check_attolang_boundary.py`. This loads the **real**
`validation/contract.v1.json`, enumerates a finite admission policy, and uses
negative mutations to ensure server definitions cannot enter its public list.
The manifest `attolang.boundary.v1.json` is deliberately **reference-only**,
and `attolang_projection.atto` contains snake_case pure policy predicates.
Neither claims compiler-backed parity or changes existing generated packages.

Before promotion, pin an actual AttoLang compiler backend SHA; compile and run
positive/negative fixtures for public/server exports, unknown-field rejection,
and operationId parity against Rust/TypeScript/Go/Gleam. Record executed,
exact-head results separately. Abstract model success is never proof that the
production validators or generators conform.
