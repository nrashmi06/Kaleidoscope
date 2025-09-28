package com.kaleidoscope.backend.posts.document;

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
@Document(indexName = "media_ai_insights")
public class MediaAiInsightsDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Long) 
    private Long postId;

    @Field(type = FieldType.Keyword)
    private String status; // PROCESSING, COMPLETED, UNSAFE, FAILED

    @Field(type = FieldType.Boolean)
    private Boolean isSafe;

    @Field(type = FieldType.Text)
    private String caption;

    @Field(type = FieldType.Keyword)
    private List<String> tags;

    @Field(type = FieldType.Keyword)
    private List<String> scenes;

    @Field(type = FieldType.Keyword) 
    private String imageEmbedding; // Vector stored as string for similarity search

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime updatedAt;

    // Post context for search results
    @Field(type = FieldType.Object)
    private PostContext postContext;

    @Data
    @Builder
    public static class PostContext {
        @Field(type = FieldType.Text)
        private String title;
        
        @Field(type = FieldType.Long)
        private Long userId;
        
        @Field(type = FieldType.Keyword)
        private String username;
    }
}
