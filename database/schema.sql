-- The Sport Exchange Database Schema
-- Database: thesportexchange

-- ============================================
-- Table: users
-- Purpose: Store admin and investor login credentials
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'investor') NOT NULL DEFAULT 'investor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: investors
-- Purpose: Store investor personal and investment details
-- ============================================
CREATE TABLE investors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  amount_of_money DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  amount_of_coins DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  share_percentage DECIMAL(5, 2) DEFAULT 0.00,
  investment_date DATE,
  status ENUM('Pending', 'Signed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  payment ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: contracts
-- Purpose: Store individual investment contracts for each investor
-- ============================================
CREATE TABLE contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  investor_id INT NOT NULL,
  amount_of_money DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  amount_of_coins DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  coin_rate DECIMAL(10, 4) NOT NULL DEFAULT 0.00,
  payment_status ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
  contract_status ENUM('Draft', 'Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft',
  status ENUM('pending', 'contract sent', 'signed', 'cancelled') NOT NULL DEFAULT 'pending',
  investment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
  INDEX idx_investor_id (investor_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_contract_status (contract_status),
  INDEX idx_status (status),
  INDEX idx_investment_date (investment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: contract_documents
-- Purpose: Store multiple documents per contract (moved from investor_documents)
-- ============================================
CREATE TABLE contract_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contract_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_url VARCHAR(500) NOT NULL,
  document_type VARCHAR(100),
  file_size INT,
  uploaded_by INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_contract_id (contract_id),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: newsletters
-- Purpose: Store newsletters sent to investors
-- ============================================
CREATE TABLE newsletters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  sent_by INT NOT NULL,
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sent_date (sent_date),
  INDEX idx_sent_by (sent_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: newsletter_attachments
-- Purpose: Store multiple attachments per newsletter
-- ============================================
CREATE TABLE newsletter_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  newsletter_id INT NOT NULL,
  attachment_name VARCHAR(255) NOT NULL,
  attachment_url VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
  INDEX idx_newsletter_id (newsletter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: newsletter_recipients
-- Purpose: Track which investors received which newsletters
-- ============================================
CREATE TABLE newsletter_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  newsletter_id INT NOT NULL,
  investor_id INT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL,
  FOREIGN KEY (newsletter_id) REFERENCES newsletters(id) ON DELETE CASCADE,
  FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_newsletter_investor (newsletter_id, investor_id),
  INDEX idx_newsletter_id (newsletter_id),
  INDEX idx_investor_id (investor_id),
  INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Default Admin User
-- Password: admin123 (CHANGE THIS IN PRODUCTION!)
-- ============================================
INSERT INTO users (email, password_hash, role) VALUES 
('admin@thesportexchange.com', '$2a$10$rQJ5H8bE3qVZ9KvYvZ.7f.1qZH8bE3qVZ9KvYvZ.7f.1qZH8bE3qVZ', 'admin');
-- NOTE: This is a placeholder hash. You'll need to hash 'admin123' using bcrypt before inserting

-- ============================================
-- Sample Investor Insert (Optional - for testing)
-- ============================================
-- First create a user account for the investor
INSERT INTO users (email, password_hash, role) VALUES 
('john.smith@example.com', '$2a$10$rQJ5H8bE3qVZ9KvYvZ.7f.1qZH8bE3qVZ9KvYvZ.7f.1qZH8bE3qVZ', 'investor');

-- Then create the investor profile linked to the user
INSERT INTO investors (
  user_id, 
  full_name, 
  email, 
  phone, 
  address, 
  city, 
  state, 
  zip_code, 
  country, 
  amount_of_money, 
  amount_of_coins, 
  share_percentage, 
  investment_date, 
  status
) VALUES (
  2,  -- user_id from the users table
  'John Smith', 
  'john.smith@example.com', 
  '+1 (555) 123-4567', 
  '123 Main Street', 
  'New York', 
  'NY', 
  '10001', 
  'USA', 
  50000.00, 
  25000.00, 
  2.50, 
  '2024-01-15', 
  'Signed'
);

-- ============================================
-- Useful Queries for Testing
-- ============================================

-- Get all investors with their user information
-- SELECT i.*, u.email, u.role FROM investors i 
-- JOIN users u ON i.user_id = u.id;

-- Get all documents for a specific investor
-- SELECT * FROM investor_documents WHERE investor_id = 1;

-- Get all newsletters with attachment count
-- SELECT n.*, COUNT(na.id) as attachment_count 
-- FROM newsletters n 
-- LEFT JOIN newsletter_attachments na ON n.id = na.newsletter_id 
-- GROUP BY n.id;

-- Get newsletter recipients with investor details
-- SELECT nr.*, i.full_name, i.email 
-- FROM newsletter_recipients nr 
-- JOIN investors i ON nr.investor_id = i.id 
-- WHERE nr.newsletter_id = 1;

-- Get investor status distribution
-- SELECT status, COUNT(*) as count 
-- FROM investors 
-- GROUP BY status;

-- ============================================
-- Table: investment_requests
-- Purpose: Store investment requests from investors
-- ============================================
CREATE TABLE investment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investor_id INT NOT NULL,
    investment_amount DECIMAL(10, 2) NOT NULL,
    current_rate DECIMAL(8, 5) NOT NULL,
    calculated_coins DECIMAL(15, 0) NOT NULL,
    discount_percentage INT DEFAULT 20,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_investor_id (investor_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    
    -- Constraints
    CONSTRAINT chk_investment_amount CHECK (investment_amount >= 100),
    CONSTRAINT chk_current_rate CHECK (current_rate > 0),
    CONSTRAINT chk_calculated_coins CHECK (calculated_coins >= 0),
    CONSTRAINT chk_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
