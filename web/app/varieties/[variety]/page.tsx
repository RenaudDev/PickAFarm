import { getVarietyBySlug, getVarietyPaths } from '@/lib/wordpress';
import { notFound } from 'next/navigation';
import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { generateMetadata } from '@/lib/seo-metadata';
import { Metadata } from 'next';

interface VarietyPageProps {
    params: {
      variety: string
    }
  }

export async function generateMetadata({ params }: VarietyPageProps): Promise<Metadata> {
    const variety = await getVarietyBySlug(params.variety);
  
    if (!variety) {
      return {};
    }
  
    const featuredImage = variety._embedded?.['wp:featuredmedia']?.[0];
    const description = variety.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim();
  
    return generateMetadata({
      title: variety.title.rendered,
      description: description,
      image: featuredImage?.source_url,
      url: `https://pickafarm.com/varieties/${variety.slug}`,
      type: 'article',
    });
  }

export async function generateStaticParams() {
  const paths = await getVarietyPaths();
  return paths;
}

export default async function VarietyPage({ params }: VarietyPageProps) {
    const { variety: varietySlug } = params;
    const variety = await getVarietyBySlug(varietySlug);
  
  if (!variety) notFound();

  const featuredImage = variety._embedded?.['wp:featuredmedia']?.[0];

  return (
    <div className="bg-background">
      {/* Minimal Navigation */}
      {/* Navigation */}
<FarmNavbar />

      {/* Article Content */}
      <article className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Article Header */}
          <header className="mb-12">

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance leading-tight">
              {variety.title.rendered}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(variety.date).toLocaleDateString()}</span>
                </span>
              </div>
            </div>

            <Separator />
          </header>

          {/* Featured Image */}
          {featuredImage && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={featuredImage.source_url}
                alt={featuredImage.alt_text || variety.title.rendered}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Body */}
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-foreground leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: variety.content.rendered }}
            />
          </div>

          {/* Article Footer */}
          <footer className="mt-16">
            <Separator className="mb-8" />
            
            
          </footer>
        </div>
      </article>
      {/* Footer */}
<FarmFooter />
    </div>
  );