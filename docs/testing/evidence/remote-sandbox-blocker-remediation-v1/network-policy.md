# Network and privilege boundary

## Enforced policy

The trusted root bootstrap resolves the frozen inference host, writes exact `/etc/hosts` entries, installs an nftables output policy, and then starts the Codex workload as UID/GID 10001 through `setpriv`. Loopback, established traffic, required DNS during trusted bootstrap, and HTTPS to the resolved inference addresses are allowed; the workload receives no general DNS path. Default output is drop. RFC1918, link-local, the metadata address, unexpected DNS, and arbitrary public endpoints are blocked.

The executor has `NoNewPrivs: 1`. Inheritable, permitted, effective, bounding, and ambient capability sets are all `0000000000000000`. Its direct nftables mutation probe fails. APK, APT, DPKG, npm, Corepack, Yarn, and PNPM commands and caches are absent. Only the dedicated Attempt repository, home, and temporary directories are writable by UID 10001.

Two sequential fresh local linux/amd64 containers independently proved:

- `openrouter.ai:443` reachable;
- a previously reachable arbitrary public IP blocked;
- `10.0.0.1` blocked;
- `169.254.1.1` and `169.254.169.254` blocked;
- unexpected DNS blocked;
- firewall mutation blocked after all capability sets were dropped;
- only `OPENAI_API_KEY` and `OPENAI_BASE_URL` present;
- protected paths and prior-Attempt state inaccessible.

## Trust limitation

provider-enforced egress unavailable

exe.dev's current control-plane interfaces expose no network namespace, egress firewall, security group, private network, or per-VM gateway option. The root bootstrap necessarily has `CAP_NET_ADMIN` long enough to install the guest policy. The adversarial Codex workload does not retain that capability and cannot alter the policy, but a successful guest-kernel or root escape could. This is guest defense in depth, not RED-ready provider isolation.
