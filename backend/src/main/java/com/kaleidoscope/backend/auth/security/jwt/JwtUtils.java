package com.kaleidoscope.backend.auth.security.jwt;

import com.kaleidoscope.backend.auth.config.JwtProperties;
import com.kaleidoscope.backend.auth.exception.token.JwtTokenExpiredException;
import com.kaleidoscope.backend.shared.enums.Role;
import com.kaleidoscope.backend.users.model.UserPreferences;
import com.kaleidoscope.backend.users.repository.UserRepository;
import com.kaleidoscope.backend.users.repository.UserInterestRepository;
import com.kaleidoscope.backend.users.repository.UserPreferencesRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    private final JwtProperties jwtProperties;
    private final UserRepository userRepository;
    private final UserInterestRepository userInterestRepository;
    private final UserPreferencesRepository userPreferencesRepository;

    @Autowired
    public JwtUtils(JwtProperties jwtProperties, UserRepository userRepository,
                    UserInterestRepository userInterestRepository, UserPreferencesRepository userPreferencesRepository) {
        this.jwtProperties = jwtProperties;
        this.userRepository = userRepository;
        this.userInterestRepository = userInterestRepository;
        this.userPreferencesRepository = userPreferencesRepository;
    }

    public String getJwtFromHeader(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        logger.debug("Authorization Header: {}", bearerToken);
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove Bearer prefix
        }
        return null;
    }

    public String generateTokenFromUsername(UserDetails userDetails, Long userId) {
        String username = userDetails.getUsername();
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_HOUSE_OWNER"); // Default role if not found

        // Check if user has selected any interests
        boolean isUserInterestSelected = userInterestRepository.existsByUser_UserId(userId);

        // Get user preferences for theme and language
        UserPreferences userPreferences = userPreferencesRepository.findByUser_UserId(userId).orElse(null);
        String theme = userPreferences != null ? userPreferences.getTheme().toString() : "SYSTEM";
        String language = userPreferences != null ? userPreferences.getLanguage() : "en-US";

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

        logger.debug("Current time: {}", now);
        logger.debug("Token expiration time: {}", expiryDate);
        logger.debug("User {} has selected interests: {}", userId, isUserInterestSelected);
        logger.debug("User {} theme: {}, language: {}", userId, theme, language);

        return Jwts.builder()
                .claim("role", role)
                .claim("userId", userId)
                .claim("isUserInterestSelected", isUserInterestSelected)
                .claim("theme", theme)
                .claim("language", language)
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String getRoleFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }

    public Long getUserIdFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("userId", Long.class);
    }

    public Long getHouseIdFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("houseId", Long.class);
    }

    public Boolean getIsUserInterestSelectedFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("isUserInterestSelected", Boolean.class);
    }

    public String getThemeFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("theme", String.class);
    }

    public String getLanguageFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get("language", String.class);
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.getSecret()));
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jws<Claims> claimsJws = Jwts.parserBuilder()
                    .setSigningKey(key())
                    .setAllowedClockSkewSeconds(60) // Allow 60 seconds clock skew
                    .build()
                    .parseClaimsJws(authToken);
            Date expiration = claimsJws.getBody().getExpiration();
            Date now = new Date();

            logger.debug("Token expiration time: {}", expiration);
            logger.debug("Current time: {}", now);

            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
            throw new JwtTokenExpiredException("Invalid JWT token");
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
            throw new JwtTokenExpiredException("JWT token has expired. Please renew your token.");
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
            throw new JwtTokenExpiredException("JWT token is unsupported");
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
            throw new JwtTokenExpiredException("JWT claims string is empty");
        }
    }

    public Long getUserIdFromContext() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String jwt = getJwtFromHeader(request);
        return getUserIdFromJwtToken(jwt);
    }

    public Long getHouseIdFromContext() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String jwt = getJwtFromHeader(request);
        return getHouseIdFromJwtToken(jwt);
    }

    public boolean isAdminFromContext() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String jwt = getJwtFromHeader(request);
        String role = getRoleFromJwtToken(jwt);
        return role.equals("ROLE_ADMIN");
    }

    public Boolean getIsUserInterestSelectedFromContext() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String jwt = getJwtFromHeader(request);
        return getIsUserInterestSelectedFromJwtToken(jwt);
    }

    public String getRoleFromContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getAuthorities() != null) {
            for (GrantedAuthority authority : authentication.getAuthorities()) {
                return authority.getAuthority();
            }
        }
        return "ROLE_"+ Role.USER; // Default role if none found
    }
}

