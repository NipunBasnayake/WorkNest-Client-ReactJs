#!/bin/sh
set -eu

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__WORKNEST_CONFIG__ = {
  API_BASE_URL: "${VITE_API_BASE_URL:-}",
  WS_URL: "${VITE_WS_URL:-}",
  REALTIME_DISABLED: "${VITE_REALTIME_DISABLED:-false}"
};
EOF
