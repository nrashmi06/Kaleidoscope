package com.kaleidoscope.backend.users.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Document(indexName = "users")
public class UserDocument {

    @Id
    private String id; // Elasticsearch internal ID

    @Field(type = FieldType.Long)
    private Long userId;

    @Field(type = FieldType.Keyword)
    private String username;

    @Field(type = FieldType.Keyword)
    private String email;

    @Field(type = FieldType.Text)
    private String designation;

    @Field(type = FieldType.Text)
    private String summary;

    @Field(type = FieldType.Keyword)
    private String profilePictureUrl;

    @Field(type = FieldType.Keyword)
    private String coverPhotoUrl;

    @Field(type = FieldType.Keyword)
    private String accountStatus; // AccountStatus enum as string

    @Field(type = FieldType.Keyword)
    private String role; // Role enum as string

    @Field(type = FieldType.Boolean)
    private Boolean isVerified;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime lastSeen;

    // --- User-specific fields only ---
    @Field(type = FieldType.Keyword)
    private String faceEmbedding; // For face-based user search/matching

    // --- User Interests as simple category IDs for fast filtering ---
    @Field(type = FieldType.Integer)
    private List<Integer> interests; // Just category IDs for fast filtering by interests

    // --- Nested Objects for Rich Data (if we need category names for display) ---
    @Field(type = FieldType.Nested)
    private List<Interest> interestDetails;

    // --- Supporting Nested Classes ---

    @Data
    @Builder
    public static class Interest {
        @Field(type = FieldType.Long)
        private Long categoryId;

        @Field(type = FieldType.Keyword)
        private String name;
    }
}
