# Thin redirect → job_search root (same for auth/backend/client cwd).
& (Join-Path $PSScriptRoot '..\dev-docker.ps1') @args
