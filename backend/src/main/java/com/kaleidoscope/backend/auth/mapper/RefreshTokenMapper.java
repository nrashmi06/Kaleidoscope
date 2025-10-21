package com.kaleidoscope.backend.auth.mapper;

import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.posts.dto.response.PostSaveResponseDTO;
import com.kaleidoscope.backend.posts.model.Post;
import com.kaleidoscope.backend.posts.model.PostSave;
import com.kaleidoscope.backend.users.mapper.UserMapper;
import com.kaleidoscope.backend.users.model.User;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Mapper for RefreshToken-related response structures
 * Migrated from RefreshTokenServiceImpl.renewToken
 */
@Component
public class RefreshTokenMapper {

    /**
     * Create renewal response Map containing user, accessToken, and refreshToken
     * Migrated from RefreshTokenServiceImpl.renewToken
     */
    public static Map<String, Object> toRenewalResponse(User user, String newAccessToken, String newRefreshToken) {
        UserLoginResponseDTO responseDTO = UserMapper.toUserLoginResponseDTO(user);

        Map<String, Object> response = new HashMap<>();
        response.put("user", responseDTO);
        response.put("accessToken", newAccessToken);
        response.put("refreshToken", newRefreshToken);

        return response;
    }
}
