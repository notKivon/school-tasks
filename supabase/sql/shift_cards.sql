-- Nightly column shift (run by the pg_cron job `shift-cards` at 00:03 HKT).
--
-- Why the previous version did nothing: it only moved rows with
-- `due_date is not null`, but cards in the auto-date columns 2/3/4 store
-- `due_date = null` by design, so every card sitting in "Next School Day" /
-- "Subsequent School Day" was skipped forever.
--
-- A null-dated card's effective date is whatever its column meant *yesterday*
-- (the previous run placed it there), so that is what we compare against.

drop function if exists public.shift_cards();

create or replace function public.shift_cards(p_force boolean default false)
returns void
language plpgsql
as $function$
declare
  today_hkt date := (now() at time zone 'Asia/Hong_Kong')::date;
  -- what the auto-date columns meant at the end of yesterday
  prev_col3 date := public.get_next_school_day(today_hkt - 1);
  prev_col4 date := public.get_subsequent_school_day(today_hkt - 1);
  -- what they mean today
  col3_date date := public.get_next_school_day(today_hkt);
  col4_date date := public.get_subsequent_school_day(today_hkt);
begin
  -- Shifting twice in one HKT day would move cards this run already placed,
  -- so skip if the nightly job has already succeeded today. Pass true to force.
  if not p_force and exists (
    select 1
      from cron.job_run_details d
      join cron.job j on j.jobid = d.jobid
     where j.jobname = 'shift-cards'
       and d.status = 'succeeded'
       and (d.start_time at time zone 'Asia/Hong_Kong')::date = today_hkt
  ) then
    return;
  end if;

  -- Innermost first so no card moves more than one column per run.

  -- Col 3 -> Col 2. Null-dated cards use col 3's meaning from yesterday.
  update public.cards
     set column_id = 2, due_date = null
   where column_id = 3
     and coalesce(due_date, prev_col3) <= today_hkt;

  -- Col 4 -> Col 3 (or straight to col 2 if it is already due).
  update public.cards
     set column_id = case when coalesce(due_date, prev_col4) <= today_hkt then 2 else 3 end,
         due_date  = null
   where column_id = 4
     and coalesce(due_date, prev_col4) <= col3_date;

  -- Col 5 -> whichever auto-date column now matches the card's own due date.
  update public.cards
     set column_id = case
                       when due_date <= today_hkt then 2
                       when due_date <= col3_date then 3
                       else 4
                     end,
         due_date = null
   where column_id = 5
     and due_date is not null
     and due_date <= col4_date;

  -- Col 1 (Upcoming Tests) is never shifted.
  -- Overdue incomplete cards already in col 2 are left untouched.
end;
$function$;
