package com.kaleidoscope.backend.posts.mapper;

import com.kaleidoscope.backend.posts.dto.response.PostCommentResponseDTO;
import com.kaleidoscope.backend.posts.model.PostComment;
import com.kaleidoscope.backend.posts.dto.response.UserResponseDTO;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

@Component
public class PostCommentMapper {

	public PostCommentResponseDTO toDTO(PostComment comment) {
		return PostCommentResponseDTO.builder()
				.commentId(comment.getCommentId())
				.postId(comment.getPost().getPostId())
				.body(comment.getBody())
				.status(comment.getStatus())
				.createdAt(comment.getCreatedAt())
				.updatedAt(comment.getUpdatedAt())
				.author(toUserDTO(comment.getUser()))
				.build();
	}

	private UserResponseDTO toUserDTO(User user) {
		if (user == null) return null;
		UserResponseDTO dto = new UserResponseDTO();
		dto.setUserId(user.getUserId());
		dto.setUsername(user.getUsername());
		return dto;
	}
}


