
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
    resultsStatus: document.getElementById('resultsStatus'),
    emptyMessage: document.getElementById('emptyMessage'),
    searchKeyword: document.getElementById('searchKeyword'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    themeToggle: document.getElementById('themeToggle'),
    menuToggle: document.getElementById('menuToggle'),
    mobileMenu: document.getElementById('mobileMenu'),
    minPriceInput: document.getElementById('minPriceInput'),
    maxPriceInput: document.getElementById('maxPriceInput'),
    minRatingInput: document.getElementById('minRatingInput'),
    applyFiltersBtn: document.getElementById('applyFiltersBtn'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    apiStatus: document.getElementById('apiStatus'),
    apiStatusText: document.getElementById('apiStatusText'),
    infiniteScrollSentinel: document.getElementById('infiniteScrollSentinel'),
    currentYear: document.getElementById('currentYear')
};

let currentKeyword = '';
let isLoading = false;
let allProducts = [];
let filteredProducts = [];
let renderIndex = 0;
const RENDER_BATCH = 12;
let infiniteObserver = null;
let hasResults = false;
let renderVersion = 0;
const renderTimers = new Set();

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
        elements.themeToggle?.setAttribute('aria-label', this.theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');
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

function toggleElement(element, show) {
    if (show) {
        element.classList.remove('is-hidden');
    } else {
        element.classList.add('is-hidden');
    }
}

function showLoading() {
    resetRendering();
    hasResults = false;
    isLoading = true;
    elements.searchBtn.disabled = true;
    elements.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Buscando...</span>';
    elements.resultsSection.setAttribute('aria-busy', 'true');
    elements.retryBtn.disabled = true;
    elements.applyFiltersBtn.disabled = true;
    elements.clearFiltersBtn.disabled = true;
    if (elements.resultsStatus) elements.resultsStatus.textContent = '';

    toggleElement(elements.errorState, false);
    toggleElement(elements.resultsSection, false);
    toggleElement(elements.emptyState, false);

    toggleElement(elements.loadingState, true);
}

function hideLoading() {
    isLoading = false;
    elements.searchBtn.disabled = false;
    elements.searchBtn.innerHTML = '<i class="fas fa-search" aria-hidden="true"></i><span>Buscar produtos</span>';
    elements.resultsSection.setAttribute('aria-busy', 'false');
    elements.retryBtn.disabled = false;
    elements.applyFiltersBtn.disabled = false;
    elements.clearFiltersBtn.disabled = false;
    toggleElement(elements.loadingState, false);
}

export function showError(message) {
    resetRendering();
    elements.errorMessage.textContent = message;
    toggleElement(elements.retryBtn, Boolean(currentKeyword));
    toggleElement(elements.errorState, true);
    toggleElement(elements.loadingState, false);
    toggleElement(elements.resultsSection, false);
    toggleElement(elements.emptyState, false);
}

export function appendStars(container, rating) {
    const ratingValue = extractRatingNumber(rating);
    if (ratingValue === null) return;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star';
        star.setAttribute('aria-hidden', 'true');
        container.appendChild(star);
    }

    if (hasHalfStar) {
        const halfStar = document.createElement('i');
        halfStar.className = 'fa-solid fa-star-half-stroke';
        halfStar.setAttribute('aria-hidden', 'true');
        container.appendChild(halfStar);
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        const emptyStar = document.createElement('i');
        emptyStar.className = 'far fa-star';
        emptyStar.setAttribute('aria-hidden', 'true');
        container.appendChild(emptyStar);
    }
}

export function getSafeWebUrl(value, allowedProtocols = ['https:', 'http:']) {
    if (!value || typeof value !== 'string') return '';
    if (value.trim().startsWith('#') || !value.trim()) return '';
    try {
        const url = new URL(value, window.location.origin);
        return allowedProtocols.includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

export function createProductCard(product) {
    const ratingValue = extractRatingNumber(product.rating);
    const fallbackImage = 'https://via.placeholder.com/200x200?text=Sem+Imagem';
    const errorImage = 'https://via.placeholder.com/200x200?text=Erro+na+Imagem';
    const imageUrl = getSafeWebUrl(product.imageUrl) || fallbackImage;
    const productUrl = getSafeWebUrl(product.productUrl);

    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.productId = String(product.id || '');

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'relative';

    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = product.title || 'Produto';
    image.className = 'product-image';
    image.addEventListener('error', () => {
        image.src = errorImage;
    }, { once: true });
    imageWrapper.appendChild(image);

    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.title || 'Produto sem t\u00edtulo';
    title.title = title.textContent;

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = product.price || 'Pre\u00e7o n\u00e3o dispon\u00edvel';

    const rating = document.createElement('div');
    rating.className = 'product-rating';
    appendStars(rating, product.rating || '');
    if (ratingValue !== null) {
        const ratingBadge = document.createElement('span');
        ratingBadge.className = 'rating-badge';
        ratingBadge.textContent = product.rating;
        rating.appendChild(ratingBadge);
    } else {
        rating.textContent = 'Sem classificação';
    }

    const reviews = document.createElement('div');
    reviews.className = 'product-reviews';
    const reviewCount = /^\d+$/.test(String(product.reviews)) ? Number(product.reviews) : null;
    reviews.textContent = reviewCount === null || reviewCount === 0
        ? 'Sem avaliações'
        : `${reviewCount.toLocaleString('pt-BR')} ${reviewCount === 1 ? 'avaliação' : 'avaliações'}`;

    card.appendChild(imageWrapper);
    card.appendChild(title);
    card.appendChild(price);
    card.appendChild(rating);
    card.appendChild(reviews);

    if (productUrl) {
        const link = document.createElement('a');
        link.href = productUrl;
        link.target = '_blank';
        link.className = 'product-link';
        link.rel = 'noopener noreferrer';
        const linkIcon = document.createElement('i');
        linkIcon.className = 'fas fa-external-link-alt';
        linkIcon.setAttribute('aria-hidden', 'true');
        link.appendChild(linkIcon);
        link.appendChild(document.createTextNode(' Ver na Amazon'));
        card.appendChild(link);
    } else {
        const unavailable = document.createElement('span');
        unavailable.className = 'product-link-unavailable';
        unavailable.textContent = 'Link indisponível';
        card.appendChild(unavailable);
    }

    return card;
}

function showResults(data) {
    const { products, keyword } = data;

    elements.resultsTitle.textContent = `Resultados para "${keyword}"`;
    elements.searchKeyword.textContent = `Palavra-chave: "${keyword}"`;
    allProducts = Array.isArray(products) ? products.slice() : [];
    hasResults = true;
    applyFiltersAndRerender();
    toggleElement(elements.loadingState, false);
    toggleElement(elements.errorState, false);
}

const errorMessages = {
    400: 'Confira a palavra-chave e tente novamente.',
    403: 'A Amazon recusou a consulta. Tente novamente mais tarde.',
    429: 'Muitas solicitações. Aguarde alguns minutos antes de tentar novamente.',
    502: 'Não foi possível consultar o serviço externo. Tente novamente mais tarde.',
    503: 'O serviço externo está temporariamente indisponível. Tente novamente mais tarde.'
};
const genericError = 'Não foi possível concluir a busca. Tente novamente em instantes.';
// Apenas mensagens públicas conhecidas do contrato da API podem chegar à interface.
const publicApiMessages = new Set([
    'Palavra-chave obrigatória',
    'Informe uma única palavra-chave válida',
    'Use ao menos 2 caracteres',
    'Use no máximo 80 caracteres',
    'Palavra-chave inválida',
    'A Amazon recusou a requisição. Tente novamente mais tarde.',
    'Muitas requisições à Amazon. Tente novamente em alguns minutos.',
    'Muitas requisições. Por favor, tente novamente em instantes.'
]);

async function fetchProducts(keyword) {
    let response;
    try {
        response = await fetch(`/api/scrape?keyword=${encodeURIComponent(keyword)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch {
        const error = new Error('network');
        error.publicMessage = errorMessages[502];
        throw error;
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true || !Array.isArray(data.products)) {
        const error = new Error('search');
        error.publicMessage = publicApiMessages.has(data?.error)
            ? data.error
            : errorMessages[response.status] || genericError;
        throw error;
    }
    return data;
}

function parsePriceBRL(priceText) {
    if (!priceText) return null;
    const cleaned = String(priceText).replace(/[^0-9,]/g, '').replace(/\.(?=\d{3})/g, '');
    const normalized = cleaned.replace(',', '.');
    const value = Number.parseFloat(normalized);
    return Number.isFinite(value) ? value : null;
}

function extractRatingNumber(ratingText) {
    if (!ratingText) return null;
    const match = String(ratingText).match(/(\d+(?:[.,]\d+)?)/);
    const value = match ? Number.parseFloat(match[1].replace(',', '.')) : null;
    return value > 0 && value <= 5 ? value : null;
}

function applyFiltersToList(list) {
    const minPrice = elements.minPriceInput?.value ? Number(elements.minPriceInput.value) : null;
    const maxPrice = elements.maxPriceInput?.value ? Number(elements.maxPriceInput.value) : null;
    const minRating = elements.minRatingInput?.value ? Number(elements.minRatingInput.value) : 0;

    return list.filter((p) => {
        const price = parsePriceBRL(p.price);
        const rating = extractRatingNumber(p.rating);
        if (minPrice !== null && (price === null || price < minPrice)) return false;
        if (maxPrice !== null && (price === null || price > maxPrice)) return false;
        if (minRating > 0 && (rating === null || rating < minRating)) return false;
        return true;
    });
}

function applyFiltersAndRerender() {
    if (!hasResults) return;
    resetRendering();
    filteredProducts = applyFiltersToList(allProducts);
    const count = filteredProducts.length;
    const summary = count === allProducts.length
        ? `${count} ${count === 1 ? 'produto encontrado' : 'produtos encontrados'}`
        : `${count} de ${allProducts.length} produtos`;
    elements.resultsCount.textContent = summary;
    if (elements.resultsStatus) elements.resultsStatus.textContent = summary;
    if (elements.emptyMessage) {
        elements.emptyMessage.textContent = allProducts.length
            ? 'Nenhum produto corresponde aos filtros. Ajuste os valores ou limpe os filtros.'
            : 'Nenhum produto encontrado para esta busca. Tente outra palavra-chave.';
    }
    toggleElement(elements.errorState, false);
    toggleElement(elements.resultsSection, count > 0);
    toggleElement(elements.emptyState, count === 0);
    if (count > 0) {
        renderNextBatch();
        setupInfiniteScroll();
    }
}

function resetRendering() {
    renderVersion += 1;
    renderTimers.forEach(clearTimeout);
    renderTimers.clear();
    infiniteObserver?.disconnect();
    elements.productsGrid.replaceChildren();
    renderIndex = 0;
}

function renderNextBatch() {
    const version = renderVersion;
    const slice = filteredProducts.slice(renderIndex, renderIndex + RENDER_BATCH);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    slice.forEach((product, idx) => {
        const timer = setTimeout(() => {
            renderTimers.delete(timer);
            if (version === renderVersion) elements.productsGrid.appendChild(createProductCard(product));
        }, reducedMotion ? 0 : idx * 25);
        renderTimers.add(timer);
    });
    renderIndex += slice.length;
}

function setupInfiniteScroll() {
    if (!elements.infiniteScrollSentinel) return;
    if (infiniteObserver) {
        infiniteObserver.disconnect();
    }
    const version = renderVersion;
    infiniteObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && version === renderVersion) {
                if (renderIndex < filteredProducts.length) {
                    renderNextBatch();
                }
            }
        });
    }, { rootMargin: '0px 0px 200px 0px' });
    infiniteObserver.observe(elements.infiniteScrollSentinel);
}

async function searchProducts() {
    if (isLoading) return;
    const keyword = elements.keywordInput.value.trim();
    currentKeyword = keyword;

    if (!keyword) {
        showError('Por favor, digite uma palavra-chave para buscar.');
        return;
    }

    showLoading();

    try {
        const data = await fetchProducts(keyword);
        showResults(data);

    } catch (error) {
        showError(error.publicMessage || genericError);
    } finally {
        hideLoading();
    }
}

function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.isComposing && !isLoading) {
        event.preventDefault();
        return searchProducts();
    }
}

function retrySearch() {
    if (currentKeyword) {
        elements.keywordInput.value = currentKeyword;
        return searchProducts();
    }
}

function initApp() {
    console.log('Amazon Scraper Frontend inicializado');

    if (elements.currentYear) {
        elements.currentYear.textContent = String(new Date().getFullYear());
    }

    window.themeManager = new ThemeManager();

    elements.searchBtn.addEventListener('click', searchProducts);
    elements.keywordInput.addEventListener('keydown', handleEnterKey);
    elements.retryBtn.addEventListener('click', retrySearch);

    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', applyFiltersAndRerender);
    }
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            if (elements.minPriceInput) elements.minPriceInput.value = '';
            if (elements.maxPriceInput) elements.maxPriceInput.value = '';
            if (elements.minRatingInput) elements.minRatingInput.value = '0';
            applyFiltersAndRerender();
        });
    }

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

    elements.keywordInput.focus();

    checkServerHealth();

}

async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            updateApiStatus(true);
        } else {
            updateApiStatus(false);
        }
    } catch (error) {
        updateApiStatus(false);
    }
}

function updateApiStatus(isOnline) {
    if (!elements.apiStatus || !elements.apiStatusText) return;
    elements.apiStatus.classList.remove('is-checking', 'is-online', 'is-offline');
    elements.apiStatus.classList.add(isOnline ? 'is-online' : 'is-offline');
    const message = isOnline ? 'API online' : 'API indisponível';
    elements.apiStatusText.textContent = message;
    elements.apiStatus.setAttribute('aria-label', message);
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
}, { once: true });

window.AmazonScraper = {
    searchProducts,
    retrySearch,
    showError,
    showResults
};
