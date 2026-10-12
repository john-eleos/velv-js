#!/bin/sh
set -eu

# Documentation example only. Keep real headless credentials in a server-side
# secret manager; shell-expanded headers can be visible to local process tools.
: "${BASE_URL:?Set BASE_URL explicitly; use https://api.example.test for offline examples}"
: "${HEADLESS_BEARER:?Set HEADLESS_BEARER explicitly; use a synthetic vch_ value for offline examples}"

curl --fail-with-body --silent --show-error \
  --get "${BASE_URL}/api/v2/headless/catalog" \
  --header "Authorization: Bearer ${HEADLESS_BEARER}" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=25"
