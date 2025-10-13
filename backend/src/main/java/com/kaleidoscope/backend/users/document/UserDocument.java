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
@Builder(toBuilder = true)
@Document(indexName = "users")
public class UserDocument {

    @Id
    private String id; // Should be the String representation of the userId

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
    private String accountStatus;

    @Field(type = FieldType.Keyword)
    private String role;

    @Field(type = FieldType.Boolean)
    private Boolean isVerified;

    // --- Social Graph Counts ---
    @Field(type = FieldType.Integer)
    private Integer followerCount;

    @Field(type = FieldType.Integer)
    private Integer followingCount;

    // --- User Interests (Optimized for Filtering) ---
    @Field(type = FieldType.Long) // Correct type to match Category ID
    private List<Long> interests;

    // --- Face Embedding for ML Similarity Search ---
    @Field(type = FieldType.Dense_Vector, dims = 1024) // Crucial for vector search
    private float[] faceEmbedding;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime lastSeen;
}