-- Per-cell hallucination probe scores.
-- probe_scores: { probeName: number[] } (one float per token in the cell completion)
-- probe_status: pending | scoring | scored | skipped (skipped = probe service unreachable)

alter table public.tabular_cells
  add column if not exists probe_scores jsonb,
  add column if not exists probe_status text;
