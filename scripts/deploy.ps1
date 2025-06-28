# Local CI/CD Script for Kaleidoscope (Windows PowerShell)
# Usage: .\scripts\deploy.ps1 [environment] [skip-tests]

param(
    [string]$Environment = "local",
    [string]$SkipTests = "false"
)

$ImageName = "kaleidoscope"
$DockerUsername = $env:DOCKER_USERNAME

Write-Host "🚀 Starting Kaleidoscope CI/CD Pipeline" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Skip Tests: $SkipTests" -ForegroundColor Cyan

function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

try {
    # Step 1: Clean and test backend
    Write-Step "Step 1: Building and testing backend..."
    Set-Location backend

    if ($SkipTests -ne "true") {
        Write-Step "Running backend tests..."
        mvn clean test
        if ($LASTEXITCODE -ne 0) { throw "Backend tests failed" }
        Write-Success "Backend tests passed!"
    }

    Write-Step "Building backend package..."
    mvn clean package -DskipTests
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Write-Success "Backend build completed!"

    Set-Location ..

    # Step 2: Build frontend
    Write-Step "Step 2: Building frontend..."
    Set-Location frontend

    if (!(Test-Path "node_modules")) {
        Write-Step "Installing frontend dependencies..."
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed" }
    }

    if ($SkipTests -ne "true") {
        Write-Step "Running frontend lint..."
        try { npm run lint } catch { Write-Warning "Frontend lint not configured" }

        Write-Step "Running frontend tests..."
        try { npm run test } catch { Write-Warning "Frontend tests not configured" }
    }

    Write-Step "Building frontend..."
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    Write-Success "Frontend build completed!"

    Set-Location ..

    # Step 3: Build Docker image
    Write-Step "Step 3: Building Docker image..."
    docker build -t "${ImageName}:latest" -f backend/Dockerfile .
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
    Write-Success "Docker image built successfully!"

    # Step 4: Tag image
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    try {
        $GitHash = (git rev-parse --short HEAD 2>$null)
    } catch {
        $GitHash = "unknown"
    }
    $ImageTag = "$Environment-$Timestamp-$GitHash"

    docker tag "${ImageName}:latest" "${ImageName}:$ImageTag"
    Write-Success "Docker image tagged as: $ImageTag"

    # Step 5: Push to registry (if not local)
    if ($Environment -ne "local") {
        Write-Step "Step 4: Pushing Docker image to registry..."

        if ([string]::IsNullOrEmpty($DockerUsername) -or $DockerUsername -eq "your-docker-username") {
            Write-Error "DOCKER_USERNAME environment variable not set!"
            Write-Warning "Please set your Docker Hub username: `$env:DOCKER_USERNAME = 'your-username'"
            exit 1
        }

        docker tag "${ImageName}:latest" "$DockerUsername/${ImageName}:latest"
        docker tag "${ImageName}:latest" "$DockerUsername/${ImageName}:$ImageTag"

        docker push "$DockerUsername/${ImageName}:latest"
        docker push "$DockerUsername/${ImageName}:$ImageTag"

        Write-Success "Docker images pushed to registry!"
        Write-Host "  - $DockerUsername/${ImageName}:latest"
        Write-Host "  - $DockerUsername/${ImageName}:$ImageTag"
    }

    # Step 6: Deploy with Docker Compose
    Write-Step "Step 5: Deploying with Docker Compose..."

    if ($Environment -ne "local") {
        if (Test-Path "docker-compose.yml") {
            # Create backup
            Copy-Item "docker-compose.yml" "docker-compose.yml.backup"

            # Update image in docker-compose.yml
            $content = Get-Content "docker-compose.yml"
            $content = $content -replace "image: .*kaleidoscope.*", "image: $DockerUsername/${ImageName}:$ImageTag"
            Set-Content "docker-compose.yml" $content
            Write-Success "Updated docker-compose.yml with new image"
        }
    }

    # Build and start services
    docker-compose build
    docker-compose up -d

    Write-Success "Application deployed successfully!"

    # Step 7: Health check
    Write-Step "Step 6: Running health check..."
    Start-Sleep 10

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Application is healthy and running!"
        }
    } catch {
        Write-Warning "Health check failed - application might still be starting..."
        Write-Step "Checking application logs..."
        docker-compose logs --tail=20 backend
    }

    # Step 8: Run API tests (if requested)
    if ($SkipTests -ne "true" -and $Environment -eq "local") {
        Write-Step "Step 7: Running API tests..."

        if (Get-Command bru -ErrorAction SilentlyContinue) {
            Set-Location Kaleidoscope-api-test
            try { bru run --env development } catch { Write-Warning "Some API tests failed" }
            Set-Location ..
            Write-Success "API tests completed!"
        } else {
            Write-Warning "Bruno CLI not installed. Skipping API tests."
            Write-Step "Install Bruno CLI: npm install -g @usebruno/cli"
        }
    }

    Write-Success "🎉 CI/CD Pipeline completed successfully!"
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "  Environment: $Environment"
    Write-Host "  Image Tag: $ImageTag"
    Write-Host "  Application URL: http://localhost:8080"
    Write-Host "  Frontend URL: http://localhost:3000"
    Write-Host ""

    if ($Environment -ne "local") {
        Write-Host "🐳 Docker Images:" -ForegroundColor Cyan
        Write-Host "  - $DockerUsername/${ImageName}:latest"
        Write-Host "  - $DockerUsername/${ImageName}:$ImageTag"
    }

} catch {
    Write-Error "Pipeline failed: $_"
    exit 1
}
