const MISSION_ROUTE_PREFIX = "/v2/missions/";

export function missionIdFromLocation(
  pathname: string,
  search: string
): string | null {
  if (pathname.startsWith(MISSION_ROUTE_PREFIX)) {
    const encodedId = pathname.slice(MISSION_ROUTE_PREFIX.length).split("/")[0];
    if (encodedId) {
      try {
        return decodeURIComponent(encodedId);
      } catch {
        return null;
      }
    }
  }

  if (pathname === "/v2/mission-detail" || pathname === "/v2/missions") {
    return new URLSearchParams(search).get("mission");
  }

  return null;
}

export function missionDetailPath(missionId: string): string {
  return `${MISSION_ROUTE_PREFIX}${encodeURIComponent(missionId)}`;
}

export function canonicalMissionLocation(
  pathname: string,
  search: string
): { pathname: string; search: string } | null {
  const missionId = missionIdFromLocation(pathname, search);
  if (!missionId) return null;

  const canonicalPathname = missionDetailPath(missionId);
  const nextSearch = new URLSearchParams(search);
  nextSearch.delete("mission");
  const canonicalSearch = nextSearch.toString();
  const normalizedSearch = canonicalSearch ? `?${canonicalSearch}` : "";

  if (pathname === canonicalPathname && search === normalizedSearch) {
    return null;
  }

  return { pathname: canonicalPathname, search: normalizedSearch };
}

export function isCanonicalMissionDetail(pathname: string): boolean {
  return pathname.startsWith(MISSION_ROUTE_PREFIX) &&
    pathname.slice(MISSION_ROUTE_PREFIX.length).length > 0;
}
