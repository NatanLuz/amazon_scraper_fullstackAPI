# Amazon Product Scraper Inteligente

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat\&logo=node.js\&logoColor=white)]()
[![Express](https://img.shields.io/badge/Express-000000?style=flat\&logo=express\&logoColor=white)]()
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat)]()
[![JSDOM](https://img.shields.io/badge/JSDOM-000000?style=flat)]()
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat\&logo=vite\&logoColor=white)]()
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat\&logo=tailwind-css\&logoColor=white)]()

## 📖 Sobre o projeto

O **Amazon Product Scraper Inteligente** é uma aplicação full stack desenvolvida em Node.js para coletar, tratar e exibir produtos da Amazon Brasil. A solução combina scraping estruturado, uma API REST e uma interface web responsiva para centralizar a pesquisa e a filtragem de produtos.

O projeto demonstra técnicas de Web Scraping, consumo e processamento de HTML, normalização de dados, desenvolvimento de APIs REST, observabilidade, cache, segurança e construção de interfaces modernas.

## Arquitetura da Aplicação

```text
Frontend (Vite + Tailwind CSS)
            ↓
API REST (Node.js + Express)
            ↓
Axios
            ↓
JSDOM
            ↓
Processamento e normalização dos dados
            ↓
Resposta JSON
```

O frontend consome a API e apresenta os produtos em uma grade responsiva. No backend, o Axios realiza as requisições HTTP, o JSDOM interpreta o conteúdo HTML e os dados coletados são normalizados antes do retorno em JSON.

> O projeto depende da estrutura HTML de um serviço externo. Alterações realizadas pela Amazon podem exigir adaptações no processo de scraping.

## ✨ Funcionalidades

## Scraping e dados

- Coleta automatizada de produtos da Amazon Brasil;
- pesquisa por palavra-chave;
- requisições HTTP realizadas com Axios;
- parsing do HTML com JSDOM;
- normalização e estruturação dos dados;
- disponibilização dos resultados por uma API REST em JSON.

## Filtros

- Avaliação mínima;
- faixa de preço mínimo e máximo;
- exibição exclusiva de produtos Prime.

## Interface

- Layout responsivo e mobile-first;
- grid de produtos;
- scroll infinito para carregamento progressivo;
- feedback visual durante carregamentos e erros;
- modo escuro com persistência;
- consumo da API por `fetch`;
- painel de métricas em tempo real.

## Observabilidade, desempenho e segurança

- Cache em memória com TTL;
- endpoint de Health Check;
- endpoint de métricas;
- monitoramento de requisições e scraping;
- monitoramento de uptime, memória, cache hits e rate limiting;
- limitação de requisições para mitigação de abuso;
- cabeçalhos de segurança;
- compressão das respostas;
- registro de requisições;
- validação dos parâmetros de entrada;
- tratamento centralizado de erros e respostas padronizadas.

## Endpoints

```http
GET /api/health
GET /api/metrics
GET /api/scrape?keyword=produto
```

O parâmetro `keyword` define o termo utilizado na pesquisa dos produtos.

## 🖼️ Screenshots

## Interface principal

![Interface principal do Amazon Product Scraper](https://i.imgur.com/y5aWKLi.png)

## Resultados e filtros

![Resultados e filtros da aplicação](https://i.imgur.com/OXFpdoq.png)

## Visualização adicional

![Visualização adicional da aplicação](https://i.imgur.com/ordYqb9.png)

## 🚀 Tecnologias

## Backend

- Node.js;
- Express;
- Axios;
- JSDOM;
- Helmet;
- Morgan;
- Compression;
- Express Rate Limit.

## Frontend

- Vite;
- Tailwind CSS;
- JavaScript.

## Testes

- Vitest;
- JSDOM.

## ⚙️ Como executar

## Pré-requisitos

- Git;
- Node.js 20+;
- npm.

## Clonar o repositório

```bash
git clone https://github.com/seu-usuario/amazon-scraper.git
cd amazon-scraper
```

## Instalar as dependências

Instale as dependências do backend e, em seguida, as dependências do frontend:

```bash
npm install
npm run install-client
```

## Executar o backend

Na raiz do projeto, execute:

```bash
npm start
```

A API ficará disponível em:

```text
http://localhost:3000
```

## Executar o frontend

Em outro terminal, execute:

```bash
cd client
npm run dev
```

A interface ficará disponível em:

```text
http://localhost:5173
```

## Verificação funcional

Após iniciar os dois serviços:

1. Realize uma busca por palavra-chave;
2. valide o retorno dos produtos pela API;
3. aplique os filtros de preço, avaliação e Prime;
4. verifique o funcionamento do scroll infinito;
5. consulte as métricas em `/api/metrics`;
6. repita uma requisição para verificar o funcionamento do cache.

## 📂 Estrutura do projeto

A aplicação separa o backend, o frontend e os testes automatizados:

```text
amazon-product-scraper/
├── server/
├── client/
├── tests/
├── package.json
├── README.md
└── ...
```

- `server/`: API REST, scraping, cache, observabilidade e middlewares;
- `client/`: interface web desenvolvida com Vite e Tailwind CSS;
- `tests/`: testes automatizados executados com Vitest;
- `package.json`: dependências e scripts do projeto;
- `README.md`: documentação técnica.

## 👤 Autor

**Natan Da Luz**

- LinkedIn: [linkedin.com/in/natandaluz](https://www.linkedin.com/in/natandaluz/)
- Portfólio: [portfolionatan.vercel.app](https://portfolionatan.vercel.app/)
- E-mail: [natandaluz01@gmail.com](mailto:natandaluz01@gmail.com)

## 📄 Licença

Este projeto está sem uma licença definida no momento.
