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
    retryBtn: document.getElementById('retryBtn')
};

// Estado da aplicação criada
let currentKeyword = '';
let isLoading = false;

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
    elements.errorMessage.textContent = message;
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
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <img 
                src="${product.imageUrl || 'https://via.placeholder.com/200x200?text=Sem+Imagem'}" 
                alt="${product.title}"
                class="product-image"
                onerror="this.src='https://via.placeholder.com/200x200?text=Erro+na+Imagem'"
            >
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">${product.price}</div>
            <div class="product-rating">
                ${starsHTML}
                <span>${product.rating}</span>
            </div>
            <div class="product-reviews">
                ${product.reviews} avaliações
            </div>
            ${product.productUrl ? `<a href="${product.productUrl}" target="_blank" class="product-link">Ver na Amazon</a>` : ''}
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
    
    // Limpar grid de produtos
    elements.productsGrid.innerHTML = '';
    
    if (products && products.length > 0) {
        // Adicionar produtos ao grid
        products.forEach(product => {
            elements.productsGrid.innerHTML += createProductCard(product);
        });
        
        // Mostra a seção de resultados 
        toggleElement(elements.resultsSection, true);
        toggleElement(elements.emptyState, false);
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
    
    // Event listeners
    elements.searchBtn.addEventListener('click', searchProducts);
    elements.keywordInput.addEventListener('keypress', handleEnterKey);
    elements.retryBtn.addEventListener('click', retrySearch);
    
    // Focar no input ao carregar a página sem emição de erros 
    elements.keywordInput.focus();
    
    // Verificar se o servidor está rodando sem problemas 
    checkServerHealth();
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
    addSmoothAnimations();
});

// Exportar funções para uso global (se necessário)
window.AmazonScraper = {
    searchProducts,
    retrySearch,
    showError,
    showResults
}; 