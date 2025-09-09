amazon-scraper/
# Amazon Scraper – Fullstack moderno, robusto e responsivo

## Preview

![Preview 1](https://i.imgur.com/y5aWKLi.png)

![Preview 2](https://i.imgur.com/OXFpdoq.png)

![Preview 3](https://i.imgur.com/ordYqb9.png)

Um projeto fullstack que demonstra, na prática, como desenhar uma experiência moderna de busca de produtos na Amazon Brasil, com um backend profissional e um frontend performático, responsivo e agradável de usar.

O objetivo é unir boas práticas de engenharia (segurança, cache, limites, observabilidade) com uma UI/UX moderna (Tailwind, Dark Mode, animações, filtros, scroll infinito), criando um case que você pode usar como portfólio, base para estudos ou ponto de partida para soluções mais avançadas.

### Por que este projeto é relevante
- Mostra um ciclo completo: API → parsing (JSDOM) → UI moderna → métricas.
- Aplica práticas de backend de produção: rate limiting, cache, logs, Helmet, compressão, health check, métricas e shutdown gracioso.
- Demonstra domínio de UX atual: Tailwind, Dark Mode, cards ricos, filtros, animações e scroll infinito.
- Fácil de entender e estender, com separação clara de responsabilidades.

---

## Arquitetura
- `server/` (Node.js + Express)
  - Endpoints REST: `/api/scrape`, `/api/health`, `/api/metrics`.
  - Scraping com `axios` + `jsdom` e heurísticas de seletores da Amazon.
  - Segurança/performance: `helmet`, `compression`, `morgan`, `express-rate-limit`.
  - Cache em memória com TTL para reduzir latência e consumo.
  - Validação de entrada, tratamento unificado de erros e graceful shutdown.
- `client/` (Vite + Tailwind)
  - Busca com feedback visual (spinner, mensagens amigáveis).
  - Cards de produto com hover, badge de avaliação e link externo.
  - Dark Mode persistente (localStorage), mobile-first, grid responsivo.
  - Filtros (preço min/max, rating min, Prime) e paginação com scroll infinito.
  - Painel de métricas consumindo `/api/metrics` (polling em 5s).

Fluxo simplificado:
1) Usuário busca → frontend chama `/api/scrape?keyword=...`.
2) Backend busca HTML na Amazon, extrai dados com `jsdom`, normaliza e responde.
3) Frontend renderiza em lotes (melhor UX), permite filtrar e observar métricas.

---

## Como rodar
Pré-requisitos: Node 20.19+ ou 22.12+ (recomendado). Em Windows, use nvm-windows.

1) Instalar dependências
```powershell
cd C:\Users\User\Desktop\amazon_scraper_fullstackAPI-master
npm install
npm run install-client
```

2) Desenvolvimento (dois terminais)
- Backend
```powershell
npm start
```
- Frontend
```powershell
cd client
npm run dev
```
Acesse o app: `http://localhost:5173`

3) Produção (servidor servindo o build)
```powershell
cd client
npm run build
cd ..
npm start
```
Acesse: `http://localhost:3000`

4) Variáveis de ambiente (opcional – crie um `.env` na raiz)
```
PORT=3000
REQUEST_TIMEOUT_MS=12000
CACHE_TTL_MS=60000
RATE_LIMIT_MAX=15
```

---

## Endpoints
- `GET /api/health` – health check básico.
- `GET /api/metrics` – métricas em memória (totalRequests, scrapeRequests, cacheHits, rateLimited, uso de memória, uptime).
- `GET /api/scrape?keyword=teclado` – retorna produtos com `{ id, title, price, rating, reviews, imageUrl, productUrl }` e `total`.

Exemplo de resposta (resumo):
```json
{
  "success": true,
  "keyword": "teclado",
  "products": [ { "id": 1, "title": "...", "price": "R$ 199,90", ... } ],
  "total": 24,
  "timestamp": "2024-..."
}
```

---

## Principais melhorias implementadas
- Frontend (UI/UX)
  - Tailwind CSS com design moderno, gradientes e glassmorphism.
  - Dark Mode com toggle e persistência via localStorage.
  - Cards de produto com animações, badge de rating e botão “Ver na Amazon”.
  - Loading com spinner suave, mensagens de erro amigáveis, scroll automático.
  - Filtros: preço min/max (BRL), rating mínimo, “Prime apenas”.
  - Paginação com scroll infinito e renderização em lotes (melhor UX e performance).
  - Painel de métricas ao vivo (polling de `/api/metrics`).
- Backend (robustez)
  - Helmet, compression, morgan (logs), CORS, rate limiting configurável.
  - Cache em memória com TTL e contagem de `cacheHits`.
  - Validação de inputs e mensagens de erro mais claras.
  - Endpoint `/api/metrics` para observabilidade.
  - Graceful shutdown e handler central de erros.

---

## Notas técnicas e decisões
- Parsing com `jsdom`: mais previsível do que regex para DOM dinâmico; seletores podem mudar conforme a Amazon altera o HTML.
- Cache em memória: simples e eficaz para reduzir chamadas repetidas; para produção, prefira Redis.
- Rate limiting: protege contra abuso e erros humanos; valores ajustáveis via `.env`.
- Tailwind: permite evoluir a UI rapidamente com consistência.
- Infinite scroll: melhora percepção de desempenho; ainda assim, ofereça paginação tradicional se o SEO for requisito.

---

## Limitações e responsabilidade
- Scraping pode violar termos de uso; utilize apenas para fins educacionais, testes controlados ou com autorização.
- A estrutura da Amazon pode mudar; seletores precisarão de manutenção.
- Este projeto não contorna mecanismos anti-bot – não é um crawler de alta escala.

---

## Roadmap sugerido
- Ordenação (preço, rating) e mais filtros (frete, categoria).
- Favoritos e comparação de produtos (localStorage ou backend).
- Persistência/Cache externo (Redis) e filas (BullMQ) para escala.
- Autenticação (painel privado de métricas).
- PWA e testes E2E (Playwright).

---

## Tecnologias
- Backend: Node.js, Express, Axios, JSDOM, Helmet, Compression, Morgan, Rate Limit.
- Frontend: Vite, Tailwind CSS, Font Awesome, Google Fonts (Inter).
- Testes (frontend): Vitest + jsdom.

---

## Licença
MIT – utilize livremente com atribuição. Respeite as políticas de uso da Amazon.
