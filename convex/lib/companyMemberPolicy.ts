export function validateMembershipInput({
  name,
  email,
  authId,
  roleCount,
}: {
  name: string;
  email: string;
  authId: string;
  roleCount: number;
}): string | null {
  if (!name.trim() || name.trim().length > 120) {
    return "Member name is required and must be 120 characters or fewer.";
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim()) || email.trim().length > 254) {
    return "Enter a valid member email address.";
  }
  if (!/^user_[A-Za-z0-9]+$/.test(authId.trim()) || authId.trim().length > 200) {
    return "Enter the exact Clerk user ID beginning with user_.";
  }
  if (roleCount === 0) return "Assign at least one company role.";
  return null;
}

export function wouldRemoveLastOwner({
  memberActive,
  memberIsOwner,
  memberWillRemainOwner,
  activeOwnerCount,
}: {
  memberActive: boolean;
  memberIsOwner: boolean;
  memberWillRemainOwner: boolean;
  activeOwnerCount: number;
}): boolean {
  return (
    memberActive &&
    memberIsOwner &&
    !memberWillRemainOwner &&
    activeOwnerCount <= 1
  );
}
