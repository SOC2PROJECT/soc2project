#!/usr/bin/env bash
npm install --omit=dev
npm rebuild sqlite3 --build-from-source
