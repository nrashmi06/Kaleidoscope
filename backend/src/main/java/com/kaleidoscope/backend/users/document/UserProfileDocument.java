package com.kaleidoscope.backend.users.document;

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
@Document(indexName = "user_profiles")
public class UserProfileDocument {

    @Id
    private String id; // Elasticsearch ID

    @Field(type = FieldType.Long)
    private Long userId;

    @Field(type = FieldType.Object)
    private Map<String, Object> profileInfo;

    @Field(type = FieldType.Long)
    private Integer followerCount;

    @Field(type = FieldType.Keyword)
    private List<String> interests;

    @Field(type = FieldType.Keyword)
    private String faceEmbedding; // Vector(1024) for face recognition

    @Field(type = FieldType.Date)
    private OffsetDateTime lastUpdated;

    // Additional search fields
    @Field(type = FieldType.Keyword)
    private String username;
    
    @Field(type = FieldType.Text)
    private String designation;
}
