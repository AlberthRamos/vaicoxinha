# 🍗 Vai Coxinha - Sistema de Delivery

Sistema completo de delivery para uma lanchonete especializada em coxinhas, desenvolvido com tecnologias modernas e melhores práticas.

## 🚀 Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com SSR/SSG
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Shadcn/ui** - Componentes UI acessíveis e customizáveis
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Lucide React** - Ícones modernos

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Prisma** - ORM moderno
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação segura
- **Bcrypt** - Hash de senhas
- **Cors** - Configuração de CORS

## 📁 Estrutura do Projeto

```
vai-coxinha/
├── frontend/                 # Aplicação Next.js
│   ├── app/                 # App Router do Next.js 15
│   ├── components/          # Componentes React
│   ├── lib/               # Utilitários e configurações
│   ├── public/            # Arquivos estáticos
│   └── package.json       # Dependências do frontend
├── backend/                 # API Node.js/Express
│   ├── prisma/            # Schema do banco de dados
│   ├── src/               # Código fonte
│   └── package.json       # Dependências do backend
└── README.md              # Este arquivo
```

## 🎯 Funcionalidades Implementadas

### Frontend
- ✅ **Página Inicial** - Landing page responsiva
- ✅ **Catálogo de Produtos** - Visualização de todos os produtos
- ✅ **Sistema de Carrinho** - Adicionar/remover itens
- ✅ **Checkout Completo** - Formulário de pedido com validação
- ✅ **Página de Admin** - Gerenciamento de produtos (em desenvolvimento)
- ✅ **Design Responsivo** - Mobile-first
- ✅ **Animações Suaves** - Transições e efeitos visuais

### Backend
- ✅ **API RESTful** - Endpoints para produtos e pedidos
- ✅ **Autenticação JWT** - Sistema de login seguro
- ✅ **Banco de Dados** - Schema PostgreSQL com Prisma
- ✅ **Validação de Dados** - Validação com middlewares
- ✅ **CORS Configurado** - Segurança entre domínios

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL
- npm ou yarn

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente (Backend)
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/vaicoxinha"
JWT_SECRET="sua_chave_secreta"
PORT=3001
```

### Variáveis de Ambiente (Frontend)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 📊 Schema do Banco de Dados

### Tabelas Principais
- **products** - Produtos do catálogo
- **orders** - Pedidos dos clientes
- **order_items** - Itens de cada pedido
- **users** - Usuários administrativos (em desenvolvimento)

## 🎨 Design System

### Cores Principais
- Primária: `#D2691E` (Laranja queimado)
- Secundária: `#8B4513` (Marrom sela)
- Apoio: `#FFA500` (Laranja)
- Background: `#FFF8DC` (Branco semente de manga)

## 🔐 Segurança
- Senhas hasheadas com bcrypt
- JWT para autenticação
- Validação de dados com Zod
- CORS configurado

## 📱 Responsividade
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Componentes adaptativos

## 🚧 Em Desenvolvimento
- Painel administrativo completo
- Sistema de autenticação de admin
- Dashboard de pedidos em tempo real
- Integração com Magic UI components
- Testes de usabilidade com Human Use MCPs

## 📄 Licença
Este projeto está sob a licença MIT.

## 👨‍💻 Autor
Desenvolvido por Alberth Ramos

---

**Vai Coxinha** - Levando sabor e qualidade até você! 🍗✨
