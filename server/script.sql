CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ROLES
-- 1. system admin
-- 2. hospital admin
-- 3. provider
-- 4. nurse
-- 5. receptionist



CREATE TABLE hospitals (
    hospital_id SERIAL PRIMARY KEY,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(100) NOT NULL, -- General, Specialty, Clinic
    hospital_license_number VARCHAR(100) UNIQUE NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    accredition_status VARCHAR(100) DEFAULT 'Not Accredited',
    contact_number VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    branch_id SERIAL PRIMARY KEY,
    hospital_id INT REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    branch_name VARCHAR(255) NOT NULL,
    branch_type VARCHAR(100) NOT NULL, -- General, Specialty, Clinic
    branch_license_number VARCHAR(100) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    accredition_status VARCHAR(100) DEFAULT 'Not Accredited',
    state VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (hospital_id, branch_name)
);


CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'locked', 'archived');
CREATE TYPE employment_status_enum AS ENUM ('active', 'suspended', 'fired');
CREATE TYPE gender_enum AS ENUM ('female', 'male', 'other');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    hospital_id INT REFERENCES hospitals(hospital_id),
    branch_id INT REFERENCES branches(branch_id) ON DELETE SET NULL,
    department VARCHAR(100),
    date_of_birth DATE,
    gender gender_enum NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact_info VARCHAR(100),
    address_line VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(role_id),
    last_login TIMESTAMP,
    employment_status employment_status_enum NOT NULL DEFAULT 'active', -- active, fired, suspended
    account_status account_status_enum NOT NULL DEFAULT 'active', -- active,suspended,locked, archived
    must_change_password BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE healthcare_providers (
    user_id INT UNIQUE NOT NULL REFERENCES users(user_id),
    provider_id SERIAL PRIMARY KEY,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry DATE,
    country VARCHAR(100),
    specialization VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE provider_hospitals (
    provider_hospital_id SERIAL PRIMARY KEY,
    provider_id INT REFERENCES healthcare_providers(provider_id) ON DELETE CASCADE,
    hospital_id INT REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(branch_id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE (provider_id, hospital_id)
);

CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    country_of_birth VARCHAR(100),
    country_of_residence VARCHAR(100),
    national_id VARCHAR(50) UNIQUE,
    date_of_birth DATE, -- age
    gender VARCHAR(10),
    marital_status VARCHAR(50),
    blood_type VARCHAR(5),
    occupation VARCHAR(100),
    address_line TEXT,
    email VARCHAR(100) UNIQUE,
    primary_number VARCHAR(50),
    secondary_number VARCHAR(50),
    emergency_contact1_name VARCHAR(100),
    emergency_contact1_number VARCHAR(50),
    emergency_contact1_relationship VARCHAR(50),
    emergency_contact2_name VARCHAR(100),
    emergency_contact2_number VARCHAR(50),
    emergency_contact2_relationship VARCHAR(50),
    primary_insurance_provider VARCHAR(100),
    primary_insurance_policy_number VARCHAR(100) UNIQUE,
    secondary_insurance_provider VARCHAR(100),
    secondary_insurance_policy_number VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    ethnicity VARCHAR(50),
    preffered_language VARCHAR(50),
    religion VARCHAR(50),
    is_deceased BOOLEAN DEFAULT FALSE,
    date_of_death DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patient_identifiers (
    identifier_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id) ON DELETE CASCADE,
    hospital_id INT REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    patient_mrn VARCHAR(100) NOT NULL,
    UNIQUE (hospital_id, patient_mrn),
    UNIQUE (patient_id, hospital_id)
);

CREATE TYPE admission_status_enum AS ENUM ('admitted','under observation','discharged','transferred');
CREATE TYPE priority_level_enum AS ENUM ('low', 'normal', 'high', 'critical');

CREATE TABLE visits (
    visit_id SERIAL PRIMARY KEY,
    visit_number VARCHAR(100) UNIQUE NOT NULL,
    visit_type VARCHAR(50) NOT NULL, -- Outpatient, Inpatient, Emergency
    patient_id INT REFERENCES patients(patient_id),
    user_id INT REFERENCES users(user_id),
    provider_id INT REFERENCES healthcare_providers(provider_id),
    hospital_id INT REFERENCES hospitals(hospital_id),
    branch_id INT REFERENCES branches(branch_id),
    visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority_level priority_level_enum DEFAULT 'normal',
    referring_provider_name VARCHAR(100),
    referring_provider_hospital VARCHAR(100),
    reason_for_visit TEXT,
    admission_status admission_status_enum, -- Admitted, Discharged, Transferred
    discharge_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE vitals (
    vital_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    blood_pressure VARCHAR(20),
    heart_rate INT,
    respiratory_rate INT,
    temperature DECIMAL(4,2),
    oxygen_saturation DECIMAL(5,2),
    weight DECIMAL(6,2),
    weight_unit VARCHAR(5) DEFAULT 'kg',
    height DECIMAL(6,2),
    height_unit VARCHAR(5) DEFAULT 'cm',
    bmi DECIMAL(5,2),
    recorded_by INT REFERENCES healthcare_providers(provider_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diagnoses (
    diagnosis_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    diagnosis_type VARCHAR(20) NOT NULL, -- Primary, Secondary, Tertiary
    diagnosis_name VARCHAR(200),
    icd_codes_version VARCHAR(10),
    icd_code VARCHAR(20) NOT NULL,
    is_chronic BOOLEAN DEFAULT FALSE,
    diagnosis_description TEXT,
    -- diagnosed_by INT REFERENCES healthcare_providers(provider_id),
    severity VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE treatments (
    treatment_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    treatment_name VARCHAR(100) NOT NULL,
    treatment_type VARCHAR(100),
    procedure_code VARCHAR(50),
    treatment_description TEXT,
    -- performed_by INT REFERENCES healthcare_providers(provider_id),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    outcome VARCHAR(50), -- Successful, Ongoing, Failed
    complications TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    treatment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE visit_prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    medication_name VARCHAR(100),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    refills_allowed INTEGER DEFAULT 0,
    instructions TEXT,
    -- prescribed_by INT REFERENCES healthcare_providers(provider_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE lab_tests (
    lab_test_id SERIAL PRIMARY KEY,  -- Changed from lab_test_id
    visit_id INT REFERENCES visits(visit_id),
    priority VARCHAR(50) DEFAULT 'normal',
    test_code VARCHAR(50),
    test_name VARCHAR(100) NOT NULL,
    pdf_key TEXT,  -- Changed from pdf_url to store S3 keys
    findings TEXT,
    recommendations TEXT,
    lab_notes TEXT,
    created_by INT,  -- Added to match backend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE imaging_results (
    imaging_result_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    -- ordered_by INT REFERENCES healthcare_providers(provider_id),
    -- performed_by INT REFERENCES healthcare_providers(provider_id),
    -- image_url TEXT,
    orthanc_study_id VARCHAR(100),
    orthanc_series_id VARCHAR(100),
    orthanc_instance_id VARCHAR(100),
    modality VARCHAR(20),
    study_description TEXT,
    series_description TEXT,
    body_part VARCHAR(100),
    study_date TIMESTAMP,
    dicom_metadata JSONB,
    file_size BIGINT,
    instance_count INTEGER DEFAULT 1,
    uploaded_by INT REFERENCES users(user_id)

    findings TEXT,
    recommendations TEXT, 
    -- notes TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE allergies (
    allergy_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    allergen VARCHAR(100),
    reaction TEXT,
    allergy_severity VARCHAR(50), -- Mild, Moderate, Severe
    verified BOOLEAN DEFAULT FALSE, 
    -- recorded_by INT REFERENCES healthcare_providers(provider_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medications (
    medication_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    medication_name VARCHAR(100),
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    start_date DATE,
    end_date DATE,
    medication_is_active BOOLEAN DEFAULT TRUE,
    hospital_where_prescribed VARCHAR(100),
    medication_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chronic_conditions (
    condition_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    icd_codes_version VARCHAR(10),
    icd_code VARCHAR(20), 
    condition_name VARCHAR(200),
    diagnosed_date DATE,
    -- diagnosed_by INT REFERENCES healthcare_providers(provider_id),
    current_status VARCHAR(50), -- Active, Controlled, In Remission, Resolved
    condition_severity VARCHAR(20),
    management_plan TEXT,
    condition_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_reviewed TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_history (
    family_history_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    relative_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- Mother, Father, Sibling, etc.
    relative_patient_id INT REFERENCES patients(patient_id),
    relative_condition_name VARCHAR(200),
    age_of_onset INTEGER,
    family_history_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_history (
    social_history_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    smoking_status VARCHAR(250),
    alcohol_use VARCHAR(250),
    drug_use TEXT,
    physical_activity TEXT,
    diet_description TEXT,
    -- occupation VARCHAR(100),
    living_situation VARCHAR(200),
    support_system TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    patient_id INT REFERENCES patients(patient_id),
    table_name VARCHAR(100),
    action_type VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    event_type VARCHAR(50), -- Create, Read, Update, Delete
    branch_id INT REFERENCES branches(branch_id);
    hospital_id INT REFERENCES hospitals(hospital_id);
    request_method VARCHAR(10);
    endpoint VARCHAR(255);
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);  

CREATE TABLE error_logs (
    error_id SERIAL PRIMARY KEY,
    error_message TEXT,
    stack_trace TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE system_logs (
    log_id SERIAL PRIMARY KEY,
    log_level VARCHAR(20), -- DEBUG, INFO, WARN, ERROR, CRITICAL
    component VARCHAR(100),
    message TEXT,
    error_code VARCHAR(50),
    stack_trace TEXT,
    additional_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE data_exports (
    export_id SERIAL PRIMARY KEY,
    requested_by INT REFERENCES users(user_id),
    patient_id INT REFERENCES patients(patient_id),
    export_type VARCHAR(50),
    date_range DATERANGE,
    export_format VARCHAR(20),
    file_path TEXT,
    file_size BIGINT,
    export_status VARCHAR(20) DEFAULT 'Processing',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP
);

CREATE TABLE ai_summaries (
    summary_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES patients(patient_id),
    summary_type VARCHAR(50), -- Full History, Recent Activity, Problem List
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summary_content TEXT NOT NULL,
    key_conditions TEXT[],
    risk_factors TEXT[],
    recommendations TEXT[],
    confidence_score DECIMAL(3,2), 
    model_version VARCHAR(50),
    input_data_range DATERANGE, -- PostgreSQL date range type
    -- reviewed_by INT REFERENCES healthcare_providers(provider_id),
    -- review_status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Modified, Rejected
    -- is_current BOOLEAN DEFAULT TRUE
);


CREATE INDEX idx_imaging_orthanc_study ON imaging_results(orthanc_study_id);
CREATE INDEX idx_imaging_orthanc_series ON imaging_results(orthanc_series_id);
CREATE INDEX idx_imaging_orthanc_instance ON imaging_results(orthanc_instance_id);
CREATE INDEX idx_imaging_modality ON imaging_results(modality);
CREATE INDEX idx_imaging_visit ON imaging_results(visit_id);
CREATE INDEX idx_imaging_study_date ON imaging_results(study_date);




CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON users(password_reset_expires);




CREATE INDEX idx_patient_mrn ON patient_identifiers(patient_mrn);
CREATE INDEX idx_patient_name ON patients(last_name, first_name);
CREATE INDEX idx_patient_national_id ON patients(national_id);
CREATE INDEX idx_patient_dob ON patients(date_of_birth);


CREATE INDEX idx_provider_name ON users(last_name, first_name);
CREATE INDEX idx_provider_license ON healthcare_providers(license_number);
CREATE INDEX idx_provider_hospital ON provider_hospitals(provider_id, hospital_id);
CREATE INDEX idx_hospital_provider ON provider_hospitals(hospital_id, provider_id);
CREATE UNIQUE INDEX idx_provider_primary_hospital ON provider_hospitals(provider_id) WHERE is_primary = TRUE;


CREATE INDEX idx_visit_patient ON visits(patient_id);
CREATE INDEX idx_visit_provider ON visits(provider_id);
CREATE INDEX idx_visit_date ON visits(visit_date);
CREATE INDEX idx_visit_patient_date ON visits(patient_id, visit_date);


CREATE INDEX idx_diagnosis_visit ON diagnoses(visit_id);
CREATE INDEX idx_visit_prescriptions_visit ON visit_prescriptions(visit_id);
CREATE INDEX idx_lab_test_visit ON lab_tests(visit_id);
CREATE INDEX idx_imaging_visit ON imaging_results(visit_id);
CREATE INDEX idx_vitals_visit ON vitals(visit_id);


CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX idx_access_user_timestamp ON access_logs(user_id, timestamp);
CREATE INDEX idx_audit_patient ON audit_logs(patient_id);


CREATE INDEX idx_active_providers ON users(user_id) WHERE employment_status = 'active';
CREATE INDEX idx_active_patients ON patients(patient_id) WHERE is_active = TRUE;


CREATE INDEX idx_audit_timestamp_desc ON audit_logs(timestamp DESC);
CREATE INDEX idx_access_timestamp_desc ON access_logs(timestamp DESC);

INSERT INTO roles (role_name, role_description, permissions)
VALUES (
  'superadmin',
  'Has unrestricted system-wide access including user, hospital, and data management.',
  '{
    "user_management": {"create": true, "edit": true, "delete": true, "view": true},
    "hospital_management": {"create": true, "edit": true, "delete": true, "view": true},
    "patient_records": {"create": true, "edit": true, "delete": true, "view": true},
    "clinical": {"diagnose": true, "treat": true, "prescribe": true, "order_tests": true},
    "logs": {"view": true, "export": true}
  }'::jsonb
);


INSERT INTO roles (role_name, role_description, permissions)
VALUES (
  'localadmin',
  'Hospital administrator with authority over staff and patient data within their hospital.',
  '{
    "user_management": {"create": true, "edit": true, "delete": true, "view": true},
    "hospital_management": {"create": false, "edit": true, "delete": false, "view": true},
    "patient_records": {"create": true, "edit": true, "delete": true, "view": true},
    "clinical": {"diagnose": false, "treat": false, "prescribe": false, "order_tests": false},
    "logs": {"view": true, "export": true}
  }'::jsonb
);


INSERT INTO roles (role_name, role_description, permissions)
VALUES (
  'medicalprovider',
  'Licensed provider who can diagnose, treat, prescribe, and order tests.',
  '{
    "patient_records": {"create": false, "edit": true, "delete": false, "view": true},
    "clinical": {"diagnose": true, "treat": true, "prescribe": true, "order_tests": true},
    "logs": {"view": false, "export": false}
  }'::jsonb
);


INSERT INTO roles (role_name, role_description, permissions)
VALUES (
  'nurse',
  'Nurse with authority to record vitals, assist in patient care, and maintain care notes.',
  '{
    "patient_records": {"create": false, "edit": true, "delete": false, "view": true},
    "clinical": {"diagnose": false, "treat": false, "prescribe": false, "order_tests": false}
  }'::jsonb
);


INSERT INTO roles (role_name, role_description, permissions)
VALUES (
  'receptionist',
  'Responsible for patient registration, scheduling, and check-in/out.',
  '{
    "patient_records": {"create": true, "edit": true, "delete": false, "view": true}
  }'::jsonb
);








-- Drop the old table if you want to start fresh (CAUTION: This deletes data!)
-- DROP TABLE IF EXISTS imaging_results CASCADE;

-- Create new imaging_studies table (replaces imaging_results)
CREATE TABLE imaging_studies (
    imaging_study_id SERIAL PRIMARY KEY,
    visit_id INT REFERENCES visits(visit_id),
    
    -- Orthanc identifiers
    orthanc_study_id VARCHAR(100) UNIQUE NOT NULL,
    study_instance_uid VARCHAR(200) UNIQUE,
    
    -- Study metadata
    modality VARCHAR(20),  -- Primary modality (CT, MRI, etc.)
    study_description TEXT,
    body_part VARCHAR(100),
    study_date TIMESTAMP,
    
    -- Study statistics
    series_count INTEGER DEFAULT 0,
    instance_count INTEGER DEFAULT 0,
    total_file_size BIGINT DEFAULT 0,
    
    -- DICOM metadata (study-level tags)
    dicom_metadata JSONB,
    
    -- Clinical information
    findings TEXT,
    recommendations TEXT,
    
    -- Audit fields
    uploaded_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create imaging_series table (child of studies)
CREATE TABLE imaging_series (
    imaging_series_id SERIAL PRIMARY KEY,
    imaging_study_id INT REFERENCES imaging_studies(imaging_study_id) ON DELETE CASCADE,
    
    orthanc_series_id VARCHAR(100) UNIQUE NOT NULL,
    series_instance_uid VARCHAR(200),
    
    series_number INTEGER,
    series_description TEXT,
    modality VARCHAR(20),
    body_part VARCHAR(100),
    
    instance_count INTEGER DEFAULT 0,
    series_file_size BIGINT DEFAULT 0,
    
    dicom_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create imaging_instances table (child of series)
CREATE TABLE imaging_instances (
    imaging_instance_id SERIAL PRIMARY KEY,
    imaging_series_id INT REFERENCES imaging_series(imaging_series_id) ON DELETE CASCADE,
    
    orthanc_instance_id VARCHAR(100) UNIQUE NOT NULL,
    sop_instance_uid VARCHAR(200),
    
    instance_number INTEGER,
    file_name VARCHAR(500),
    file_size BIGINT,
    
    dicom_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_imaging_studies_visit ON imaging_studies(visit_id);
CREATE INDEX idx_imaging_studies_orthanc_study ON imaging_studies(orthanc_study_id);
CREATE INDEX idx_imaging_studies_study_uid ON imaging_studies(study_instance_uid);
CREATE INDEX idx_imaging_studies_modality ON imaging_studies(modality);
CREATE INDEX idx_imaging_studies_study_date ON imaging_studies(study_date);
CREATE INDEX idx_imaging_studies_uploaded_by ON imaging_studies(uploaded_by);

CREATE INDEX idx_imaging_series_study ON imaging_series(imaging_study_id);
CREATE INDEX idx_imaging_series_orthanc ON imaging_series(orthanc_series_id);
CREATE INDEX idx_imaging_series_modality ON imaging_series(modality);

CREATE INDEX idx_imaging_instances_series ON imaging_instances(imaging_series_id);
CREATE INDEX idx_imaging_instances_orthanc ON imaging_instances(orthanc_instance_id);

-- Create a view to easily get study summaries
CREATE OR REPLACE VIEW v_imaging_study_summary AS
SELECT 
    s.imaging_study_id,
    s.visit_id,
    s.orthanc_study_id,
    s.study_instance_uid,
    s.modality,
    s.study_description,
    s.body_part,
    s.study_date,
    s.series_count,
    s.instance_count,
    s.total_file_size,
    s.findings,
    s.recommendations,
    s.uploaded_by,
    s.created_at,
    v.visit_number,
    v.visit_date,
    v.patient_id,
    p.first_name,
    p.last_name,
    u.first_name as uploaded_by_first_name,
    u.last_name as uploaded_by_last_name
FROM imaging_studies s
LEFT JOIN visits v ON s.visit_id = v.visit_id
LEFT JOIN patients p ON v.patient_id = p.patient_id
LEFT JOIN users u ON s.uploaded_by = u.user_id;

-- Trigger to update study statistics when series/instances are added
CREATE OR REPLACE FUNCTION update_study_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE imaging_studies
    SET 
        series_count = (
            SELECT COUNT(*) 
            FROM imaging_series 
            WHERE imaging_study_id = NEW.imaging_study_id
        ),
        instance_count = (
            SELECT COALESCE(SUM(instance_count), 0)
            FROM imaging_series
            WHERE imaging_study_id = NEW.imaging_study_id
        ),
        total_file_size = (
            SELECT COALESCE(SUM(series_file_size), 0)
            FROM imaging_series
            WHERE imaging_study_id = NEW.imaging_study_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE imaging_study_id = NEW.imaging_study_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_study_stats_on_series
AFTER INSERT OR UPDATE OR DELETE ON imaging_series
FOR EACH ROW
EXECUTE FUNCTION update_study_statistics();

-- Trigger to update series statistics when instances are added
CREATE OR REPLACE FUNCTION update_series_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE imaging_series
    SET 
        instance_count = (
            SELECT COUNT(*) 
            FROM imaging_instances 
            WHERE imaging_series_id = NEW.imaging_series_id
        ),
        series_file_size = (
            SELECT COALESCE(SUM(file_size), 0)
            FROM imaging_instances
            WHERE imaging_series_id = NEW.imaging_series_id
        )
    WHERE imaging_series_id = NEW.imaging_series_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_series_stats_on_instance
AFTER INSERT OR UPDATE OR DELETE ON imaging_instances
FOR EACH ROW
EXECUTE FUNCTION update_series_statistics();




-- TRUNCATE TABLE imaging_studies, imaging_series, imaging_instances
-- RESTART IDENTITY CASCADE;

-- Add status column if not exists
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS visit_status VARCHAR(50) DEFAULT 'open';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_visit_status ON visits(visit_status);

-- Update existing visits to 'open' (or 'closed' if discharge_date is set)
UPDATE visits 

SET visit_status = CASE
    WHEN admission_status NOT IN ('admitted', 'under observation') THEN 'open'
    ELSE 'closed'
END;


