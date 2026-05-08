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
@Document(indexName = "media_search")
public class MediaSearchDocument {

    @Id
    private String id;

    @Field(type = FieldType.Long)
    private Long mediaId;

    @Field(type = FieldType.Long)
    private Long postId;

    @Field(type = FieldType.Keyword)
    private String mediaUrl;

    @Field(type = FieldType.Keyword)
    private String mediaType;

    @Field(type = FieldType.Keyword)
    private String aiStatus;

    @Field(type = FieldType.Boolean)
    private Boolean isSafe;

    @Field(type = FieldType.Text)
    private String aiCaption;

    @Field(type = FieldType.Keyword)
    private List<String> aiTags;

    @Field(type = FieldType.Keyword)
    private List<String> scenes;

    @Field(type = FieldType.Integer)
    private Integer detectedFaceCount;

    @Field(type = FieldType.Keyword)
    private List<String> detectedUserIds;

    @Field(type = FieldType.Keyword)
    private List<String> detectedUsernames;

    @Field(type = FieldType.Object)
    private PostInfo postInfo;

    @Field(type = FieldType.Object)
    private UploaderInfo uploaderInfo;

    @Field(type = FieldType.Long)
    private Long reactionCount;

    @Field(type = FieldType.Long)
    private Long commentCount;

    @Field(type = FieldType.Date, format = {}, pattern = "uuuu-MM-dd'T'HH:mm:ss.SSSSSS")
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class PostInfo {
        @Field(type = FieldType.Text)
        private String title;

        @Field(type = FieldType.Keyword)
        private String visibility;

        @Field(type = FieldType.Keyword)
        private List<String> categories;
    }

    @Data
    @Builder
    public static class UploaderInfo {
        @Field(type = FieldType.Long)
        private Long userId;

        @Field(type = FieldType.Keyword)
        private String username;
    }
}
