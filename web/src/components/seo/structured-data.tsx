/**
 * Structured Data Component
 * Renders JSON-LD structured data for SEO
 */

interface StructuredDataProps {
  data: Record<string, any>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
      }}
    />
  )
}

/**
 * Multiple Structured Data Blocks
 * Renders multiple JSON-LD schemas at once
 */
interface MultipleStructuredDataProps {
  schemas: Array<Record<string, any>>
}

export function MultipleStructuredData({ schemas }: MultipleStructuredDataProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
    </>
  )
}
