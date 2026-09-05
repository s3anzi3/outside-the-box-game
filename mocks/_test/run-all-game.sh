#!/bin/bash
# Runs every real-game level test against dist/ and prints a summary.
cd "$(dirname "$0")/../.."
pass=0; fail=0; failed=""
for t in mocks/_test/tests/game-q*.test.js; do
  case "$t" in *probe*) continue;; esac
  r=$(node mocks/_test/game.js "$t" 2>&1)
  if echo "$r" | grep -q '"pass": true'; then pass=$((pass+1)); echo "ok   $(basename $t .test.js)"; else fail=$((fail+1)); failed="$failed $(basename $t .test.js)"; echo "FAIL $(basename $t .test.js) $(echo "$r" | grep -E 'ASSERT|"error"|pageErrors' | head -1 | cut -c1-200)"; fi
done
echo "SUMMARY pass=$pass fail=$fail$failed"
