import { generateMetadata, generateProductSchema } from '@/config/seo'
import Head from 'next/head'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  product?: any
  noIndex?: boolean
}

export function SEO({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url = '',
  type = 'website',
  product,
  noIndex = false,
}: SEOProps) {
  const metadata = generateMetadata({
    title,
    description,
    keywords,
    image,
    url,
    type,
    noIndex,
  })

  return (
    <Head>
      {/* Meta tags básicas */}
      <title>{metadata.title as string}</title>
      <meta name="description" content={metadata.description as string} />
      <meta name="keywords" content={metadata.keywords as string} />
      <meta name="author" content={metadata.authors?.[0]?.name} />
      <meta name="robots" content={metadata.robots as string} />
      
      {/* Open Graph */}
      <meta property="og:title" content={metadata.openGraph?.title as string} />
      <meta property="og:description" content={metadata.openGraph?.description as string} />
      <meta property="og:url" content={metadata.openGraph?.url as string} />
      <meta property="og:type" content={metadata.openGraph?.type as string} />
      <meta property="og:site_name" content={metadata.openGraph?.siteName as string} />
      <meta property="og:locale" content={metadata.openGraph?.locale as string} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={metadata.twitter?.card as string} />
      <meta name="twitter:title" content={metadata.twitter?.title as string} />
      <meta name="twitter:description" content={metadata.twitter?.description as string} />
      <meta name="twitter:creator" content={metadata.twitter?.creator as string} />
      <meta name="twitter:site" content={metadata.twitter?.site as string} />
      
      {/* Imagens */}
      {metadata.openGraph?.images?.map((image, index) => (
        <meta key={index} property="og:image" content={(image as any).url} />
      ))}
      {metadata.twitter?.images?.map((image, index) => (
        <meta key={index} name="twitter:image" content={image as string} />
      ))}
      
      {/* Schema markup para produtos */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateProductSchema(product as any)),
          }}
        />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={metadata.alternates?.canonical as string} />
      
      {/* Outras meta tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={metadata.other?.['apple-mobile-web-app-title'] as string} />
      <meta name="msapplication-TileColor" content={metadata.other?.['msapplication-TileColor'] as string} />
      <meta name="msapplication-TileImage" content={metadata.other?.['msapplication-TileImage'] as string} />
      <meta name="theme-color" content={metadata.other?.['theme-color'] as string} />
    </Head>
  )
}