# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:26.7.0-alpine3.23@sha256:ce3cc39fe3b8b2602d3b1c4d63d301e46b48c550ecb627869853ddcdda418b63 AS codex-builder

WORKDIR /opt/mission-control/codex
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
  && test "$(node --version)" = "v26.7.0" \
  && test "$(node_modules/.bin/codex --version)" = "codex-cli 0.146.0"

FROM node:26.7.0-alpine3.23@sha256:ce3cc39fe3b8b2602d3b1c4d63d301e46b48c550ecb627869853ddcdda418b63 AS git-builder

ARG GIT_VERSION=2.55.0
ARG GIT_SOURCE_SHA256=457fdb04dc8728e007d4688695e6912e6f680727920f2a40bf11eacc17505357
RUN apk add --no-cache build-base=0.5-r3 linux-headers=6.16.12-r0 xz=5.8.3-r0 zlib-dev=1.3.2-r0 \
  && wget -q "https://www.kernel.org/pub/software/scm/git/git-${GIT_VERSION}.tar.xz" -O /tmp/git.tar.xz \
  && echo "${GIT_SOURCE_SHA256}  /tmp/git.tar.xz" | sha256sum -c - \
  && mkdir /tmp/git \
  && tar -xJf /tmp/git.tar.xz --strip-components=1 -C /tmp/git \
  && make -C /tmp/git -j6 prefix=/opt/git \
    NO_CURL=YesPlease NO_EXPAT=YesPlease NO_GETTEXT=YesPlease NO_ICONV=YesPlease \
    NO_OPENSSL=YesPlease NO_PERL=YesPlease NO_PYTHON=YesPlease NO_REGEX=NeedsStartEnd NO_RUST=YesPlease NO_TCLTK=YesPlease \
  && make -C /tmp/git prefix=/opt/git \
    NO_CURL=YesPlease NO_EXPAT=YesPlease NO_GETTEXT=YesPlease NO_ICONV=YesPlease \
    NO_OPENSSL=YesPlease NO_PERL=YesPlease NO_PYTHON=YesPlease NO_REGEX=NeedsStartEnd NO_RUST=YesPlease NO_TCLTK=YesPlease \
    install \
  && /opt/git/bin/git --version

FROM node:26.7.0-alpine3.23@sha256:ce3cc39fe3b8b2602d3b1c4d63d301e46b48c550ecb627869853ddcdda418b63 AS busybox-builder

ARG BUSYBOX_VERSION=1.37.0
ARG BUSYBOX_SOURCE_SHA256=3311dff32e746499f4df0d5df04d7eb396382d7e108bb9250e7b519b837043a4
RUN apk add --no-cache build-base=0.5-r3 bzip2=1.0.8-r6 linux-headers=6.16.12-r0 patch=2.8-r0 \
  && wget -q "https://busybox.net/downloads/busybox-${BUSYBOX_VERSION}.tar.bz2" -O /tmp/busybox.tar.bz2 \
  && echo "${BUSYBOX_SOURCE_SHA256}  /tmp/busybox.tar.bz2" | sha256sum -c - \
  && mkdir /tmp/busybox \
  && tar -xjf /tmp/busybox.tar.bz2 --strip-components=1 -C /tmp/busybox
COPY busybox-minimal.config /tmp/busybox-minimal.config
COPY patches/busybox-CVE-2026-38754.patch patches/busybox-CVE-2026-38755.patch /tmp/patches/
RUN patch -d /tmp/busybox -p1 --fuzz=0 </tmp/patches/busybox-CVE-2026-38754.patch \
  && patch -d /tmp/busybox -p1 --fuzz=0 </tmp/patches/busybox-CVE-2026-38755.patch \
  && KCONFIG_NOTIMESTAMP=1 make -C /tmp/busybox allnoconfig \
  && while IFS= read -r option; do \
    key="${option%%=*}"; \
    sed -i "s/^# ${key} is not set$/${option}/" /tmp/busybox/.config; \
  done </tmp/busybox-minimal.config \
  && yes '' | KCONFIG_NOTIMESTAMP=1 make -C /tmp/busybox oldconfig \
  && while IFS= read -r option; do grep -qx "$option" /tmp/busybox/.config; done </tmp/busybox-minimal.config \
  && KCONFIG_NOTIMESTAMP=1 make -C /tmp/busybox -j6 \
  && test "$(/tmp/busybox/busybox | head -n 1 | cut -d' ' -f1-2)" = "BusyBox v1.37.0" \
  && /tmp/busybox/busybox --list | grep -qx kill \
  && ! /tmp/busybox/busybox --list | grep -qx awk \
  && ! /tmp/busybox/busybox --list | grep -qx wget

FROM node:26.7.0-alpine3.23@sha256:ce3cc39fe3b8b2602d3b1c4d63d301e46b48c550ecb627869853ddcdda418b63

USER root

LABEL org.opencontainers.image.source="https://github.com/jaydubya818/MissionControl"
LABEL org.opencontainers.image.description="Mission Control exe.dev restricted-profile remediation candidate"
LABEL org.opencontainers.image.licenses="UNLICENSED"
LABEL exe.dev/login-user="root"

RUN apk add --no-cache \
    ca-certificates-bundle=20260611-r0 \
    nftables=1.1.5-r2 \
    setpriv=2.41.4-r0 \
    zlib=1.3.2-r0 \
  && apk del apk-tools ssl_client \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx \
  && test ! -e /sbin/apk \
  && ! grep -qE '^P:(apk-tools|libapk|libcrypto3|libssl3|ssl_client)$' /lib/apk/db/installed

WORKDIR /opt/mission-control/codex
COPY --from=codex-builder /opt/mission-control/codex/node_modules ./node_modules
COPY --from=git-builder /opt/git /usr/local
RUN test "$(node --version)" = "v26.7.0" \
  && test "$(node_modules/.bin/codex --version)" = "codex-cli 0.146.0" \
  && test "$(git --version)" = "git version 2.55.0" \
  && ln -s /opt/mission-control/codex/node_modules/.bin/codex /usr/local/bin/codex \
  && test ! -e /usr/local/bin/npm \
  && test ! -e /sbin/apk

RUN addgroup -S -g 10001 mc-attempt \
  && adduser -S -D -H -u 10001 -G mc-attempt -s /sbin/nologin mc-attempt \
  && mkdir -p /var/lib/mission-control/attempt/home /var/lib/mission-control/attempt/tmp /etc/mission-control \
  && chown root:root /var/lib/mission-control/attempt /etc/mission-control \
  && chmod 0711 /var/lib/mission-control/attempt \
  && chown mc-attempt:mc-attempt /var/lib/mission-control/attempt/home /var/lib/mission-control/attempt/tmp \
  && chmod 0700 /var/lib/mission-control/attempt/home /var/lib/mission-control/attempt/tmp \
  && chmod 0755 /etc/mission-control

COPY --from=busybox-builder /tmp/busybox/busybox /bin/busybox
RUN test "$(busybox | head -n 1 | cut -d' ' -f1-2)" = "BusyBox v1.37.0" \
  && busybox --list | grep -qx kill \
  && busybox --list | grep -qx find \
  && busybox --list | grep -qx ls \
  && busybox --list | grep -qx sed \
  && kill -0 "$$" \
  && ! busybox --list | grep -qx awk \
  && ! busybox --list | grep -qx wget \
  && rm -f /usr/bin/awk /usr/bin/wget

COPY toolchain-inputs.json /etc/mission-control/toolchain-inputs.json
RUN native_binary="/opt/mission-control/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/bin/codex" \
  && test -x "$native_binary" \
  && sha256sum "$native_binary" | cut -d' ' -f1 >/etc/mission-control/codex-binary.sha256 \
  && sha256sum /usr/local/bin/git | cut -d' ' -f1 >/etc/mission-control/git-binary.sha256 \
  && sha256sum /bin/busybox | cut -d' ' -f1 >/etc/mission-control/busybox-binary.sha256 \
  && sha256sum /etc/mission-control/toolchain-inputs.json | cut -d' ' -f1 >/etc/mission-control/toolchain-inputs.sha256 \
  && chmod 0444 /etc/mission-control/toolchain-inputs.json /etc/mission-control/codex-binary.sha256 /etc/mission-control/git-binary.sha256 /etc/mission-control/busybox-binary.sha256 /etc/mission-control/toolchain-inputs.sha256

WORKDIR /var/lib/mission-control/attempt
