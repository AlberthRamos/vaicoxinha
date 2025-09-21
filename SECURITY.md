# Segurança do Projeto Vai Coxinha

## ⚠️ CRÍTICO - Problemas de Segurança Corrigidos

### 1. JWT Secret
- **ANTES**: Fallback para 'dev' quando JWT_SECRET não definido
- **DEPOIS**: Requer JWT_SECRET definido, sem fallback
- **Ação**: Gerar chave segura de pelo menos 32 caracteres

### 2. Validação de Role Admin
- **ANTES**: Qualquer token JWT válido acessava funções admin
- **DEPOIS**: Verificação explícita de `role: 'admin'` no payload JWT

### 3. Seed Token
- **ANTES**: Fallback vazio quando SEED_TOKEN não definido
- **DEPOIS**: Requer SEED_TOKEN definido

### 4. Credenciais
- **Sempre** use credenciais de teste do Mercado Pago em desenvolvimento
- **Nunca** commite credenciais reais no repositório

## 🔑 Gerando Chaves Seguras

```bash
# JWT Secret (32+ caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Seed Token
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 📝 Configuração de Produção

1. Copie `.env.example` para `.env`
2. Substitua os valores com chaves geradas
3. Configure variáveis no painel do Render/Deploy
4. **Nunca** commite arquivos `.env` com credenciais reais