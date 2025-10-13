package com.kaleidoscope.backend.users.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;

@Data
@Builder
@Document(indexName = "follows")
public class FollowDocument {

    @Id
    private String id; // A unique ID for the follow relationship, e.g., "followerId_followingId"

    @Field(type = FieldType.Object)
    private UserSummary follower;

    @Field(type = FieldType.Object)
    private UserSummary following;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class UserSummary {
        @Field(type = FieldType.Long)
        private Long userId;

        @Field(type = FieldType.Keyword)
        private String username;

        @Field(type = FieldType.Keyword)
        private String profilePictureUrl;
    }
}