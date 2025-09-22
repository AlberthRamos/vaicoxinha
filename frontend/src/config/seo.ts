import { Metadata } from 'next'

export const siteConfig = {
  title: 'Vai Coxinha - Os Melhores Salgados da Cidade',
  description: 'Coxinhas artesanais crocantes por fora, macias por dentro. Peça online e receba em casa. Vai Coxinha - sabor que conquista!',
  keywords: [
    'coxinha',
    'salgados',
    'comida brasileira',
    'lanche',
    'delivery',
    'comida rápida',
    'coxinha artesanal',
    'salgados fritos',
    'petisco',
    'Vai Coxinha'
  ],
  author: 'Vai Coxinha',
  siteUrl: 'https://vaicoxinha.com.br',
  locale: 'pt_BR',
  themeColor: '#FF6B35',
  twitter: '@vaicoxinha',
  facebook: 'vaicoxinha',
  instagram: '@vaicoxinha',
  address: {
    street: 'Rua das Coxinhas',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  },
  phone: '+5511999999999',
  email: 'contato@vaicoxinha.com.br',
  openingHours: {
    monday: '11:00-22:00',
    tuesday: '11:00-22:00',
    wednesday: '11:00-22:00',
    thursday: '11:00-22:00',
    friday: '11:00-23:00',
    saturday: '11:00-23:00',
    sunday: '11:00-21:00'
  }
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url = '',
  type = 'website',
  noIndex = false,
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
  noIndex?: boolean
} = {}): Metadata {
  const siteTitle = title ? `${title} | ${siteConfig.title}` : siteConfig.title
  const siteDescription = description || siteConfig.description
  const siteKeywords = [...siteConfig.keywords, ...keywords].join(', ')
  const siteUrl = url ? `${siteConfig.siteUrl}${url}` : siteConfig.siteUrl
  const siteImage = image.startsWith('http') ? image : `${siteConfig.siteUrl}${image}`

  return {
    title: siteTitle,
    description: siteDescription,
    keywords: siteKeywords,
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: siteConfig.title,
      images: [
        {
          url: siteImage,
          width: 1200,
          height: 630,
          alt: siteConfig.title,
        },
      ],
      locale: siteConfig.locale,
      type: type,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: [siteImage],
      creator: siteConfig.twitter,
      site: siteConfig.twitter,
    },
    verification: {
      google: 'google-site-verification-code',
      yandex: 'yandex-verification-code',
    },
    other: {
      'format-detection': 'telephone=no',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': siteConfig.title,
      'msapplication-TileColor': siteConfig.themeColor,
      'msapplication-TileImage': '/ms-icon-144x144.png',
      'theme-color': siteConfig.themeColor,
    },
  }
}

export function generateStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${siteConfig.address.street}, ${siteConfig.address.number}`,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zipCode,
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-23.550520',
      longitude: '-46.633308',
    },
    openingHoursSpecification: Object.entries(siteConfig.openingHours).map(([day, hours]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
      opens: hours.split('-')[0],
      closes: hours.split('-')[1],
    })),
    menu: `${siteConfig.siteUrl}/menu`,
    servesCuisine: 'Brazilian',
    priceRange: '$$',
    paymentAccepted: 'Cash, Credit Card, Debit Card, Digital Payment',
    sameAs: [
      `https://facebook.com/${siteConfig.facebook}`,
      `https://instagram.com/${siteConfig.instagram}`,
      `https://twitter.com/${siteConfig.twitter}`,
    ],
    image: `${siteConfig.siteUrl}/logo.png`,
    logo: `${siteConfig.siteUrl}/logo.png`,
  }
}

export function generateProductSchema(product: any) {
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: 'Vai Coxinha',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'BRL',
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Vai Coxinha',
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 0,
    } : undefined,
    category: product.category,
  }
  return productSchema as any
}