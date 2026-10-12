#!/usr/bin/env sh
set -eu

# Offline example source-verified against the backend production branch at
# b81302575918fcd91fcdb48627dd4506c6dea161 on 2026-10-09 UTC. It is not live
# deployment or connected-sandbox proof.
# Documentation example only. Generate API_KEY_CIPHERTEXT on a trusted server as:
# CryptoJS.AES.encrypt(SECRET_KEY + PUBLIC_KEY + REQUEST_REFERENCE, ENCRYPTION_KEY)
# Do not use live secrets with this shell example: expanded header arguments may
# be visible to local process inspection. Use a backend HTTP client with secret
# manager integration for production.

: "${VELVPAY_BASE_URL:=https://api.velvpay.com}"
: "${PUBLIC_KEY:?Set a synthetic or issued public key}"
: "${CREATE_API_KEY_CIPHERTEXT:?Set server-generated v1 ciphertext for CREATE_REFERENCE}"
: "${LOOKUP_API_KEY_CIPHERTEXT:?Set server-generated v1 ciphertext for LOOKUP_REFERENCE}"

CREATE_REFERENCE="ORDER-SYNTHETIC-1001"

curl --fail-with-body --silent --show-error \
  --request POST \
  "${VELVPAY_BASE_URL}/api/v1/service/payment/collection/transaction" \
  --header 'content-type: application/json' \
  --header "api-key: ${CREATE_API_KEY_CIPHERTEXT}" \
  --header "public-key: ${PUBLIC_KEY}" \
  --header "reference-id: ${CREATE_REFERENCE}" \
  --data '{"amount":125000,"isNaira":false,"validityTime":20,"email":"buyer@example.test"}'

# LOOKUP_API_KEY_CIPHERTEXT must be generated using LOOKUP_REFERENCE.
# Omitting send_webhook prevents webhook delivery; the backend still records
# activity logs and analytics for this lookup.
LOOKUP_REFERENCE="LOOKUP-SYNTHETIC-2001"
TRANSACTION_ID="FR-SYNTHETIC-1001"

curl --fail-with-body --silent --show-error \
  --get \
  "${VELVPAY_BASE_URL}/api/v1/service/payment/collection/transaction/details" \
  --header "api-key: ${LOOKUP_API_KEY_CIPHERTEXT}" \
  --header "public-key: ${PUBLIC_KEY}" \
  --header "reference-id: ${LOOKUP_REFERENCE}" \
  --data-urlencode "transaction_id=${TRANSACTION_ID}"
