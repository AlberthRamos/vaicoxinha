import QRCode from 'qrcode';
import { logger } from '@/utils/logger';

export class QRCodeService {
  /**
   * Gera QR Code a partir de um texto (copia e cola PIX)
   */
  async generateQRCode(text: string, options: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  } = {}): Promise<string> {
    try {
      const defaultOptions = {
        width: 256,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        ...options,
      };

      const qrCodeDataUrl = await QRCode.toDataURL(text, {
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        color: defaultOptions.color,
        errorCorrectionLevel: 'M',
      });

      logger.info('QR Code gerado com sucesso');
      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Erro ao gerar QR Code:', error);
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Gera QR Code a partir de dados PIX formatados
   */
  async generatePixQRCode(pixData: {
    chave: string;
    nome: string;
    cidade: string;
    valor: number;
    identificador?: string;
    mensagem?: string;
  }): Promise<string> {
    try {
      // Formatar dados PIX no padrão BR Code
      const brCode = this.formatPixBRCode(pixData);
      
      return await this.generateQRCode(brCode, {
        width: 512,
        margin: 2,
      });
    } catch (error) {
      logger.error('Erro ao gerar QR Code PIX:', error);
      throw new Error('Erro ao gerar QR Code PIX');
    }
  }

  /**
   * Formata dados PIX no padrão BR Code
   */
  private formatPixBRCode(data: {
    chave: string;
    nome: string;
    cidade: string;
    valor: number;
    identificador?: string;
    mensagem?: string;
  }): string {
    // Código de país (BR)
    const countryCode = 'BR';
    
    // Código de moeda (BRL)
    const currencyCode = '986';
    
    // Merchant Account Information (PIX)
    const gui = 'br.gov.bcb.pix';
    const pixKey = data.chave;
    
    // Merchant Category Code
    const mcc = '0000';
    
    // Transaction Currency
    const transactionCurrency = currencyCode;
    
    // Transaction Amount
    const transactionAmount = data.valor.toFixed(2);
    
    // Country Code
    const countryCodeField = countryCode;
    
    // Merchant Name
    const merchantName = data.nome.substring(0, 25);
    
    // Merchant City
    const merchantCity = data.cidade.substring(0, 15);
    
    // Additional Data Field Template
    const referenceLabel = data.identificador || '***';
    
    // CRC16
    const crc16 = '6304';

    // Montar o BR Code
    let brCode = '';
    brCode += '000201'; // Payload Format Indicator
    brCode += '26'; // Merchant Account Information
    brCode += String(gui.length).padStart(2, '0') + gui;
    brCode += String(pixKey.length).padStart(2, '0') + pixKey;
    brCode += '52040000'; // Merchant Category Code
    brCode += '5303986'; // Transaction Currency
    brCode += '54' + String(transactionAmount.length).padStart(2, '0') + transactionAmount; // Transaction Amount
    brCode += '5802' + countryCodeField; // Country Code
    brCode += '59' + String(merchantName.length).padStart(2, '0') + merchantName; // Merchant Name
    brCode += '60' + String(merchantCity.length).padStart(2, '0') + merchantCity; // Merchant City
    brCode += '62' + String(referenceLabel.length + 4).padStart(2, '0'); // Additional Data Field Template
    brCode += '05' + String(referenceLabel.length).padStart(2, '0') + referenceLabel; // Reference Label
    
    if (data.mensagem) {
      brCode += String(data.mensagem.length).padStart(2, '0') + data.mensagem; // Mensagem adicional
    }
    
    brCode += crc16; // CRC16

    return brCode;
  }

  /**
   * Valida se um QR Code é válido
   */
  async validateQRCode(qrCodeDataUrl: string): Promise<boolean> {
    try {
      // Extrair base64 do data URL
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      
      // Verificar se é uma imagem PNG válida
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Verificar assinatura PNG
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      
      return buffer.slice(0, 8).equals(pngSignature);
    } catch (error) {
      logger.error('Erro ao validar QR Code:', error);
      return false;
    }
  }

  /**
   * Converte QR Code base64 para buffer
   */
  base64ToBuffer(base64Data: string): Buffer {
    try {
      const base64DataClean = base64Data.replace(/^data:image\/png;base64,/, '');
      return Buffer.from(base64DataClean, 'base64');
    } catch (error) {
      logger.error('Erro ao converter base64 para buffer:', error);
      throw new Error('Erro ao converter QR Code');
    }
  }
}