package com.kaleidoscope.backend.shared.document;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Data
@Builder
@Document(indexName = "recommendations")
public class RecommendationDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Keyword)
    private String imageEmbedding; // Vector(512) for similarity matching

    @Field(type = FieldType.Keyword)
    private String mediaUrl;
}
