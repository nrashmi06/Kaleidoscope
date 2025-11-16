package com.kaleidoscope.backend.blogs.document;

import com.kaleidoscope.backend.blogs.enums.BlogStatus;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Elasticsearch denormalized representation of a Blog for fast search/filter.
 * Mirrors PostDocument style but limited to Blog-specific fields.
 */
@Data
@Builder(toBuilder = true)
@Document(indexName = "blogs")
public class BlogDocument {

    @Id
    private String id; // String version of blogId

    @Field(type = FieldType.Long)
    private Long blogId;

    @Field(type = FieldType.Text, fielddata = true)
    private String title;

    @Field(type = FieldType.Text)
    private String body;

    @Field(type = FieldType.Text)
    private String summary;

    @Field(type = FieldType.Keyword)
    private String thumbnailUrl;

    @Field(type = FieldType.Integer)
    private Integer wordCount;

    @Field(type = FieldType.Integer)
    private Integer readTimeMinutes;

    @Field(type = FieldType.Keyword)
    private BlogStatus blogStatus;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime updatedAt;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime reviewedAt;

    @Field(type = FieldType.Object)
    private Author author;

    @Field(type = FieldType.Object)
    private Reviewer reviewer;

    @Field(type = FieldType.Nested)
    private List<Category> categories;

    @Field(type = FieldType.Object)
    private LocationInfo location;

    @Field(type = FieldType.Nested)
    private List<BlogTagInfo> blogTags;

    @Field(type = FieldType.Long)
    private long reactionCount;

    @Field(type = FieldType.Long)
    private long commentCount;

    @Field(type = FieldType.Long)
    private long viewCount;

    // --- Nested Classes ---

    @Data
    @Builder
    public static class Author {
        @Field(type = FieldType.Long)
        private Long userId;
        @Field(type = FieldType.Keyword)
        private String username;
        @Field(type = FieldType.Keyword)
        private String profilePictureUrl;
        @Field(type = FieldType.Keyword)
        private String email;
        @Field(type = FieldType.Keyword)
        private String accountStatus;
    }

    @Data
    @Builder
    public static class Reviewer {
        @Field(type = FieldType.Long)
        private Long userId;
        @Field(type = FieldType.Keyword)
        private String username;
        @Field(type = FieldType.Keyword)
        private String profilePictureUrl;
        @Field(type = FieldType.Keyword)
        private String email;
        @Field(type = FieldType.Keyword)
        private String accountStatus;
    }

    @Data
    @Builder
    public static class Category {
        @Field(type = FieldType.Long)
        private Long categoryId;
        @Field(type = FieldType.Keyword)
        private String name;
    }

    @Data
    @Builder
    public static class LocationInfo {
        @Field(type = FieldType.Long)
        private Long id; // locationId
        @Field(type = FieldType.Keyword)
        private String name;
        @Field(type = FieldType.Object)
        private GeoPoint point; // may be null
    }

    @Data
    @Builder
    public static class BlogTagInfo {
        @Field(type = FieldType.Long)
        private Long blogId;
        @Field(type = FieldType.Keyword)
        private String title;
    }
}

