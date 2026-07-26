#!/usr/bin/env bash
set -Eeuo pipefail
umask 027

# IndiaNikah AI Content Hub: isolated deployment for a multi-site VPS.
# Target: ai.indianikah.com -> 31.97.60.150
#
# Optional before running:
#   export EXISTING_SITE_URLS="https://www.indianikah.com https://example.com"
#
# This script intentionally does NOT:
# - upgrade the OS or globally replace Node.js;
# - change firewall rules;
# - remove/edit existing Nginx sites;
# - use "certbot --nginx";
# - expose the Node.js port publicly.

DOMAIN="ai.indianikah.com"
EXPECTED_IP="31.97.60.150"
APP_PORT="3107"
APP_USER="contenthub"
APP_GROUP="contenthub"
APP_HOME="/srv/indianikah-content-hub"
APP_DIR="${APP_HOME}/app"
NODE_VERSION="22.17.0"
NODE_RUNTIME="${APP_HOME}/runtime/node"
NODE_BIN="${NODE_RUNTIME}/bin/node"
NPM_BIN="${NODE_RUNTIME}/bin/npm"
NPX_BIN="${NODE_RUNTIME}/bin/npx"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
REPOSITORY="https://github.com/indianikahcom/indianikah-content-hub.git"
BRANCH="feature/backend-bootstrap"
SERVICE_NAME="indianikah-content-hub"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
NGINX_SITE="/etc/nginx/sites-available/${SERVICE_NAME}.conf"
NGINX_LINK="/etc/nginx/sites-enabled/${SERVICE_NAME}.conf"
AUTH_FILE="/etc/nginx/.htpasswd-contenthub"
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
SAFETY_DIR="/root/${SERVICE_NAME}-deployment-${RUN_ID}"
NGINX_MANIFEST="${SAFETY_DIR}/nginx-existing.sha256"
SITE_BASELINE="${SAFETY_DIR}/existing-sites-before.txt"
LOG_FILE="${SAFETY_DIR}/deployment.log"
NEW_NGINX_LINK_CREATED="false"

mkdir -p "${SAFETY_DIR}"
touch "${LOG_FILE}"
chmod 700 "${SAFETY_DIR}"
chmod 600 "${LOG_FILE}"
exec > >(tee -a "${LOG_FILE}") 2>&1

step() {
    printf '\n============================================================\n'
    printf 'STEP: %s\n' "$1"
    printf '============================================================\n'
}

die() {
    printf '\nERROR: %s\n' "$*" >&2
    printf 'No existing Nginx configuration was intentionally changed.\n' >&2
    printf 'Deployment log: %s\n' "${LOG_FILE}" >&2
    exit 1
}

require_command() {
    command -v "$1" >/dev/null 2>&1 ||
        die "Required command '$1' is missing. Install it separately, review the impact, and rerun."
}

run_as_app() {
    sudo -u "${APP_USER}" env \
        "PATH=${NODE_RUNTIME}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
        "NPM_CONFIG_REGISTRY=https://registry.npmjs.org/" \
        "NPM_CONFIG_AUDIT=false" \
        "NPM_CONFIG_FETCH_RETRIES=4" \
        "NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=10000" \
        "NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000" \
        "NPM_CONFIG_FETCH_TIMEOUT=300000" \
        "$@"
}

npm_ci_with_retries() {
    local directory="$1"
    local attempt

    for attempt in 1 2 3; do
        echo "Running npm ci in ${directory} (attempt ${attempt}/3)."
        if (
            cd "${directory}"
            run_as_app "${NPM_BIN}" ci \
                --registry="https://registry.npmjs.org/" \
                --no-audit
        ); then
            return 0
        fi

        if (( attempt < 3 )); then
            echo "npm ci failed; waiting $((attempt * 15)) seconds before retry."
            sleep "$((attempt * 15))"
        fi
    done

    die "npm ci failed three times in ${directory}."
}

verify_existing_nginx_files() {
    if ! sha256sum --check --quiet "${NGINX_MANIFEST}"; then
        die "A pre-existing Nginx configuration file changed. Review ${NGINX_MANIFEST} and ${SAFETY_DIR}."
    fi
    echo "Verified: every pre-existing Nginx configuration file is unchanged."
}

check_existing_sites() {
    local phase="$1"
    local output="$2"
    : > "${output}"

    if [[ -z "${EXISTING_SITE_URLS:-}" ]]; then
        echo "EXISTING_SITE_URLS was not supplied; skipping HTTP checks for existing sites."
        return
    fi

    local url
    for url in ${EXISTING_SITE_URLS}; do
        local status
        status="$(curl --silent --show-error --location \
            --output /dev/null --write-out '%{http_code}' \
            --connect-timeout 10 --max-time 30 "${url}")" ||
            die "${phase}: existing site failed: ${url}"

        # A deliberate 401/403/404 can be the normal response for an API,
        # private app, or host without a public root page. A connection failure
        # (000) or server error (5xx) is considered unhealthy.
        [[ "${status}" =~ ^[1234][0-9][0-9]$ ]] ||
            die "${phase}: existing site ${url} returned HTTP ${status}"

        printf '%s %s\n' "${url}" "${status}" | tee -a "${output}"
    done
}

cleanup_on_error() {
    local exit_code=$?
    if (( exit_code == 0 )); then
        return
    fi

    echo "Deployment stopped with exit code ${exit_code}."

    if [[ "${NEW_NGINX_LINK_CREATED}" == "true" && -L "${NGINX_LINK}" ]]; then
        rm -f -- "${NGINX_LINK}"
        if nginx -t; then
            systemctl reload nginx || true
            echo "Removed only the newly created Content Hub Nginx symlink."
        fi
    fi
}
trap cleanup_on_error EXIT

step "Preflight: root, tools, services, port, DNS, and conflicts"

[[ "${EUID}" -eq 0 ]] || die "Run this script as root."

for command_name in nginx systemctl git curl sha256sum tar getent htpasswd certbot sudo ss uname awk; do
    require_command "${command_name}"
done

systemctl is-active --quiet nginx || die "Nginx is not currently active."
nginx -t || die "Existing Nginx configuration is invalid before deployment."

if ss -lntH "sport = :${APP_PORT}" | grep -q .; then
    die "Port ${APP_PORT} is already in use."
fi
echo "Verified: localhost application port ${APP_PORT} is available."

mapfile -t RESOLVED_IPS < <(getent ahostsv4 "${DOMAIN}" | awk '{print $1}' | sort -u)
printf 'DNS IPv4 result(s): %s\n' "${RESOLVED_IPS[*]:-none}"
printf '%s\n' "${RESOLVED_IPS[@]:-}" | grep -Fxq "${EXPECTED_IP}" ||
    die "${DOMAIN} does not resolve to ${EXPECTED_IP}."

if nginx -T 2>&1 |
    awk -v target="${NGINX_SITE}" '
        /^# configuration file / {
            current=$4
            sub(/:$/, "", current)
        }
        current != target && $1 == "server_name" {
            for (i=2; i<=NF; i++) {
                value=$i
                sub(/;$/, "", value)
                if (value == "ai.indianikah.com") found=1
            }
        }
        END { exit(found ? 0 : 1) }
    '; then
    die "Another Nginx configuration already declares server_name ${DOMAIN}."
fi

[[ ! -e "${SERVICE_FILE}" ]] ||
    die "${SERVICE_FILE} already exists; refusing to overwrite it."
[[ ! -e "${NGINX_SITE}" ]] ||
    die "${NGINX_SITE} already exists; refusing to overwrite it."
[[ ! -e "${NGINX_LINK}" ]] ||
    die "${NGINX_LINK} already exists; refusing to overwrite it."
[[ ! -e "${APP_DIR}" ]] ||
    die "${APP_DIR} already exists; refusing to overwrite an existing deployment."

echo "Preflight passed."

step "Snapshot existing Nginx configuration and existing sites"

tar -czf "${SAFETY_DIR}/nginx-before.tar.gz" /etc/nginx

find /etc/nginx -type f \
    ! -path "${NGINX_SITE}" \
    ! -path "${AUTH_FILE}" \
    -print0 |
    sort -z |
    xargs -0 sha256sum > "${NGINX_MANIFEST}"

nginx -T > "${SAFETY_DIR}/nginx-before.txt" 2>&1
check_existing_sites "Before deployment" "${SITE_BASELINE}"
verify_existing_nginx_files

step "Create isolated Linux user and clone the requested branch"

if ! getent group "${APP_GROUP}" >/dev/null; then
    addgroup --system "${APP_GROUP}"
fi

if ! id "${APP_USER}" >/dev/null 2>&1; then
    adduser --system \
        --ingroup "${APP_GROUP}" \
        --home "${APP_HOME}" \
        --shell /usr/sbin/nologin \
        "${APP_USER}"
fi

install -d -o "${APP_USER}" -g "${APP_GROUP}" "${APP_HOME}"

case "$(uname -m)" in
    x86_64) NODE_ARCH="x64" ;;
    aarch64|arm64) NODE_ARCH="arm64" ;;
    *) die "Unsupported server architecture: $(uname -m)" ;;
esac

NODE_ARCHIVE="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
NODE_DOWNLOAD="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}"
NODE_TEMP="$(mktemp -d)"

echo "Installing isolated Node.js v${NODE_VERSION} runtime for ${APP_USER}."
curl --fail --location --silent --show-error \
    "${NODE_DOWNLOAD}" \
    --output "${NODE_TEMP}/${NODE_ARCHIVE}"
curl --fail --location --silent --show-error \
    "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" \
    --output "${NODE_TEMP}/SHASUMS256.txt"

(
    cd "${NODE_TEMP}"
    grep " ${NODE_ARCHIVE}\$" SHASUMS256.txt | sha256sum --check -
) || die "The isolated Node.js download failed checksum verification."

install -d -o "${APP_USER}" -g "${APP_GROUP}" "${NODE_RUNTIME}"
tar -xJf "${NODE_TEMP}/${NODE_ARCHIVE}" \
    --strip-components=1 \
    -C "${NODE_RUNTIME}"
chown -R "${APP_USER}:${APP_GROUP}" "${NODE_RUNTIME}"
rm -rf -- "${NODE_TEMP}"

run_as_app "${NODE_BIN}" --version
run_as_app "${NPM_BIN}" --version

sudo -u "${APP_USER}" git clone \
    --branch "${BRANCH}" \
    --single-branch \
    "${REPOSITORY}" \
    "${APP_DIR}"

verify_existing_nginx_files
check_existing_sites "After repository clone" "${SAFETY_DIR}/existing-sites-after-clone.txt"

step "Install dependencies and build in isolated application directories"

npm_ci_with_retries "${BACKEND_DIR}"
(
    cd "${BACKEND_DIR}"
    run_as_app env \
        'DATABASE_URL=file:./prisma/production.db' \
        "${NPX_BIN}" prisma generate
)

sudo -u "${APP_USER}" cp "${FRONTEND_DIR}/.env.example" "${FRONTEND_DIR}/.env.production"
npm_ci_with_retries "${FRONTEND_DIR}"
(
    cd "${FRONTEND_DIR}"
    run_as_app "${NPM_BIN}" run build
)

[[ -f "${FRONTEND_DIR}/dist/index.html" ]] ||
    die "Frontend build did not create dist/index.html."

# Grant Nginx traversal/read access only to the compiled public frontend.
chmod o+x "${APP_HOME}" "${APP_DIR}" "${FRONTEND_DIR}"
chmod -R o+rX "${FRONTEND_DIR}/dist"

verify_existing_nginx_files
check_existing_sites "After application build" "${SAFETY_DIR}/existing-sites-after-build.txt"

step "Create the private backend environment"

read -r -p "Production MySQL database name [django]: " PROD_DB_NAME_INPUT
PROD_DB_NAME_INPUT="${PROD_DB_NAME_INPUT:-django}"
read -r -p "Production MySQL read-only username [contenthub_reader]: " PROD_DB_USER_INPUT
PROD_DB_USER_INPUT="${PROD_DB_USER_INPUT:-contenthub_reader}"
read -r -s -p "Production MySQL read-only password: " PROD_DB_PASSWORD_INPUT
printf '\n'
[[ -n "${PROD_DB_PASSWORD_INPUT}" ]] || die "MySQL password cannot be empty."

read -r -s -p "OpenAI API key: " OPENAI_API_KEY_INPUT
printf '\n'
[[ -n "${OPENAI_API_KEY_INPUT}" ]] || die "OpenAI API key cannot be empty."

read -r -s -p "Telegram bot token: " TELEGRAM_BOT_TOKEN_INPUT
printf '\n'
[[ -n "${TELEGRAM_BOT_TOKEN_INPUT}" ]] || die "Telegram bot token cannot be empty."

read -r -p "Telegram channel ID [@IndiaNikah]: " TELEGRAM_CHANNEL_INPUT
TELEGRAM_CHANNEL_INPUT="${TELEGRAM_CHANNEL_INPUT:-@IndiaNikah}"

install -d -o "${APP_USER}" -g "${APP_GROUP}" \
    "${BACKEND_DIR}/public/generated-media"

install -o "${APP_USER}" -g "${APP_GROUP}" -m 600 /dev/null "${BACKEND_DIR}/.env"
{
    printf 'PORT=%s\n' "${APP_PORT}"
    printf 'NODE_ENV=production\n'
    printf 'APP_NAME=IndiaNikah AI Content Hub\n'
    printf 'APP_VERSION=0.1.0\n'
    printf 'DATABASE_URL="file:./prisma/production.db"\n'
    printf 'PROD_DB_HOST=127.0.0.1\n'
    printf 'PROD_DB_PORT=3306\n'
    printf 'PROD_DB_NAME=%s\n' "${PROD_DB_NAME_INPUT}"
    printf 'PROD_DB_USER=%s\n' "${PROD_DB_USER_INPUT}"
    printf 'PROD_DB_PASSWORD=%s\n' "${PROD_DB_PASSWORD_INPUT}"
    printf 'PROD_DB_POOL_SIZE=3\n'
    printf 'AI_GENERATION_ENABLED=true\n'
    printf 'OPENAI_API_KEY=%s\n' "${OPENAI_API_KEY_INPUT}"
    printf 'OPENAI_MODEL=gpt-5.4-mini\n'
    printf 'CONTENT_AUTOMATION_MODE=FULL_AUTO\n'
    printf 'AUTO_APPROVE_ENABLED=true\n'
    printf 'AUTO_PUBLISH_ENABLED=true\n'
    printf 'PROFILE_SUMMARY_SCHEDULER_ENABLED=true\n'
    printf 'PROFILE_SUMMARY_HOUR_IST=10\n'
    printf 'PROFILE_SUMMARY_MINUTE_IST=0\n'
    printf 'WEEKLY_CONTENT_SCHEDULER_ENABLED=true\n'
    printf 'WEEKLY_CONTENT_HOUR_IST=20\n'
    printf 'WEEKLY_CONTENT_MINUTE_IST=30\n'
    printf 'MAX_AUTO_POSTS_PER_DAY=2\n'
    printf 'CONTENT_QUEUE_SCHEDULER_ENABLED=false\n'
    printf 'CONTENT_QUEUE_CRON_ENABLED=false\n'
    printf 'QUEUE_AUTO_PUBLISH=false\n'
    printf 'PROFILE_IMPORT_CRON_ENABLED=false\n'
    printf 'ENABLED_PUBLISH_PLATFORMS=TELEGRAM\n'
    printf 'PUBLISH_PLATFORMS=TELEGRAM\n'
    printf 'TELEGRAM_PUBLISH_ENABLED=true\n'
    printf 'TELEGRAM_BOT_TOKEN=%s\n' "${TELEGRAM_BOT_TOKEN_INPUT}"
    printf 'TELEGRAM_CHANNEL_ID=%s\n' "${TELEGRAM_CHANNEL_INPUT}"
    printf 'FACEBOOK_PUBLISH_ENABLED=false\n'
    printf 'INSTAGRAM_PUBLISH_ENABLED=false\n'
    printf 'X_PUBLISH_ENABLED=false\n'
    printf 'SEND_PUBLISH_EMAIL_REPORT=false\n'
    printf 'INSTAGRAM_MEDIA_PUBLIC_BASE_URL=https://%s/generated-media\n' "${DOMAIN}"
    printf 'INSTAGRAM_MEDIA_OUTPUT_DIR=public/generated-media\n'
} > "${BACKEND_DIR}/.env"

unset PROD_DB_PASSWORD_INPUT OPENAI_API_KEY_INPUT TELEGRAM_BOT_TOKEN_INPUT
chown "${APP_USER}:${APP_GROUP}" "${BACKEND_DIR}/.env"
chmod 600 "${BACKEND_DIR}/.env"

(
    cd "${BACKEND_DIR}"
    run_as_app "${NPX_BIN}" prisma migrate deploy
)

verify_existing_nginx_files
check_existing_sites "After database preparation" "${SAFETY_DIR}/existing-sites-after-database.txt"

step "Create and start a dedicated systemd service"

cat > "${SERVICE_FILE}" <<EOF
[Unit]
Description=IndiaNikah Content Hub Backend
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${BACKEND_DIR}
Environment=NODE_ENV=production
Environment=PATH=${NODE_RUNTIME}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=${NODE_BIN} ${BACKEND_DIR}/src/server.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=${BACKEND_DIR}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "${SERVICE_NAME}"

for attempt in {1..20}; do
    if curl --silent --fail "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null; then
        break
    fi
    if (( attempt == 20 )); then
        journalctl -u "${SERVICE_NAME}" -n 100 --no-pager || true
        die "Backend health check failed."
    fi
    sleep 1
done

systemctl is-active --quiet "${SERVICE_NAME}" ||
    die "The new backend service is not active."

verify_existing_nginx_files
check_existing_sites "After backend startup" "${SAFETY_DIR}/existing-sites-after-backend.txt"

step "Create isolated Basic Authentication credentials"

read -r -p "Admin username [contentadmin]: " ADMIN_USER_INPUT
ADMIN_USER_INPUT="${ADMIN_USER_INPUT:-contentadmin}"
[[ "${ADMIN_USER_INPUT}" =~ ^[A-Za-z0-9._-]+$ ]] ||
    die "Admin username contains unsupported characters."

htpasswd -c "${AUTH_FILE}" "${ADMIN_USER_INPUT}"
chmod 640 "${AUTH_FILE}"
chown root:www-data "${AUTH_FILE}"

step "Create only the new HTTP Nginx virtual host"

cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${FRONTEND_DIR}/dist;
    index index.html;

    access_log /var/log/nginx/${SERVICE_NAME}.access.log;
    error_log /var/log/nginx/${SERVICE_NAME}.error.log;
    client_max_body_size 20m;

    location ^~ /.well-known/acme-challenge/ {
        auth_basic off;
        try_files \$uri =404;
    }

    location /generated-media/ {
        auth_basic off;
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        auth_basic "IndiaNikah Content Hub";
        auth_basic_user_file ${AUTH_FILE};
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        auth_basic "IndiaNikah Content Hub";
        auth_basic_user_file ${AUTH_FILE};
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -s "${NGINX_SITE}" "${NGINX_LINK}"
NEW_NGINX_LINK_CREATED="true"
nginx -t || die "New HTTP Nginx configuration failed validation."
verify_existing_nginx_files
systemctl reload nginx

check_existing_sites "After HTTP Nginx reload" "${SAFETY_DIR}/existing-sites-after-http.txt"

step "Obtain HTTPS certificate without allowing Certbot to edit Nginx"

certbot certonly \
    --webroot \
    --webroot-path "${FRONTEND_DIR}/dist" \
    --domain "${DOMAIN}"

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
[[ -f "${CERT_DIR}/fullchain.pem" && -f "${CERT_DIR}/privkey.pem" ]] ||
    die "Certificate files were not created."

verify_existing_nginx_files

step "Replace only the new virtual host with its HTTPS configuration"

cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root ${FRONTEND_DIR}/dist;
        auth_basic off;
        try_files \$uri =404;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root ${FRONTEND_DIR}/dist;
    index index.html;

    access_log /var/log/nginx/${SERVICE_NAME}.access.log;
    error_log /var/log/nginx/${SERVICE_NAME}.error.log;
    client_max_body_size 20m;

    location /generated-media/ {
        auth_basic off;
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        auth_basic "IndiaNikah Content Hub";
        auth_basic_user_file ${AUTH_FILE};
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    location / {
        auth_basic "IndiaNikah Content Hub";
        auth_basic_user_file ${AUTH_FILE};
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

nginx -t || die "New HTTPS Nginx configuration failed validation."
verify_existing_nginx_files
systemctl reload nginx

step "Final checks: new application and all supplied existing sites"

curl --silent --show-error --fail \
    --user "${ADMIN_USER_INPUT}" \
    "https://${DOMAIN}/api/health" >/dev/null ||
    die "Public HTTPS health check failed."

check_existing_sites "Final verification" "${SAFETY_DIR}/existing-sites-final.txt"
verify_existing_nginx_files

systemctl is-active --quiet nginx || die "Nginx is not active."
systemctl is-active --quiet "${SERVICE_NAME}" || die "Content Hub service is not active."
nginx -t

trap - EXIT
NEW_NGINX_LINK_CREATED="false"

printf '\nDeployment completed safely.\n'
printf 'URL: https://%s\n' "${DOMAIN}"
printf 'Backend: http://127.0.0.1:%s\n' "${APP_PORT}"
printf 'Safety backup and log: %s\n' "${SAFETY_DIR}"
printf '\nPublishing schedule (Asia/Kolkata):\n'
printf '  Daily 10:00 - 24-hour profile summary\n'
printf '  Daily 20:30 - Monday News, Tuesday Blog, Wednesday Book,\n'
printf '                Thursday Video, Friday Quran, Saturday Hadith, Sunday Dua\n'
