-- Create admin user for The Sport Exchange
-- Email: admin@thesportexchange.com
-- Password: admin123

INSERT INTO users (email, password_hash, role) 
VALUES (
  'admin@thesportexchange.com',
  '$2b$10$86N4NLIen4FuajmYcgJplujVS7CfRZvpZRpKXv2jfGD3Z.ocTSYv2',
  'admin'
);
