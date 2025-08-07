# Amazon Product Scraper

Um Aplicativo Web Completo para extrair listagens de produtos da Amazon usando Bun (backend) e Vite (frontend).

## Funcionalidades

- **Backend em Bun**: API REST com Express para scraping da Amazon
- **Frontend em Vite**: Interface moderna e responsiva
- **Extração de dados**: Título, classificação, avaliações, imagem e preço
- **Interface amigável**: Design moderno com estados de loading, erro e sucesso
- **Responsivo**: Funciona em desktop e mobile
- **Tratamento de erros**: Feedback claro para o usuário

##  Pré-requisitos

- [Bun](https://bun.sh/) instalado (versão 1.0 ou superior)
- [Node.js](https://nodejs.org/) instalado (versão 16 ou superior)
- Navegador web moderno

## Instalação

1. **Clone o repositório** (se aplicável):
```bash
git clone <url-do-repositorio>
cd amazon-scraper
```

2. **Instale as dependências do backend**:
```bash
bun install
```

3. **Instale as dependências do frontend**:
```bash
cd client
npm install
cd ..
```

4. **Ou use o comando de instalação completa**:
```bash
npm run install-all
```

##  Como executar

### Desenvolvimento (Recomendado)

1. **Inicie o servidor backend**:
```bash
npm run dev
```

2. **Em outro terminal, inicie o frontend**:
```bash
cd client
npm run dev
```

3. **Acesse a aplicação**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Produção

1. **Construa o frontend**:
```bash
npm run build
```

2. **Inicie o servidor**:
```bash
npm start
```

3. **Acesse**: http://localhost:3000

## 📁 Estrutura do Projeto

```
amazon-scraper/
├── server/
│   └── index.js          # Servidor Express com API de scraping
├── client/
│   ├── index.html        # Página principal
│   ├── style.css         # Estilos CSS
│   ├── main.js           # Lógica JavaScript do frontend
│   ├── package.json      # Dependências do frontend
│   └── vite.config.js    # Configuração do Vite
├── public/               # Arquivos estáticos
├── package.json          # Dependências do backend
└── README.md            # Arquivo que explica o projeto
```

##  API Endpoints

### GET `/api/scrape`
Extrai produtos da Amazon baseado em uma palavra-chave.

**Parâmetros:**
- `keyword` (string, obrigatório): Palavra-chave para busca

**Exemplo:**
```bash
curl "http://localhost:3000/api/scrape?keyword=smartphone"
```

**Resposta:**
```json
{
  "success": true,
  "keyword": "smartphone",
  "products": [
    {
      "id": 1,
      "title": "Smartphone XYZ",
      "rating": "4.5 estrelas",
      "reviews": "1,234",
      "imageUrl": "https://...",
      "productUrl": "https://amazon.com.br/...",
      "price": "R$ 999,99"
    }
  ],
  "total": 1,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET `/api/health`
Verifica o status do servidor.

**Resposta:**
```json
{
  "success": true,
  "message": "Servidor funcionando normalmente",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

##  Interface do Usuário

### Funcionalidades da Interface

- **Campo de busca**: Digite a palavra-chave do produto
- **Botão de busca**: Inicia o processo de scraping
- **Estados visuais**:
  - Loading: Animação de carregamento
  - Erro: Mensagem de erro com botão de retry
  - Resultados: Grid de produtos encontrados
  - Vazio: Mensagem quando nenhum produto é encontrado

### Características do Design

- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Moderno**: Design com gradientes e efeitos de vidro
- **Acessível**: Contraste adequado e navegação por teclado
- **Animado**: Transições suaves e feedback visual

##  Como Funciona

### Backend (Bun + Express)

1. **Recebe requisição** com palavra-chave
2. **Faz requisição HTTP** para a Amazon Brasil
3. **Parseia o HTML** usando JSDOM
4. **Extrai dados** dos produtos (título, rating, etc.)
5. **Retorna JSON** com os produtos encontrados

### Frontend (Vite + JavaScript)

1. **Interface de busca** para o usuário
2. **Faz requisição AJAX** para o backend
3. **Mostra estados** (loading, erro, sucesso)
4. **Renderiza produtos** em cards responsivos
5. **Permite navegação** para páginas dos produtos

##  Considerações Importantes

### Limitações do Scraping

- **Rate Limiting**: A Amazon pode limitar requisições excessivas
- **Mudanças na estrutura**: Seletores CSS podem precisar de atualização
- **Captcha**: Pode aparecer para requisições automatizadas
- **Termos de Serviço**: Respeite os termos da Amazon

### Tratamento de Erros

- **Conexão**: Retorna dados de exemplo se não conseguir conectar
- **Timeout**: 10 segundos para requisições
- **Validação**: Verifica se a palavra-chave foi fornecida
- **Feedback**: Mensagens claras de erro para o usuário

##  Segurança

- **CORS**: Configurado para permitir requisições do frontend
- **Validação**: Verifica parâmetros de entrada
- **Headers**: Simula navegador real para evitar bloqueios
- **Timeout**: Evita requisições que demoram muito

##  Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor em modo watch
npm start                # Inicia servidor em produção

# Frontend
npm run install-client   # Instala dependências para o frontend
npm run build            # faz a construção do frontend para produção

# Instalação
npm run install-server   # Instala dependências para e o backend
npm run install-all      # Instala todas as dependências
```

##  Configuração

### Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)

### Personalização

- **Seletores CSS**: Edite `server/index.js` para ajustar extração
- **Estilos**: Modifique `client/style.css` para personalizar aparência
- **Comportamento**: Ajuste `client/main.js` para mudar lógica do frontend

##  Logs

O servidor exibe logs úteis:
- Requisições recebidas
- URLs sendo acessadas
- Número de produtos encontrados
- Erros de conexão ou parsing


## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## Tecnologias Utilizadas

- **Backend**: Bun, Express, Axios, JSDOM
- **Frontend**: Vite, HTML5, CSS3, JavaScript ES6+
- **Design**: CSS Grid, Flexbox, Gradientes, Animações
- **Ícones**: Font Awesome
- **Fontes**: Google Fonts usada a Inter
