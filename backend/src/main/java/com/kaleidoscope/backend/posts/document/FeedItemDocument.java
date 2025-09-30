package com.kaleidoscope.backend.posts.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.OffsetDateTime;

@Data
@Builder
@Document(indexName = "feed_items")
public class FeedItemDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Long)
    private Long postId;

    @Field(type = FieldType.Long)
    private Long uploaderId;

    @Field(type = FieldType.Keyword)
    private String mediaUrl;

    @Field(type = FieldType.Text)
    private String caption;

    @Field(type = FieldType.Long)
    private Integer reactionCount;

    @Field(type = FieldType.Long)
    private Integer commentCount;

    @Field(type = FieldType.Date)
    private OffsetDateTime createdAt;

    // Context for feed optimization
    @Field(type = FieldType.Object)
    private UploaderContext uploader;

    @Data
    @Builder
    public static class UploaderContext {
        @Field(type = FieldType.Keyword)
        private String username;
        
        @Field(type = FieldType.Keyword)
        private String profilePictureUrl;
    }
}
