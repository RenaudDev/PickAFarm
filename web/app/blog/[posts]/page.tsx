import { getPostBySlug, getPostPaths } from '@/lib/wordpress';
import { notFound } from 'next/navigation';
import { FarmNavbar } from '@/components/farm-navbar';
import { FarmFooter } from '@/components/farm-footer';
import { Separator } from '@/components/ui/separator';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-metadata';
import { Metadata } from 'next';

interface BlogPostProps {
  params: Promise<{
    posts: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { posts: slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];
  const description = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim();

  return generateSEOMetadata({
    title: post.title.rendered,
    description: description,
    image: featuredImage?.source_url,
    url: `https://pickafarm.com/blog/${post.slug}`,
    type: 'article',
  });
}

export async function generateStaticParams() {
  const paths = await getPostPaths();
  return paths;
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { posts: slug } = await params; // Changed this line
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];

  return (
    <div className="bg-background">
      <FarmNavbar />

      <article className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance leading-tight">
              {post.title.rendered}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </span>
              </div>
            </div>

            <Separator />
          </header>

          {featuredImage && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={featuredImage.source_url}
                alt={featuredImage.alt_text || post.title.rendered}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <div
              className="text-foreground leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            />
          </div>

          <footer className="mt-16">
            <Separator className="mb-8" />
          </footer>
        </div>
      </article>

      <FarmFooter />
    </div>
  );
}
