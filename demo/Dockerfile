FROM ghcr.io/coder/code-server:4.145.2@sha256:09565f9e07f5624554e295e8bab0e2fec4a7c533eb3cff459ed6596a4d3d7c1c

USER root
ARG TARGETARCH
COPY demo/fetch-opencode.cjs /tmp/fetch-opencode.cjs
RUN /usr/lib/code-server/lib/node /tmp/fetch-opencode.cjs "$TARGETARCH" \
    && tar -xzf /tmp/opencode.tgz -C /tmp \
    && install -m 755 /tmp/package/bin/opencode /usr/local/bin/opencode \
    && rm -rf /tmp/package /tmp/opencode.tgz /tmp/fetch-opencode.cjs

# Reuse the existing Code Station appearance. The launcher itself is an extension.
COPY patches/chat/ /tmp/patches/chat/
RUN /usr/lib/code-server/lib/node /tmp/patches/chat/apply.cjs /usr/lib/code-server
COPY patches/welcome/ /tmp/patches/welcome/
RUN /usr/lib/code-server/lib/node /tmp/patches/welcome/apply.cjs /usr/lib/code-server

COPY outputs/code-station-window-launcher-0.1.0.vsix /tmp/window-launcher.vsix
USER coder
RUN mkdir -p /home/coder/.local/share/opencode /home/coder/.config/opencode \
    && code-server --install-extension /tmp/window-launcher.vsix
COPY --chown=coder:coder demo/settings.json /home/coder/.local/share/code-server/User/settings.json
WORKDIR /home/coder/project
CMD ["--bind-addr", "0.0.0.0:8080", "--auth", "none", "--disable-telemetry", "/home/coder/project"]
