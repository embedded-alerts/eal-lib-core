-- Embedded Alerts canonical desired persistence state.
--
-- Authority: embedded-alerts/eal-lib-core.
-- Publication/projection: embedded-alerts/eal-interfaces/sql/001_initial.sql.
--
-- This file is forward-only and replayable. Keep physical table/column parity
-- with the interface projection, but make migration-safety corrections here
-- first and verify the projection in CI.

create extension if not exists pgcrypto;

create table if not exists public.alert_rules (
    id uuid primary key default pg_catalog.gen_random_uuid(),
    title text not null check (pg_catalog.length(title) between 1 and 256),
    summary text not null default '' check (pg_catalog.length(summary) <= 4000),
    query text not null,
    threshold real not null,
    delivery_channel text not null,
    enabled boolean not null,
    status text not null default 'draft',
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists alert_rules_status_created_idx
    on public.alert_rules(status, created_at desc, id);

alter table public.alert_rules enable row level security;

-- Production replaces this deny-by-default baseline with reviewed tenant-scoped
-- policies tied to authenticated subjects. PostgreSQL has no CREATE POLICY IF
-- NOT EXISTS, so guard duplicate creation rather than dropping policy coverage
-- during replay.
do $policy$
begin
    create policy deny_anon_alert_rules on public.alert_rules
        for all to anon using (false) with check (false);
exception
    when duplicate_object then null;
end
$policy$;

create extension if not exists vector;

create table if not exists public.alert_documents (
    id uuid primary key default pg_catalog.gen_random_uuid(),
    source_uri text not null,
    content_sha256 text not null unique,
    content_text text not null,
    embedding public.vector(1536),
    published_at timestamptz,
    ingested_at timestamptz not null default pg_catalog.now()
);

create index if not exists alert_documents_embedding_hnsw
    on public.alert_documents using hnsw (embedding public.vector_cosine_ops);
