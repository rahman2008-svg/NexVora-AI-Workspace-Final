#!/usr/bin/env bash
# Executes the security-critical TypeScript (UIStore keychain migration, web-search config, data helpers) under Node.
# Native modules (Keychain, AsyncStorage, React Native) are replaced by in-memory fakes in harness.js, so this checks the
# LOGIC only - it does not replace testing on a real device. Needs: node and a TypeScript compiler (`tsc`).
set -euo pipefail
cd "$(dirname "$0")/../.."
export NEX_TEST_OUT="${NEX_TEST_OUT:-/tmp/nex-test-out}"
TSC="node_modules/.bin/tsc"; [ -x "$TSC" ] || TSC="$(command -v tsc)"
rm -rf "$NEX_TEST_OUT"
"$TSC" --ignoreConfig --outDir "$NEX_TEST_OUT" --rootDir . --module commonjs --target es2020 --noResolve --skipLibCheck \
  --jsx react-native --experimentalDecorators --noEmitOnError false --esModuleInterop \
  src/store/UIStore.ts src/utils/secureStorage.ts src/utils/ToolsManager/tools/webSearch/config.ts src/utils/nex/data.ts >/dev/null || true
node scripts/nex-tests/test_secure.js
