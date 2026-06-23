-- Seed the superadmin account (password: Admin@1234 — must be changed on first login)
-- BCrypt hash of 'Admin@1234'
INSERT INTO users (id, email, password_hash, full_name, phone, role, enabled)
VALUES (
    uuid_generate_v4(),
    'admin@aauca.ac.rw',
    '$2b$12$k1yFf4SRyyNL2f0WBXy6J.DhhrMUHblh.qraMRGyIvijZeVmB8Gvm',
    'System Administrator',
    NULL,
    'SUPERADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;
