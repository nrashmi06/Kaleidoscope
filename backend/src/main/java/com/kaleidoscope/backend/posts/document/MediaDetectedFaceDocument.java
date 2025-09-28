package com.kaleidoscope.backend.posts.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Data
@Builder
@Document(indexName = "media_detected_faces")
public class MediaDetectedFaceDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long faceId;

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Integer)
    private List<Integer> bbox; // Bounding box coordinates

    @Field(type = FieldType.Keyword)
    private String embedding; // Vector(1024) for face recognition

    @Field(type = FieldType.Long)
    private Long identifiedUserId;

    @Field(type = FieldType.Long) 
    private Long suggestedUserId;

    @Field(type = FieldType.Double)
    private Float confidenceScore;

    @Field(type = FieldType.Keyword)
    private String status; // UNIDENTIFIED, SUGGESTED, CONFIRMED

    // Context for search results
    @Field(type = FieldType.Object)
    private MediaContext mediaContext;

    @Field(type = FieldType.Object)
    private UserContext identifiedUser;

    @Field(type = FieldType.Object)
    private UserContext suggestedUser;

    @Data
    @Builder
    public static class MediaContext {
        @Field(type = FieldType.Long)
        private Long postId;
        
        @Field(type = FieldType.Keyword)
        private String mediaUrl;
    }

    @Data
    @Builder
    public static class UserContext {
        @Field(type = FieldType.Long)
        private Long userId;
        
        @Field(type = FieldType.Keyword)
        private String username;
    }
}
