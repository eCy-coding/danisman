-- Perspektif Search Infrastructure — PB-3
-- Postgres FTS function: search_insights(q, lang, filters)

CREATE OR REPLACE FUNCTION search_insights(
  q             TEXT,
  lang          TEXT     DEFAULT 'simple',
  filter_domain TEXT[]   DEFAULT NULL,
  filter_tag    TEXT[]   DEFAULT NULL,
  filter_from   DATE     DEFAULT NULL,
  filter_to     DATE     DEFAULT NULL,
  page_limit    INT      DEFAULT 20,
  page_offset   INT      DEFAULT 0
) RETURNS TABLE(post_id TEXT, rank REAL, title TEXT, excerpt TEXT, domain TEXT, published_at TIMESTAMPTZ)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    bp.id                             AS post_id,
    ts_rank(
      to_tsvector(lang::regconfig,
        bp."titleTr" || ' ' || bp."titleTr" || ' ' ||
        bp."excerptTr" || ' ' ||
        bp."bodyTrMdx"
      ),
      plainto_tsquery(lang::regconfig, q)
    )                                 AS rank,
    bp."titleTr"                      AS title,
    bp."excerptTr"                    AS excerpt,
    bp."primaryDomain"::TEXT          AS domain,
    bp."publishedAt"                  AS published_at
  FROM "blog_posts" bp
  WHERE
    bp.status = 'PUBLISHED'
    AND (
      filter_domain IS NULL
      OR bp."primaryDomain"::TEXT = ANY(filter_domain)
    )
    AND (
      filter_tag IS NULL
      OR EXISTS (
        SELECT 1
        FROM "_BlogPostTags" bpt
        JOIN "tags" t ON bpt."B" = t.id
        WHERE bpt."A" = bp.id
          AND t.slug = ANY(filter_tag)
      )
    )
    AND (filter_from IS NULL OR bp."publishedAt"::DATE >= filter_from)
    AND (filter_to   IS NULL OR bp."publishedAt"::DATE <= filter_to)
    AND to_tsvector(lang::regconfig,
          bp."titleTr" || ' ' || bp."excerptTr" || ' ' || bp."bodyTrMdx"
        ) @@ plainto_tsquery(lang::regconfig, q)
  ORDER BY rank DESC, bp."publishedAt" DESC
  LIMIT  page_limit
  OFFSET page_offset;
$$;

-- View count için atomik Redis → DB sync function
-- Batch flush: Redis INCRBY değerini DB'ye uygular
CREATE OR REPLACE FUNCTION increment_view_count(post_id TEXT, delta INT)
RETURNS void
LANGUAGE SQL
AS $$
  UPDATE "blog_posts"
  SET "viewCount" = "viewCount" + delta
  WHERE id = post_id;
$$;
