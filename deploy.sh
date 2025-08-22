#!/bin/bash

echo "🚀 Iniciando deploy do Amazon Scraper..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado. Por favor, instale o Node.js primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado. Por favor, instale o npm primeiro."
    exit 1
fi

# Limpar builds anteriores
log_info "Limpando builds anteriores..."
npm run clean

# Instalar dependências
log_info "Instalando dependências..."
npm run install-all

if [ $? -ne 0 ]; then
    log_error "Falha ao instalar dependências"
    exit 1
fi

# Build do frontend
log_info "Construindo frontend para produção..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Falha ao construir o frontend"
    exit 1
fi

# Verificar se os arquivos foram criados
if [ ! -f "public/index.html" ]; then
    log_error "Build não foi criado corretamente"
    exit 1
fi

log_info "✅ Deploy concluído com sucesso!"
log_info "Para iniciar o servidor em produção, execute:"
log_info "  npm start"
log_info ""
log_info "O servidor estará disponível em: http://localhost:3000"