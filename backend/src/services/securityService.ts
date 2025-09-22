import crypto from 'crypto';

export class SecurityService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SECRET_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-here-32-chars-long';
  private static readonly IV_LENGTH = 16; // Tamanho do IV para AES
  private static readonly TAG_LENGTH = 16; // Tamanho da tag GCM

  /**
   * Criptografa dados sensíveis
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher(this.ALGORITHM, this.SECRET_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  /**
   * Descriptografa dados sensíveis
   */
  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Dados criptografados inválidos');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(this.ALGORITHM, this.SECRET_KEY);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Gera hash SHA256 para validação de integridade
   */
  static generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Ofusca dados sensíveis (ex: CPF, cartão)
   */
  static maskSensitiveData(data: string, type: 'cpf' | 'card' | 'phone' | 'email'): string {
    switch (type) {
      case 'cpf':
        return data.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4');
      case 'card':
        return data.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '****-****-****-$4');
      case 'phone':
        return data.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) ****-$3');
      case 'email':
        const [username, domain] = data.split('@');
        const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
        return `${maskedUsername}@${domain}`;
      default:
        return data;
    }
  }

  /**
   * Gera fingerprint único para detecção de fraude
   */
  static generateFingerprint(userAgent: string, ipAddress: string): string {
    const data = `${userAgent}|${ipAddress}|${Date.now()}`;
    return this.generateHash(data);
  }

  /**
   * Avalia risco de transação
   */
  static assessRisk(paymentData: any): {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  } {
    let score = 0;
    const factors: string[] = [];

    // Verifica valor da transação
    if (paymentData.amount > 1000) {
      score += 20;
      factors.push('High transaction amount');
    }

    // Verifica horário da transação
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      score += 15;
      factors.push('Unusual transaction time');
    }

    // Verifica frequência de transações
    if (paymentData.recentTransactions > 5) {
      score += 25;
      factors.push('High transaction frequency');
    }

    // Verifica método de pagamento
    if (paymentData.paymentMethod === 'CREDIT_CARD') {
      score += 10;
      factors.push('Credit card payment');
    }

    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    if (score >= 40) {
      level = 'HIGH';
    } else if (score >= 20) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    return { score, level, factors };
  }

  /**
   * Gera dados de origem ofuscados
   */
  static generateOriginData(accountId: string, source: string): {
    accountId: string;
    source: string;
    timestamp: Date;
    hash: string;
  } {
    const timestamp = new Date();
    const data = `${accountId}|${source}|${timestamp.toISOString()}`;
    const hash = this.generateHash(data);

    return {
      accountId: this.maskAccountId(accountId),
      source: this.obfuscateSource(source),
      timestamp,
      hash
    };
  }

  private static maskAccountId(accountId: string): string {
    if (accountId.length < 8) {
      return '*'.repeat(accountId.length);
    }
    return accountId.substring(0, 4) + '*'.repeat(accountId.length - 8) + accountId.substring(accountId.length - 4);
  }

  private static obfuscateSource(source: string): string {
    const sources: { [key: string]: string } = {
      'mercado_pago': 'MP',
      'stripe': 'ST',
      'paypal': 'PP',
      'pagseguro': 'PS'
    };
    return sources[source.toLowerCase()] || 'XX';
  }

  /**
   * Valida CPF brasileiro
   */
  static validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica sequências inválidas
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Valida primeiro dígito
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cpf.charAt(9)) !== digit) return false;
    
    // Valida segundo dígito
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    digit = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cpf.charAt(10)) === digit;
  }

  /**
   * Sanitiza dados de entrada
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove tags HTML
      .replace(/['"]/g, '') // Remove aspas
      .trim();
  }
}