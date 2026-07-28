const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function isValidRepositorySlug(repository: string): boolean {
  return REPOSITORY_PATTERN.test(repository.trim());
}

export function validateHostBinding(input: {
  expectedRepository: string;
  repository: string;
  hostId: string;
  checkoutRoot: string;
}): string | null {
  if (input.repository !== input.expectedRepository) {
    return "Checkout repository does not match the workspace repository";
  }
  if (!input.hostId.trim()) return "Host ID is required";
  if (!input.checkoutRoot.trim()) return "Checkout root is required";
  return null;
}
