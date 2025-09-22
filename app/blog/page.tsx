import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts } from '@/blog/contentful';

// Enable ISR - revalidate every 10 minutes
export const revalidate = 600;

export default async function BlogPage() {
  const response = await getBlogPosts({ limit: 100 });
  const posts = (response && response.items) || [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Our Blog</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => {
          const fields = post.fields || {};
          const title = fields.title || 'Untitled';
          // slug in Contentful might be a plain string field; fall back to entry id if missing
          const rawSlug =
            typeof fields.slug === 'string'
              ? fields.slug
              : fields.slug && fields.slug.current
              ? fields.slug.current
              : null;
          const slugValue = rawSlug || post.sys?.id;

          // image fallback: support both `image` and `featuredImage` field names
          const imageAsset = fields.image || fields.featuredImage || null;
          const imageUrl =
            imageAsset &&
            imageAsset.fields &&
            imageAsset.fields.file &&
            imageAsset.fields.file.url
              ? `https:${imageAsset.fields.file.url}`
              : null;

          const excerpt = fields.excerpt || '';

          return (
            <article
              key={post.sys.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {imageUrl && (
                <div className="aspect-video relative">
                  <Image
                    src={imageUrl}
                    alt={
                      (imageAsset &&
                        imageAsset.fields &&
                        imageAsset.fields.description) ||
                      title
                    }
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-5">
                <h2 className="text-xl font-bold mb-2">
                  <Link
                    href={`/blog/${encodeURIComponent(slugValue)}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {title}
                  </Link>
                </h2>

                {excerpt && <p className="text-gray-600 mb-4">{excerpt}</p>}

                <Link
                  href={`/blog/${encodeURIComponent(slugValue)}`}
                  className="text-blue-600 font-medium hover:underline"
                >
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
