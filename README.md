## Amazon Product Scraper Inteligente
API Full Stack para Coleta e Filtragem de Produtos por Avaliação e Preço

---

## 📖 Sobre o Projeto

Este projeto é uma aplicação Full Stack baseada em Web Scraping, desenvolvida para coletar, organizar e apresentar dados de produtos da Amazon Brasil de forma inteligente.

A motivação é prática e pessoal: surgiu da dificuldade recorrente dentro da minha família para encontrar produtos com **boa avaliação**, **preço acessível** e **bom custo‑benefício**, sem precisar abrir dezenas de abas manualmente.

Para resolver esse problema, foi criada uma **API scraper** que:

- ✔ Coleta dados diretamente da Amazon a partir de uma palavra‑chave
- ✔ Estrutura as informações dos produtos em um formato consistente
- ✔ Permite filtrar produtos melhor avaliados e por faixa de preço
- ✔ Facilita encontrar opções com melhor custo‑benefício
- ✔ Entrega tudo isso em uma interface **moderna, responsiva e rápida**

Além da utilidade real, o projeto foi construído para consolidar conhecimentos em:

- Web Scraping estruturado
- Arquitetura de APIs REST
- Boas práticas de segurança e performance
- Observabilidade e monitoramento
- UX moderna em aplicações web

---

## 🎯 Objetivos Técnicos

- Construir um **scraper robusto, organizado e de fácil manutenção**
- Demonstrar **boas práticas** no desenvolvimento de APIs Node.js com Express
- Implementar **parsing confiável de HTML** usando JSDOM
- Aplicar **técnicas de performance e cache em memória**
- Criar uma **interface reativa** que consome dados de scraping em tempo quase real
- Expor **métricas de uso e saúde** da API para facilitar monitoramento

---

## 🧩 Funcionalidades

### 🔎 Scraping de Produtos

- Coleta resultados da Amazon via requisição HTTP (Axios)
- Parsing do HTML usando **JSDOM** com seletores bem definidos
- Normalização e limpeza dos dados coletados
- Retorno estruturado via **API REST** em JSON

### ⭐ Filtros Inteligentes

- Filtro por **avaliação mínima** do produto (rating)
- Filtro por **faixa de preço** (mínimo e máximo)
- Filtro para **produtos Prime**

### ⚡ Experiência do Usuário

- Scroll infinito para carregar mais produtos
- Interface **responsiva** (mobile‑first)
- Feedback visual de carregamento e erros
- **Modo escuro** com preferência persistida

### 📊 Monitoramento da API

- Total de requisições recebidas
- Quantidade de requisições de scraping
- Uso de cache (cache hits)
- Rate limiting em ação
- Consumo de memória
- Tempo de atividade do servidor (uptime)

---

## 🏗️ Arquitetura

```text
Frontend (Vite + Tailwind)
        │
        ▼
API Scraper (Node.js + Express)
        │
        ▼
Requisição HTTP (Axios)
        │
        ▼
Parsing DOM (JSDOM)
        │
        ▼
Estruturação e Retorno dos Dados
```

- **server/** – API em Node.js + Express
  - Endpoints REST: `/api/scrape`, `/api/health`, `/api/metrics`
  - Scraping com `axios` + `jsdom` e seletores resilientes
  - Segurança e performance: `helmet`, `compression`, `morgan`, `express-rate-limit`
  - **Cache em memória** com TTL para reduzir latência e chamadas repetidas
  - Tratamento centralizado de erros e respostas padronizadas

- **client/** – Frontend em Vite + Tailwind CSS
  - Busca com campo de pesquisa e feedback visual
  - Cartões de produto com título, preço, rating, reviews e link para a Amazon
  - Grid responsivo, animações suaves e modo escuro persistente
  - Filtros de avaliação, preço e Prime
  - Scroll infinito para carregamento progressivo
  - Painel de métricas consumindo `/api/metrics` em intervalo regular

Fluxo resumido:

1. O usuário digita um termo de busca no frontend
2. O frontend chama `GET /api/scrape?keyword=...`
3. O backend faz a requisição para a Amazon, interpreta o HTML com JSDOM
4. Os dados de produto são normalizados e retornados em JSON
5. O frontend renderiza em lotes, aplica filtros e atualiza métricas

---

## 🚀 Execução do Projeto

### 🔧 Pré‑requisitos

- Node.js **20+**

### 📦 Instalação

```bash
npm install
npm run install-client
```

### 💻 Ambiente de Desenvolvimento

**Backend:**

```bash
npm start
```

**Frontend:**

```bash
cd client
npm run dev
```

Acesse o frontend em: `http://localhost:5173`

### 🌐 Build e Execução (produção simples)

```bash
cd client
npm run build
cd ..
npm start
```

API disponível em: `http://localhost:3000`

### ⚙️ Variáveis de Ambiente (opcional)

Crie um arquivo `.env` na raiz do projeto, por exemplo:

```env
PORT=3000
REQUEST_TIMEOUT_MS=12000
CACHE_TTL_MS=60000
RATE_LIMIT_MAX=15
```

---

## 📡 Endpoints Principais

### Health Check

- `GET /api/health` → Verifica se a API está saudável e respondendo.

### Métricas

- `GET /api/metrics` → Retorna métricas em memória, como:
  - `totalRequests`, `scrapeRequests`, `cacheHits`, `rateLimited`
  - uso de memória, uptime e outras informações de monitoramento

### Scraping de Produtos

- `GET /api/scrape?keyword=notebook`

Resposta (exemplo simplificado):

```json
{
  "success": true,
  "keyword": "notebook",
  "products": [
    {
      "id": 1,
      "title": "Notebook ...",
      "price": "R$ 2.499,90",
      "rating": 4.7,
      "reviews": 132,
      "imageUrl": "https://...",
      "productUrl": "https://www.amazon.com.br/..."
    }
  ],
  "total": 24,
  "timestamp": "2025-..."
}
```

---

## 🧰 Tecnologias Utilizadas

### Backend

- Node.js
- Express
- Axios
- JSDOM
- Helmet
- Morgan
- Compression
- Express Rate Limit

### Frontend

- Vite
- Tailwind CSS
- HTML5, CSS3, JavaScript
- Ícones e fontes modernas

### Testes

- Vitest
- JSDOM (ambiente de teste para DOM)

---

## 💼 Competências Demonstradas

- Desenvolvimento de **scrapers estruturados** com JSDOM
- Construção de **APIs REST** escaláveis com Node.js + Express
- **Parsing avançado de HTML** e tratamento de seletores frágeis
- **Otimização de performance** com cache em memória e compressão
- Implementação de **segurança básica** (rate limiting, Helmet, validação)
- **Monitoramento e observabilidade** via endpoint de métricas
- Desenvolvimento **Full Stack** (frontend moderno + backend robusto)
- UX com foco em **experiência real de busca de produtos**

---

## ⚠️ Aviso Importante

Este projeto foi desenvolvido para **fins educacionais** e demonstração técnica.

- Mudanças no HTML da Amazon podem exigir manutenção nos seletores de scraping
- O sistema **não foi projetado** para automação em larga escala
- O uso de scraping pode estar sujeito a termos de uso da plataforma; utilize com responsabilidade

---

## 📸 Preview

![Preview 1](https://i.imgur.com/y5aWKLi.png)

![Preview 2](https://i.imgur.com/OXFpdoq.png)

![Preview 3](https://i.imgur.com/ordYqb9.png)

---

## 📜 Licença

Projeto de uso livre para fins educacionais e portfólio. Respeite sempre as políticas e termos de uso da Amazon.
