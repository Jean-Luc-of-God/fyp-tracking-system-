-- Seed the superadmin account (password: Admin@1234 — must be changed on first login)
-- BCrypt hash of 'Admin@1234'
INSERT INTO users (id, email, password_hash, full_name, phone, role, enabled)
VALUES (
    uuid_generate_v4(),
    'admin@aauca.ac.rw',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TlFcJ1F.6T2nF3X8bV.7QhYqO6Ky',
    'System Administrator',
    NULL,
    'SUPERADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;
