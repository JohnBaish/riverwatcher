#!/bin/sh
# Vercel's build (vercel.json): fetch the latest data from the public data repo, then build the
# page from it. The data isn't in this repo (SPEC §6), so each build, including the hourly ones
# started by the collector's deploy hook, takes a fresh copy. git if the build machine has it,
# otherwise GitHub's tarball.
set -e
rm -rf .data
if command -v git >/dev/null 2>&1; then
  git clone -q --depth 1 https://github.com/JohnBaish/riverwatcher-data .data
else
  mkdir .data
  curl -fsSL https://codeload.github.com/JohnBaish/riverwatcher-data/tar.gz/refs/heads/main | tar xz -C .data --strip-components=1
fi
RW_DATA=.data/data npm run build
