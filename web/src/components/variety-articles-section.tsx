import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { TreePine } from "lucide-react"

interface VarietyArticle {
  slug: string
  title: {
    rendered: string
  }
  excerpt: {
    rendered: string
  }
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      alt_text: string
    }>
  }
}

interface VarietyArticlesSectionProps {
  varieties: VarietyArticle[]
  title: string
  description?: string
}

export default function VarietyArticlesSection({
  varieties,
  title,
  description
}: VarietyArticlesSectionProps) {
  if (!varieties || varieties.length === 0) {
    return null
  }

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TreePine className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {varieties.map((variety) => {
            const featuredImage = variety._embedded?.['wp:featuredmedia']?.[0]
            const excerpt = variety.excerpt.rendered
              .replace(/<[^>]*>?/gm, '')
              .trim()
              .substring(0, 150) + '...'

            return (
              <Link
                key={variety.slug}
                href={`/varieties/${variety.slug}`}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden border-2 hover:border-primary">
                  {featuredImage && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={featuredImage.source_url}
                        alt={featuredImage.alt_text || variety.title.rendered}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                      {variety.title.rendered}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {excerpt}
                    </p>
                    <div className="mt-4">
                      <span className="text-sm font-medium text-primary group-hover:underline">
                        Learn More →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
