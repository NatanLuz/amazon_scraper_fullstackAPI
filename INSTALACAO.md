# Guia de Instalação - Amazon Scraper

## Pré-requisitos

### Opção 1: Usando Node.js (Recomendado)

1. **Instale o Node.js**:
   - Acesse o site: https://nodejs.org/
   - Baixe a versão LTS (recomendo fazer isso)
   - Execute o instalador e siga as instruções na ordem.

2. **Verifique sempre a instalação**:
   ```bash
   node --version
   npm --version
   ```

### Opção 2: Utilizando o Bun

1. **Instale o Bun**:
   - Windows: `powershell -c "irm bun.sh/install.ps1|iex"`
   - macOS/Linux: `curl -fsSL https://bun.sh/install | bash`

2. **Verifique a instalação**:
   ```bash
   bun --version
   ```

##  Instalação do Projeto

### Passo 1: Clone ou baixe o projeto

Se você tem o Git instalado(recomendo)(rápido prático):
```bash
git clone <url-do-repositorio>
cd amazon-scraper
```

Ou baixe o ZIP e extraia para uma pasta.

### Passo 2: Instale as dependências

#### Com Node.js:
```bash
# Instalar dependências para o backend
npm install

# Instalar dependências para o frontend
cd client
npm install
cd ..
```

#### Com Bun:
```bash
# Instalar dependências para o backend
bun install

# Instalar dependências para o frontend
cd client
npm install
cd ..
```

### Passo 3: Execute o projeto

#### Desenvolvimento (Recomendado):

**Terminal 1 - Backend:**
```bash
# Utilizando > Node.js
npm run dev

# Utilizando > Bun
bun run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

#### Produção:

```bash
# Construir frontend
npm run build

# Iniciar servidor(backend)
npm start
```

## Acesse a aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000


## Testando a API

Você pode testar a API diretamente:

```bash
# Teste de saúde
curl http://localhost:3000/api/health

# Teste de scraping
curl "http://localhost:3000/api/scrape?keyword=smartphone"
```

## Solução de Problemas

### Erro: "bun/npm não é reconhecido"

**Solução**: Instale o Node.js ou Bun primeiro.

### Erro: "Porta já em uso"

**Solução**: 
- Feche outros aplicativos que possam estar usando a porta 3000 ou 5173
- Ou mude a porta no arquivo `server/index.js` (linha 8)

### Erro: "CORS"

**Solução**: O CORS já está configurado no projeto. Se ainda houver problemas, verifique se ambos os servidores estão rodando.

### Erro: "Falha na conexão com a Amazon"

**Solução**: 
- Verifique sua conexão com a internet
- O projeto retorna dados de exemplo em caso de erro
- A Amazon pode bloquear requisições automatizadas

## Comandos Úteis

```bash
# Verificar versões
node --version
npm --version
bun --version

# Limpar cache (se necessário)
npm cache clean --force

# Para reinstalar as dependências .json 
rm -rf node_modules package-lock.json
npm install

# Verificar portas em uso se falhar pode utilizar outra
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

## Suporte

Se você encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Certifique-se de que as portas 3000 e 5173 estão livres
3. Verifique sua conexão com a internet
4. Consulte o README.md para mais detalhes

