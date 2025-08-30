package com.kaleidoscope.backend.blogs.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Embeddable;
import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlogCategoryId implements Serializable {
    private Long blogId;
    private Long categoryId;
}