#!/bin/bash

# 🚀 Script de Deploy Automático - Cosmetics API
# Este script automatiza el proceso de deploy del proyecto

set -e  # Salir si hay algún error

echo "🚀 Iniciando deploy de Cosmetics API..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

# Función para deploy del frontend
deploy_frontend() {
    print_step "Deployando Frontend..."
    
    if [ ! -d "frontend" ]; then
        print_error "Directorio frontend no encontrado"
        return 1
    fi
    
    cd frontend
    
    # Verificar si existe .env.production
    if [ ! -f ".env.production" ]; then
        print_warning "Archivo .env.production no encontrado"
        print_message "Copiando .env.production.example..."
        cp env.production.example .env.production
        print_warning "Por favor, configura las variables de entorno en .env.production antes de continuar"
        read -p "¿Continuar con el deploy? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_message "Deploy cancelado"
            cd ..
            return 1
        fi
    fi
    
    # Instalar dependencias
    print_message "Instalando dependencias..."
    npm install
    
    # Build de producción
    print_message "Construyendo para producción..."
    npm run build:prod
    
    # Verificar si el build fue exitoso
    if [ $? -eq 0 ]; then
        print_message "✅ Build exitoso!"
    else
        print_error "❌ Build falló"
        cd ..
        return 1
    fi
    
    # Deploy a Vercel (si está configurado)
    if command -v vercel &> /dev/null; then
        print_message "Deployando a Vercel..."
        vercel --prod --yes
    else
        print_warning "Vercel CLI no está instalado"
        print_message "Para instalar: npm i -g vercel"
        print_message "Para deploy manual: vercel --prod"
    fi
    
    cd ..
}

# Función para deploy del backend
deploy_backend() {
    print_step "Deployando Backend..."
    
    if [ ! -d "backend" ]; then
        print_error "Directorio backend no encontrado"
        return 1
    fi
    
    cd backend
    
    # Verificar si existe .env
    if [ ! -f ".env" ]; then
        print_warning "Archivo .env no encontrado"
        print_message "Por favor, crea un archivo .env con las variables de entorno necesarias"
        cd ..
        return 1
    fi
    
    # Instalar dependencias
    print_message "Instalando dependencias..."
    npm install
    
    # Verificar que el servidor inicia correctamente
    print_message "Verificando que el servidor inicia correctamente..."
    timeout 10s npm start || {
        print_error "El servidor no pudo iniciarse correctamente"
        cd ..
        return 1
    }
    
    print_message "✅ Backend listo para deploy!"
    print_message "Para deploy a Railway:"
    print_message "1. Ve a railway.app"
    print_message "2. Conecta tu repositorio"
    print_message "3. Configura las variables de entorno"
    print_message "4. Deploy automático"
    
    cd ..
}

# Función para verificar el estado del proyecto
check_project_status() {
    print_step "Verificando estado del proyecto..."
    
    # Verificar Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_message "Node.js: $NODE_VERSION"
    else
        print_error "Node.js no está instalado"
        exit 1
    fi
    
    # Verificar npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_message "npm: $NPM_VERSION"
    else
        print_error "npm no está instalado"
        exit 1
    fi
    
    # Verificar estructura del proyecto
    if [ -d "frontend" ]; then
        print_message "✅ Frontend encontrado"
    else
        print_warning "⚠️  Frontend no encontrado"
    fi
    
    if [ -d "backend" ]; then
        print_message "✅ Backend encontrado"
    else
        print_warning "⚠️  Backend no encontrado"
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "🚀 Script de Deploy - Cosmetics API"
    echo ""
    echo "Uso:"
    echo "  ./deploy.sh [opción]"
    echo ""
    echo "Opciones:"
    echo "  frontend    Deploy solo del frontend"
    echo "  backend     Deploy solo del backend"
    echo "  all         Deploy completo (frontend + backend)"
    echo "  check       Verificar estado del proyecto"
    echo "  help        Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy.sh all"
    echo "  ./deploy.sh frontend"
    echo "  ./deploy.sh check"
}

# Función principal
main() {
    case "${1:-all}" in
        "frontend")
            check_project_status
            deploy_frontend
            ;;
        "backend")
            check_project_status
            deploy_backend
            ;;
        "all")
            check_project_status
            deploy_backend
            deploy_frontend
            ;;
        "check")
            check_project_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Opción inválida: $1"
            show_help
            exit 1
            ;;
    esac
    
    print_message "🎉 Deploy completado!"
    print_message "Revisa los logs arriba para verificar que todo esté funcionando"
}

# Ejecutar función principal
main "$@"
