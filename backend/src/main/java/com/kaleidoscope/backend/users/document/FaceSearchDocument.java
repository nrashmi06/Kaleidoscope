package com.kaleidoscope.backend.users.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Data
@Builder
@Document(indexName = "face_search")
public class FaceSearchDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long faceId;

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Long)
    private Long postId;

    // --- Face Detection Data ---
    @Field(type = FieldType.Integer)
    private List<Integer> bbox; // Bounding box coordinates

    @Field(type = FieldType.Keyword)
    private String detectionStatus; // UNIDENTIFIED, SUGGESTED, CONFIRMED

    @Field(type = FieldType.Double)
    private Double confidenceScore;

    // --- User Information (if identified) ---
    @Field(type = FieldType.Object)
    private IdentifiedUser identifiedUser;

    @Field(type = FieldType.Object)
    private SuggestedUser suggestedUser;

    // --- Media Context ---
    @Field(type = FieldType.Keyword)
    private String mediaUrl;

    @Field(type = FieldType.Object)
    private PostContext postContext;

    // --- Nested Classes ---
    @Data
    @Builder
    public static class IdentifiedUser {
        @Field(type = FieldType.Long)
        private Long userId;

        @Field(type = FieldType.Keyword)
        private String username;
    }

    @Data
    @Builder
    public static class SuggestedUser {
        @Field(type = FieldType.Long)
        private Long userId;

        @Field(type = FieldType.Keyword)
        private String username;
    }

    @Data
    @Builder
    public static class PostContext {
        @Field(type = FieldType.Long)
        private Long uploaderId;

        @Field(type = FieldType.Keyword)
        private String uploaderUsername;

        @Field(type = FieldType.Keyword)
        private String postVisibility;
    }
}
