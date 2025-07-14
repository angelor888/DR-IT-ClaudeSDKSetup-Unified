-- DuetRight Construction Database Schema
-- Generated: January 2025

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'quoted', 'approved', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    estimated_hours INTEGER,
    actual_hours INTEGER,
    start_date DATE,
    end_date DATE,
    completion_date DATE,
    location TEXT,
    permit_required BOOLEAN DEFAULT FALSE,
    permit_number VARCHAR(100),
    insurance_claim BOOLEAN DEFAULT FALSE,
    claim_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communications table
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'phone', 'meeting', 'note')),
    direction VARCHAR(20) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'replied', 'failed')),
    metadata JSONB,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    file_path TEXT NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('contract', 'invoice', 'receipt', 'photo', 'plan', 'permit', 'other')),
    description TEXT,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estimates/Quotes table
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    valid_until DATE,
    terms TEXT,
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estimate line items
CREATE TABLE estimate_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'each',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    item_type VARCHAR(50) DEFAULT 'labor' CHECK (item_type IN ('labor', 'material', 'equipment', 'subcontractor', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES estimates(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2) NOT NULL DEFAULT 0,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_date DATE,
    terms TEXT,
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice line items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_order INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'each',
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    item_type VARCHAR(50) DEFAULT 'labor' CHECK (item_type IN ('labor', 'material', 'equipment', 'subcontractor', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'other')),
    amount DECIMAL(12,2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers USING GIN(name gin_trgm_ops);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_dates ON jobs(start_date, end_date);
CREATE INDEX idx_communications_customer_id ON communications(customer_id);
CREATE INDEX idx_communications_job_id ON communications(job_id);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_sent_at ON communications(sent_at);
CREATE INDEX idx_documents_customer_id ON documents(customer_id);
CREATE INDEX idx_documents_job_id ON documents(job_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX idx_estimates_number ON estimates(estimate_number);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_processed_at ON payments(processed_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estimates_updated_at BEFORE UPDATE ON estimates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create computed column triggers
CREATE OR REPLACE FUNCTION update_estimate_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE estimates 
    SET 
        subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM estimate_items WHERE estimate_id = NEW.estimate_id),
        tax_amount = (subtotal * tax_rate),
        total_amount = (subtotal + tax_amount)
    WHERE id = NEW.estimate_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices 
    SET 
        subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM invoice_items WHERE invoice_id = NEW.invoice_id),
        tax_amount = (subtotal * tax_rate),
        total_amount = (subtotal + tax_amount),
        amount_due = (total_amount - amount_paid)
    WHERE id = NEW.invoice_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_estimate_total_trigger AFTER INSERT OR UPDATE OR DELETE ON estimate_items FOR EACH ROW EXECUTE FUNCTION update_estimate_total();
CREATE TRIGGER update_invoice_total_trigger AFTER INSERT OR UPDATE OR DELETE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_invoice_total();

-- Create views for common queries
CREATE VIEW customer_summary AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.city,
    c.state,
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN j.status = 'in_progress' THEN j.id END) as active_jobs,
    COALESCE(SUM(j.actual_cost), SUM(j.estimated_cost), 0) as total_value,
    MAX(j.created_at) as last_job_date,
    c.created_at
FROM customers c
LEFT JOIN jobs j ON c.id = j.customer_id
GROUP BY c.id, c.name, c.email, c.phone, c.city, c.state, c.created_at;

CREATE VIEW job_summary AS
SELECT 
    j.id,
    j.title,
    j.status,
    j.priority,
    c.name as customer_name,
    c.email as customer_email,
    j.estimated_cost,
    j.actual_cost,
    j.start_date,
    j.end_date,
    j.completion_date,
    CASE 
        WHEN j.status = 'completed' AND j.completion_date IS NOT NULL THEN j.completion_date - j.start_date
        WHEN j.status IN ('in_progress', 'approved') AND j.start_date IS NOT NULL THEN CURRENT_DATE - j.start_date
        ELSE NULL
    END as duration_days,
    j.created_at
FROM jobs j
JOIN customers c ON j.customer_id = c.id;

-- Insert sample data
INSERT INTO customers (name, email, phone, address, city, state, zip_code, notes) VALUES
('John Smith', 'john.smith@email.com', '(206) 555-0123', '123 Main St', 'Seattle', 'WA', '98101', 'Preferred customer - always pays on time'),
('Sarah Johnson', 'sarah.johnson@email.com', '(206) 555-0456', '456 Oak Ave', 'Bellevue', 'WA', '98004', 'Referred by John Smith'),
('Mike Davis', 'mike.davis@email.com', '(206) 555-0789', '789 Pine Rd', 'Redmond', 'WA', '98052', 'Previous customer - deck and patio work'),
('Lisa Wilson', 'lisa.wilson@email.com', '(206) 555-0321', '321 Cedar Ln', 'Kirkland', 'WA', '98033', 'New construction project'),
('DuetRight Construction', 'info@duetright.com', '(206) 555-0001', '1234 Construction Ave', 'Seattle', 'WA', '98101', 'Company record for internal projects');

-- Sample jobs
INSERT INTO jobs (customer_id, title, description, status, estimated_cost, actual_cost, start_date, end_date, location) 
SELECT 
    c.id,
    'Kitchen Remodel',
    'Complete kitchen renovation including cabinets, countertops, appliances, and flooring. Remove wall between kitchen and dining room.',
    'in_progress',
    45000.00,
    47500.00,
    '2025-01-15',
    '2025-02-28',
    '123 Main St, Seattle, WA'
FROM customers c WHERE c.email = 'john.smith@email.com';

INSERT INTO jobs (customer_id, title, description, status, estimated_cost, start_date, location) 
SELECT 
    c.id,
    'Composite Deck Installation',
    '20x12 ft composite deck with cable railings and built-in bench seating.',
    'quoted',
    8500.00,
    '2025-02-15',
    '456 Oak Ave, Bellevue, WA'
FROM customers c WHERE c.email = 'sarah.johnson@email.com';

INSERT INTO jobs (customer_id, title, description, status, estimated_cost, actual_cost, completion_date, location) 
SELECT 
    c.id,
    'Bathroom Renovation',
    'Master bathroom renovation with walk-in shower, new vanity, and tile work.',
    'completed',
    12000.00,
    11800.00,
    '2024-12-20',
    '789 Pine Rd, Redmond, WA'
FROM customers c WHERE c.email = 'mike.davis@email.com';

-- Sample communications
INSERT INTO communications (customer_id, job_id, type, subject, content, status)
SELECT 
    c.id,
    j.id,
    'email',
    'Project Update - Kitchen Remodel',
    'Hi John, I wanted to update you on the progress of your kitchen remodel. We have successfully removed the wall and are now working on the electrical updates. Everything is on schedule for completion by February 28th.',
    'read'
FROM customers c 
JOIN jobs j ON c.id = j.customer_id 
WHERE c.email = 'john.smith@email.com' AND j.title = 'Kitchen Remodel';

INSERT INTO communications (customer_id, type, content, status, direction)
SELECT 
    c.id,
    'phone',
    'Discussed deck specifications, material preferences, and timeline. Customer prefers composite decking in gray color. Scheduling site visit for next week.',
    'sent',
    'outbound'
FROM customers c WHERE c.email = 'sarah.johnson@email.com';

-- Grant permissions to duetright_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO duetright_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO duetright_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO duetright_user;

-- Success message
\echo 'DuetRight Construction database schema created successfully!'
\echo 'Sample data inserted for testing.'
\echo 'Database is ready for use.'