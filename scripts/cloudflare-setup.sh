#!/usr/bin/env bash
# Configura en Cloudflare las cabeceras de seguridad, HSTS y las redirecciones 301 que
# GitHub Pages no puede emitir. Ver docs/seo/CLOUDFLARE-SETUP.md.
#
# Uso (por defecto es un ensayo: imprime lo que enviaría y no cambia nada):
#   export CF_API_TOKEN=...            # token con permisos Zone:Transform Rules/Redirect Rules/Zone Settings: Edit
#   scripts/cloudflare-setup.sh        # ensayo
#   APPLY=1 scripts/cloudflare-setup.sh
#
# AVISO: los PUT sobre /rulesets/phases/.../entrypoint REEMPLAZAN las reglas existentes de esa
# fase. Revisa antes en el panel si ya tienes reglas de redirección/cabeceras propias.
set -euo pipefail

ZONE_NAME="${CF_ZONE:-alimentosnewyork.com}"
API="https://api.cloudflare.com/client/v4"
: "${CF_API_TOKEN:?Define CF_API_TOKEN}"

headers=(-H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json")

HEADERS_RULESET='{
  "rules": [{
    "action": "rewrite",
    "expression": "true",
    "description": "Cabeceras de seguridad (SEO tecnico)",
    "action_parameters": { "headers": {
      "X-Content-Type-Options": { "operation": "set", "value": "nosniff" },
      "X-Frame-Options":        { "operation": "set", "value": "SAMEORIGIN" },
      "Referrer-Policy":        { "operation": "set", "value": "strict-origin-when-cross-origin" },
      "Permissions-Policy":     { "operation": "set", "value": "camera=(), microphone=(), geolocation=()" }
    } }
  }]
}'

redirect_rule() { # $1 descripcion  $2 expresion  $3 destino
  printf '{"action":"redirect","description":"%s","expression":"%s","action_parameters":{"from_value":{"status_code":301,"preserve_query_string":false,"target_url":{"value":"%s"}}}}' "$1" "$2" "$3"
}
REDIRECTS_RULESET="{\"rules\":[
$(redirect_rule 'sobre-nosotros -> empresa' '(http.request.uri.path in {\"/sobre-nosotros\" \"/sobre-nosotros/\"})' '/empresa/'),
$(redirect_rule 'cocinando-con-amor -> guia tecnica' '(http.request.uri.path in {\"/cocinando-con-amor\" \"/cocinando-con-amor/\"})' '/documentacion/guia-tecnica/'),
$(redirect_rule 'blog miga de memoria 1' '(http.request.uri.path eq \"/blog/miga-de-memoria-pan-brioche-hamburguesa-gourmet-caracas/\")' '/blog/pan-brioche-hamburguesas-caracas/'),
$(redirect_rule 'blog miga de memoria 2' '(http.request.uri.path eq \"/blog/por-que-la-miga-de-memoria-en-el-pan-brioche-es-el-secreto-de-una-hamburguesa-gourmet-perfecta/\")' '/blog/pan-brioche-hamburguesas-caracas/')
]}"

HSTS='{"value":{"strict_transport_security":{"enabled":true,"max_age":15552000,"include_subdomains":false,"preload":false,"nosniff":true}}}'

for payload in "$HEADERS_RULESET" "$REDIRECTS_RULESET" "$HSTS"; do
  echo "$payload" | python3 -m json.tool >/dev/null || { echo "JSON invalido"; exit 1; }
done

if [ "${APPLY:-0}" != "1" ]; then
  echo "== ENSAYO (APPLY=1 para aplicar) =="
  echo "--- Cabeceras"; echo "$HEADERS_RULESET" | python3 -m json.tool
  echo "--- Redirecciones 301"; echo "$REDIRECTS_RULESET" | python3 -m json.tool
  echo "--- HSTS"; echo "$HSTS" | python3 -m json.tool
  exit 0
fi

ZONE_ID=$(curl -fsS "${headers[@]}" "$API/zones?name=${ZONE_NAME}" | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(r[0]["id"])')
echo "Zona ${ZONE_NAME}: ${ZONE_ID}"

curl -fsS -X PUT "${headers[@]}" -d "$HEADERS_RULESET"   "$API/zones/${ZONE_ID}/rulesets/phases/http_response_headers_transform/entrypoint" >/dev/null && echo "Cabeceras OK"
curl -fsS -X PUT "${headers[@]}" -d "$REDIRECTS_RULESET" "$API/zones/${ZONE_ID}/rulesets/phases/http_request_dynamic_redirect/entrypoint" >/dev/null && echo "Redirecciones OK"
curl -fsS -X PATCH "${headers[@]}" -d "$HSTS"            "$API/zones/${ZONE_ID}/settings/security_header" >/dev/null && echo "HSTS OK"

echo "Verifica: curl -sI https://www.${ZONE_NAME}/ | grep -iE 'strict-transport|x-content-type|x-frame|referrer'"
