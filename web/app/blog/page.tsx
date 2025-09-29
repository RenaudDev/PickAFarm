import { getAllPosts } from '@/lib/wordpress';
import { FarmNavbar } from "@/components/farm-navbar"
import { FarmFooter } from "@/components/farm-footer"
import { Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="bg-background">
      <FarmNavbar />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-12">Blog</h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => {
            const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];
            
            return (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                {featuredImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={featuredImage.source_url}
                      alt={featuredImage.alt_text || post.title.rendered}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-2">
                    {post.title.rendered}
                  </h2>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div 
                    className="text-gray-600 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                      __html: post.excerpt.rendered 
                    }} 
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <FarmFooter />
    </div>
  );
}