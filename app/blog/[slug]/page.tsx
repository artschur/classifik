import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBlogPostBySlug } from '@/blog/contentful';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

const renderOptions = {
  renderMark: {
    [MARKS.BOLD]: (text: any) => <strong>{text}</strong>,
    [MARKS.ITALIC]: (text: any) => <em>{text}</em>,
    [MARKS.UNDERLINE]: (text: any) => <u>{text}</u>,
    [MARKS.CODE]: (text: any) => <code className="px-1 py-0.5 rounded bg-muted text-sm">{text}</code>,
  },
  renderNode: {
    [INLINES.HYPERLINK]: (node: any, children: any) => {
      const href = node?.data?.uri || '#';
      return (
        <a href={href} className="text-blue-600 underline" rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      );
    },
    [BLOCKS.PARAGRAPH]: (_node: any, children: any) => <p>{children}</p>,
    [BLOCKS.HEADING_1]: (_node: any, children: any) => <h1 className="text-3xl font-bold mt-10 mb-4">{children}</h1>,
    [BLOCKS.HEADING_2]: (_node: any, children: any) => <h2 className="text-2xl font-semibold mt-8 mb-3">{children}</h2>,
    [BLOCKS.HEADING_3]: (_node: any, children: any) => <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>,
    [BLOCKS.HEADING_4]: (_node: any, children: any) => <h4 className="text-lg font-semibold mt-4 mb-2">{children}</h4>,
    [BLOCKS.HEADING_5]: (_node: any, children: any) => <h5 className="text-base font-semibold mt-3 mb-1">{children}</h5>,
    [BLOCKS.HEADING_6]: (_node: any, children: any) => <h6 className="text-sm font-semibold mt-2 mb-1">{children}</h6>,
    [BLOCKS.UL_LIST]: (_node: any, children: any) => <ul className="list-disc pl-6">{children}</ul>,
    [BLOCKS.OL_LIST]: (_node: any, children: any) => <ol className="list-decimal pl-6">{children}</ol>,
    [BLOCKS.QUOTE]: (_node: any, children: any) => (
      <blockquote className="border-l-4 pl-4 italic my-4">{children}</blockquote>
    ),
    [BLOCKS.EMBEDDED_ASSET]: (node: any) => {
      const file = node?.data?.target?.fields?.file;
      const url = file?.url ? `https:${file.url}` : null;
      const alt = node?.data?.target?.fields?.title || '';
      if (!url) return null;
      return (
        <div className="my-6">
          <Image src={url} alt={alt} width={1200} height={675} className="rounded" />
        </div>
      );
    },
  },
};

function isRichTextDocument(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as any).nodeType === 'document' &&
    Array.isArray((value as any).content)
  );
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Get the current post by slug or id (supports preview mode)
  const { post, recommended } = await getBlogPostBySlug(slug, false, 3);

  if (!post) {
    notFound();
  }

  const fields = post.fields || {};
  const title = typeof (fields as any).title === 'string' ? ((fields as any).title as string) : 'Untitled';
  const content = fields.body || fields.content || null;
  const imageAsset = fields.image || fields.featuredImage || null;

  // Recommended posts (resolved by helper). Fallback to empty array.
  const recommendedPosts = recommended || [];

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Featured image */}
      {(() => {
        const asset: any = imageAsset as any;
        const url = asset?.fields?.file?.url ? `https:${asset.fields.file.url}` : null;
        const alt = asset?.fields?.title || title;
        const dims = asset?.fields?.file?.details?.image;
        const width = (dims?.width as number) || 1200;
        const height = (dims?.height as number) || Math.round((width * 9) / 16);
        return url ? (
          <div className="relative mb-8">
            <Image src={url} alt={alt} width={width} height={height} className="rounded" />
          </div>
        ) : null;
      })()}
      <h1 className="text-4xl font-bold mb-6">{title}</h1>

      {/* Main content */}
      {content ? (
        <div className="prose max-w-none">
          {isRichTextDocument(content) ? (
            <>{documentToReactComponents(content as any, renderOptions)}</>
          ) : (
            <p>{String(content as any)}</p>
          )}
        </div>
      ) : (
        <p className="text-gray-600">No content available.</p>
      )}

      {/* Recommended posts section */}
      {recommendedPosts.length > 0 && (
        <div className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-bold mb-6">Recommended Posts</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedPosts.map((r) => {
              const rAny = r as any;
              const rfields = (rAny?.fields as any) || {};
              const rImage = (rfields.image || rfields.featuredImage || null) as any;
              const rImageUrl =
                rImage && (rImage as any).fields && (rImage as any).fields.file && (rImage as any).fields.file.url
                  ? `https:${(rImage as any).fields.file.url}`
                  : null;
              const rSlug =
                typeof rfields.slug === 'string'
                  ? (rfields.slug as string)
                  : rfields.slug && (rfields.slug as any).current
                    ? (rfields.slug as any).current
                    : rAny?.sys?.id;

              return (
                <div key={rAny?.sys?.id} className="border rounded-lg overflow-hidden">
                  {rImageUrl && (
                    <div className="aspect-video relative">
                      <Image src={rImageUrl} alt={(rfields.title as string) || ''} fill className="object-cover" />
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="font-bold mb-2">
                      <Link href={`/blog/${encodeURIComponent(String(rSlug))}`} className="hover:text-blue-600">
                        {(rfields.title as string) || 'Untitled'}
                      </Link>
                    </h3>

                    <Link href={`/blog/${encodeURIComponent(String(rSlug))}`} className="text-blue-600 text-sm">
                      Read more →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
