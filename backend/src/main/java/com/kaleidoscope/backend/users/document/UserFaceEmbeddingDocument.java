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
@Document(indexName = "user_face_embeddings")
public class UserFaceEmbeddingDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long embeddingId;

    @Field(type = FieldType.Long)
    private Long userId;

    @Field(type = FieldType.Keyword)
    private String embedding; // Vector(1024) stored as string for face matching

    @Field(type = FieldType.Boolean)
    private Boolean isActive;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime updatedAt;

    // User context for search results
    @Field(type = FieldType.Object)
    private UserContext userContext;

    @Data
    @Builder
    public static class UserContext {
        @Field(type = FieldType.Keyword)
        private String username;

        @Field(type = FieldType.Text)
        private String designation;

        @Field(type = FieldType.Keyword)
        private String profilePictureUrl;
    }
}
