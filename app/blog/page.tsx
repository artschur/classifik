import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts } from '@/blog/contentful';

// ISR: revalidate every 10 minutes
export const revalidate = 600;

/**
 * Blog listing page (Server Component)
 *
 * Contentful response types are intentionally typed as `any` to avoid TS errors
 * related to missing/mismatched Contentful typings in this project.
 *
 * Note: Return type is `Promise<any>` (instead of `JSX.Element`) to avoid
 * relying on the global `JSX` namespace which may not be available in some
 * TypeScript configurations.
 */
export default async function BlogPage(): Promise<any> {
  const response: any = await getBlogPosts({ limit: 100 });
  const posts: any[] = (response && response.items) || [];

  // Early return when there are no posts
  if (!posts || posts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Our Blog</h1>
        <p className="text-gray-600">No posts found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Our Blog</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post: any, index: number) => {
          const sys: any = post?.sys || {};
          const fields: any = post?.fields || {};

          const title: string = fields?.title || 'Untitled';

          // slug in Contentful might be a plain string field; fall back to entry id if missing
          const rawSlug =
            typeof fields?.slug === 'string'
              ? fields.slug
              : fields?.slug && fields.slug.current
                ? fields.slug.current
                : null;
          const slugValue = rawSlug || sys?.id || `post-${index}`;
          const slugStr = String(slugValue);

          // image fallback: support both `image` and `featuredImage` field names
          const imageAsset: any = fields?.image || fields?.featuredImage || null;
          const fileObj: any = imageAsset?.fields?.file || null;
          const imageUrl: string | null = fileObj && fileObj.url ? `https:${fileObj.url}` : null;

          const excerpt: string = fields?.excerpt || '';

          const articleKey = sys?.id || slugStr || `post-${index}`;

          return (
            <article
              key={articleKey}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {imageUrl && (
                <div className="aspect-video relative">
                  <Image
                    src={imageUrl}
                    alt={(imageAsset?.fields && imageAsset.fields.description) || title}
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-5">
                <h2 className="text-xl font-bold mb-2">
                  <Link href={`/blog/${encodeURIComponent(slugStr)}`} className="hover:text-blue-600 transition-colors">
                    {title}
                  </Link>
                </h2>

                {excerpt && <p className="text-gray-600 mb-4">{excerpt}</p>}

                <Link href={`/blog/${encodeURIComponent(slugStr)}`} className="text-blue-600 font-medium hover:underline">
                  Read more →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
