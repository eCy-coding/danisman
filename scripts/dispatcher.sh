#!/bin/bash
case "${1:-help}" in
  deploy) bash "$(dirname "$0")/deploy/production.sh" "${@:2}" || exit 1 ;;
  backup) bash "$(dirname "$0")/maintenance/backup-db.sh" "${@:2}" || exit 1 ;;
  *) echo "Usage: $0 {deploy|backup}"; exit 1 ;;
esac
