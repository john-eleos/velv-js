#!/bin/sh
set -eu

# Documentation example only. Keep real headless credentials in a server-side
# secret manager; shell-expanded headers can be visible to local process tools.
BASE_URL="${BASE_URL:-https://api.velvpay.com}"
HEADLESS_BEARER="${HEADLESS_BEARER:-vch_SYNTHETIC_DOCUMENTATION_ONLY_0000000000}"

curl --fail-with-body --silent --show-error \
  --get "${BASE_URL}/api/v2/headless/catalog" \
  --header "Authorization: Bearer ${HEADLESS_BEARER}" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=25"
