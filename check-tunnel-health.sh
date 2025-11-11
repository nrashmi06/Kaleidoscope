#!/bin/bash
# Health check script for SSH tunnel and services
# Usage: ./check-tunnel-health.sh

echo "=== SSH Tunnel Health Check ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if SSH tunnel process is running
echo "1. Checking SSH tunnel process..."
if pgrep -f "ssh.*6379.*9200.*165.232.179.167" &>/dev/null; then
    echo -e "${GREEN}✓ SSH tunnel process is running${NC}"
else
    echo -e "${RED}✗ SSH tunnel process is NOT running${NC}"
    echo -e "${YELLOW}  Start it with: ./backend/ssh-tunnel.sh${NC}"
fi
echo ""

# Check if ports are listening
echo "2. Checking if ports are listening..."
if lsof -Pi :6379 -sTCP:LISTEN -t &>/dev/null; then
    echo -e "${GREEN}✓ Port 6379 (Redis) is listening${NC}"
else
    echo -e "${RED}✗ Port 6379 (Redis) is NOT listening${NC}"
fi

if lsof -Pi :9200 -sTCP:LISTEN -t &>/dev/null; then
    echo -e "${GREEN}✓ Port 9200 (Elasticsearch) is listening${NC}"
else
    echo -e "${RED}✗ Port 9200 (Elasticsearch) is NOT listening${NC}"
fi
echo ""

# Check Redis connectivity
echo "3. Testing Redis connection..."
if command -v redis-cli &>/dev/null; then
    if redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ Redis is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Redis port is open but PING failed (might need password)${NC}"
        echo -e "${YELLOW}  Try: redis-cli -h localhost -p 6379 -a YOUR_PASSWORD ping${NC}"
    fi
else
    echo -e "${YELLOW}⚠ redis-cli not installed, cannot test Redis connection${NC}"
    echo -e "  Install with: sudo apt-get install redis-tools  (Ubuntu/Debian)"
    echo -e "  Or: brew install redis  (macOS)"
fi
echo ""

# Check Elasticsearch connectivity
echo "4. Testing Elasticsearch connection..."
if command -v curl &>/dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Elasticsearch is responding${NC}"
        echo "  Cluster info:"
        curl -s http://localhost:9200 | head -n 5
    else
        echo -e "${RED}✗ Elasticsearch is NOT responding (HTTP $HTTP_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ curl not installed, cannot test Elasticsearch connection${NC}"
fi
echo ""

# Check if Spring Boot is likely to connect
echo "5. Overall tunnel health..."
TUNNEL_OK=true

if ! pgrep -f "ssh.*6379.*9200.*165.232.179.167" &>/dev/null; then
    TUNNEL_OK=false
fi

if ! lsof -Pi :6379 -sTCP:LISTEN -t &>/dev/null || ! lsof -Pi :9200 -sTCP:LISTEN -t &>/dev/null; then
    TUNNEL_OK=false
fi

if [ "$TUNNEL_OK" = true ]; then
    echo -e "${GREEN}✓ SSH tunnel appears healthy!${NC}"
    echo -e "${GREEN}  Your Spring Boot application should be able to connect.${NC}"
else
    echo -e "${RED}✗ SSH tunnel has issues${NC}"
    echo -e "${YELLOW}  Fix the issues above before running your application.${NC}"
fi

echo ""
echo "=== End Health Check ==="

