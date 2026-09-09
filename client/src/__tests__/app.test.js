import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

let createProductCard
let getSafeWebUrl
let showError

beforeAll(async () => {
  document.body.innerHTML = '<div id="errorState"></div><p id="errorMessage"></p><div id="loadingState"></div><div id="resultsSection"></div><div id="keywordInput"></div><div id="searchBtn"></div><div id="resultsTitle"></div><div id="resultsCount"></div><div id="productsGrid"></div><div id="emptyState"></div><div id="retryBtn"></div><div id="applyFiltersBtn"></div><div id="clearFiltersBtn"></div><div id="themeToggle"></div><div id="menuToggle"></div><div id="filtersPanel"></div><div id="minPriceInput"></div><div id="maxPriceInput"></div><div id="minRatingSelect"></div><div id="primeOnlyCheckbox"></div><div id="infiniteScrollSentinel"></div>'
  const module = await import('../../main.js')
  createProductCard = module.createProductCard
  getSafeWebUrl = module.getSafeWebUrl
  showError = module.showError
})

describe('componentes reais do frontend', () => {
  beforeEach(() => {
    document.getElementById('errorState').className = ''
    document.getElementById('errorMessage').textContent = ''
  })

  it('renderiza dados externos como texto', () => {
    const card = createProductCard({ id: 1, title: '<strong>Produto</strong>', price: 'R$ 10', rating: '4.5 estrelas', reviews: '12', imageUrl: 'https://example.com/a.jpg', productUrl: 'https://amazon.com/dp/A' })
    expect(card.querySelector('h3').textContent).toBe('<strong>Produto</strong>')
    expect(card.querySelector('strong')).toBeNull()
    expect(card.querySelector('.product-price').textContent).toBe('R$ 10')
  })

  it.each([
    ['https://example.com/a', 'https://example.com/a'],
    ['http://example.com/a', 'http://example.com/a'],
    ['javascript:alert(1)', ''],
    ['http://[invalid', '']
  ])('valida URL %s', (input, expected) => {
    expect(getSafeWebUrl(input)).toBe(expected)
  })

  it('rejeita URL insegura no card', () => {
    const card = createProductCard({ id: 1, title: 'Produto', price: 'R$ 10', rating: '', reviews: '0', imageUrl: 'javascript:bad', productUrl: 'javascript:bad' })
    expect(card.querySelector('a')).toBeNull()
    expect(card.querySelector('img').src).toContain('via.placeholder.com')
  })

  it('usa fallback seguro de imagem sem onerror inline', () => {
    const card = createProductCard({ id: 1, title: 'Produto', price: 'R$ 10', rating: '', reviews: '0', imageUrl: 'https://example.com/a.jpg', productUrl: '' })
    const image = card.querySelector('img')
    expect(image.getAttribute('onerror')).toBeNull()
    image.dispatchEvent(new Event('error'))
    expect(image.src).toContain('Erro+na+Imagem')
  })

  it('exibe mensagem de erro como texto', () => {
    showError('<img src=x>')
    expect(document.getElementById('errorMessage').textContent).toBe('<img src=x>')
    expect(document.getElementById('errorMessage').querySelector('img')).toBeNull()
  })
})
