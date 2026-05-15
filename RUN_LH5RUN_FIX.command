#!/bin/bash
# Wrapper — run RUN_LH5RUN with tag="fix-baseline" (post Tier-0 regression fixes)
cd "$(dirname "$0")"
exec bash ./RUN_LH5RUN.command fix-baseline-v2
