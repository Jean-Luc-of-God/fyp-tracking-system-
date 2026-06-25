package rw.aauca.fyp.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP token-bucket rate limiter for the login endpoint.
 * Allows 5 attempts per IP per 15-minute window.
 * Buckets are evicted hourly once they are full (i.e. the IP has been idle long enough to refill).
 */
@Component
public class LoginRateLimiter {

    private static final int CAPACITY = 5;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String ip) {
        return buckets.computeIfAbsent(ip, k -> newBucket()).tryConsume(1);
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.classic(CAPACITY, Refill.intervally(CAPACITY, REFILL_PERIOD));
        return Bucket.builder().addLimit(limit).build();
    }

    @Scheduled(fixedDelay = 3_600_000)
    public void evictFullBuckets() {
        buckets.entrySet().removeIf(e -> e.getValue().getAvailableTokens() == CAPACITY);
    }
}
