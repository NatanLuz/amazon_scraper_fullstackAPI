const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 12000;
const CACHE_TTL_MS_ENV = Number(process.env.CACHE_TTL_MS) || 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX) || 15;
const CACHE_MAX_ENTRIES = 100;
const KEYWORD_MAX_LENGTH = 80;
const isDevelopment = process.env.NODE_ENV === 'development';

// Helmet cuida de uns headers de segurança padrão pra gente não ter que fazer na mão
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://*.media-amazon.com', 'https://m.media-amazon.com', 'https://via.placeholder.com'],
      connectSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"]
    }
  }
}));

// Colocando limite de 100kb no body pra evitar payload gigante
app.use(express.json({ limit: '100kb' }));

// Log de cada requisição no console, ajuda a debugar em dev
morgan.token('path', (req) => req.path);
app.use(morgan(':method :path :status :response-time ms'));

// Comprime as respostas antes de mandar pro cliente
app.use(compression());

// Libera CORS pro front local (vite roda na 5173) e no fim libera geral mesmo,
// porque isso aqui é só uma demo
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // fallback permissivo para demo
  },
  methods: ['GET'],
}));

// Cache bem simples em memória, some quando reiniciar o servidor
const scrapeCache = new Map(); // chave -> { data, expiresAt }
const CACHE_TTL_MS = CACHE_TTL_MS_ENV; // dá pra configurar via env

// Contadores simples só pra acompanhar como o serviço tá se comportando
const metrics = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  scrapeRequests: 0,
  cacheHits: 0,
  rateLimited: 0
};

// Conta toda requisição que chega, não importa a rota
app.use((req, res, next) => {
  metrics.totalRequests += 1;
  next();
});

function getCache(key) {
  cleanupExpiredCache();
  const entry = scrapeCache.get(key);
  if (!entry) return null;
  // já expirou, joga fora e finge que não tinha nada
  if (Date.now() > entry.expiresAt) {
    scrapeCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs = CACHE_TTL_MS) {
  cleanupExpiredCache();
  scrapeCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  while (scrapeCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = scrapeCache.keys().next().value;
    scrapeCache.delete(oldestKey);
  }
}

function cleanupExpiredCache(now = Date.now()) {
  for (const [key, entry] of scrapeCache.entries()) {
    if (now > entry.expiresAt) {
      scrapeCache.delete(key);
    }
  }
}

function validateKeyword(query) {
  if (!Object.prototype.hasOwnProperty.call(query, 'keyword')) {
    return { error: 'Palavra-chave obrigat\u00f3ria' };
  }

  const { keyword } = query;
  if (typeof keyword !== 'string') {
    return { error: 'Informe uma \u00fanica palavra-chave v\u00e1lida' };
  }

  const sanitized = keyword.trim();
  if (!sanitized) {
    return { error: 'Palavra-chave obrigat\u00f3ria' };
  }

  if (sanitized.length < 2) {
    return { error: 'Use ao menos 2 caracteres' };
  }

  if (sanitized.length > KEYWORD_MAX_LENGTH) {
    return { error: `Use no m\u00e1ximo ${KEYWORD_MAX_LENGTH} caracteres` };
  }

  if (/[\u0000-\u001F\u007F]/.test(sanitized)) {
    return { error: 'Palavra-chave inv\u00e1lida' };
  }

  return { value: sanitized };
}

function publicScrapeError(status, error) {
  if (status === 403) {
    return 'A Amazon recusou a requisição. Tente novamente mais tarde.';
  }
  if (status === 429) {
    return 'Muitas requisi\u00e7\u00f5es \u00e0 Amazon. Tente novamente em alguns minutos.';
  }
  return 'N\u00e3o foi poss\u00edvel concluir a busca agora. Tente novamente em instantes.';
}

// Limita quantas buscas cada IP pode fazer por minuto, pra não tomar bloqueio da Amazon
function createScraperError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeRating(ratingText) {
  if (!ratingText) return 'Sem classifica\u00e7\u00e3o';
  const ratingMatch = String(ratingText).match(/(\d+(?:[.,]\d+)?)/);
  if (!ratingMatch) return 'Sem classifica\u00e7\u00e3o';
  const value = Number.parseFloat(ratingMatch[1].replace(',', '.'));
  return Number.isFinite(value) ? `${value} estrelas` : 'Sem classifica\u00e7\u00e3o';
}

function normalizeReviews(reviewsText) {
  if (!reviewsText) return 'Sem avalia\u00e7\u00f5es';
  const text = String(reviewsText).trim().replace(/\s+/g, ' ');
  const compactMatch = text.match(/^(\d+(?:[.,]\d+)?)\s*(mil|k)$/i);
  if (compactMatch) {
    const value = Number.parseFloat(compactMatch[1].replace(',', '.')) * 1000;
    return Number.isFinite(value) ? String(Math.round(value)) : 'Sem avalia\u00e7\u00f5es';
  }
  if (/^\d{1,3}(?:\.\d{3})+$/.test(text)) return text.replace(/\./g, '');
  if (/^\d{1,3}(?:,\d{3})+$/.test(text)) return text.replace(/,/g, '');
  if (/^\d+$/.test(text)) return text;
  return 'Sem avalia\u00e7\u00f5es';
}

function normalizeProductUrl(href) {
  if (!href || typeof href !== 'string') return '';
  try {
    const url = new URL(href, 'https://www.amazon.com.br');
    if (!['http:', 'https:'].includes(url.protocol) || !url.pathname.includes('/dp/')) return '';
    return url.href;
  } catch {
    return '';
  }
}

const scrapeLimiter = rateLimit({
  windowMs: 60 * 1000, // janela de 1 minuto
  max: RATE_LIMIT_MAX, // quantidade de requisições permitida nessa janela
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /*, next*/) => {
    metrics.rateLimited += 1;
    res.status(429).json({
      success: false,
      error: 'Muitas requisições. Por favor, tente novamente em instantes.',
      status: 429
    });
  }
});

// Serve os arquivos estáticos do build do front (pasta public)

app.use(express.static(path.join(__dirname, '../public')));

/**
 * Vasculha o HTML da página de busca da Amazon e monta a lista de produtos.
 * Os seletores foram pegos olhando o HTML atual do site, então se a Amazon
 * mudar o layout isso aqui provavelmente quebra e precisa ser ajustado.
 * @param {string} html - HTML da página de resultados
 * @returns {Array} lista de produtos encontrados
 */
function extractProductsFromHTML(html) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => {
    if (isDevelopment) console.error('JSDOM:', error.message);
  });
  const dom = new JSDOM(html, { virtualConsole });
  const document = dom.window.document;
  const products = [];

  // cada card de produto no resultado da busca
  const productContainers = document.querySelectorAll('[data-component-type="s-search-result"]');

  productContainers.forEach((container, index) => {
    try {
      // título do produto - tenta alguns seletores porque a Amazon varia o markup
      const titleElement = container.querySelector('h2 a span') ||
                          container.querySelector('h2 a') ||
                          container.querySelector('h2');
      const title = titleElement ? titleElement.textContent.trim() : 'Título não encontrado';

      // nota do produto (as estrelinhas)
      const ratingElement = container.querySelector('.a-icon-alt') ||
                           container.querySelector('[aria-label*="estrela"]') ||
                           container.querySelector('.a-icon-star-small');
      let rating = 'Sem classificação';
      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label');
        rating = normalizeRating(ratingText);
      }

      // quantidade de avaliações
      const reviewsElement = container.querySelector('a[href*="customerReviews"]') ||
                            container.querySelector('.a-size-base.s-underline-text');
      let reviews = 'Sem avaliações';
      if (reviewsElement) {
        const reviewsText = reviewsElement.textContent.trim();
        reviews = normalizeReviews(reviewsText);
      }

      // imagem do produto
      const imageElement = container.querySelector('img.s-image') ||
                          container.querySelector('.a-image-container img');
      let imageUrl = '';
      if (imageElement) {
        imageUrl = imageElement.src || imageElement.getAttribute('data-src');
        // às vezes vem sem o protocolo (//...), aí completa com https
        if (imageUrl && imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
      }

      // link pra página do produto
      const productLinkElement = container.querySelector('h2 a') ||
                                container.querySelector('.a-link-normal[href*="/dp/"]');
      const productUrl = productLinkElement ? normalizeProductUrl(productLinkElement.getAttribute('href')) : '';

      // preço - normalmente vem prontinho no span "a-offscreen", mas às vezes
      // só dá pra montar juntando a parte inteira com a fração
      const priceElementOffscreen = container.querySelector('.a-price .a-offscreen') ||
                                   container.querySelector('.a-price-current .a-offscreen');
      let price = 'Preço não disponível';
      if (priceElementOffscreen) {
        price = priceElementOffscreen.textContent.trim();
      } else {
        const wholePartEl = container.querySelector('.a-price-whole');
        const fractionPartEl = container.querySelector('.a-price-fraction');
        const wholeRaw = wholePartEl ? wholePartEl.textContent.trim() : '';
        const fractionRaw = fractionPartEl ? fractionPartEl.textContent.trim() : '';
        if (wholeRaw) {
          const digitsWhole = (wholeRaw || '').replace(/\D/g, '');
          const digitsFraction = (fractionRaw || '').replace(/\D/g, '');
          const fraction = digitsFraction.length > 0 ? digitsFraction.padEnd(2, '0').slice(0, 2) : '00';
          const numeric = Number.parseInt(digitsWhole || '0', 10) + Number.parseInt(fraction || '0', 10) / 100;
          if (!Number.isNaN(numeric) && numeric > 0) {
            price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric);
          } else {
            price = `${wholeRaw}${fractionRaw ? ',' + fractionRaw : ''}`;
          }
        }
      }

      // só entra na lista se tiver pelo menos título ou imagem, senão é lixo
      if (title !== 'Título não encontrado' || imageUrl) {
        products.push({
          id: index + 1,
          title,
          rating,
          reviews,
          imageUrl,
          productUrl,
          price
        });
      }
    } catch (error) {
      // um produto quebrado não pode derrubar os outros, então só loga e segue
      console.error(`Erro ao processar produto ${index + 1}:`, error.message);
    }
  });

  return products;
}

function validateScrapeDocument(html, products) {
  if (!html || typeof html !== 'string') {
    throw createScraperError('Resposta vazia da Amazon');
  }
  const lowerHtml = html.toLowerCase();
  const blocked = ['captcha', 'robot check', 'access denied', 'automated access'].some((marker) => lowerHtml.includes(marker));
  if (blocked || products.length === 0) {
    throw createScraperError('Resposta incompatível da Amazon');
  }
}

/**
 * Faz a busca na Amazon pra uma palavra-chave e devolve os produtos encontrados.
 * @param {string} keyword - o que o usuário quer pesquisar
 * @returns {Promise<Array>} produtos encontrados
 */
async function scrapeAmazonProducts(keyword) {
  try {
    // finge ser um navegador de verdade pra Amazon não bloquear de cara
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(keyword)}`;

    console.log(`Buscando produtos na Amazon (${keyword.length} caracteres)`);

    // validateStatus sempre true porque a gente mesmo trata o status abaixo
    const response = await axios.get(searchUrl, { headers, timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true });

    if (response.status !== 200) {
      throw createScraperError(`HTTP ${response.status}`, response.status);
    }

    const products = extractProductsFromHTML(response.data);
    validateScrapeDocument(response.data, products);

    console.log(`Encontrados ${products.length} produtos`);
    return products;

  } catch (error) {
    console.error('Erro ao fazer scraping da Amazon:', error.message);
    if (isDevelopment && error.stack) {
      console.error(error.stack);
    }

    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 502;
    throw createScraperError('Falha ao buscar dados na Amazon', statusCode);
  }
}

// Rota principal: recebe a palavra-chave e devolve os produtos raspados da Amazon
app.get('/api/scrape', scrapeLimiter, async (req, res) => {
  try {
    const keywordResult = validateKeyword(req.query);
    if (keywordResult.error) {
      return res.status(400).json({
        success: false,
        error: keywordResult.error
      });
    }
    const sanitized = keywordResult.value;

    console.log(`Iniciando scraping (${sanitized.length} caracteres)`);

    // se já buscou essa palavra recentemente, devolve do cache e economiza uma requisição
    const cacheKey = `scrape:${sanitized}`;
    const cached = getCache(cacheKey);
    if (cached) {
      metrics.cacheHits += 1;
      return res.json({
        success: true,
        keyword: sanitized,
        products: cached,
        total: cached.length,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    metrics.scrapeRequests += 1;
    const products = await scrapeAmazonProducts(sanitized);

    setCache(cacheKey, products);

    res.json({
      success: true,
      keyword: sanitized,
      products,
      total: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no endpoint /api/scrape:', error.message);
    if (isDevelopment && error.stack) {
      console.error(error.stack);
    }
    const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500;
    res.status(status).json({
      success: false,
      error: publicScrapeError(status, error),
      status
    });
  }
});

// Rota simples pra saber se o servidor tá de pé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando normalmente',
    timestamp: new Date().toISOString()
  });
});

// Métricas básicas de uso - não deixar isso público sem autenticação em produção
app.get('/api/metrics', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    success: true,
    startedAt: metrics.startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    totalRequests: metrics.totalRequests,
    scrapeRequests: metrics.scrapeRequests,
    cacheHits: metrics.cacheHits,
    rateLimited: metrics.rateLimited,
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external
    },
    timestamp: new Date().toISOString()
  });
});

// Serve o index.html na raiz (entrada do front)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint só pra listar o que essa API oferece
app.get('/api', (req, res) => {
  res.json({
    message: 'Amazon Scraper API',
    endpoints: {
      '/api/scrape?keyword=yourKeyword': 'Extrair produtos da Amazon',
      '/api/health': 'Verificar status do servidor'
    }
  });
});

// Qualquer rota que não seja /api cai aqui e volta pro index.html (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint não encontrado' });
  }
});

// Se algum erro escapar de todo o resto, cai aqui
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error('Unhandled error:', err.message || 'Erro interno do servidor');
  if (isDevelopment && err.stack) {
    console.error(err.stack);
  }
  res.status(status).json({ success: false, error: 'Erro interno do servidor', status });
});

function startServer() {
  return app.listen(PORT, () => {
    console.log(` Servidor rodando na porta ${PORT}`);
    console.log(` API disponível em: http://localhost:${PORT}/api/scrape`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
  });
}

const server = require.main === module ? startServer() : null;

// Encerra o servidor de forma limpa quando recebe sinal de término
function shutdown(signal) {
  if (!server) return;
  console.log(`\nRecebido ${signal}. Encerrando com graça...`);
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
  // se não encerrar sozinho a tempo, força a saída
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = {
  app,
  startServer,
  validateKeyword,
  normalizeRating,
  normalizeReviews,
  normalizeProductUrl,
  extractProductsFromHTML,
  validateScrapeDocument,
  scrapeAmazonProducts,
  clearScrapeCache: () => scrapeCache.clear()
};
