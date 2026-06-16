-- Migration 000032: Add label column to timetable_slots
-- Stores the original ICS event summary so imported slots show their name
alter table public.timetable_slots
  add column if not exists label text;
