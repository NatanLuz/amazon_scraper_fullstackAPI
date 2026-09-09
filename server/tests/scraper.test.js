const { after, before, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

const html = `<div data-component-type="s-search-result"><h2><a href="/dp/ABC"><span>Produto seguro</span></a></h2><span class="a-price"><span class="a-offscreen">R$ 99,90</span></span><span class="a-icon-alt">4,7 de 5 estrelas</span><a href="/customerReviews/ABC">1,2 mil</a><img class="s-image" src="https://m.media-amazon.com/image.jpg"></div>`;
const originalGet = axios.get;
const serverModule = require('../index');
const { app, extractProductsFromHTML, normalizeRating, normalizeReviews, normalizeProductUrl, scrapeAmazonProducts, clearScrapeCache } = serverModule;
let httpServer;
let baseUrl;
let mode = 'valid';

axios.get = async () => {
  if (mode === 'connection') {
    const error = new Error('network');
    error.code = 'ENOTFOUND';
    throw error;
  }
  if (mode === 'empty') return { status: 200, data: '<html><body>sem resultados</body></html>' };
  if (mode === 'incompatible') return { status: 200, data: '<html><title>captcha</title></html>' };
  if (mode === 'valid') return { status: 200, data: html };
  return { status: Number(mode), statusText: 'simulado' };
};

before(async () => {
  httpServer = app.listen(0);
  await new Promise((resolve) => httpServer.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

beforeEach(() => {
  mode = 'valid';
  clearScrapeCache();
});

after(async () => {
  axios.get = originalGet;
  await new Promise((resolve) => httpServer.close(resolve));
});

test('normaliza ratings e reviews reais', () => {
  assert.equal(normalizeRating('4,7 de 5 estrelas'), '4.7 estrelas');
  assert.equal(normalizeRating('4.7 out of 5 stars'), '4.7 estrelas');
  assert.equal(normalizeRating('sem rating'), 'Sem classificação');
  assert.deepEqual(['123', '1234', '1234', '1200', '12000', '1200'].map(normalizeReviews), ['123', '1234', '1234', '1200', '12000', '1200']);
  assert.equal(normalizeReviews('indisponível'), 'Sem avaliações');
});

test('normaliza URLs e rejeita protocolos inseguros', () => {
  assert.equal(normalizeProductUrl('/dp/ABC'), 'https://www.amazon.com.br/dp/ABC');
  assert.equal(normalizeProductUrl('https://www.amazon.com.br/dp/ABC'), 'https://www.amazon.com.br/dp/ABC');
  assert.equal(normalizeProductUrl('javascript:alert(1)'), '');
  assert.equal(normalizeProductUrl('invalida'), '');
});

test('extrai um card HTML controlado real', () => {
  const [product] = extractProductsFromHTML(html);
  assert.equal(product.title, 'Produto seguro');
  assert.equal(product.price, 'R$ 99,90');
  assert.equal(product.rating, '4.7 estrelas');
  assert.equal(product.reviews, '1200');
  assert.equal(product.productUrl, 'https://www.amazon.com.br/dp/ABC');
  assert.equal(product.imageUrl, 'https://m.media-amazon.com/image.jpg');
});

test('rejeita HTML incompatível e HTML sem cards', () => {
  assert.throws(() => serverModule.validateScrapeDocument('<html><title>captcha</title></html>', []));
  assert.throws(() => serverModule.validateScrapeDocument('<html></html>', []));
});

test('endpoints básicos respondem pelo app real', async () => {
  for (const path of ['/api/health', '/api', '/api/metrics']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 200);
  }
});

test('keyword inválida retorna 400 e UTF-8 válido funciona', async () => {
  for (const query of ['', 'keyword=', 'keyword=a', 'keyword=x&keyword=y', `keyword=${'x'.repeat(81)}`]) {
    const response = await fetch(`${baseUrl}/api/scrape${query ? '?' + query : ''}`);
    assert.equal(response.status, 400);
  }
  const response = await fetch(`${baseUrl}/api/scrape?keyword=caf%C3%A9`);
  assert.equal(response.status, 200);
});

test('resultado válido entra no cache e não inventa produtos', async () => {
  const first = await fetch(`${baseUrl}/api/scrape?keyword=cache-real`).then((r) => r.json());
  const second = await fetch(`${baseUrl}/api/scrape?keyword=cache-real`).then((r) => r.json());
  assert.equal(first.success, true);
  assert.equal(first.products.length, 1);
  assert.equal(second.cached, true);
  assert.equal(second.products[0].title, 'Produto seguro');
});

test('erros upstream preservam status e não retornam fallback', async () => {
  for (const status of [403, 429, 503]) {
    mode = String(status);
    const response = await fetch(`${baseUrl}/api/scrape?keyword=erro-${status}`);
    const body = await response.json();
    assert.equal(response.status, status);
    assert.equal(body.success, false);
    assert.equal(body.products, undefined);
  }
  mode = 'connection';
  const response = await fetch(`${baseUrl}/api/scrape?keyword=erro-rede`);
  assert.equal(response.status, 502);
});

test('erro e HTML incompatível não são cacheados', async () => {
  mode = 'incompatible';
  assert.equal((await fetch(`${baseUrl}/api/scrape?keyword=sem-cards`)).status, 502);
  mode = 'valid';
  const response = await fetch(`${baseUrl}/api/scrape?keyword=sem-cards`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.cached, undefined);
});
