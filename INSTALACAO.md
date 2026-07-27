# 🚀 Guia de Instalação - Amazon Scraper

Este guia fornece instruções completas para instalar e executar o Amazon Product Scraper.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior) - [Download](https://nodejs.org/)
- **npm** (incluído com Node.js)
- **Git** (opcional, para clonar o repositório)

### Verificar instalação

```bash
node --version
npm --version
```

## 📥 Instalação

### Método 1: Instalação Automática (Recomendado)

1. **Clone ou baixe o projeto**:
```bash
git clone <repository-url>
cd amazon-scraper
```

2. **Execute o script de deploy**:
```bash
./deploy.sh
```

3. **Inicie o servidor**:
```bash
npm start
```

### Método 2: Instalação Manual

1. **Instalar dependências do backend**:
```bash
npm install
```

2. **Instalar dependências do frontend**:
```bash
cd client
npm install
cd ..
```

3. **Ou usar o comando combinado**:
```bash
npm run install-all
```

## 🔧 Configuração

### Variáveis de Ambiente (Opcional)

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Edite as configurações conforme necessário:
```env
PORT=3000
NODE_ENV=production
```

## 🚀 Executando a Aplicação

### Desenvolvimento

1. **Iniciar o backend**:
```bash
npm run dev
```

2. **Em outro terminal, iniciar o frontend**:
```bash
cd client
npm run dev
```

Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Produção

1. **Build da aplicação**:
```bash
npm run build
```

2. **Iniciar servidor**:
```bash
npm start
```

Acesse: http://localhost:3000

## 📋 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor backend em modo desenvolvimento |
| `npm start` | Inicia servidor em modo produção |
| `npm run build` | Constrói frontend para produção |
| `npm run build:prod` | Instala dependências e constrói para produção |
| `npm run deploy` | Deploy completo (build + start) |
| `npm run install-all` | Instala todas as dependências |
| `npm run test-api` | Testa se a API está funcionando |
| `npm run clean` | Limpa arquivos de build |

## 🔍 Verificação

### Testar API

```bash
curl http://localhost:3000/api/health
```

### Testar Scraping

```bash
curl "http://localhost:3000/api/scrape?keyword=smartphone"
```

## 🐛 Solução de Problemas

### Erro: "porta já em uso"
```bash
# Encontrar processo usando a porta
lsof -i :3000

# Matar processo
kill -9 <PID>
```

### Erro: "dependências não encontradas"
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules
rm -rf client/node_modules
npm run install-all
```

### Erro: "build não encontrado"
```bash
# Reconstruir aplicação
npm run clean
npm run build
```

## 📁 Estrutura de Arquivos

```
amazon-scraper/
├── server/
│   └── index.js          # Servidor Express
├── client/
│   ├── index.html        # Página principal
│   ├── main.js           # JavaScript frontend
│   ├── style.css         # Estilos CSS
│   └── package.json      # Dependências frontend
├── public/               # Build de produção
├── deploy.sh            # Script de deploy
├── .env.example         # Configurações de exemplo
└── package.json         # Dependências backend
```

## 🔒 Segurança

- ✅ Vulnerabilidades corrigidas
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Headers de segurança

## 🌐 Deploy

### Deploy Local
```bash
./deploy.sh
npm start
```

### Deploy em Servidor
1. Transfira os arquivos para o servidor
2. Execute `./deploy.sh`
3. Configure proxy reverso (nginx/apache) se necessário
4. Configure PM2 para gerenciamento de processo (opcional)

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] Dependências instaladas (`npm run install-all`)
- [ ] Build criado (`npm run build`)
- [ ] Servidor iniciado (`npm start`)
- [ ] API testada (`npm run test-api`)
- [ ] Frontend acessível (http://localhost:3000)

---

**Instalação bem-sucedida!** 🎉

Sua aplicação Amazon Scraper está pronta para uso!

