package com.kaleidoscope.backend.posts.document;

import com.kaleidoscope.backend.posts.enums.PostStatus;
import com.kaleidoscope.backend.posts.enums.PostVisibility;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.core.geo.GeoPoint;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder(toBuilder = true)
@Document(indexName = "posts")
public class PostDocument {

    @Id
    private String id;

    @Field(type = FieldType.Long)
    private Long postId;

    @Field(type = FieldType.Text, fielddata = true)
    private String title;

    @Field(type = FieldType.Text)
    private String body;

    @Field(type = FieldType.Text)
    private String summary;

    @Field(type = FieldType.Keyword)
    private String thumbnailUrl;

    @Field(type = FieldType.Keyword)
    private PostVisibility visibility;

    @Field(type = FieldType.Keyword)
    private PostStatus status;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    // --- Nested Objects for Rich Data ---

    @Field(type = FieldType.Object)
    private Author author;

    @Field(type = FieldType.Nested) // Nested for lists of objects
    private List<Category> categories;

    @Field(type = FieldType.Object)
    private LocationInfo location;

    // --- Counts for Filtering & Sorting ---

    @Field(type = FieldType.Long)
    private long reactionCount;

    @Field(type = FieldType.Long)
    private long commentCount;

    @Field(type = FieldType.Long)
    private Long viewCount;

    // --- ML Image Tags and People Count ---
    @Field(type = FieldType.Keyword)
    private List<String> mlImageTags;

    @Field(type = FieldType.Integer)
    private Integer peopleCount;

    // --- Hashtags ---
    @Field(type = FieldType.Keyword)
    private List<String> hashtags;

    // --- Supporting Nested Classes ---

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
        private Long id;

        @Field(type = FieldType.Keyword)
        private String name;

        @Field(type = FieldType.Object)
        private GeoPoint point;
    }
}