package com.kaleidoscope.backend.shared.enums; // Or a suitable package

public enum MediaAssetStatus {
    /**
     * An upload signature has been generated, but the file has not yet been
     * confirmed as uploaded to the cloud provider.
     */
    PENDING,

    /**
     * The file has been successfully uploaded to the cloud provider (confirmed via webhook)
     * but is not yet associated with a saved post.
     */
    UPLOADED,

    /**
     * The file is successfully linked to a post in the database and is considered "safe".
     */
    ASSOCIATED
}