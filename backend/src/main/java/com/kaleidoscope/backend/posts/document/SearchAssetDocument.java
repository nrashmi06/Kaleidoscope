package com.kaleidoscope.backend.posts.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@Document(indexName = "search_assets")
public class SearchAssetDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Long)
    private Long postId;

    @Field(type = FieldType.Keyword)
    private String mediaUrl;

    @Field(type = FieldType.Object)
    private Map<String, Object> uploaderInfo;

    @Field(type = FieldType.Object)
    private Map<String, Object> postInfo;

    @Field(type = FieldType.Text)
    private String caption;

    @Field(type = FieldType.Keyword)
    private List<String> tags;

    @Field(type = FieldType.Keyword)
    private List<String> scenes;

    @Field(type = FieldType.Keyword)
    private String imageEmbedding; // Vector(512) for similarity search

    @Field(type = FieldType.Object)
    private Map<String, Object> detectedUsers;

    @Field(type = FieldType.Long)
    private Integer reactionCount;

    @Field(type = FieldType.Long)
    private Integer commentCount;

    @Field(type = FieldType.Date)
    private OffsetDateTime createdAt;

    @Field(type = FieldType.Date)
    private OffsetDateTime lastUpdated;
}
