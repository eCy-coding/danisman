import { getPostHog } from '../posthog';

// PB-10: Perspektif blog analytics — 11 PostHog events
// STRICT OPT-IN: uses posthog.has_opted_in_capturing() wrapper via getPostHog()
// All captures silently no-op if user has not opted in.

async function capture(event: string, props: Record<string, unknown>): Promise<void> {
  try {
    const ph = await getPostHog();
    if (!ph) return;
    if (!ph.has_opted_in_capturing()) return;
    ph.capture(event, props);
  } catch {
    // Silent — analytics must never break core functionality
  }
}

export async function trackInsightsHubView(props: {
  domain?: string;
  filterActive: boolean;
}): Promise<void> {
  await capture('insights_hub_view', props);
}

export async function trackInsightsFilterApplied(props: {
  domain?: string;
  tags?: string[];
  sort?: string;
}): Promise<void> {
  await capture('insights_filter_applied', props);
}

export async function trackInsightsSearchQuery(props: {
  query: string;
  resultCount: number;
}): Promise<void> {
  await capture('insights_search_query', props);
}

export async function trackArticleView(props: {
  postId: string;
  slug: string;
  domain: string;
  language: string;
}): Promise<void> {
  await capture('article_view', props);
}

export async function trackArticleScroll(props: {
  postId: string;
  depth: 50 | 75 | 100;
}): Promise<void> {
  await capture(`article_scroll_${props.depth}`, { postId: props.postId, depth: props.depth });
}

export async function trackArticleShareClick(props: {
  postId: string;
  platform: 'twitter' | 'linkedin' | 'copy' | 'whatsapp';
}): Promise<void> {
  await capture('article_share_click', props);
}

export async function trackArticleBookmarkAdd(props: { postId: string }): Promise<void> {
  await capture('article_bookmark_add', props);
}

export async function trackArticleCtaClick(props: {
  postId: string;
  ctaType: 'discovery_call' | 'newsletter' | 'service';
}): Promise<void> {
  await capture('article_cta_click', props);
}

export async function trackArticleCommentSubmit(props: { postId: string }): Promise<void> {
  await capture('article_comment_submit', props);
}

export async function trackSeriesPartComplete(props: {
  seriesId: string;
  partNumber: number;
}): Promise<void> {
  await capture('series_part_complete', props);
}

export async function trackAuthorPageView(props: {
  authorId: string;
  authorSlug: string;
}): Promise<void> {
  await capture('author_page_view', props);
}
