#!/usr/bin/env bash
set -euo pipefail

pods_apk="${1:?Usage: scripts/sign-preview.sh path/to/app-release.apk}"
pods_key_dir="${XDG_DATA_HOME:-$HOME/.local/share}/pods-controls"
pods_sdk="${ANDROID_HOME:-$HOME/Android/Sdk}"
pods_build_tools="$(find "$pods_sdk/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -1)"
mkdir -p "$pods_key_dir" artifacts
chmod 700 "$pods_key_dir"
if [[ ! -f "$pods_key_dir/preview.jks" ]]; then
  umask 077
  openssl rand -hex 32 > "$pods_key_dir/preview.password"
  keytool -genkeypair -keystore "$pods_key_dir/preview.jks" -alias pods-preview \
    -storepass:file "$pods_key_dir/preview.password" -keypass:file "$pods_key_dir/preview.password" \
    -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Pods Preview'
fi
"$pods_build_tools/apksigner" sign --ks "$pods_key_dir/preview.jks" --ks-key-alias pods-preview \
  --ks-pass "file:$pods_key_dir/preview.password" --key-pass "file:$pods_key_dir/preview.password" \
  --out artifacts/pods-0.1.0-preview.1.apk "$pods_apk"
"$pods_build_tools/apksigner" verify artifacts/pods-0.1.0-preview.1.apk
(cd artifacts && sha256sum pods-0.1.0-preview.1.apk > SHA256SUMS)
