-- ─── Atomic Nova message increment ──────────────────────────────────────────
-- Fixes the race condition where two concurrent requests can both pass the
-- monthly cap check and both call Anthropic, causing quota bypass.
--
-- The FOR UPDATE row-lock ensures only one transaction can read+write the
-- counter at a time. The month reset is also atomic inside the same lock.
--
-- Run this in the Supabase SQL editor for the VarsityOS project.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION try_use_nova_message(
  p_user_id  UUID,
  p_month_key TEXT,     -- 'YYYY-MM', e.g. '2026-06'
  p_limit    INTEGER    -- -1 means unlimited (nova_unlimited internal cap enforced separately)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used      INTEGER;
  v_reset_key TEXT;
BEGIN
  -- Lock row so concurrent calls queue instead of racing
  SELECT
    COALESCE(nova_messages_used, 0),
    COALESCE(to_char(nova_messages_reset_at, 'YYYY-MM'), '')
  INTO v_used, v_reset_key
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'messages_used', 0, 'reason', 'profile_not_found');
  END IF;

  -- New month → reset counter then allow
  IF v_reset_key != p_month_key THEN
    UPDATE profiles
    SET nova_messages_used = 1,
        nova_messages_reset_at = NOW()
    WHERE id = p_user_id;
    RETURN jsonb_build_object('allowed', true, 'messages_used', 1, 'reset', true);
  END IF;

  -- Unlimited tier (-1) — still increment for cost monitoring
  IF p_limit = -1 THEN
    UPDATE profiles
    SET nova_messages_used = nova_messages_used + 1
    WHERE id = p_user_id;
    RETURN jsonb_build_object('allowed', true, 'messages_used', v_used + 1);
  END IF;

  -- At or over limit
  IF v_used >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'messages_used', v_used, 'reason', 'limit_reached');
  END IF;

  -- Under limit — increment and allow
  UPDATE profiles
  SET nova_messages_used = nova_messages_used + 1
  WHERE id = p_user_id;
  RETURN jsonb_build_object('allowed', true, 'messages_used', v_used + 1);
END;
$$;

-- Grant execute to authenticated users (RLS still applies to underlying table)
GRANT EXECUTE ON FUNCTION try_use_nova_message(UUID, TEXT, INTEGER) TO authenticated;

-- Ensure nova_messages_reset_at column exists (should already from prior migrations)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS nova_messages_reset_at TIMESTAMPTZ;
