import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { NotificationPermission } from '@/components/notification-permission'
import { OrderStatus } from '@/components/order-status'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vai Coxinha - Delivery de Coxinhas',
  description: 'Peça suas coxinhas favoritas com rapidez e facilidade!',
  manifest: '/manifest.json',
  themeColor: '#FF6B35',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vai Coxinha'
  },
  icons: {
    icon: [
      { url: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vai Coxinha" />
      </head>
      <body className={inter.className}>
        <Providers>
          <NotificationPermission />
          <OrderStatus />
          {children}
        </Providers>
      </body>
    </html>
  )
}