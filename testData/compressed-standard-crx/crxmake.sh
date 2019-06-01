#!/bin/bash -e
#
# Purpose: Pack a Chromium extension directory into crx format

crx="archive.crx"
pub="publickey.tmp"
sig="signature.tmp"
zip="../compressed-standard/archive.zip"
key="./key"

# signature
openssl sha1 -sha1 -binary -sign key.pem < "$zip" > "$sig"

# public key
openssl rsa -pubout -outform DER < key.pem > "$pub" 2>/dev/null

byte_swap () {
  # Take "abcdefgh" and return it as "ghefcdab"
  echo "${1:6:2}${1:4:2}${1:2:2}${1:0:2}"
}

crmagic_hex="4372 3234" # Cr24
version_hex="0200 0000" # 2
pub_len_hex=$(byte_swap $(printf '%08x\n' $(ls -l "$pub" | awk '{print $5}')))
sig_len_hex=$(byte_swap $(printf '%08x\n' $(ls -l "$sig" | awk '{print $5}')))
(
  echo "$crmagic_hex $version_hex $pub_len_hex $sig_len_hex" | xxd -r -p
  cat "$pub" "$sig" "$zip"
) > "$crx"
rm *.tmp
echo "Wrote $crx"
