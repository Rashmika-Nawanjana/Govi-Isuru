#!/usr/bin/env bash
# Install GitHub Actions self-hosted runner on EC2.
# Usage: GITHUB_RUNNER_TOKEN=<token> ./scripts/install-github-runner.sh
set -euo pipefail

if [ -z "${GITHUB_RUNNER_TOKEN:-}" ]; then
  echo "Set GITHUB_RUNNER_TOKEN (from GitHub repo Settings > Actions > Runners > New self-hosted runner)."
  exit 1
fi

RUNNER_VERSION="${RUNNER_VERSION:-2.322.0}"
RUNNER_DIR="${RUNNER_DIR:-/home/ubuntu/actions-runner}"
REPO_URL="https://github.com/Rashmika-Nawanjana/Govi-Isuru"
RUNNER_NAME="${RUNNER_NAME:-govi-isuru-ec2}"

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f ./config.sh ]; then
  curl -sL "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" -o runner.tar.gz
  tar xzf runner.tar.gz
  rm runner.tar.gz
fi

if [ -f ./.runner ]; then
  echo "Runner already configured in ${RUNNER_DIR}"
else
  ./config.sh --url "$REPO_URL" --token "$GITHUB_RUNNER_TOKEN" --name "$RUNNER_NAME" --unattended --replace
fi

sudo ./svc.sh install ubuntu || sudo ./svc.sh install
sudo ./svc.sh start
sudo ./svc.sh status

echo "Self-hosted runner installed."
