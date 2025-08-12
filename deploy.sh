#!/bin/bash

echo "🚀 Deploying MaxEvo to DigitalOcean App Platform..."

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your DigitalOcean access token"
    echo "Usage: ./deploy.sh YOUR_DO_ACCESS_TOKEN"
    exit 1
fi

DO_TOKEN=$1

# Authenticate with DigitalOcean
echo "🔐 Authenticating with DigitalOcean..."
doctl auth init --access-token $DO_TOKEN

# Deploy the app
echo "📦 Creating MaxEvo app on DigitalOcean..."
doctl apps create .do/app.yaml --wait

echo "✅ MaxEvo deployed successfully!"
echo "🌐 Check your apps at: https://cloud.digitalocean.com/apps"
echo "📝 Remember to set your environment variables:"
echo "   - SERPER_API_KEY: Your Serper API key"
echo "   - DATABASE_URL will be auto-configured"