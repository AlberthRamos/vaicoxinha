// Paleta de cores baseada na logo do Vai Coxinha
// Cores principais - tons de marrom e laranja (coxinha)
export const colors = {
  // Cores primárias - identidade visual
  primary: {
    50: '#FDF2E9',   // Bege muito claro
    100: '#FAE5D3',  // Bege claro
    200: '#F5CBA7',  // Bege médio
    300: '#F0B27A',  // Laranja claro (crosta da coxinha)
    400: '#EB984E',  // Laranja médio
    500: '#E67E22',  // Laranja principal - cor da coxinha frita
    600: '#D2691E',  // Laranja escuro (tema)
    700: '#BA4A00',  // Laranja escuro
    800: '#A04000',  // Marrom alaranjado
    900: '#7D3C00',  // Marrom escuro
  },

  // Cores secundárias - complementares
  secondary: {
    50: '#FFF8F0',   // Bege muito claro
    100: '#FFF0D6',  // Bege claro
    200: '#FFE1B3',  // Amarelo claro (massa)
    300: '#FFD18A',  // Amarelo médio
    400: '#FFC107',  // Amarelo vibrante
    500: '#FF9800',  // Laranja vibrante
    600: '#F57C00',  // Laranja forte
    700: '#EF6C00',  // Laranja escuro
    800: '#E65100',  // Laranja muito escuro
    900: '#BF360C',  // Vermelho alaranjado
  },

  // Cores de apoio - neutros
  neutral: {
    50: '#FAFAFA',   // Branco gelo
    100: '#F5F5F5',  // Cinza muito claro
    200: '#EEEEEE',  // Cinza claro
    300: '#E0E0E0',  // Cinza médio claro
    400: '#BDBDBD',  // Cinza médio
    500: '#9E9E9E',  // Cinza
    600: '#757575',  // Cinza médio escuro
    700: '#616161',  // Cinza escuro
    800: '#424242',  // Cinza muito escuro
    900: '#212121',  // Quase preto
  },

  // Cores de feedback - semânticas
  semantic: {
    success: {
      light: '#E8F5E8',
      main: '#4CAF50',
      dark: '#2E7D32',
    },
    warning: {
      light: '#FFF3E0',
      main: '#FF9800',
      dark: '#E65100',
    },
    error: {
      light: '#FFEBEE',
      main: '#F44336',
      dark: '#C62828',
    },
    info: {
      light: '#E3F2FD',
      main: '#2196F3',
      dark: '#1565C0',
    },
  },

  // Cores específicas do contexto
  food: {
    // Cores que remetem a comida e apetite
    golden: '#FFD700',      // Dourado (fritura perfeita)
    crispy: '#CD853F',      // Crosta crocante
    creamy: '#FFF8DC',      // Massa cremosa
    spicy: '#DC143C',       // Pimenta (opcional)
    fresh: '#32CD32',       // Verde fresco (acompanhamentos)
  },

  // Cores de textos
  text: {
    primary: '#2C1810',     // Marrom escuro (texto principal)
    secondary: '#5D4037',   // Marrom médio (texto secundário)
    disabled: '#8D6E63',    // Marrom claro (texto desabilitado)
    inverse: '#FFFFFF',     // Branco (texto sobre cores escuras)
  },

  // Cores de fundo
  background: {
    paper: '#FFFFFF',       // Branco (cards, surfaces)
    default: '#FFF8F0',   // Bege muito claro (fundo geral)
    dark: '#8B4513',      // Marrom (fundo escuro)
    darker: '#5D2E00',    // Marrom muito escuro
  },

  // Cores de borda
  border: {
    light: '#F5CBA7',     // Bege claro
    main: '#E67E22',      // Laranja principal
    dark: '#D2691E',      // Laranja escuro
  },

  // Gradientes
  gradient: {
    primary: 'linear-gradient(135deg, #E67E22 0%, #D2691E 100%)',
    secondary: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
    golden: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    brown: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    cream: 'linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%)',
  },

  // Sombras com tons de marrom
  shadow: {
    light: '0 2px 4px rgba(139, 69, 19, 0.1)',
    medium: '0 4px 8px rgba(139, 69, 19, 0.15)',
    dark: '0 8px 16px rgba(139, 69, 19, 0.2)',
    card: '0 2px 8px rgba(139, 69, 19, 0.12)',
    button: '0 4px 12px rgba(230, 126, 34, 0.25)',
  },
} as const;

// Funções utilitárias para cores
export const colorUtils = {
  // Converter hex para RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  },

  // Converter RGB para hex
  rgbToHex: (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Obter cor com opacidade
  withOpacity: (hex: string, opacity: number): string => {
    const { r, g, b } = colorUtils.hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Escurecer cor
  darken: (hex: string, amount: number): string => {
    const { r, g, b } = colorUtils.hexToRgb(hex);
    return colorUtils.rgbToHex(
      Math.max(0, Math.min(255, r - amount)),
      Math.max(0, Math.min(255, g - amount)),
      Math.max(0, Math.min(255, b - amount))
    );
  },

  // Clarear cor
  lighten: (hex: string, amount: number): string => {
    const { r, g, b } = colorUtils.hexToRgb(hex);
    return colorUtils.rgbToHex(
      Math.max(0, Math.min(255, r + amount)),
      Math.max(0, Math.min(255, g + amount)),
      Math.max(0, Math.min(255, b + amount))
    );
  },

  // Verificar se a cor é escura
  isDark: (hex: string): boolean => {
    const { r, g, b } = colorUtils.hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  },

  // Obter cor de contraste (branco ou preto)
  getContrastColor: (hex: string): string => {
    return colorUtils.isDark(hex) ? '#FFFFFF' : '#000000';
  },
};

// Configurações de tema
export const theme = {
  colors,
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%',
  },
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondary: '"Georgia", "Times New Roman", serif',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;