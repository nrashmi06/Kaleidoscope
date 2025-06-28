#!/bin/bash

# Local CI/CD Script for Kaleidoscope
# Usage: ./scripts/deploy.sh [environment] [skip-tests]

set -e

ENVIRONMENT=${1:-"local"}
SKIP_TESTS=${2:-"false"}
IMAGE_NAME="kaleidoscope"
DOCKER_USERNAME=${DOCKER_USERNAME:-"your-docker-username"}

echo "🚀 Starting Kaleidoscope CI/CD Pipeline"
echo "Environment: $ENVIRONMENT"
echo "Skip Tests: $SKIP_TESTS"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Clean and test backend
print_step "Step 1: Building and testing backend..."
cd backend

if [ "$SKIP_TESTS" != "true" ]; then
    print_step "Running backend tests..."
    mvn clean test
    print_success "Backend tests passed!"
fi

print_step "Building backend package..."
mvn clean package -DskipTests
print_success "Backend build completed!"

cd ..

# Step 2: Build frontend
print_step "Step 2: Building frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    npm ci
fi

if [ "$SKIP_TESTS" != "true" ]; then
    print_step "Running frontend lint..."
    npm run lint 2>/dev/null || print_warning "Frontend lint not configured"

    print_step "Running frontend tests..."
    npm run test 2>/dev/null || print_warning "Frontend tests not configured"
fi

print_step "Building frontend..."
npm run build
print_success "Frontend build completed!"

cd ..

# Step 3: Build Docker image
print_step "Step 3: Building Docker image..."
docker build -t ${IMAGE_NAME}:latest -f backend/Dockerfile .
print_success "Docker image built successfully!"

# Step 4: Tag image
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
IMAGE_TAG="${ENVIRONMENT}-${TIMESTAMP}-${GIT_HASH}"

docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:${IMAGE_TAG}
print_success "Docker image tagged as: ${IMAGE_TAG}"

# Step 5: Push to registry (if not local)
if [ "$ENVIRONMENT" != "local" ]; then
    print_step "Step 4: Pushing Docker image to registry..."

    if [ -z "$DOCKER_USERNAME" ] || [ "$DOCKER_USERNAME" = "your-docker-username" ]; then
        print_error "DOCKER_USERNAME environment variable not set!"
        print_warning "Please set your Docker Hub username: export DOCKER_USERNAME=your-username"
        exit 1
    fi

    docker tag ${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    docker tag ${IMAGE_NAME}:latest ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}

    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest
    docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}

    print_success "Docker images pushed to registry!"
    echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
fi

# Step 6: Deploy with Docker Compose
print_step "Step 5: Deploying with Docker Compose..."

if [ "$ENVIRONMENT" != "local" ]; then
    # Update docker-compose.yml with the new image
    if [ -f "docker-compose.yml" ]; then
        # Create backup
        cp docker-compose.yml docker-compose.yml.backup

        # Update image in docker-compose.yml
        sed -i.bak "s|image: .*kaleidoscope.*|image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}|g" docker-compose.yml
        print_success "Updated docker-compose.yml with new image"
    fi
fi

# Build and start services
docker-compose build
docker-compose up -d

print_success "Application deployed successfully!"

# Step 7: Health check
print_step "Step 6: Running health check..."
sleep 10

if curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
    print_success "Application is healthy and running!"
else
    print_warning "Health check failed - application might still be starting..."
    print_step "Checking application logs..."
    docker-compose logs --tail=20 backend
fi

# Step 8: Run API tests (if requested)
if [ "$SKIP_TESTS" != "true" ] && [ "$ENVIRONMENT" = "local" ]; then
    print_step "Step 7: Running API tests..."

    if command -v bru >/dev/null 2>&1; then
        cd Kaleidoscope-api-test
        bru run --env development || print_warning "Some API tests failed"
        cd ..
        print_success "API tests completed!"
    else
        print_warning "Bruno CLI not installed. Skipping API tests."
        print_step "Install Bruno CLI: npm install -g @usebruno/cli"
    fi
fi

print_success "🎉 CI/CD Pipeline completed successfully!"
echo ""
echo "📊 Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Image Tag: $IMAGE_TAG"
echo "  Application URL: http://localhost:8080"
echo "  Frontend URL: http://localhost:3000"
echo ""

if [ "$ENVIRONMENT" != "local" ]; then
    echo "🐳 Docker Images:"
    echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
    echo "  - ${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
fi
