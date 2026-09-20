import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import html from '../../index.html?raw'

const product = (id, price = 'R$ 99,90') => ({
  id, title: `Produto ${id}`, price, rating: '4.5 estrelas', reviews: '12',
  imageUrl: 'https://m.media-amazon.com/image.jpg', productUrl: 'https://amazon.com.br/dp/ABC'
})
const response = (status, data) => ({ ok: status === 200, status, json: async () => data })
const byId = id => document.getElementById(id)
let api
let createProductCard
let observers

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetModules()
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML
  document.documentElement.classList.remove('dark')
  localStorage.clear()
  observers = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe() {}
    disconnect() {}
  })
  vi.stubGlobal('fetch', vi.fn(async () => response(200, { success: true })))
  ;({ createProductCard } = await import('../../main.js'))
  document.dispatchEvent(new Event('DOMContentLoaded'))
  api = window.AmazonScraper
  await Promise.resolve()
  fetch.mockClear()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('interações do frontend com o HTML real', () => {
  it('repete manualmente a primeira busca com falha e depois o último termo tentado', async () => {
    fetch.mockResolvedValue(response(503, { success: false }))
    byId('keywordInput').value = 'notebook'
    await api.searchProducts()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(byId('retryBtn').classList.contains('is-hidden')).toBe(false)
    byId('keywordInput').value = 'texto ainda não pesquisado'
    await api.retrySearch()
    expect(fetch.mock.calls[1][0]).toContain('keyword=notebook')
    byId('keywordInput').value = 'teclado'
    await api.searchProducts()
    await api.retrySearch()
    expect(fetch.mock.calls[3][0]).toContain('keyword=teclado')
    await vi.advanceTimersByTimeAsync(1000)
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('preserva mensagem pública e usa fallbacks por status sem revelar respostas internas', async () => {
    byId('keywordInput').value = 'teste'
    fetch.mockResolvedValue(response(400, { success: false, error: 'Use ao menos 2 caracteres' }))
    await api.searchProducts()
    expect(byId('errorMessage').textContent).toBe('Use ao menos 2 caracteres')
    for (const [status, expected] of [[400, 'palavra-chave'], [403, 'recusou'], [429, 'Aguarde'], [502, 'serviço externo'], [503, 'temporariamente'], [500, 'concluir a busca']]) {
      fetch.mockResolvedValue(response(status, { error: '<html>stack trace at server/index.js:10</html>' }))
      await api.searchProducts()
      expect(byId('errorMessage').textContent).toContain(expected)
      expect(byId('errorMessage').textContent).not.toMatch(/stack|server\/|<html>|HTTP/)
    }
    fetch.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new SyntaxError('HTML externo') } })
    await api.searchProducts()
    expect(byId('errorMessage').textContent).toContain('serviço externo')
    fetch.mockRejectedValue(new TypeError('Failed to fetch: detalhe interno'))
    await api.searchProducts()
    expect(byId('errorMessage').textContent).toContain('serviço externo')
    expect(byId('searchBtn').disabled).toBe(false)
    expect(byId('loadingState').classList.contains('is-hidden')).toBe(true)
  })

  it('mantém loading, impede busca duplicada e anuncia o resultado', async () => {
    let finish
    fetch.mockReturnValue(new Promise(resolve => { finish = resolve }))
    byId('keywordInput').value = 'produto'
    const pending = api.searchProducts()
    await api.searchProducts()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(byId('searchBtn').disabled).toBe(true)
    expect(byId('loadingState').classList.contains('is-hidden')).toBe(false)
    expect(byId('resultsSection').getAttribute('aria-busy')).toBe('true')
    finish(response(200, { success: true, keyword: 'produto', products: [product(1)], total: 1 }))
    await pending
    await vi.advanceTimersByTimeAsync(500)
    expect(byId('resultsStatus').textContent).toBe('1 produto encontrado')
    expect(byId('resultsSection').getAttribute('aria-busy')).toBe('false')
    expect(byId('searchBtn').textContent).toBe('Buscar produtos')
  })

  it('recalcula filtros e contador, explica vazio e cancela cards pendentes', async () => {
    api.showResults({ keyword: 'produto', products: [product(1), product(2, 'R$ 200,00'), product(3)], total: 3 })
    byId('minPriceInput').value = '150'
    byId('applyFiltersBtn').click()
    await vi.advanceTimersByTimeAsync(500)
    expect(byId('resultsCount').textContent).toBe('1 de 3 produtos')
    expect([...document.querySelectorAll('.product-card')].map(c => c.dataset.productId)).toEqual(['2'])
    byId('clearFiltersBtn').click()
    byId('minPriceInput').value = '9999'
    byId('applyFiltersBtn').click()
    await vi.advanceTimersByTimeAsync(500)
    expect(byId('productsGrid').children).toHaveLength(0)
    expect(byId('emptyState').classList.contains('is-hidden')).toBe(false)
    expect(byId('emptyMessage').textContent).toContain('filtros')
    expect(byId('emptyMessage').textContent).not.toContain('internet')
    expect(byId('resultsStatus').textContent).toBe('0 de 3 produtos')
    byId('clearFiltersBtn').click()
    await vi.advanceTimersByTimeAsync(500)
    expect(byId('productsGrid').children).toHaveLength(3)
    expect(byId('resultsCount').textContent).toBe('3 produtos encontrados')
  })

  it('preserva lotes progressivos e ignora observer e timers da busca anterior', async () => {
    api.showResults({ keyword: 'antiga', products: Array.from({ length: 25 }, (_, i) => product(i)), total: 25 })
    await vi.advanceTimersByTimeAsync(500)
    expect(byId('productsGrid').children).toHaveLength(12)
    const oldObserver = observers.at(-1)
    oldObserver.callback([{ isIntersecting: true }])
    await vi.advanceTimersByTimeAsync(500)
    expect(byId('productsGrid').children).toHaveLength(24)
    oldObserver.callback([{ isIntersecting: true }])
    byId('keywordInput').value = 'nova'
    fetch.mockResolvedValue(response(200, { success: true, keyword: 'nova', products: [product('novo')] }))
    await api.searchProducts()
    oldObserver.callback([{ isIntersecting: true }])
    await vi.advanceTimersByTimeAsync(500)
    expect([...byId('productsGrid').children].map(c => c.dataset.productId)).toEqual(['novo'])
  })

  it('apresenta dados ausentes sem rating fictício, reviews duplicados ou link falso', () => {
    const card = createProductCard({ title: 'Título completo', rating: 'Sem classificação', reviews: 'Sem avaliações', productUrl: '#' })
    expect(card.querySelector('.product-rating').textContent).toBe('Sem classificação')
    expect(card.querySelector('.product-rating i')).toBeNull()
    expect(card.querySelector('.product-reviews').textContent).toBe('Sem avaliações')
    expect(card.querySelector('a')).toBeNull()
    expect(card.querySelector('.product-link-unavailable').textContent).toBe('Link indisponível')
    expect(card.querySelector('h3').title).toBe('Título completo')
    expect(card.querySelector('img').alt).toBe('Título completo')
  })
})
