export function canonicalGithubRepositoryFromRemote(remoteUrl: string) {
  const value = remoteUrl.trim();
  const scp = value.match(/^[^@\s]+@([^:\s]+):(.+)$/);
  let repositoryPath: string;
  if (scp) {
    if (scp[1].toLowerCase() !== "github.com") throw new Error("Factory checkout origin must use github.com.");
    repositoryPath = scp[2];
  } else {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error("Factory checkout origin must be a canonical GitHub remote URL.");
    }
    if (!["https:", "ssh:"].includes(parsed.protocol)
      || parsed.hostname.toLowerCase() !== "github.com"
      || parsed.port
      || (parsed.protocol === "https:" && parsed.username)
      || parsed.password
      || parsed.search
      || parsed.hash) {
      throw new Error("Factory checkout origin must use an exact HTTPS or SSH github.com remote.");
    }
    repositoryPath = parsed.pathname;
  }
  const repository = repositoryPath.replace(/^\/+/, "").replace(/\.git$/, "");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("Factory checkout origin must identify one GitHub owner/repository pair.");
  }
  return repository;
}

export function isExactGithubPullRequestUrl(value: string, repositoryIdentity: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:"
      && parsed.hostname.toLowerCase() === "github.com"
      && !parsed.port
      && !parsed.username
      && !parsed.password
      && !parsed.search
      && !parsed.hash
      && new RegExp(`^/${escapeRegex(repositoryIdentity)}/pull/[1-9]\\d*$`).test(parsed.pathname);
  } catch {
    return false;
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
