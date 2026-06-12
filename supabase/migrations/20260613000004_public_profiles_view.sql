-- public_profiles view: expose only id + display_name + emoji so marketplace
-- components can resolve seller/buyer names without exposing sensitive profile data.
-- Runs as postgres owner (bypasses RLS on the underlying profiles table by default).
-- profiles.name is the display name column; aliased for a stable public interface
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, name AS display_name, emoji, university
  FROM profiles;

GRANT SELECT ON public_profiles TO authenticated, anon;
