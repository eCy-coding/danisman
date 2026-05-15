#!/usr/bin/env bash
# RUN_P7_MEASURE.command — P7 Aşama 3+4: Round A/B/C ölçüm
# Host'tan Finder Cmd+O ile çalıştır.
# Bu script:
#   1. Mevcut çalışan kodu (Round A+B+C uygulanmış halde) build eder
#   2. 3-run × 6-page Lighthouse koşar
#   3. P7_FINAL_REPORT.md'yi gerçek rakamlarla günceller
#
# Push YOK. Commit YOK. Sadece ölçüm.

set -u
cd "$(dirname "$0")"
TS=$(date +%Y%m%d-%H%M%S)
LOG="outputs/run-p7-measure-$TS.log"
DONE="outputs/run-p7-measure-done-$TS.txt"
LH_LABEL="p7-final-$TS"
PREVIEW_PORT=4173
mkdir -p outputs

cleanup() {
  if [ -n "${PREVIEW_PID:-}" ] && kill -0 "$PREVIEW_PID" 2>/dev/null; then
    echo "[cleanup] preview pid $PREVIEW_PID kill..."
    kill "$PREVIEW_PID" 2>/dev/null || true
    sleep 1
  fi
}
trap cleanup EXIT

{
  echo "=== RUN_P7_MEASURE başlangıç $(date) ==="
  echo

  # 1. Typecheck + Lint (early fail)
  echo "--- step 1: typecheck ---"
  if ! npm run typecheck > "outputs/p7-typecheck-$TS.log" 2>&1; then
    echo "TYPECHECK FAILED — see outputs/p7-typecheck-$TS.log"
    exit 1
  fi
  echo "[ok] typecheck passed"

  echo
  echo "--- step 2: lint ---"
  if ! npm run lint > "outputs/p7-lint-$TS.log" 2>&1; then
    echo "LINT FAILED — see outputs/p7-lint-$TS.log (continuing — non-fatal)"
  else
    echo "[ok] lint passed"
  fi

  # 2. Build
  echo
  echo "--- step 3: build ---"
  rm -rf dist
  if ! npm run build > "outputs/p7-build-$TS.log" 2>&1; then
    echo "BUILD FAILED — see outputs/p7-build-$TS.log"
    tail -40 "outputs/p7-build-$TS.log"
    exit 1
  fi
  BUILD_BYTES=$(du -sb dist/assets 2>/dev/null | awk '{print $1}')
  echo "[ok] build complete — dist/assets size: ${BUILD_BYTES} bytes"

  # 3. Bundle stats snapshot
  echo
  echo "--- step 4: bundle snapshot ---"
  {
    echo "# Bundle stats — $TS"
    du -sb dist/assets/*.js 2>/dev/null | sort -n | tail -20
    echo
    echo "## Total .br size:"
    find dist/assets -name "*.js.br" -exec stat -c '%s %n' {} \; 2>/dev/null | sort -n | tail -20
  } > "outputs/p7-bundle-$TS.txt"
  echo "[ok] bundle snapshot: outputs/p7-bundle-$TS.txt"

  # 4. Boot preview server
  echo
  echo "--- step 5: preview server (port $PREVIEW_PORT) ---"
  npm run preview > "outputs/p7-preview-$TS.log" 2>&1 &
  PREVIEW_PID=$!
  echo "[ok] preview pid: $PREVIEW_PID, waiting for boot..."
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if curl -fsS "http://localhost:$PREVIEW_PORT/" > /dev/null 2>&1; then
      echo "[ok] preview ready after ${i}s"
      break
    fi
    [ "$i" = "10" ] && { echo "PREVIEW NOT READY"; exit 1; }
  done

  # 5. Lighthouse 3-run × 6 pages
  echo
  echo "--- step 6: Lighthouse 3-run × 6 pages ($LH_LABEL) ---"
  if ! node scripts/lh-5run.mjs --runs 3 --label "$LH_LABEL" > "outputs/p7-lh-$TS.log" 2>&1; then
    echo "LIGHTHOUSE FAILED — see outputs/p7-lh-$TS.log"
    tail -40 "outputs/p7-lh-$TS.log"
    # don't exit; keep going to write whatever partial report
  fi
  echo "[ok] lighthouse done"
  echo
  echo "Summary file: outputs/lh-$LH_LABEL-*/summary.md"
  for f in outputs/lh-$LH_LABEL-*/summary.md; do
    [ -f "$f" ] && cat "$f"
  done

  echo
  echo "=== RUN_P7_MEASURE bitti $(date) ==="
  echo "P7_FINAL_REPORT.md'yi açıp '## Final ölçüm (gerçek)' bölümünü yukarıdaki tabloyla doldur."
} 2>&1 | tee "$LOG"

cp "$LOG" "$DONE"
echo
echo "Log: $LOG"
echo "Done marker: $DONE"
