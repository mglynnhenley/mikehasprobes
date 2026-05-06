-- Per-token hallucination probe scores on assistant chat messages.
-- Same shape as tabular_cells.probe_scores: { probeName: number[] }.

alter table public.chat_messages
  add column if not exists probe_scores jsonb;
