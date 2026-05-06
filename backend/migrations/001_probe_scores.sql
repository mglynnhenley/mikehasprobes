-- Hallucination probe scores on tabular cells and chat messages.
-- probe_scores: { probeName: number[] } — one float per token in the completion.
-- probe_status (cells only): pending | scoring | scored | skipped
--   (skipped = probe service unreachable; cell render is unaffected).

alter table public.tabular_cells
  add column if not exists probe_scores jsonb,
  add column if not exists probe_status text;

alter table public.chat_messages
  add column if not exists probe_scores jsonb;
