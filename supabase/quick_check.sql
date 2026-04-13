SELECT
  month_year,
  COUNT(*) AS users,
  SUM(message_count) AS total_messages,
  MAX(message_count) AS highest_single_user,
  ROUND(AVG(message_count), 1) AS avg_messages
FROM nova_usage
GROUP BY month_year
ORDER BY month_year DESC;

SELECT
  COALESCE(subscription_tier, 'free') AS tier,
  is_premium,
  COUNT(*) AS users
FROM profiles
GROUP BY subscription_tier, is_premium
ORDER BY users DESC;
