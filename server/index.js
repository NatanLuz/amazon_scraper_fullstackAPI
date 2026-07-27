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

// Helmet cuida de uns headers de segurança padrão pra gente não ter que fazer na mão
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Limite de 100kb no body pra evitar payload gigante
app.use(express.json({ limit: '100kb' }));

// Log de cada requisição no console, ajuda a debugar em dev
app.use(morgan('dev'));

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
  scrapeCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Limita quantas buscas cada IP pode fazer por minuto, pra não tomar bloqueio da Amazon
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
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const products = [];

  // cada card de produto no resultado da busca
  const productContainers = document.querySelectorAll('[data-component-type="s-search-result"]');

  productContainers.forEach((container, index) => {
    try {
      // título do produto - tenta alguns seletores porque a Amazon varia o markup
      const titleElement = container.querySelector('h2 a span') ||
                          container.querySelector('.a-size-medium') ||
                          container.querySelector('.a-size-base-plus');
      const title = titleElement ? titleElement.textContent.trim() : 'Título não encontrado';

      // nota do produto (as estrelinhas)
      const ratingElement = container.querySelector('.a-icon-alt') ||
                           container.querySelector('[aria-label*="estrela"]') ||
                           container.querySelector('.a-icon-star-small');
      let rating = 'Sem classificação';
      if (ratingElement) {
        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label');
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        rating = ratingMatch ? `${ratingMatch[1]} estrelas` : ratingText;
      }

      // quantidade de avaliações
      const reviewsElement = container.querySelector('a[href*="customerReviews"]') ||
                            container.querySelector('.a-size-base.s-underline-text');
      let reviews = 'Sem avaliações';
      if (reviewsElement) {
        const reviewsText = reviewsElement.textContent.trim();
        const reviewsMatch = reviewsText.match(/(\d+(?:,\d+)*)/);
        reviews = reviewsMatch ? reviewsMatch[1] : reviewsText;
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
      let productUrl = '';
      if (productLinkElement) {
        productUrl = productLinkElement.href;
        // link relativo, completa com o domínio
        if (productUrl && productUrl.startsWith('/')) {
          productUrl = 'https://www.amazon.com.br' + productUrl;
        }
      }

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

    console.log(`Buscando produtos para: "${keyword}"`);
    console.log(`URL: ${searchUrl}`);

    // validateStatus sempre true porque a gente mesmo trata o status abaixo
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

    // sem conexão? devolve uns produtos fake só pra não deixar a tela vazia na demo
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

    // qualquer outro erro sobe pra quem chamou tratar
    const err = new Error(error.message || 'Falha ao buscar dados na Amazon');
    err.statusCode = error.response?.status || 500;
    throw err;
  }
}

// Rota principal: recebe a palavra-chave e devolve os produtos raspados da Amazon
app.get('/api/scrape', scrapeLimiter, async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Palavra-chave é obrigatória'
      });
    }

    // corta em 80 caracteres pra ninguém mandar uma string absurda
    const sanitized = String(keyword).trim().slice(0, 80);
    if (sanitized.length < 2) {
      return res.status(400).json({ success: false, error: 'Use ao menos 2 caracteres.' });
    }

    console.log(`Iniciando scraping para: "${sanitized}"`);

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
  const message = err.message || 'Erro interno do servidor';
  console.error('Unhandled error:', message);
  res.status(status).json({ success: false, error: message, status });
});

// Sobe o servidor
const server = app.listen(PORT, () => {
  console.log(` Servidor rodando na porta ${PORT}`);
  console.log(` API disponível em: http://localhost:${PORT}/api/scrape`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
});

// Encerra o servidor de forma limpa quando recebe sinal de término
function shutdown(signal) {
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

module.exports = app;
