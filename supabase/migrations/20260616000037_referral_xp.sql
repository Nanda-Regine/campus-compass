-- Referral rewards reworked: award XP (gamified) instead of bonus Nova messages.
-- Bumps user_xp_state.total_xp for both referrer and referred; the client XP
-- engine adopts the higher DB total on next load (initXPFromDB).

create or replace function public.apply_referral(
  p_referred_id   uuid,
  p_referral_code text
)
returns jsonb as $$
declare
  v_referrer_id uuid;
  v_already_used boolean;
  v_referrer_xp int := 250;   -- friend who refers
  v_referred_xp int := 100;   -- new user head-start
begin
  -- Find referrer; cannot refer yourself
  select id into v_referrer_id from public.profiles
  where referral_code = p_referral_code and id != p_referred_id;

  if not found then
    return jsonb_build_object('error', 'Invalid referral code');
  end if;

  -- One referral per new user
  select exists(select 1 from public.referrals where referred_id = p_referred_id)
    into v_already_used;
  if v_already_used then
    return jsonb_build_object('error', 'You have already used a referral code');
  end if;

  insert into public.referrals (referrer_id, referred_id)
  values (v_referrer_id, p_referred_id);

  -- Award XP to the referrer
  insert into public.user_xp_state (user_id, total_xp, event_counts, daily_event_log, recent_gains, updated_at)
  values (v_referrer_id, v_referrer_xp, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, now())
  on conflict (user_id) do update
    set total_xp = public.user_xp_state.total_xp + v_referrer_xp, updated_at = now();

  -- Award XP to the new user
  insert into public.user_xp_state (user_id, total_xp, event_counts, daily_event_log, recent_gains, updated_at)
  values (p_referred_id, v_referred_xp, '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, now())
  on conflict (user_id) do update
    set total_xp = public.user_xp_state.total_xp + v_referred_xp, updated_at = now();

  return jsonb_build_object(
    'success', true,
    'referrer_xp', v_referrer_xp,
    'referred_xp', v_referred_xp
  );
end;
$$ language plpgsql security definer;

grant execute on function public.apply_referral to authenticated;
