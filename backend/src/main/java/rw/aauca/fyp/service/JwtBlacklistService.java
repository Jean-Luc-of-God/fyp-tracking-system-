package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class JwtBlacklistService {

    private static final String PREFIX = "jwt:bl:";

    private final StringRedisTemplate redis;

    /** Blacklist a token by its JTI until it would have expired naturally. */
    public void blacklist(String jti, Instant tokenExpiry) {
        Duration ttl = Duration.between(Instant.now(), tokenExpiry);
        if (!ttl.isNegative() && !ttl.isZero()) {
            redis.opsForValue().set(PREFIX + jti, "1", ttl);
        }
    }

    /** Returns true if the token's JTI has been blacklisted. */
    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX + jti));
    }
}
