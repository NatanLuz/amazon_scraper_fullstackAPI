const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { JSDOM } = require('jsdom');
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

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Allow JSON requests
app.use(express.json({ limit: '100kb' }));

// Basic request logging
app.use(morgan('dev'));

// Response compression
app.use(compression());

// CORS - allow local dev client and same-origin
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

// Very small in-memory cache with TTL
const scrapeCache = new Map(); // key -> { data, expiresAt }
const CACHE_TTL_MS = CACHE_TTL_MS_ENV; // configurable TTL

// Simple in-memory metrics
const metrics = {
  startedAt: new Date().toISOString(),
  totalRequests: 0,
  scrapeRequests: 0,
  cacheHits: 0,
  rateLimited: 0
};

// Count all requests
app.use((req, res, next) => {
  metrics.totalRequests += 1;
  next();
});

function getCache(key) {
  const entry = scrapeCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    scrapeCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs = CACHE_TTL_MS) {
  scrapeCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Rate limiting for scrape endpoint
const scrapeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: RATE_LIMIT_MAX, // configurable req/min por IP
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

// Servir arquivos estáticos do build de produção
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Função para extrair dados de produtos da página de resultados da Amazon
 * @param {string} html - Conteúdo HTML da página
 * @returns {Array} Array de objetos com dados dos produtos
 */
function extractProductsFromHTML(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const products = [];

  // Seletores CSS para elementos da Amazon
  // Nota: Os seletores podem precisar de ajustes conforme a Amazon muda sua estrutura
  const productContainers = document.querySelectorAll('[data-component-type="s-search-result"]');

  productContainers.forEach((container, index) => {
    try {
      // Extrair título do produto
      const titleElement = container.querySelector('h2 a span') ||
                          container.querySelector('.a-size-medium') ||
                          container.querySelector('.a-size-base-plus');
      const title = titleElement ? titleElement.textContent.trim() : 'Título não encontrado';

      // Extrair classificação (estrelas)
      const ratingElement = container.querySelector('.a-icon-alt') ||
                           container.querySelector('[aria-label*="estrela"]') ||
                           container.querySelector('.a-icon-star-small');
      let rating = 'Sem classificação';
      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label');
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        rating = ratingMatch ? `${ratingMatch[1]} estrelas` : ratingText;
      }

      // Extrair número de avaliações
      const reviewsElement = container.querySelector('a[href*="customerReviews"]') ||
                            container.querySelector('.a-size-base.s-underline-text');
      let reviews = 'Sem avaliações';
      if (reviewsElement) {
        const reviewsText = reviewsElement.textContent.trim();
        const reviewsMatch = reviewsText.match(/(\d+(?:,\d+)*)/);
        reviews = reviewsMatch ? reviewsMatch[1] : reviewsText;
      }

      // Extrair URL da imagem
      const imageElement = container.querySelector('img.s-image') ||
                          container.querySelector('.a-image-container img');
      let imageUrl = '';
      if (imageElement) {
        imageUrl = imageElement.src || imageElement.getAttribute('data-src');
        // Se a URL for relativa, converter para absoluta
        if (imageUrl && imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
      }

      // Extrair URL do produto
      const productLinkElement = container.querySelector('h2 a') ||
                                container.querySelector('.a-link-normal[href*="/dp/"]');
      let productUrl = '';
      if (productLinkElement) {
        productUrl = productLinkElement.href;
        // Converter para URL absoluta se necessário
        if (productUrl && productUrl.startsWith('/')) {
          productUrl = 'https://www.amazon.com.br' + productUrl;
        }
      }

      // Extrair preço
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

      // Só adicionar produtos que tenham pelo menos título ou imagem
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
      console.error(`Erro ao processar produto ${index + 1}:`, error.message);
    }
  });

  return products;
}

/**
 * Função para buscar produtos da Amazon
 * @param {string} keyword - Palavra-chave para pesquisa
 * @returns {Promise<Array>} Array de produtos encontrados
 */
async function scrapeAmazonProducts(keyword) {
  try {
    // Headers para simular um navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // URL de pesquisa da Amazon Brasil mostrando os produtos pesquisados
    const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(keyword)}`;

    console.log(`Buscando produtos para: "${keyword}"`);
    console.log(`URL: ${searchUrl}`);

    const response = await axios.get(searchUrl, { headers, timeout: REQUEST_TIMEOUT_MS, validateStatus: () => true });

    if (response.status !== 200) {
      const statusText = response.statusText || 'Erro na requisição';
      throw new Error(`HTTP ${response.status}: ${statusText}`);
    }

    const products = extractProductsFromHTML(response.data);

    console.log(`Encontrados ${products.length} produtos`);
    return products;

  } catch (error) {
    console.error('Erro ao fazer scraping da Amazon:', error.message);

    // Retornar dados de exemplo em caso de erro (para demonstração)
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('Retornando dados de exemplo devido a erro de conexão...');
      return [
        {
          id: 1,
          title: `Produto de exemplo para "${keyword}"`,
          rating: '4.5 estrelas',
          reviews: '1,234',
          imageUrl: 'https://via.placeholder.com/200x200?text=Produto+Exemplo',
          productUrl: '#',
          price: 'R$ 99,99'
        },
        {
          id: 2,
          title: `Outro produto para "${keyword}"`,
          rating: '4.0 estrelas',
          reviews: '567',
          imageUrl: 'https://via.placeholder.com/200x200?text=Produto+2',
          productUrl: '#',
          price: 'R$ 149,99'
        }
      ];
    }

    // Propagar erro com mensagem controlada
    const err = new Error(error.message || 'Falha ao buscar dados na Amazon');
    err.statusCode = error.response?.status || 500;
    throw err;
  }
}

// Endpoint principal para scraping
// Scraping é o processo de extrair dados de uma página web
app.get('/api/scrape', scrapeLimiter, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Palavra-chave é obrigatória'
      });
    }

    const sanitized = String(keyword).trim().slice(0, 80);
    if (sanitized.length < 2) {
      return res.status(400).json({ success: false, error: 'Use ao menos 2 caracteres.' });
    }

    console.log(`Iniciando scraping para: "${sanitized}"`);

    // Try cache first
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

    // Save to cache
    setCache(cacheKey, products);

    res.json({
      success: true,
      keyword: sanitized,
      products,
      total: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no endpoint /api/scrape:', error);
    const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500;
    const message =
      String(error.message || '').includes('429')
        ? 'Muitas requisições à Amazon. Tente novamente em alguns minutos.'
        : String(error.message || 'Erro interno do servidor');
    res.status(status).json({
      success: false,
      error: message,
      status
    });
  }
});

// Endpoint de health check
//Health check é uma rota que verifica se o servidor está funcionando corretamente
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando normalmente',
    timestamp: new Date().toISOString()
  });
});

// Simple metrics endpoint (do not expose publicly in prod without auth)
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

// Rota raiz - servir aplicação frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para API info
app.get('/api', (req, res) => {
  res.json({
    message: 'Amazon Scraper API',
    endpoints: {
      '/api/scrape?keyword=yourKeyword': 'Extrair produtos da Amazon',
      '/api/health': 'Verificar status do servidor'
    }
  });
});

// Fallback para SPA - redirecionar todas as rotas não-API para index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint não encontrado' });
  }
});

// Centralized error handler (last resort)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  console.error('Unhandled error:', message);
  res.status(status).json({ success: false, error: message, status });
});

// Iniciando o servidor
const server = app.listen(PORT, () => {
  console.log(` Servidor rodando na porta ${PORT}`);
  console.log(` API disponível em: http://localhost:${PORT}/api/scrape`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\nRecebido ${signal}. Encerrando com graça...`);
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
  // Forçar saída após timeout
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
