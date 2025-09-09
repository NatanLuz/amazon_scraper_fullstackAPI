/**
 * // Frontend
 * Gerenciando a interface do usuário e comunicação com a API
 */

// Elementos do DOM necessários
// Utilizando IDs para facilitar a manipulação
const elements = {
    keywordInput: document.getElementById('keywordInput'),
    searchBtn: document.getElementById('searchBtn'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    resultsSection: document.getElementById('resultsSection'),
    emptyState: document.getElementById('emptyState'),
    productsGrid: document.getElementById('productsGrid'),
    resultsTitle: document.getElementById('resultsTitle'),
    resultsCount: document.getElementById('resultsCount'),
    searchKeyword: document.getElementById('searchKeyword'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    themeToggle: document.getElementById('themeToggle'),
    menuToggle: document.getElementById('menuToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    // filtros
    minPriceInput: document.getElementById('minPriceInput'),
    maxPriceInput: document.getElementById('maxPriceInput'),
    minRatingInput: document.getElementById('minRatingInput'),
    primeOnlyInput: document.getElementById('primeOnlyInput'),
    applyFiltersBtn: document.getElementById('applyFiltersBtn'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    // métricas
    metricsPanel: document.getElementById('metricsPanel'),
    metricTotalRequests: document.getElementById('metricTotalRequests'),
    metricScrapeRequests: document.getElementById('metricScrapeRequests'),
    metricCacheHits: document.getElementById('metricCacheHits'),
    metricRateLimited: document.getElementById('metricRateLimited'),
    infiniteScrollSentinel: document.getElementById('infiniteScrollSentinel')
};

// Estado da aplicação criada
let currentKeyword = '';
let isLoading = false;
let allProducts = [];
let filteredProducts = [];
let renderIndex = 0;
const RENDER_BATCH = 12;
let infiniteObserver = null;

/**
 * Gerenciamento de tema escuro
 */
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
    }

    applyTheme() {
        const html = document.documentElement;
        if (this.theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    bindEvents() {
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
}

/**
 * Função que mostra e esconde elementos
 */
function toggleElement(element, show) {
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Função para mostrar estado de carregamento
 */
function showLoading() {
    isLoading = true;
    elements.searchBtn.disabled = true;
    elements.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';

    // Esconder outros estados
    toggleElement(elements.errorState, false);
    toggleElement(elements.resultsSection, false);
    toggleElement(elements.emptyState, false);

    // Mostrar loading state
    toggleElement(elements.loadingState, true);
}

/**
 * Função para esconder estado de carregamento
 */
function hideLoading() {
    isLoading = false;
    elements.searchBtn.disabled = false;
    elements.searchBtn.innerHTML = '<i class="fas fa-rocket"></i> Buscar Produtos';
    toggleElement(elements.loadingState, false);
}

/**
 * Função para mostrar os erros
 */
function showError(message) {
    // Mensagens de erro mais amigáveis
    const friendlyMessages = {
        'Failed to fetch': 'Não conseguimos conectar ao servidor. Verifique sua conexão com a internet e tente novamente.',
        'HTTP 429': 'Muitas requisições foram feitas. Por favor, aguarde alguns minutos antes de tentar novamente.',
        'HTTP 500': 'Ocorreu um erro interno no servidor. Nossa equipe foi notificada. Tente novamente em alguns minutos.',
        'HTTP 404': 'O serviço não foi encontrado. Verifique se o servidor está funcionando corretamente.',
        'HTTP 403': 'Acesso negado. Verifique suas permissões e tente novamente.',
        'timeout': 'A requisição demorou muito para responder. Verifique sua conexão e tente novamente.',
        'network': 'Problema de conexão. Verifique sua internet e tente novamente.'
    };

    let friendlyMessage = message;

    // Verificar se a mensagem contém alguma das chaves conhecidas
    for (const [key, value] of Object.entries(friendlyMessages)) {
        if (message.toLowerCase().includes(key.toLowerCase())) {
            friendlyMessage = value;
            break;
        }
    }

    elements.errorMessage.textContent = friendlyMessage;
    toggleElement(elements.errorState, true);
    toggleElement(elements.loadingState, false);
    toggleElement(elements.resultsSection, false);
    toggleElement(elements.emptyState, false);
}

/**
 * Função para criar estrelas baseada na classificação
 */
function createStars(rating) {
    const ratingMatch = rating.match(/(\d+(?:\.\d+)?)/);
    if (!ratingMatch) return '';

    const ratingValue = parseFloat(ratingMatch[1]);
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    let starsHTML = '';

    // Estrelas cheias
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }

    // Meia estrela
    if (hasHalfStar) {
        starsHTML += '<i class="fa-solid fa-star-half-stroke"></i>';
    }

    // Estrelas vazias
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
}

/**
 * Função para criar card de produtos
 */
function createProductCard(product) {
    const starsHTML = createStars(product.rating);
    const ratingValue = product.rating ? product.rating.match(/(\d+(?:\.\d+)?)/)?.[1] || '0' : '0';

    return `
        <div class="product-card group" data-product-id="${product.id}">
            <div class="relative">
                <img
                    src="${product.imageUrl || 'https://via.placeholder.com/200x200?text=Sem+Imagem'}"
                    alt="${product.title}"
                    class="product-image"
                    onerror="this.src='https://via.placeholder.com/200x200?text=Erro+na+Imagem'"
                >
                ${product.rating ? `
                    <div class="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-lg">
                        <div class="flex items-center gap-1">
                            <i class="fas fa-star text-yellow-400 text-xs"></i>
                            <span class="text-xs font-semibold text-gray-900 dark:text-white">${ratingValue}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">${product.price}</div>
            <div class="product-rating">
                ${starsHTML}
                ${product.rating ? `<span class="rating-badge">${product.rating}</span>` : ''}
            </div>
            <div class="product-reviews">
                ${product.reviews || '0'} avaliações
            </div>
            ${product.productUrl ? `
                <a href="${product.productUrl}" target="_blank" class="product-link" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i>
                    Ver na Amazon
                </a>
            ` : ''}
        </div>
    `;
}

/**
 * Função para mostrar os resultados pesquisados
 */
function showResults(data) {
    const { products, keyword, total } = data;

    currentKeyword = keyword;

    // Atualizar informações do cabeçalho criado
    elements.resultsTitle.textContent = `Resultados para "${keyword}"`;
    elements.resultsCount.textContent = `${total} produto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    elements.searchKeyword.textContent = `Palavra-chave: "${keyword}"`;

    // Limpar estado de listagem
    elements.productsGrid.innerHTML = '';
    renderIndex = 0;
    allProducts = Array.isArray(products) ? products.slice() : [];
    filteredProducts = applyFiltersToList(allProducts);

    if (filteredProducts && filteredProducts.length > 0) {
        // Primeira leva
        renderNextBatch();
        setupInfiniteScroll();

        // Mostra a seção de resultados
        toggleElement(elements.resultsSection, true);
        toggleElement(elements.emptyState, false);

        // Scroll suave para os resultados após um pequeno delay
        setTimeout(() => {
            elements.resultsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 500);
    } else {
        // Mostrar o estado vazio
        toggleElement(elements.emptyState, true);
        toggleElement(elements.resultsSection, false);
    }

    // Esconder os outros estados
    toggleElement(elements.loadingState, false);
    toggleElement(elements.errorState, false);
}

/**
 * Função para fazer requisição à API
 */
async function fetchProducts(keyword) {
    try {
        const response = await fetch(`/api/scrape?keyword=${encodeURIComponent(keyword)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Erro desconhecido');
        }

        return data;

    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// --- Filtros ---
function parsePriceBRL(priceText) {
    if (!priceText) return null;
    // Remove tudo que não é dígito ou vírgula
    const cleaned = String(priceText).replace(/[^0-9,]/g, '').replace(/\.(?=\d{3})/g, '');
    const normalized = cleaned.replace(',', '.');
    const value = Number.parseFloat(normalized);
    return Number.isFinite(value) ? value : null;
}

function extractRatingNumber(ratingText) {
    if (!ratingText) return null;
    const match = String(ratingText).match(/(\d+(?:\.\d+)?)/);
    return match ? Number.parseFloat(match[1]) : null;
}

function isPrimeProduct(product) {
    // Heurística simples: se o título contém 'prime' (apenas exemplo)
    return /\bprime\b/i.test(product.title || '') || /prime/i.test(product.badges || '');
}

function applyFiltersToList(list) {
    const minPrice = elements.minPriceInput?.value ? Number(elements.minPriceInput.value) : null;
    const maxPrice = elements.maxPriceInput?.value ? Number(elements.maxPriceInput.value) : null;
    const minRating = elements.minRatingInput?.value ? Number(elements.minRatingInput.value) : 0;
    const primeOnly = !!elements.primeOnlyInput?.checked;

    return list.filter((p) => {
        const price = parsePriceBRL(p.price);
        const rating = extractRatingNumber(p.rating);
        if (minPrice !== null && (price === null || price < minPrice)) return false;
        if (maxPrice !== null && (price === null || price > maxPrice)) return false;
        if (minRating > 0 && (rating === null || rating < minRating)) return false;
        if (primeOnly && !isPrimeProduct(p)) return false;
        return true;
    });
}

function applyFiltersAndRerender() {
    elements.productsGrid.innerHTML = '';
    renderIndex = 0;
    filteredProducts = applyFiltersToList(allProducts);
    if (filteredProducts.length === 0) {
        toggleElement(elements.emptyState, true);
        toggleElement(elements.resultsSection, false);
        return;
    }
    toggleElement(elements.resultsSection, true);
    toggleElement(elements.emptyState, false);
    renderNextBatch();
}

// --- Renderização em lotes / Infinite Scroll ---
function renderNextBatch() {
    const slice = filteredProducts.slice(renderIndex, renderIndex + RENDER_BATCH);
    slice.forEach((product, idx) => {
        setTimeout(() => {
            elements.productsGrid.innerHTML += createProductCard(product);
        }, idx * 50);
    });
    renderIndex += slice.length;
}

function setupInfiniteScroll() {
    if (!elements.infiniteScrollSentinel) return;
    if (infiniteObserver) {
        infiniteObserver.disconnect();
    }
    infiniteObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                if (renderIndex < filteredProducts.length) {
                    renderNextBatch();
                }
            }
        });
    }, { rootMargin: '0px 0px 200px 0px' });
    infiniteObserver.observe(elements.infiniteScrollSentinel);
}

/**
 * Função principal para buscar os produtos
 */
async function searchProducts() {
    const keyword = elements.keywordInput.value.trim();

    if (!keyword) {
        showError('Por favor, digite uma palavra-chave para buscar.');
        return;
    }

    if (isLoading) {
        return; // Evitar múltiplas requisições simultâneas podendo causar problemas
    }

    showLoading();

    try {
        const data = await fetchProducts(keyword);
        showResults(data);

    } catch (error) {
        console.error('Erro ao buscar produtos:', error);

        let errorMessage = 'Erro ao buscar produtos.';

        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
        } else if (error.message.includes('HTTP 429')) {
            errorMessage = 'Muitas requisições. Tente novamente em alguns minutos.';
        } else if (error.message.includes('HTTP 500')) {
            errorMessage = 'Erro interno do servidor. Tente novamente.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showError(errorMessage);
    } finally {
        hideLoading();
    }
}

/**
 * Função para lidar com Enter no input feito
 */
function handleEnterKey(event) {
    if (event.key === 'Enter' && !isLoading) {
        searchProducts();
    }
}

/**
 * Função para > retry em caso de erro pesquisando e fazer novamente a busca
 */
function retrySearch() {
    if (currentKeyword) {
        elements.keywordInput.value = currentKeyword;
        searchProducts();
    }
}

/**
 * Função para inicializar a aplicação
 */
function initApp() {
    console.log('🚀 Amazon Scraper Frontend inicializado');

    // Inicializar gerenciador de tema
    window.themeManager = new ThemeManager();

    // Event listeners
    elements.searchBtn.addEventListener('click', searchProducts);
    elements.keywordInput.addEventListener('keypress', handleEnterKey);
    elements.retryBtn.addEventListener('click', retrySearch);

    // Filtros
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', applyFiltersAndRerender);
    }
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            if (elements.minPriceInput) elements.minPriceInput.value = '';
            if (elements.maxPriceInput) elements.maxPriceInput.value = '';
            if (elements.minRatingInput) elements.minRatingInput.value = '0';
            if (elements.primeOnlyInput) elements.primeOnlyInput.checked = false;
            applyFiltersAndRerender();
        });
    }

    // Mobile menu toggle
    if (elements.menuToggle && elements.mobileMenu) {
        elements.menuToggle.addEventListener('click', () => {
            const isHidden = elements.mobileMenu.classList.contains('hidden');
            if (isHidden) {
                elements.mobileMenu.classList.remove('hidden');
                elements.menuToggle.setAttribute('aria-expanded', 'true');
            } else {
                elements.mobileMenu.classList.add('hidden');
                elements.menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Focar no input ao carregar a página sem emição de erros
    elements.keywordInput.focus();

    // Verificar se o servidor está rodando sem problemas
    checkServerHealth();

    // Iniciar polling de métricas
    startMetricsPolling();

    // Adicionar animações suaves
    addSmoothAnimations();
}

/**
 * Função para verificar saúde do servidor
 */
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            console.log('✅ Servidor está funcionando normalmente');
        } else {
            console.warn('⚠️ Servidor pode estar com problemas');
        }
    } catch (error) {
        console.warn('⚠️ Não foi possível conectar ao servidor:', error.message);
    }
}

// --- Métricas ---
function startMetricsPolling() {
    if (!elements.metricsPanel || !elements.metricTotalRequests) return;
    // Mostrar painel
    elements.metricsPanel.classList.remove('hidden');
    const update = async () => {
        try {
            const res = await fetch('/api/metrics');
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success) return;
            if (elements.metricTotalRequests) elements.metricTotalRequests.textContent = String(json.totalRequests || 0);
            if (elements.metricScrapeRequests) elements.metricScrapeRequests.textContent = String(json.scrapeRequests || 0);
            if (elements.metricCacheHits) elements.metricCacheHits.textContent = String(json.cacheHits || 0);
            if (elements.metricRateLimited) elements.metricRateLimited.textContent = String(json.rateLimited || 0);
        } catch (_) {
            // ignore
        }
    };
    update();
    setInterval(update, 5000);
}

/**
 * Função para adicionar animações suaves
 */
function addSmoothAnimations() {
    // Adicionar animação de fade-in para os cards de produtos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar cards de produtos quando são adicionados
    const productsGrid = document.getElementById('productsGrid');
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('product-card')) {
                    node.style.opacity = '0';
                    node.style.transform = 'translateY(20px)';
                    node.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    observer.observe(node);
                }
            });
        });
    });

    mutationObserver.observe(productsGrid, { childList: true });
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Exportar funções para uso global (se necessário)
window.AmazonScraper = {
    searchProducts,
    retrySearch,
    showError,
    showResults
};
