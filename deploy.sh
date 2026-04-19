#!/bin/bash
# ============================================================
# SmarterOS - Deploy Script
# Optimiza y despliega arquitectura simplificada
# ============================================================

set -e

echo "🚀 SmarterOS Deploy - Arquitectura Simplificada"
echo "================================================"
echo ""

# 1. Build FastAPI
echo "📦 1. Building FastAPI backend..."
cd /Users/mac/dev/2026/smarter-app
docker build -t smarteros-api:latest . 2>&1 | tail -3

# 2. Copiar a VPS
echo ""
echo "📤 2. Copying to VPS..."
docker save smarteros-api:latest | gzip | sshpass -p 'Chevrolet2026@' ssh root@89.116.23.167 "gunzip -c > /tmp/smarteros-api.tar && docker load -i /tmp/smarteros-api.tar" 2>&1 | tail -3

# 3. Deploy Caddy simplificado
echo ""
echo "⚙️  3. Configuring Caddy..."
sshpass -p 'Chevrolet2026@' ssh root@89.116.23.167 "
# Backup
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.\$(date +%Y%m%d)

# Crear Caddyfile limpio
cat > /etc/caddy/Caddyfile << 'CADDY_EOF'
{
    email admin@smarterbot.cl
    admin off
}

# App frontend
app.smarterbot.store {
    root * /var/www/app
    file_server
    encode gzip
    
    log {
        output file /var/log/caddy/app-access.log
        format json
    }
}

# API backend (FastAPI)
api.smarterbot.store {
    reverse_proxy smarteros-api:8000 {
        header_up Host {host}
        header_up X-Forwarded-Proto \"https\"
    }
    
    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS'
        Access-Control-Allow-Headers 'Content-Type, Authorization'
    }
    
    log {
        output file /var/log/caddy/api-access.log
        format json
    }
}

# MCP (interno, solo backend)
mcp.smarterbot.store {
    reverse_proxy n8n:5678
    
    log {
        output file /var/log/caddy/mcp-access.log
        format json
    }
}
CADDY_EOF

# Validar
caddy validate --config /etc/caddy/Caddyfile 2>&1 | grep -v 'warn\\|deprecated' || echo '✅ Validado'

# Recargar
caddy reload --config /etc/caddy/Caddyfile

echo '✅ Caddy configurado'
"

# 4. Start FastAPI container
echo ""
echo "🚀 4. Starting FastAPI..."
sshpass -p 'Chevrolet2026@' ssh root@89.116.23.167 "
docker stop smarteros-api 2>/dev/null || true
docker rm smarteros-api 2>/dev/null || true

docker run -d \\
  --name smarteros-api \\
  --restart unless-stopped \\
  --network smarteros_default \\
  -p 8000:8000 \\
  smarteros-api:latest

sleep 3
docker ps | grep smarteros-api
"

# 5. Test endpoints
echo ""
echo "🧪 5. Testing endpoints..."
sleep 2
sshpass -p 'Chevrolet2026@' ssh root@89.116.23.167 "
echo 'Health:'
curl -s https://api.smarterbot.store/health -k | jq -r '.status'

echo 'Ready:'
curl -s https://api.smarterbot.store/ready -k | jq -r '.status'
"

echo ""
echo "================================================"
echo "✅ DEPLOY COMPLETADO"
echo ""
echo "🌐 Endpoints:"
echo "   - app.smarterbot.store → Frontend"
echo "   - api.smarterbot.store → FastAPI Backend"
echo "   - mcp.smarterbot.store → MCP (interno)"
echo ""
echo "📱 App: Rebuild y push al móvil"
echo ""
