-- Create a function to search profiles with follower information
CREATE OR REPLACE FUNCTION search_profiles(search_term text)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  followers_count bigint,
  following_count bigint,
  is_following boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH follower_counts AS (
    SELECT
      following_id,
      COUNT(*) as followers
    FROM follows
    GROUP BY following_id
  ),
  following_counts AS (
    SELECT
      follower_id,
      COUNT(*) as following
    FROM follows
    GROUP BY follower_id
  ),
  is_following_check AS (
    SELECT
      following_id,
      true as is_following
    FROM follows
    WHERE follower_id = auth.uid()
  )
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    COALESCE(fc.followers, 0)::bigint as followers_count,
    COALESCE(fwc.following, 0)::bigint as following_count,
    COALESCE(ifc.is_following, false) as is_following
  FROM profiles p
  LEFT JOIN follower_counts fc ON p.id = fc.following_id
  LEFT JOIN following_counts fwc ON p.id = fwc.follower_id
  LEFT JOIN is_following_check ifc ON p.id = ifc.following_id
  WHERE 
    p.username ILIKE '%' || search_term || '%'
    OR p.full_name ILIKE '%' || search_term || '%'
  ORDER BY
    CASE
      WHEN p.username ILIKE search_term || '%' THEN 1
      WHEN p.full_name ILIKE search_term || '%' THEN 2
      ELSE 3
    END,
    p.username
  LIMIT 20;
END;
$$; 