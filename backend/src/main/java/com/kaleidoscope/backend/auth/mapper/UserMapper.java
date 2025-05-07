package com.kaleidoscope.backend.auth.mapper;

import com.kaleidoscope.backend.auth.enums.AccountStatus;
import com.kaleidoscope.backend.auth.enums.Role;
import com.kaleidoscope.backend.auth.dto.request.UserRegistrationRequestDTO;
import com.kaleidoscope.backend.auth.dto.response.UserDetailsSummaryResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserLoginResponseDTO;
import com.kaleidoscope.backend.auth.dto.response.UserRegistrationResponseDTO;
import com.kaleidoscope.backend.auth.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    public User toUser(UserRegistrationRequestDTO userRegistrationRequestDTO) {
        User user = User.builder()
                .email(userRegistrationRequestDTO.getEmail())
                .password(userRegistrationRequestDTO.getPassword())
                .username(userRegistrationRequestDTO.getUsername())
                .build();
        return user;
    }

    public User toEntity(UserRegistrationRequestDTO dto, String encodedPassword) {
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(encodedPassword);
        user.setRole(Role.USER);
        user.setAccountStatus(AccountStatus.DEACTIVATED);
        user.setEmail(dto.getEmail());
        return user;
    }

    public static UserLoginResponseDTO toUserLoginResponseDTO(User user) {
        UserLoginResponseDTO responseDTO = UserLoginResponseDTO.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();

        return responseDTO;
    }

    public static UserDetailsSummaryResponseDTO toUserDetailsSummaryResponseDTO(User user) {
        return new UserDetailsSummaryResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getAccountStatus().name()
        );
    }

    public static UserRegistrationResponseDTO toRegistrationResponseDTO(User user) {
        return new UserRegistrationResponseDTO(
                user.getUserId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole()
        );
    }
}