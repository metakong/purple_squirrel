@echo off
title Purple Squirrel - VibeCode Command Center
cd /d "%~dp0app"
start "" http://localhost:4477
node server.js
