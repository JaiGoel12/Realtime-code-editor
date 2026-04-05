/**
 * Display name for the squad list / cursors — prefers Clerk first + last name.
 * @param {{ firstName?: string | null; lastName?: string | null; username?: string | null; primaryEmailAddress?: { emailAddress?: string } | null } | null | undefined} user
 * @param {{ displayName?: string; username?: string } | undefined} locationState
 */
export function getCollaboratorDisplayName(user, locationState) {
    if (locationState?.displayName && String(locationState.displayName).trim()) {
        return String(locationState.displayName).trim();
    }
    if (locationState?.username && String(locationState.username).trim()) {
        return String(locationState.username).trim();
    }
    if (!user) return 'Guest';
    const first = user.firstName?.trim() || '';
    const last = user.lastName?.trim() || '';
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    if (user.username) return String(user.username).trim();
    const emailLocal =
        user.primaryEmailAddress?.emailAddress?.split('@')[0] || '';
    return emailLocal.trim() || 'Guest';
}

/** @param {{ imageUrl?: string | null } | null | undefined} user */
export function getCollaboratorImageUrl(user) {
    if (!user?.imageUrl) return '';
    const u = String(user.imageUrl).trim();
    return u || '';
}
