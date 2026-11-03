#!/usr/bin/env node
// Static validation of the Android identity/build configuration (does not run Gradle).
// Run: node scripts/check-android-config.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let failed = 0;
const ok = (name, cond, detail = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'}  ${name}${!cond && detail ? ' -> ' + detail : ''}`); if (!cond) failed++; };

const ID = 'com.nexvora.aiworkspace';
const gradle = read('android/app/build.gradle');
const pkg = JSON.parse(read('package.json'));
const appJson = JSON.parse(read('app.json'));
const manifest = read('android/app/src/main/AndroidManifest.xml');
const rootGradle = read('android/build.gradle');

ok('applicationId', gradle.includes(`applicationId "${ID}"`));
ok('namespace', gradle.includes(`namespace "${ID}"`));
ok('versionCode 1', /versionCode\s+1\b/.test(gradle));
ok('versionName 1.0.0', /versionName\s+"1\.0\.0"/.test(gradle));
ok('package.json version 1.0.0', pkg.version === '1.0.0');
ok('.version is 1.0.0', read('.version').trim() === '1.0.0');
ok('app.json name matches MainActivity component', read(`android/app/src/main/java/${ID.replaceAll('.', '/')}/MainActivity.kt`).includes(`"${appJson.name}"`));
ok('settings.gradle rootProject.name', read('android/settings.gradle').includes("rootProject.name = 'NexVoraAIWorkspace'"));
ok('no Firebase / google-services in Gradle', !/firebase|google-services|crashlytics/i.test(gradle + rootGradle));
const releaseBlock = gradle.slice(gradle.indexOf('release {'), gradle.indexOf('}', gradle.indexOf('release {')));
ok('release signing reads secrets from .env, none hard-coded', /storePassword project\.env\.get/.test(releaseBlock) && /keyPassword project\.env\.get/.test(releaseBlock) && !/storePassword\s+['"][^'"]+['"]/.test(releaseBlock), 'release block must not contain literal passwords (the standard debug keystore password is fine)');
ok('release keystore is git-ignored', /\*\.keystore/.test(read('.gitignore')));
ok('arm64-v8a is the build ABI', /reactNativeArchitectures=arm64-v8a/.test(read('android/gradle.properties')));
ok('allowBackup=false', /android:allowBackup="false"/.test(manifest));
ok('manifest has no hard-coded package attribute', !/<manifest[^>]*\spackage=/.test(manifest));
ok('minSdk/compileSdk/targetSdk/ndk pinned in root build.gradle', /minSdkVersion/.test(rootGradle) && /compileSdkVersion/.test(rootGradle) && /targetSdkVersion/.test(rootGradle) && /ndkVersion/.test(rootGradle));

// every Kotlin file's package must equal its directory (except the pre-existing vectordb folder which declares ...vector)
const base = path.join(root, 'android/app/src/main/java');
let bad = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.kt')) {
      const m = fs.readFileSync(p, 'utf8').match(/^package\s+([\w.]+)/m);
      const expected = path.relative(base, d).replaceAll(path.sep, '.');
      if (!m || (m[1] !== expected && !(expected.endsWith('.vectordb') && m[1].endsWith('.vector')))) bad.push(`${path.relative(root, p)} (${m?.[1]} vs ${expected})`);
    }
  }
})(base);
ok('Kotlin package matches directory for every file', bad.length === 0, bad.slice(0, 3).join('; '));
ok('every Kotlin import of our package points to a declared package', (() => {
  const declared = new Set(); const imports = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.kt')) {
    const src = fs.readFileSync(p, 'utf8'); const pk = src.match(/^package\s+([\w.]+)/m); if (pk) declared.add(pk[1]);
    for (const m of src.matchAll(/^import\s+(com\.nexvora\.aiworkspace\.[\w.]+)/gm)) imports.push([m[1], path.relative(root, p)]);
  } } })(base);
  const missing = imports.filter(([i]) => !i.endsWith('.R') && !i.endsWith('.BuildConfig') && !declared.has(i.split('.').slice(0, -1).join('.')));
  if (missing.length) console.log('   unresolved:', missing.slice(0, 5));
  return missing.length === 0;
})());
console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL ANDROID CONFIG CHECKS PASSED');
process.exit(failed ? 1 : 0);
