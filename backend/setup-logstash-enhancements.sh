#!/bin/bash
# Setup script for enhanced Logstash features
# This script sets up GeoIP database for IP geolocation in Logstash

echo "Setting up enhanced Logstash features..."

# Create GeoIP directory in Logstash container
docker exec kaleidoscope-logstash mkdir -p /usr/share/GeoIP

# Download GeoLite2 City database (free version from MaxMind)
echo "Downloading GeoLite2 database..."
curl -L "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb" \
  -o GeoLite2-City.mmdb

# Copy database to Logstash container
docker cp GeoLite2-City.mmdb kaleidoscope-logstash:/usr/share/GeoIP/

# Clean up local file
rm GeoLite2-City.mmdb

echo "GeoIP database setup complete!"
echo "Restarting Logstash to enable geolocation features..."

# Restart Logstash to enable GeoIP
docker restart kaleidoscope-logstash

echo "Setup complete! Your Logstash now has:"
echo "✅ IP Geolocation (Country, City, Coordinates)"
echo "✅ User Agent Parsing (Browser, OS, Device)"
echo "✅ Request Categorization (API types, Performance)"
echo "✅ Security Event Detection"
echo "✅ Bot Detection"
echo "✅ Business Hours Classification"
echo "✅ Timestamp Enrichment"
