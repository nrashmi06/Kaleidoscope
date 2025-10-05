package com.kaleidoscope.backend.users.repository.specifications;

import com.kaleidoscope.backend.shared.enums.AccountStatus;
import com.kaleidoscope.backend.users.enums.Visibility;
import com.kaleidoscope.backend.users.model.User;
import com.kaleidoscope.backend.users.model.UserBlock;
import com.kaleidoscope.backend.users.model.UserPreferences;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;


public class UserSpecifications {

    public static Specification<User> isNotCurrentUser(Long currentUserId) {
        return (root, query, cb) -> cb.notEqual(root.get("userId"), currentUserId);
    }

    public static Specification<User> isActive() {
        return (root, query, cb) -> cb.equal(root.get("accountStatus"), AccountStatus.ACTIVE);
    }

    public static Specification<User> usernameOrEmailContains(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.isEmpty()) {
                return cb.conjunction();
            }
            String likePattern = "%" + searchTerm.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("username")), likePattern),
                    cb.like(cb.lower(root.get("email")), likePattern)
            );
        };
    }

    public static Specification<User> isNotBlockedBy(Long currentUserId) {
        return (root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<UserBlock> subRoot = subquery.from(UserBlock.class);
            subquery.select(subRoot.get("blocked").get("userId"));
            subquery.where(cb.equal(subRoot.get("blocker").get("userId"), currentUserId));
            return cb.not(root.get("userId").in(subquery));
        };
    }

    public static Specification<User> hasPublicTagging() {
        return (root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<UserPreferences> subRoot = subquery.from(UserPreferences.class);
            subquery.select(subRoot.get("user").get("userId"));
            subquery.where(cb.equal(subRoot.get("allowTagging"), Visibility.PUBLIC));
            return root.get("userId").in(subquery);
        };
    }
}