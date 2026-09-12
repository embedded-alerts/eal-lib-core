{application, eal_locks, [
    {vsn, "0.1.0"},
    {applications, [gleam_stdlib,
                    gleeunit,
                    ores_locks_and_leases]},
    {description, "embedded-alerts lock routines: ores_locks_and_leases with the embedded-alerts key prefix and lock catalog."},
    {modules, [eal_locks_test]},
    {registered, []}
]}.
