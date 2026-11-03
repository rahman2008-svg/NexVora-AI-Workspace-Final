#!/usr/bin/env bash
# Static security greps. Exits non-zero when something suspicious is found. Run: bash scripts/security-check.sh
cd "$(dirname "$0")/.."
fail=0
check() { # description, pattern, paths...
  local desc="$1" pat="$2"; shift 2
  local out; out=$(grep -rIEn --exclude-dir=node_modules --exclude-dir=ios --exclude-dir=locales --exclude='*.lock' "$pat" "$@" 2>/dev/null || true)
  if [ -n "$out" ]; then echo "FAIL  $desc"; echo "$out" | head -5; fail=1; else echo "ok    $desc"; fi
}
check "no Firebase / Crashlytics / Google services"           "firebase|crashlytics|google-services"        src App.tsx index.js android package.json
check "no ipapi / IP-geolocation service"                      "ipapi\\.co|geojson\\.|ipwho"                 src App.tsx
check "no upstream search proxy or its key"                    "cguicrchal|anythingLLMPublic|searxng-serp"  src App.tsx
check "no upstream CDN/web assets/update endpoints active"     "cdn\\.anythingllm\\.com|docs\\.anythingllm\\.com/mobile" src/utils/paths.ts
check "no google favicon service"                              "google\\.com/s2/favicons"                    src
check "no hard-coded key-like literals (sk-, AIza, xox, ghp_)" "['\"](sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|xox[abp]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{30,})['\"]" src App.tsx android/app/src
check "no console logging of apiKey / token values"            "console\\.(log|warn|error|info)\\([^)]*(apiKey|api_key|accessToken|refreshToken|deviceToken)" src
check "no old Kotlin package"                                  "com\\.anythingllm"                           android src App.tsx
check "allowBackup is false"                                   "android:allowBackup=\"true\""                android/app/src/main/AndroidManifest.xml
check "no location permission declared"                        "ACCESS_(FINE|COARSE)_LOCATION"               android/app/src/main/AndroidManifest.xml
check "no advertising id permission"                           "AD_ID"                                       android/app/src/main/AndroidManifest.xml
[ $fail -eq 0 ] && echo "ALL SECURITY GREP CHECKS PASSED" || { echo "SECURITY CHECKS FOUND PROBLEMS"; exit 1; }
