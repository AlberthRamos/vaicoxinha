export interface MercadoPagoConfig {
  publicKey: string;
  accessToken: string;
  environment: 'development' | 'production';
  webhookUrl: string;
  notificationUrl: string;
}

export const mercadoPagoConfig: MercadoPagoConfig = {
  development: {
    publicKey: 'APP_USR-183db6ce-dc17-4b64-9e7a-dfcbc301e388',
    accessToken: 'APP_USR-1213983003831172-092013-efd0a6996ee4e3017faeb045f57598ae-2704379760',
    environment: 'development',
    webhookUrl: 'https://webhook.site/unique-id', // URL temporária para testes
    notificationUrl: 'http://localhost:3001/api/payments/webhook'
  },
  production: {
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
    environment: 'production',
    webhookUrl: process.env.MERCADO_PAGO_WEBHOOK_URL || '',
    notificationUrl: process.env.MERCADO_PAGO_NOTIFICATION_URL || ''
  }
};

export const getMercadoPagoConfig = (): MercadoPagoConfig => {
  const env = process.env.NODE_ENV || 'development';
  return mercadoPagoConfig[env as keyof typeof mercadoPagoConfig] || mercadoPagoConfig.development;
};