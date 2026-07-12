#!/bin/sh
# Purple Squirrel — VibeCode Command Center (POSIX launcher, mirrors start.cmd)
cd "$(dirname "$0")/app" || exit 1
# Open the dashboard (best-effort; server prints the URL regardless)
if command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:4477 &
elif command -v open >/dev/null 2>&1; then open http://localhost:4477 &
fi
exec node server.js
