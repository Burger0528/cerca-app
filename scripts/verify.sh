#!/usr/bin/env bash
#
# La única puerta a main. Lo mismo que corre en tu portátil corre en CI: si aquí está en
# verde y allí en rojo, el bug está en este archivo, no en el PR.
#
# Presupuesto: menos de 60 s. Es lo que corre en pre-push.
#
set -Eeuo pipefail

cd "$(dirname "$0")/.."

BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; DIM=$'\033[2m'; RESET=$'\033[0m'
[[ -t 1 ]] || { BOLD=''; RED=''; GREEN=''; DIM=''; RESET=''; }

failed=()
started_at=$SECONDS

step() {
  local name="$1"; shift
  local step_started=$SECONDS
  printf '%s▸ %s%s\n' "$BOLD" "$name" "$RESET"
  if "$@"; then
    printf '  %s✓ %s (%ss)%s\n\n' "$GREEN" "$name" "$((SECONDS - step_started))" "$RESET"
  else
    printf '  %s✗ %s%s\n\n' "$RED" "$name" "$RESET"
    failed+=("$name")
  fi
}

# Ningún EXPO_PUBLIC_ con pinta de credencial. Todo lo que lleve ese prefijo acaba en el
# bundle en claro, así que el nombre de la variable es la única defensa que queda.
check_public_env() {
  local hits
  hits=$(grep -rInE 'EXPO_PUBLIC_[A-Z0-9_]*(SECRET|PRIVATE|PASSWORD|CREDENTIAL|_KEY|TOKEN)' \
    --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' \
    --include='.env*' --exclude-dir=node_modules --exclude-dir=.expo --exclude-dir=dist \
    . 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    printf '  %sVariable EXPO_PUBLIC_ con pinta de credencial. EXPO_PUBLIC_ se publica en claro:%s\n' "$RED" "$RESET"
    printf '%s\n' "$hits"
    return 1
  fi
  printf '  %ssin credenciales bajo EXPO_PUBLIC_%s\n' "$DIM" "$RESET"
}

printf '\n%sverify · cerca%s\n\n' "$BOLD" "$RESET"

step 'format'      npx prettier --check .
step 'lint'        npx eslint . --max-warnings=0
step 'typecheck'   npm run typecheck --workspaces --if-present
step 'test'        npm run test --workspaces --if-present
step 'public-env'  check_public_env

if (( ${#failed[@]} > 0 )); then
  printf '%s✗ verify en rojo (%ss): %s%s\n\n' "$RED" "$((SECONDS - started_at))" "${failed[*]}" "$RESET"
  exit 1
fi

printf '%s✓ verify en verde (%ss)%s\n\n' "$GREEN" "$((SECONDS - started_at))" "$RESET"
