package com.kaleidoscope.backend.shared.enums;

/**
 * Represents the visibility and moderation status of a comment.
 */
public enum CommentStatus {
    /**
     * The comment is visible to everyone.
     */
    ACTIVE,
    /**
     * The comment has been hidden by a moderator and is not visible.
     */
    HIDDEN,
    /**
     * The comment has been marked as deleted by its author but remains in the system.
     * This is distinct from a soft-delete, which hides it from all queries.
     */
    DELETED
}