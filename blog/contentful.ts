import { createClient, EntryCollection, Entry } from 'contentful';

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
const previewAccessToken = process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN;

// Basic validations for required production credentials
if (!spaceId) {
  throw new Error('CONTENTFUL_SPACE_ID is not defined');
}

if (!accessToken) {
  throw new Error('CONTENTFUL_ACCESS_TOKEN is not defined');
}

// preview token is optional (only required if you plan to use preview mode)
if (!previewAccessToken) {
  // don't throw — preview token is optional. Logging helps during local dev.
  // eslint-disable-next-line no-console
  console.warn(
    'CONTENTFUL_PREVIEW_ACCESS_TOKEN is not defined — preview mode disabled'
  );
}

export const client = createClient({
  space: spaceId!,
  accessToken: accessToken!,
});

export const previewClient = previewAccessToken
  ? createClient({
      space: spaceId!,
      accessToken: previewAccessToken,
      host: 'preview.contentful.com',
    })
  : null;

export const getClient = (preview = false) =>
  preview && previewClient ? previewClient : client;

/**
 * Helper to get blog pages (uses content type `blogPage`)
 */
export async function getBlogPosts({
  limit = 10,
  skip = 0,
  preview = false,
  featured = false,
  orderBy = '-sys.createdAt',
  recommendedFor = null,
}: {
  limit?: number;
  skip?: number;
  preview?: boolean;
  featured?: boolean;
  orderBy?: string;
  recommendedFor?: string | null;
} = {}): Promise<EntryCollection<any>> {
  const query: Record<string, any> = {
    content_type: 'blogPage',
    order: orderBy,
    limit,
    skip,
    include: 2, // Include linked assets and entries
  };

  // If we want featured posts
  if (featured) {
    query['fields.featured'] = true;
  }

  // If we're getting recommended posts, exclude the current post
  if (recommendedFor) {
    query['sys.id[ne]'] = recommendedFor;
  }

  return getClient(preview)!.getEntries(query);
}

/**
 * Fetch a single blog page by slug.
 * Returns the post entry and an array of recommended post entries.
 *
 * - If the entry has `fields.recommendedPosts` (array of references), those are resolved and returned.
 * - Otherwise, a fallback list of posts (excluding the current one) is returned.
 */
export async function getBlogPostBySlug(
  slugOrId: string,
  preview = false,
  recommendedLimit = 3
): Promise<{
  post: Entry<any> | null;
  recommended: Entry<any>[];
}> {
  const c = getClient(preview)!;
  const value = typeof slugOrId === 'string' ? slugOrId : String(slugOrId);

  // Attempt: if value looks like a UUID-like sys.id, fetch directly; otherwise try entries by any possible field names safely.
  let post: Entry<any> | null = null;
  try {
    // First, try fetching by entry id. This will succeed if `value` is a valid entry id.
    const entry = await c.getEntry(value);
    if (
      entry &&
      entry.sys &&
      entry.sys.contentType &&
      entry.sys.contentType.sys &&
      entry.sys.contentType.sys.id === 'blogPage'
    ) {
      post = entry as any;
    }
  } catch (_err) {
    // ignore and fall back to a best-effort search below
  }

  // If not found by id, try a best-effort search without assuming a specific slug field exists
  if (!post) {
    const res = await c.getEntries({
      content_type: 'blogPage',
      query: value, // broad full-text search across fields
      include: 3,
      limit: 5,
      order: '-sys.createdAt',
    });
    post = res.items && res.items.length > 0 ? res.items[0] : null;
  }

  // If not found by slug, fall back to fetching by sys.id
  if (!post) {
    try {
      const entry = await c.getEntry(value);
      if (
        entry &&
        entry.sys &&
        entry.sys.contentType &&
        entry.sys.contentType.sys &&
        entry.sys.contentType.sys.id === 'blogPage'
      ) {
        post = entry as any;
      }
    } catch (err) {
      // ignore errors from getEntry when the id doesn't exist
    }
  }

  if (!post) {
    return { post: null, recommended: [] };
  }

  // If the post explicitly lists recommendedPosts, resolve those IDs
  const recommendedRefs = (post.fields?.recommendedPosts as any[]) || [];

  let recommended: Entry<any>[] = [];

  if (recommendedRefs.length > 0) {
    // Collect referenced entry IDs (defensive)
    const ids = recommendedRefs
      .map((r) => (r && r.sys && r.sys.id ? r.sys.id : null))
      .filter(Boolean);

    if (ids.length > 0) {
      // fetch referenced entries by sys.id
      const recRes = await c.getEntries({
        'sys.id[in]': ids.join(','),
        include: 1,
        limit: ids.length,
      });
      recommended = recRes.items || [];
    }
  } else {
    // Fallback: get some other posts excluding the current one
    const fallbackRes = await getBlogPosts({
      limit: recommendedLimit,
      preview,
      recommendedFor: post.sys.id,
      orderBy: '-sys.createdAt',
    });
    recommended = fallbackRes.items || [];
  }

  return { post, recommended };
}

/**
 * Lightweight serializer to export a normalized post shape for consumption in pages.
 * Keeps a reference to the original raw entry under `raw`.
 */
export function serializePost(entry: Entry<any> | null) {
  if (!entry) return null;
  const fields = entry.fields || {};
  const computeSlug = () => {
    const directSlug =
      typeof fields.slug === 'string'
        ? fields.slug
        : fields.slug && fields.slug.current
        ? fields.slug.current
        : null;
    if (directSlug) return directSlug;
    const alt =
      (typeof fields.handle === 'string' && fields.handle) ||
      (typeof fields.urlSlug === 'string' && fields.urlSlug) ||
      null;
    return alt || entry.sys?.id || '';
  };
  return {
    id: entry.sys?.id || null,
    title: fields.title || '',
    slug: computeSlug(),
    body: fields.body || fields.content || null,
    image: fields.image || fields.featuredImage || null,
    recommendedIds:
      Array.isArray(fields.recommendedPosts) &&
      fields.recommendedPosts.length > 0
        ? fields.recommendedPosts.map((r: any) => r?.sys?.id).filter(Boolean)
        : [],
    raw: entry,
  };
}
