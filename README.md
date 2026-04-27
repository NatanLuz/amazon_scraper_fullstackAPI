## Amazon Product Scraper Inteligente 

Ache produtos mais baratos, com boas avaliações, e tudo isso filtrado !

Aplicação para coleta, filtragem e visualização de produtos da Amazon Brasil, desenvolvida com foco em scraping estruturado, performance, observabilidade e experiência do usuário.

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat\&logo=node.js\&logoColor=white)]()
[![Express](https://img.shields.io/badge/Express-000000?style=flat\&logo=express\&logoColor=white)]()
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat)]()
[![JSDOM](https://img.shields.io/badge/JSDOM-000000?style=flat)]()
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat\&logo=vite\&logoColor=white)]()
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat\&logo=tailwind-css\&logoColor=white)]()

---

## 🎯 Proposta de Valor

Automatizar a descoberta de produtos com melhor custo-benefício na Amazon, centralizando coleta, filtragem e análise em uma única aplicação performática e observável.

**Benefícios principais:**

* Coleta automatizada de produtos via scraping
* Filtros inteligentes por avaliação, preço e Prime
* Redução de esforço manual na comparação de produtos
* Interface rápida e responsiva com feedback em tempo real
* API monitorável com métricas de uso e saúde

---

## ⚙️ Funcionalidades

### Scraping e Dados

* Coleta de produtos via requisições HTTP (Axios)
* Parsing de HTML com JSDOM
* Normalização e estruturação de dados
* Retorno padronizado via API REST (JSON)

### Filtros Inteligentes

* Avaliação mínima (rating)
* Faixa de preço (mínimo e máximo)
* Filtro de produtos Prime

### Experiência do Usuário

* Interface responsiva (mobile-first)
* Scroll infinito para carregamento progressivo
* Feedback visual de carregamento e erros
* Modo escuro com persistência

### Observabilidade

* Métricas de requisição e scraping
* Monitoramento de cache (cache hits)
* Uptime da aplicação
* Uso de memória
* Rate limiting monitorado

---

## 🏗️ Arquitetura / Estrutura

Arquitetura baseada em separação clara entre frontend e API:

```text
Frontend (Vite + Tailwind)
        │
        ▼
API (Node.js + Express)
        │
        ▼
HTTP Client (Axios)
        │
        ▼
Parsing DOM (JSDOM)
        │
        ▼
Normalização e retorno JSON
```

### Backend (`server/`)

* API REST (`/api/scrape`, `/api/health`, `/api/metrics`)
* Scraping com Axios + JSDOM
* Cache em memória com TTL
* Middlewares de segurança e performance:

  * `helmet`
  * `compression`
  * `morgan`
  * `express-rate-limit`
* Tratamento centralizado de erros

### Frontend (`client/`)

* Interface com Vite + Tailwind CSS
* Consumo da API via fetch
* Grid responsivo de produtos
* Filtros dinâmicos
* Painel de métricas em tempo real

---

## 🔐 Segurança

* Rate limiting para mitigação de abuso
* Headers de segurança via `helmet`
* Validação de entrada de parâmetros
* Cache para reduzir volume de requisições externas
* Tratamento de erros e respostas padronizadas

> Observação: o projeto depende de scraping de terceiros, podendo sofrer alterações caso a estrutura da Amazon seja modificada.

---

## 🧰 Stack Tecnológica

### Backend

* Node.js
* Express
* Axios
* JSDOM
* Helmet
* Morgan
* Compression
* Express Rate Limit

### Frontend

* Vite
* Tailwind CSS
* JavaScript (Vanilla)

### Testes

* Vitest
* JSDOM

---

## 🚀 Instalação

### Pré-requisitos

* Node.js 20+

### Passos

```bash
git clone https://github.com/seu-usuario/amazon-scraper.git
cd amazon-scraper

npm install
npm run install-client
```

### Execução (desenvolvimento)

**Backend:**

```bash
npm start
```

**Frontend:**

```bash
cd client
npm run dev
```

Acesse:

* Frontend: http://localhost:5173
* API: http://localhost:3000

---

## 🧪 Testes Rápidos

**Checklist funcional:**

1. Realizar busca por palavra-chave
2. Validar retorno de produtos via API
3. Aplicar filtros (preço, rating, Prime)
4. Verificar funcionamento do scroll infinito
5. Validar métricas em `/api/metrics`
6. Testar cache (repetir requisições)

---

## 📡 Endpoints Principais

### Health Check

```
GET /api/health
```

### Métricas

```
GET /api/metrics
```

### Scraping

```
GET /api/scrape?keyword=notebook
```

---

## 📸 Screenshots

![Preview 1](https://i.imgur.com/y5aWKLi.png)
![Preview 2](https://i.imgur.com/OXFpdoq.png)
![Preview 3](https://i.imgur.com/ordYqb9.png)

---

## 👤 Autor

**Natan Da Luz**
Desenvolvedor de Software
