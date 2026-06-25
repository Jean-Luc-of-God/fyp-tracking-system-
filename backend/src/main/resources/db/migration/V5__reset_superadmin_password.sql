-- Reset superadmin password to Admin@1234 and ensure the account exists and is enabled.
-- BCrypt cost 12 hash of 'Admin@1234'
INSERT INTO users (id, email, password_hash, full_name, phone, role, enabled)
VALUES (
    uuid_generate_v4(),
    'admin@aauca.ac.rw',
    '$2b$12$jxethnG.j9qbxE9WfY3msOA4LBE1e.unW5ks52Q0w8XgNK4OhnNfS',
    'System Administrator',
    NULL,
    'SUPERADMIN',
    TRUE
)
ON CONFLICT (email) DO UPDATE
    SET password_hash = '$2b$12$jxethnG.j9qbxE9WfY3msOA4LBE1e.unW5ks52Q0w8XgNK4OhnNfS',
        enabled       = TRUE;
