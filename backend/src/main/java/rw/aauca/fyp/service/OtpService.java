package rw.aauca.fyp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redis;
    private static final Duration OTP_TTL = Duration.ofMinutes(15);
    private static final String PREFIX = "otp:";
    private static final SecureRandom RANDOM = new SecureRandom();

    public String generateAndStore(String email) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        redis.opsForValue().set(PREFIX + email.toLowerCase(), otp, OTP_TTL);
        return otp;
    }

    /** Returns true and deletes the OTP if it matches. Returns false otherwise. */
    public boolean validate(String email, String otp) {
        String key = PREFIX + email.toLowerCase();
        String stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(otp.trim())) return false;
        redis.delete(key);
        return true;
    }
}
