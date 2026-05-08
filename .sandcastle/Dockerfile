FROM node:22-bookworm

# Install pnpm globally so sandbox startup doesn't depend on Corepack downloads
RUN npm install -g pnpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

# Install GitLab CLI
RUN echo "deb http://deb.debian.org/debian bookworm-backports main" \
  | tee /etc/apt/sources.list.d/bookworm-backports.list > /dev/null \
  && apt-get update && apt-get install -y -t bookworm-backports glab \
  && rm -rf /var/lib/apt/lists/*

# Rename the base image's "node" user (UID 1000) to "agent".
# This keeps UID 1000 so that --userns=keep-id (Podman) and
# --user 1000:1000 (Docker) map to the correct home directory owner.
RUN groupmod -n agent node \
  && usermod -d /home/agent -m -l agent node \
  && chown -R agent:agent /home/agent \
  && chmod -R a+rwX /home/agent

# Claude installer runs as root; HOME must point at agent so files land under /home/agent.
ENV HOME=/home/agent
WORKDIR /home/agent

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Installer may leave root-owned files; normalize ownership afterward.
# Sandcastle's Docker provider runs the container as the *host* UID/GID (see sandboxes/docker.js:
# `user: `${hostUid}:${hostGid}`), e.g. macOS often uses 501:20 — not necessarily 1000:1000.
# Directories under /home/agent default to 755 after chown; other UIDs then cannot create
# ~/.claude/session-env, and Claude Code reports the Bash tool as unavailable. Keep the
# home tree world-read/write/traverse like the block above (chmod -R a+rwX).
RUN mkdir -p /home/agent/.claude \
  && chown -R agent:agent /home/agent \
  && chmod -R a+rwX /home/agent

# Add Claude to PATH; Bash tool expects a real Bourne-again shell path.
ENV PATH="/home/agent/.local/bin:$PATH"
ENV SHELL=/bin/bash

# In worktree sandbox mode, Sandcastle bind-mounts the git worktree at /home/agent/workspace
# and overrides the working directory to /home/agent/workspace at container start.
# Structure your Dockerfile so that /home/agent/workspace can serve as the project root.
ENTRYPOINT ["sleep", "infinity"]
