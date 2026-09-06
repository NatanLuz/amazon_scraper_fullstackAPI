# 🚀 Guia de Instalação - Amazon Scraper

Este guia fornece instruções completas para instalar e executar o Amazon Product Scraper.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (`^20.19.0 || >=22.12.0`) - [Download](https://nodejs.org/)
- **npm** (incluído com Node.js)
- **Git** (opcional, para clonar o repositório)

### Verificar instalação

```powershell
node --version
npm --version
```

## 📥 Instalação

### Método 1: Instalação pelos scripts npm (Recomendado)

Os comandos abaixo funcionam no Windows/PowerShell, sem depender de Bash.

1. **Clone ou baixe o projeto**:
```powershell
git clone https://github.com/NatanLuz/amazon_scraper_fullstackAPI.git
cd amazon_scraper_fullstackAPI
```

2. **Instale pelos lockfiles e compile pela raiz**:
```powershell
npm run install-all
npm run build
```

3. **Inicie o servidor**:
```powershell
npm start
```

### Método 2: Instalação Manual

1. **Instalar dependências do backend**:
```powershell
npm run install-server
```

2. **Instalar dependências do frontend**:
```powershell
npm run install-client
```

3. **Ou usar o comando combinado**:
```powershell
npm run install-all
```

## 🔧 Configuração

### Variáveis de Ambiente (Opcional)

Copie o arquivo de exemplo:
```powershell
Copy-Item .env.example .env
```

Edite as configurações conforme necessário:
```env
PORT=3000
# REQUEST_TIMEOUT_MS=12000
# CACHE_TTL_MS=60000
# RATE_LIMIT_MAX=15
```

## 🚀 Executando a Aplicação

### Desenvolvimento

1. **Iniciar o backend**:
```powershell
npm run dev
```

2. **Em outro terminal, iniciar o frontend**:
```powershell
cd client
npm run dev
```

Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Produção

1. **Build da aplicação**:
```powershell
npm run build
```

2. **Iniciar servidor**:
```powershell
npm start
```

Acesse: http://localhost:3000

## 📋 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor backend em modo desenvolvimento |
| `npm start` | Inicia servidor em modo produção |
| `npm run build` | Constrói frontend para produção |
| `npm run build:prod` | Reutiliza o build sem instalar dependências |
| `npm run deploy` | Compila e inicia localmente, sem publicação externa |
| `npm run install-server` | Instala dependências da raiz com `npm ci` |
| `npm run install-client` | Instala dependências do client com `npm ci --prefix client` |
| `npm run install-all` | Executa as duas instalações reproduzíveis |
| `npm run test-api` | Consulta o health check com fetch nativo do Node; falha em erro HTTP ou de conexão |
| `npm run clean` | Limpa arquivos de build |

## 🔍 Verificação

### Testar API

```powershell
npm run test-api
Invoke-RestMethod http://localhost:3000/api
Invoke-RestMethod http://localhost:3000/api/metrics
```

### Testar Scraping

```powershell
Invoke-RestMethod "http://localhost:3000/api/scrape?keyword=smartphone"
```

## 🐛 Solução de Problemas

### Erro: "porta já em uso"
```powershell
# Identificar o processo usando a porta
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
```

Encerre o servidor com Ctrl+C no terminal em que ele foi iniciado.

### Erro: "dependências não encontradas"
```powershell
# Reinstalar a partir dos lockfiles; npm ci substitui node_modules
npm run install-all
```

### Erro: "build não encontrado"
```powershell
# Reconstruir aplicação
npm run clean
npm run build
```

## 📁 Estrutura de Arquivos

```
amazon_scraper_fullstackAPI/
├── server/
│   └── index.js          # Servidor Express
├── client/
│   ├── index.html        # Página principal
│   ├── main.js           # JavaScript frontend
│   ├── style.css         # Estilos CSS
│   └── package.json      # Dependências frontend
├── public/               # Build de produção
├── deploy.sh            # Script legado para Bash
├── .env.example         # Configurações de exemplo
└── package.json         # Dependências backend
```

## 🔒 Segurança

- Consulte `npm audit` e `npm audit --omit=dev` na raiz e no client para o diagnóstico de dependências atual.
- ✅ CORS configurado
- ✅ Validação de entrada
- ✅ Headers de segurança

## 🌐 Deploy

### Deploy Local
```powershell
npm run install-all
npm run deploy
```

O script `deploy` apenas compila e inicia a aplicação localmente; não publica em uma plataforma externa.

### Deploy em Servidor
1. Transfira os arquivos para o servidor
2. Execute `npm run install-all`, `npm run build` e `npm start` na raiz
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

