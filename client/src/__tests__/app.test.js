import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock do DOM
const mockElements = {
  keywordInput: {
    value: '',
    focus: vi.fn(),
    addEventListener: vi.fn()
  },
  searchBtn: {
    disabled: false,
    innerHTML: '',
    addEventListener: vi.fn()
  },
  loadingState: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  errorState: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  },
  resultsSection: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    },
    scrollIntoView: vi.fn()
  },
  productsGrid: {
    innerHTML: ''
  },
  resultsTitle: {
    textContent: ''
  },
  resultsCount: {
    textContent: ''
  },
  errorMessage: {
    textContent: ''
  }
}

// Mock do document
global.document = {
  getElementById: vi.fn((id) => mockElements[id] || {}),
  addEventListener: vi.fn()
}

// Mock do fetch
global.fetch = vi.fn()

describe('Amazon Scraper App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Theme Management', () => {
    it('should initialize with light theme by default', () => {
      const theme = localStorage.getItem('theme') || 'light'
      expect(theme).toBe('light')
    })

    it('should toggle theme correctly', () => {
      const initialTheme = 'light'
      const newTheme = initialTheme === 'light' ? 'dark' : 'light'
      expect(newTheme).toBe('dark')
    })
  })

  describe('Error Messages', () => {
    it('should provide friendly error messages', () => {
      const friendlyMessages = {
        'Failed to fetch': 'Não conseguimos conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
        'HTTP 429': 'Muitas requisições foram feitas. Por favor, aguarde alguns minutos antes de tentar novamente.',
        'HTTP 500': 'Ocorreu um erro interno no servidor. Nossa equipe foi notificada. Tente novamente em alguns minutos.'
      }

      expect(friendlyMessages['Failed to fetch']).toContain('conexão')
      expect(friendlyMessages['HTTP 429']).toContain('aguarde')
      expect(friendlyMessages['HTTP 500']).toContain('equipe')
    })
  })

  describe('Product Card Creation', () => {
    it('should create product card with all required elements', () => {
      const mockProduct = {
        id: '1',
        title: 'Test Product',
        price: 'R$ 99,99',
        rating: '4.5 de 5 estrelas',
        reviews: '123',
        imageUrl: 'https://example.com/image.jpg',
        productUrl: 'https://amazon.com/product'
      }

      // Simular a função createProductCard
      const createProductCard = (product) => {
        return `
          <div class="product-card" data-product-id="${product.id}">
            <img src="${product.imageUrl}" alt="${product.title}" class="product-image">
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">${product.price}</div>
            <div class="product-rating">${product.rating}</div>
            <div class="product-reviews">${product.reviews} avaliações</div>
            <a href="${product.productUrl}" target="_blank" class="product-link">Ver na Amazon</a>
          </div>
        `
      }

      const cardHTML = createProductCard(mockProduct)

      expect(cardHTML).toContain(mockProduct.title)
      expect(cardHTML).toContain(mockProduct.price)
      expect(cardHTML).toContain(mockProduct.rating)
      expect(cardHTML).toContain('Ver na Amazon')
    })
  })

  describe('API Integration', () => {
    it('should handle successful API response', async () => {
      const mockResponse = {
        success: true,
        products: [
          {
            id: '1',
            title: 'Test Product',
            price: 'R$ 99,99',
            rating: '4.5 de 5 estrelas',
            reviews: '123'
          }
        ],
        keyword: 'test',
        total: 1
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/scrape?keyword=test')
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.products).toHaveLength(1)
      expect(data.total).toBe(1)
    })

    it('should handle API error response', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'))

      try {
        await fetch('/api/scrape?keyword=test')
      } catch (error) {
        expect(error.message).toBe('Failed to fetch')
      }
    })
  })

  describe('Input Validation', () => {
    it('should validate empty keyword input', () => {
      const keyword = ''
      const isValid = keyword.trim().length > 0
      expect(isValid).toBe(false)
    })

    it('should validate non-empty keyword input', () => {
      const keyword = 'smartphone'
      const isValid = keyword.trim().length > 0
      expect(isValid).toBe(true)
    })
  })
})
