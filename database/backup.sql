--
-- PostgreSQL database dump
--

\restrict gblXB7jwLeok2cm2UKqkgidUbetDSAKgf1GDhZ1ut26DbMYHXRmqzvQ8et1visR

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: account_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_status_enum AS ENUM (
    'active',
    'suspended',
    'inactive',
    'archived'
);


--
-- Name: admission_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admission_status_enum AS ENUM (
    'admitted',
    'under observation',
    'discharged',
    'transferred'
);


--
-- Name: employment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.employment_status_enum AS ENUM (
    'active',
    'suspended',
    'fired'
);


--
-- Name: gender_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender_enum AS ENUM (
    'female',
    'male',
    'other'
);


--
-- Name: update_series_statistics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_series_statistics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_study_statistics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_study_statistics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_logs (
    access_id integer NOT NULL,
    user_id integer,
    patient_id integer,
    access_type character varying(50),
    resource_accessed character varying(255),
    session_id character varying(100),
    access_granted boolean DEFAULT true,
    denial_reason text,
    ip_address inet,
    user_agent text,
    session_duration integer,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: access_logs_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.access_logs_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: access_logs_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.access_logs_access_id_seq OWNED BY public.access_logs.access_id;


--
-- Name: ai_summaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_summaries (
    summary_id integer NOT NULL,
    patient_id integer,
    summary_type character varying(50),
    generated_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    summary_content text NOT NULL,
    key_conditions text[],
    risk_factors text[],
    recommendations text[],
    confidence_score numeric(3,2),
    model_version character varying(50),
    input_data_range daterange,
    reviewed_by integer,
    review_status character varying(20) DEFAULT 'Pending'::character varying,
    is_current boolean DEFAULT true
);


--
-- Name: ai_summaries_summary_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_summaries_summary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_summaries_summary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_summaries_summary_id_seq OWNED BY public.ai_summaries.summary_id;


--
-- Name: allergies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.allergies (
    allergy_id integer NOT NULL,
    patient_id integer,
    allergen character varying(100),
    reaction text,
    allergy_severity character varying(50),
    verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: allergies_allergy_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.allergies_allergy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: allergies_allergy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.allergies_allergy_id_seq OWNED BY public.allergies.allergy_id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    patient_id integer,
    table_name character varying(100),
    action_type character varying(100),
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    event_type character varying(50),
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id integer,
    hospital_id integer,
    request_method character varying(10),
    endpoint character varying(255)
);


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    branch_id integer NOT NULL,
    hospital_id integer,
    branch_name character varying(255) NOT NULL,
    branch_type character varying(100) NOT NULL,
    branch_license_number character varying(100) NOT NULL,
    address_line character varying(255) NOT NULL,
    accredition_status character varying(100) DEFAULT 'Not Accredited'::character varying,
    state character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    zip_code character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    contact_number character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: branches_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.branches_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: branches_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.branches_branch_id_seq OWNED BY public.branches.branch_id;


--
-- Name: chronic_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chronic_conditions (
    condition_id integer NOT NULL,
    patient_id integer,
    icd_codes_version character varying(10),
    icd_code character varying(20),
    condition_name character varying(200),
    diagnosed_date date,
    current_status character varying(50),
    condition_severity character varying(20),
    management_plan text,
    condition_notes text,
    is_active boolean DEFAULT true,
    last_reviewed timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: chronic_conditions_condition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chronic_conditions_condition_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chronic_conditions_condition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chronic_conditions_condition_id_seq OWNED BY public.chronic_conditions.condition_id;


--
-- Name: data_exports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_exports (
    export_id integer NOT NULL,
    requested_by integer,
    patient_id integer,
    export_type character varying(50),
    date_range daterange,
    export_format character varying(20),
    file_path text,
    file_size bigint,
    export_status character varying(20) DEFAULT 'Processing'::character varying,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    download_count integer DEFAULT 0,
    expires_at timestamp without time zone
);


--
-- Name: data_exports_export_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_exports_export_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_exports_export_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_exports_export_id_seq OWNED BY public.data_exports.export_id;


--
-- Name: diagnoses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnoses (
    diagnosis_id integer NOT NULL,
    visit_id integer,
    diagnosis_type character varying(20) NOT NULL,
    diagnosis_name character varying(200),
    icd_codes_version character varying(10),
    icd_code character varying(20) NOT NULL,
    is_chronic boolean DEFAULT false,
    diagnosis_description text,
    severity character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: diagnoses_diagnosis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.diagnoses_diagnosis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: diagnoses_diagnosis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.diagnoses_diagnosis_id_seq OWNED BY public.diagnoses.diagnosis_id;


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    error_id integer NOT NULL,
    error_message text,
    stack_trace text,
    occurred_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: error_logs_error_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.error_logs_error_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: error_logs_error_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.error_logs_error_id_seq OWNED BY public.error_logs.error_id;


--
-- Name: family_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family_history (
    family_history_id integer NOT NULL,
    patient_id integer,
    relative_name character varying(100) NOT NULL,
    relationship character varying(50) NOT NULL,
    relative_patient_id integer,
    relative_condition_name character varying(200),
    age_of_onset integer,
    family_history_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: family_history_family_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.family_history_family_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: family_history_family_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.family_history_family_history_id_seq OWNED BY public.family_history.family_history_id;


--
-- Name: healthcare_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.healthcare_providers (
    user_id integer NOT NULL,
    provider_id integer NOT NULL,
    license_number character varying(100) NOT NULL,
    license_expiry date,
    specialization character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country character varying(100)
);


--
-- Name: healthcare_providers_provider_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.healthcare_providers_provider_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: healthcare_providers_provider_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.healthcare_providers_provider_id_seq OWNED BY public.healthcare_providers.provider_id;


--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hospitals (
    hospital_id integer NOT NULL,
    hospital_name character varying(255) NOT NULL,
    hospital_type character varying(100) NOT NULL,
    hospital_license_number character varying(100) NOT NULL,
    address_line character varying(255) NOT NULL,
    country character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    zip_code character varying(20) NOT NULL,
    email character varying(100) NOT NULL,
    is_active boolean DEFAULT true,
    accredition_status character varying(100) DEFAULT 'Not Accredited'::character varying,
    contact_number character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hospitals_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hospitals_hospital_id_seq OWNED BY public.hospitals.hospital_id;


--
-- Name: imaging_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_instances (
    imaging_instance_id integer NOT NULL,
    imaging_series_id integer,
    orthanc_instance_id character varying(100) NOT NULL,
    sop_instance_uid character varying(200),
    instance_number integer,
    file_name character varying(500),
    file_size bigint,
    dicom_metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: imaging_instances_imaging_instance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imaging_instances_imaging_instance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imaging_instances_imaging_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imaging_instances_imaging_instance_id_seq OWNED BY public.imaging_instances.imaging_instance_id;


--
-- Name: imaging_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_results (
    imaging_result_id integer NOT NULL,
    visit_id integer,
    findings text,
    recommendations text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    orthanc_study_id character varying(100),
    orthanc_series_id character varying(100),
    orthanc_instance_id character varying(100),
    modality character varying(20),
    study_description text,
    series_description text,
    body_part character varying(100),
    study_date timestamp without time zone,
    dicom_metadata jsonb,
    file_size bigint,
    instance_count integer DEFAULT 1,
    uploaded_by integer,
    patient_id integer
);


--
-- Name: COLUMN imaging_results.orthanc_study_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.imaging_results.orthanc_study_id IS 'Orthanc internal Study ID - groups related series together';


--
-- Name: COLUMN imaging_results.orthanc_series_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.imaging_results.orthanc_series_id IS 'Orthanc internal Series ID - groups related instances together';


--
-- Name: COLUMN imaging_results.orthanc_instance_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.imaging_results.orthanc_instance_id IS 'Orthanc internal Instance ID - individual DICOM image';


--
-- Name: imaging_results_imaging_result_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imaging_results_imaging_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imaging_results_imaging_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imaging_results_imaging_result_id_seq OWNED BY public.imaging_results.imaging_result_id;


--
-- Name: imaging_series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_series (
    imaging_series_id integer NOT NULL,
    imaging_study_id integer,
    orthanc_series_id character varying(100) NOT NULL,
    series_instance_uid character varying(200),
    series_number integer,
    series_description text,
    modality character varying(20),
    body_part character varying(100),
    instance_count integer DEFAULT 0,
    series_file_size bigint DEFAULT 0,
    dicom_metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: imaging_series_imaging_series_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imaging_series_imaging_series_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imaging_series_imaging_series_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imaging_series_imaging_series_id_seq OWNED BY public.imaging_series.imaging_series_id;


--
-- Name: imaging_studies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.imaging_studies (
    imaging_study_id integer NOT NULL,
    visit_id integer,
    orthanc_study_id character varying(100) NOT NULL,
    study_instance_uid character varying(200),
    modality character varying(20),
    study_description text,
    body_part character varying(100),
    study_date timestamp without time zone,
    series_count integer DEFAULT 0,
    instance_count integer DEFAULT 0,
    total_file_size bigint DEFAULT 0,
    dicom_metadata jsonb,
    findings text,
    recommendations text,
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: imaging_studies_imaging_study_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.imaging_studies_imaging_study_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: imaging_studies_imaging_study_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.imaging_studies_imaging_study_id_seq OWNED BY public.imaging_studies.imaging_study_id;


--
-- Name: lab_tests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_tests (
    lab_test_id integer NOT NULL,
    visit_id integer,
    priority character varying(50) DEFAULT 'normal'::character varying,
    test_code character varying(50),
    test_name character varying(100) NOT NULL,
    pdf_key text,
    findings text,
    recommendations text,
    lab_notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: lab_tests_lab_test_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lab_tests_lab_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lab_tests_lab_test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lab_tests_lab_test_id_seq OWNED BY public.lab_tests.lab_test_id;


--
-- Name: medications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medications (
    medication_id integer NOT NULL,
    patient_id integer,
    medication_name character varying(100),
    dosage character varying(50),
    frequency character varying(50),
    start_date date,
    end_date date,
    medication_is_active boolean DEFAULT true,
    hospital_where_prescribed character varying(100),
    medication_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: medications_medication_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.medications_medication_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: medications_medication_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.medications_medication_id_seq OWNED BY public.medications.medication_id;


--
-- Name: patient_identifiers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_identifiers (
    identifier_id integer NOT NULL,
    patient_id integer,
    hospital_id integer,
    patient_mrn character varying(100) NOT NULL
);


--
-- Name: patient_identifiers_identifier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patient_identifiers_identifier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patient_identifiers_identifier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patient_identifiers_identifier_id_seq OWNED BY public.patient_identifiers.identifier_id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    patient_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    country_of_birth character varying(100),
    country_of_residence character varying(100),
    national_id character varying(50),
    date_of_birth date,
    gender character varying(10),
    marital_status character varying(50),
    blood_type character varying(5),
    occupation character varying(100),
    address_line text,
    email character varying(100),
    primary_number character varying(50),
    secondary_number character varying(50),
    emergency_contact1_name character varying(100),
    emergency_contact1_number character varying(50),
    emergency_contact1_relationship character varying(50),
    emergency_contact2_name character varying(100),
    emergency_contact2_number character varying(50),
    emergency_contact2_relationship character varying(50),
    primary_insurance_provider character varying(100),
    primary_insurance_policy_number character varying(100),
    secondary_insurance_provider character varying(100),
    secondary_insurance_policy_number character varying(100),
    is_active boolean DEFAULT true,
    ethnicity character varying(50),
    preffered_language character varying(50),
    religion character varying(50),
    is_deceased boolean DEFAULT false,
    date_of_death date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    birth_certificate_number character varying(50),
    deleted_at timestamp without time zone
);


--
-- Name: patients_patient_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.patients_patient_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: patients_patient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.patients_patient_id_seq OWNED BY public.patients.patient_id;


--
-- Name: provider_hospitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_hospitals (
    provider_hospital_id integer NOT NULL,
    provider_id integer,
    hospital_id integer,
    start_date date,
    end_date date,
    is_primary boolean DEFAULT false,
    branch_id integer
);


--
-- Name: provider_hospitals_provider_hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.provider_hospitals_provider_hospital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: provider_hospitals_provider_hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.provider_hospitals_provider_hospital_id_seq OWNED BY public.provider_hospitals.provider_hospital_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    role_description text,
    permissions jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: series_summaries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.series_summaries AS
 SELECT orthanc_series_id,
    orthanc_study_id,
    visit_id,
    patient_id,
    series_description,
    modality,
    count(*) AS instance_count,
    sum(file_size) AS total_size,
    min(created_at) AS first_uploaded,
    max(created_at) AS last_uploaded
   FROM public.imaging_results
  GROUP BY orthanc_series_id, orthanc_study_id, visit_id, patient_id, series_description, modality;


--
-- Name: VIEW series_summaries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.series_summaries IS 'Aggregated view of DICOM series with instance counts';


--
-- Name: social_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_history (
    social_history_id integer NOT NULL,
    patient_id integer,
    smoking_status character varying(250),
    alcohol_use character varying(250),
    drug_use text,
    physical_activity text,
    diet_description text,
    living_situation character varying(200),
    support_system text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: social_history_social_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_history_social_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_history_social_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_history_social_history_id_seq OWNED BY public.social_history.social_history_id;


--
-- Name: study_summaries; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.study_summaries AS
 SELECT orthanc_study_id,
    visit_id,
    patient_id,
    study_description,
    study_date,
    modality,
    body_part,
    count(DISTINCT orthanc_series_id) AS series_count,
    count(*) AS instance_count,
    sum(file_size) AS total_size,
    min(created_at) AS first_uploaded,
    max(created_at) AS last_uploaded,
    max(findings) AS findings,
    max(recommendations) AS recommendations
   FROM public.imaging_results
  GROUP BY orthanc_study_id, visit_id, patient_id, study_description, study_date, modality, body_part;


--
-- Name: VIEW study_summaries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.study_summaries IS 'Aggregated view of DICOM studies with instance and series counts';


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    log_id integer NOT NULL,
    log_level character varying(20),
    component character varying(100),
    message text,
    error_code character varying(50),
    stack_trace text,
    additional_data jsonb,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: system_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_logs_log_id_seq OWNED BY public.system_logs.log_id;


--
-- Name: treatments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatments (
    treatment_id integer NOT NULL,
    visit_id integer,
    treatment_name character varying(100) NOT NULL,
    treatment_type character varying(100),
    procedure_code character varying(50),
    treatment_description text,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    outcome character varying(50),
    complications text,
    follow_up_required boolean DEFAULT false,
    treatment_notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: treatments_treatment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.treatments_treatment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: treatments_treatment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.treatments_treatment_id_seq OWNED BY public.treatments.treatment_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    employee_id character varying(100) NOT NULL,
    hospital_id integer,
    department character varying(100),
    date_of_birth date,
    gender public.gender_enum NOT NULL,
    email character varying(100) NOT NULL,
    contact_info character varying(100),
    address_line character varying(255),
    password_hash character varying(255) NOT NULL,
    role_id integer,
    last_login timestamp without time zone,
    employment_status public.employment_status_enum DEFAULT 'active'::public.employment_status_enum NOT NULL,
    account_status public.account_status_enum DEFAULT 'active'::public.account_status_enum NOT NULL,
    must_change_password boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id integer
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: visits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visits (
    visit_id integer NOT NULL,
    visit_number character varying(100) NOT NULL,
    visit_type character varying(50) NOT NULL,
    patient_id integer,
    provider_id integer,
    hospital_id integer,
    visit_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    priority_level character varying(50) DEFAULT 'normal'::character varying,
    referring_provider_name character varying(100),
    referring_provider_hospital character varying(100),
    reason_for_visit text,
    admission_status public.admission_status_enum,
    discharge_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    branch_id integer,
    user_id integer,
    visit_status character varying(50) DEFAULT 'open'::character varying
);


--
-- Name: v_imaging_study_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_imaging_study_summary AS
 SELECT s.imaging_study_id,
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
    u.first_name AS uploaded_by_first_name,
    u.last_name AS uploaded_by_last_name
   FROM (((public.imaging_studies s
     LEFT JOIN public.visits v ON ((s.visit_id = v.visit_id)))
     LEFT JOIN public.patients p ON ((v.patient_id = p.patient_id)))
     LEFT JOIN public.users u ON ((s.uploaded_by = u.user_id)));


--
-- Name: visit_prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visit_prescriptions (
    prescription_id integer NOT NULL,
    visit_id integer,
    medication_name character varying(100),
    dosage character varying(50),
    frequency character varying(50),
    start_date date,
    end_date date,
    refills_allowed integer DEFAULT 0,
    instructions text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: visit_prescriptions_prescription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visit_prescriptions_prescription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visit_prescriptions_prescription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visit_prescriptions_prescription_id_seq OWNED BY public.visit_prescriptions.prescription_id;


--
-- Name: visits_visit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.visits_visit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: visits_visit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.visits_visit_id_seq OWNED BY public.visits.visit_id;


--
-- Name: vitals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vitals (
    vital_id integer NOT NULL,
    visit_id integer,
    blood_pressure character varying(20),
    heart_rate integer,
    respiratory_rate integer,
    temperature numeric(4,2),
    oxygen_saturation numeric(5,2),
    weight numeric(6,2),
    weight_unit character varying(5) DEFAULT 'kg'::character varying,
    height numeric(6,2),
    height_unit character varying(5) DEFAULT 'cm'::character varying,
    bmi numeric(5,2),
    recorded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: vitals_vital_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vitals_vital_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vitals_vital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vitals_vital_id_seq OWNED BY public.vitals.vital_id;


--
-- Name: access_logs access_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_logs ALTER COLUMN access_id SET DEFAULT nextval('public.access_logs_access_id_seq'::regclass);


--
-- Name: ai_summaries summary_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_summaries ALTER COLUMN summary_id SET DEFAULT nextval('public.ai_summaries_summary_id_seq'::regclass);


--
-- Name: allergies allergy_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allergies ALTER COLUMN allergy_id SET DEFAULT nextval('public.allergies_allergy_id_seq'::regclass);


--
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- Name: branches branch_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches ALTER COLUMN branch_id SET DEFAULT nextval('public.branches_branch_id_seq'::regclass);


--
-- Name: chronic_conditions condition_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chronic_conditions ALTER COLUMN condition_id SET DEFAULT nextval('public.chronic_conditions_condition_id_seq'::regclass);


--
-- Name: data_exports export_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports ALTER COLUMN export_id SET DEFAULT nextval('public.data_exports_export_id_seq'::regclass);


--
-- Name: diagnoses diagnosis_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses ALTER COLUMN diagnosis_id SET DEFAULT nextval('public.diagnoses_diagnosis_id_seq'::regclass);


--
-- Name: error_logs error_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs ALTER COLUMN error_id SET DEFAULT nextval('public.error_logs_error_id_seq'::regclass);


--
-- Name: family_history family_history_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_history ALTER COLUMN family_history_id SET DEFAULT nextval('public.family_history_family_history_id_seq'::regclass);


--
-- Name: healthcare_providers provider_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers ALTER COLUMN provider_id SET DEFAULT nextval('public.healthcare_providers_provider_id_seq'::regclass);


--
-- Name: hospitals hospital_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals ALTER COLUMN hospital_id SET DEFAULT nextval('public.hospitals_hospital_id_seq'::regclass);


--
-- Name: imaging_instances imaging_instance_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_instances ALTER COLUMN imaging_instance_id SET DEFAULT nextval('public.imaging_instances_imaging_instance_id_seq'::regclass);


--
-- Name: imaging_results imaging_result_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results ALTER COLUMN imaging_result_id SET DEFAULT nextval('public.imaging_results_imaging_result_id_seq'::regclass);


--
-- Name: imaging_series imaging_series_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_series ALTER COLUMN imaging_series_id SET DEFAULT nextval('public.imaging_series_imaging_series_id_seq'::regclass);


--
-- Name: imaging_studies imaging_study_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_studies ALTER COLUMN imaging_study_id SET DEFAULT nextval('public.imaging_studies_imaging_study_id_seq'::regclass);


--
-- Name: lab_tests lab_test_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests ALTER COLUMN lab_test_id SET DEFAULT nextval('public.lab_tests_lab_test_id_seq'::regclass);


--
-- Name: medications medication_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medications ALTER COLUMN medication_id SET DEFAULT nextval('public.medications_medication_id_seq'::regclass);


--
-- Name: patient_identifiers identifier_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_identifiers ALTER COLUMN identifier_id SET DEFAULT nextval('public.patient_identifiers_identifier_id_seq'::regclass);


--
-- Name: patients patient_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients ALTER COLUMN patient_id SET DEFAULT nextval('public.patients_patient_id_seq'::regclass);


--
-- Name: provider_hospitals provider_hospital_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_hospitals ALTER COLUMN provider_hospital_id SET DEFAULT nextval('public.provider_hospitals_provider_hospital_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: social_history social_history_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_history ALTER COLUMN social_history_id SET DEFAULT nextval('public.social_history_social_history_id_seq'::regclass);


--
-- Name: system_logs log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN log_id SET DEFAULT nextval('public.system_logs_log_id_seq'::regclass);


--
-- Name: treatments treatment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments ALTER COLUMN treatment_id SET DEFAULT nextval('public.treatments_treatment_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: visit_prescriptions prescription_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_prescriptions ALTER COLUMN prescription_id SET DEFAULT nextval('public.visit_prescriptions_prescription_id_seq'::regclass);


--
-- Name: visits visit_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits ALTER COLUMN visit_id SET DEFAULT nextval('public.visits_visit_id_seq'::regclass);


--
-- Name: vitals vital_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals ALTER COLUMN vital_id SET DEFAULT nextval('public.vitals_vital_id_seq'::regclass);


--
-- Data for Name: access_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.access_logs (access_id, user_id, patient_id, access_type, resource_accessed, session_id, access_granted, denial_reason, ip_address, user_agent, session_duration, "timestamp") FROM stdin;
\.


--
-- Data for Name: ai_summaries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_summaries (summary_id, patient_id, summary_type, generated_date, summary_content, key_conditions, risk_factors, recommendations, confidence_score, model_version, input_data_range, reviewed_by, review_status, is_current) FROM stdin;
\.


--
-- Data for Name: allergies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.allergies (allergy_id, patient_id, allergen, reaction, allergy_severity, verified, created_at, updated_at) FROM stdin;
1	3	Penicillin	Mild itching	Mild	t	2025-10-05 17:44:14.547986	2025-10-05 17:59:55.334063
2	7	Penicillin	Severe rash and difficulty breathing	Severe	t	2025-10-07 04:49:26.400417	2025-10-07 04:49:26.400417
3	8	Nuts	Rash	Mild	f	2025-10-12 23:06:00.950942	2025-10-12 23:06:00.950942
4	3	Nuts	Rash	Severe	t	2025-10-13 23:32:30.110045	2025-10-13 23:32:30.110045
5	14	Nuts	Rash	Moderate	t	2025-10-17 19:02:19.29863	2025-10-17 19:02:19.29863
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (log_id, user_id, patient_id, table_name, action_type, old_values, new_values, ip_address, event_type, "timestamp", branch_id, hospital_id, request_method, endpoint) FROM stdin;
1	7	\N	hospitals	register_hospital	\N	{"city": "Eldoret", "email": "eldoretreferral@hospital.com", "country": "Kenya", "hospital_id": 4, "hospital_name": "Eldoret Regional Referral Hospital", "hospital_type": "General", "hospital_license_number": "LIC-KE-0004"}	::1	CREATE	2025-10-07 02:13:53.295643	\N	\N	POST	/api-v1/hospitals/register-hospital
2	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "westlandsbranch@stmary.com", "state": "Nairobi County", "country": "Kenya", "zip_code": "00100", "branch_name": "St. Mary Westlands Branch", "branch_type": "Outpatient Clinic", "address_line": "56 Peponi Road", "contact_number": "+254701445566", "accredition_status": "Accredited", "branch_license_number": "LIC-KE-B001"}	::1	Create	2025-10-07 02:23:11.4242	4	1	POST	/api-v1/hospitals/register-hospital-branch
3	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "nairobiheart@hospital.com", "state": "Nairobi County", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-03T22:22:51.042Z", "updated_at": "2025-10-03T23:29:18.854Z", "hospital_id": 2, "address_line": "45 Heartland Avenue", "hospital_name": "Nairobi Heart Specialty Center", "hospital_type": "Research Specialty", "contact_number": "+254700111333", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-0002-UPDATED"}	{"city": "Nairobi", "email": "nairobiheart@hospital.com", "state": "Nairobi County", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-03T22:22:51.042Z", "updated_at": "2025-10-06T23:26:32.042Z", "hospital_id": 2, "address_line": "45 Heartland Avenue", "hospital_name": "Nairobi Heart Institute and Research Center [UPDATED]", "hospital_type": "Specialty", "contact_number": "+254700111333", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-0002-UPDATED"}	::1	Update	2025-10-07 02:26:32.042682	\N	2	PUT	/api-v1/hospitals/update-hospital
4	7	\N	branches	UPDATE	{"city": "Nairobi", "email": "westlandsbranch@stmary.com", "state": "Nairobi County", "country": "Kenya", "zip_code": "00100", "branch_id": 4, "is_active": true, "created_at": "2025-10-06T23:23:11.424Z", "updated_at": "2025-10-06T23:23:11.424Z", "branch_name": "St. Mary Westlands Branch", "branch_type": "Outpatient Clinic", "hospital_id": 1, "address_line": "56 Peponi Road", "contact_number": "+254701445566", "accredition_status": "Accredited", "branch_license_number": "LIC-KE-B001"}	{"city": "Nairobi", "email": "stmarywestlandsclinic@hospital.com", "state": "Nairobi County", "country": "Kenya", "zip_code": "00100", "branch_id": 4, "is_active": true, "created_at": "2025-10-06T23:23:11.424Z", "updated_at": "2025-10-06T23:39:51.038Z", "branch_name": "St. Mary Westlands Specialty Clinic", "branch_type": "Specialty Clinic", "hospital_id": 1, "address_line": "58 Peponi Road, Westlands", "contact_number": "+254701445567", "accredition_status": "Accredited", "branch_license_number": "LIC-KE-B001"}	::1	Update	2025-10-07 02:39:51.038984	4	1	PUT	/api-v1/hospitals/update-hospital-branch
5	7	\N	users	register_user	\N	{"email": "sarah.mwangi@hospital.com", "role_id": 5, "user_id": 17, "username": "smwangi", "branch_id": 1, "hospital_id": 1}	::1	CREATE	2025-10-07 04:25:51.414478	\N	\N	POST	/api-v1/users/register-user
6	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:49:26.485151	\N	\N	\N	\N
7	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:49:26.529054	\N	\N	\N	\N
8	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:49:26.534886	\N	\N	\N	\N
9	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:49:26.540871	\N	\N	\N	\N
10	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:49:26.545003	\N	\N	\N	\N
11	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-07 04:49:26.550009	\N	\N	\N	\N
12	7	\N	users	register_user	\N	{"email": "john.doe@example.com", "role_id": 4, "user_id": 18, "username": "johndoe", "branch_id": 1, "hospital_id": 1}	::1	CREATE	2025-10-12 00:09:06.082194	\N	\N	POST	/api-v1/users/register-user
13	7	\N	users	register_user	\N	{"email": "john.doe@example.com", "role_id": 2, "user_id": 19, "username": "johndoe", "branch_id": 1, "hospital_id": 1}	::1	CREATE	2025-10-12 00:11:19.825737	\N	\N	POST	/api-v1/users/register-user
14	7	\N	users	register_user	\N	{"email": "sammyfocus07@gmail.com", "role_id": 2, "user_id": 21, "username": "aass", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-12 00:42:55.453406	\N	\N	POST	/api-v1/users/register-user
15	7	\N	users	register_user	\N	{"email": "sasha@email.com", "role_id": 2, "user_id": 22, "username": "ssaa", "branch_id": null, "hospital_id": 2}	::1	CREATE	2025-10-12 00:46:50.546536	\N	\N	POST	/api-v1/users/register-user
16	7	\N	users	register_user	\N	{"email": "mKim@gmail.com", "role_id": 1, "user_id": 23, "username": "mk11", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-12 00:54:37.811739	\N	\N	POST	/api-v1/users/register-user
17	7	\N	users	register_user	\N	{"email": "kimdan@gmail.com", "role_id": 3, "user_id": 24, "username": "kimdan", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-10-12 00:56:53.064834	\N	\N	POST	/api-v1/users/register-user
18	7	\N	healthcare_providers	register_provider	\N	{"user_id": 24, "created_at": "2025-10-11T21:56:52.813Z", "updated_at": "2025-10-11T21:56:52.813Z", "provider_id": 5, "license_expiry": "2030-12-30T21:00:00.000Z", "license_number": "122333", "specialization": "Paediatrics"}	::1	CREATE	2025-10-12 00:56:53.071792	\N	\N	POST	/api-v1/users/register-user
19	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": null, "is_primary": false, "start_date": null, "hospital_id": 1, "provider_id": 5, "provider_hospital_id": 6}	::1	CREATE	2025-10-12 00:56:53.080874	\N	1	POST	/api-v1/users/register-user
20	7	\N	users	USER_PASSWORD_CHANGE	{"password_hash": "$2b$10$VxjljQQXlkwMkl1dLmPqYObBrq8XAP8pV1M0PIfY263Qbp53mMbDm"}	{"password_hash": "[UPDATED]"}	::1	UPDATE	2025-10-12 01:18:01.798985	\N	\N	PUT	/api-v1/users/change-password
21	7	\N	users	USER_PASSWORD_CHANGE	{"password_hash": "$2b$10$bNTSSSferDd5uDk28p.4HeF1/ENwLB6jFTFZ5QaOd3RyK1s5tCr1C"}	{"password_hash": "[UPDATED]"}	::1	UPDATE	2025-10-12 01:19:20.106759	\N	\N	PUT	/api-v1/users/change-password
22	7	\N	users	USER_PASSWORD_CHANGE	{"password_hash": "$2b$10$1D2RcpStzhJwF1QDW1SGzu/qrEqVGUmDvxAAfO6G0n2x0OOzvT0l."}	{"password_hash": "[UPDATED]"}	::1	UPDATE	2025-10-12 01:19:55.020277	\N	\N	PUT	/api-v1/users/change-password
23	7	\N	users	USER_PASSWORD_CHANGE	{"password_hash": "$2b$10$3aWPfe80p.rH93TW2.NM.Ow2MBZCLr/0UyiIZdqigL12hheqVjZFS"}	{"password_hash": "[UPDATED]"}	::1	UPDATE	2025-10-12 01:24:53.534748	\N	\N	PUT	/api-v1/users/change-password
24	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 23:06:01.049227	\N	\N	\N	\N
25	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-12 23:06:01.06174	\N	\N	\N	\N
26	7	\N	hospitals	register_hospital	\N	{"city": "Nakuru", "email": "kabarakhosi@gmail.com", "country": "Kenya", "hospital_id": 5, "hospital_name": "Kabarak Uni Hospital", "hospital_type": "Public", "hospital_license_number": "hosi123"}	::1	CREATE	2025-10-12 23:21:16.686425	\N	\N	POST	/api-v1/hospitals/register-hospital
27	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "branch@gmail.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Karen clinic", "branch_type": "Satellite Clinic", "address_line": "tassia1", "contact_number": "+254769400801", "accredition_status": "Accredited", "branch_license_number": "BL123"}	::1	Create	2025-10-12 23:42:02.324446	5	3	POST	/api-v1/hospitals/register-hospital-branch
28	7	3	allergies	INSERT	\N	{"allergen": "Nuts", "reaction": "Rash", "verified": true, "allergy_id": 4, "created_at": "2025-10-13T20:32:30.110Z", "patient_id": 3, "updated_at": "2025-10-13T20:32:30.110Z", "allergy_severity": "Severe"}	\N	Add Allergy	2025-10-13 23:32:30.133419	\N	\N	POST	/api-v1/patients/add-allergy
29	7	7	chronic_conditions	INSERT	\N	{"icd_code": "E11.9", "is_active": true, "created_at": "2025-10-13T20:44:52.879Z", "patient_id": 7, "updated_at": "2025-10-13T20:44:52.879Z", "condition_id": 4, "last_reviewed": null, "condition_name": "Diabetes", "current_status": "In Remission", "diagnosed_date": "2003-12-11T21:00:00.000Z", "condition_notes": "", "management_plan": "", "icd_codes_version": "ICD-10", "condition_severity": "Mild"}	\N	Add Chronic Condition	2025-10-13 23:44:52.892241	\N	\N	POST	/api-v1/patients/add-chronic-condition
30	7	7	family_history	INSERT	\N	{"created_at": "2025-10-13T21:01:20.568Z", "patient_id": 7, "updated_at": "2025-10-13T21:01:20.568Z", "age_of_onset": null, "relationship": "Father", "relative_name": "michael Ogara", "family_history_id": 4, "relative_patient_id": null, "family_history_notes": null, "relative_condition_name": "heart disease"}	\N	Add Family History	2025-10-14 00:01:20.585396	\N	\N	POST	/api-v1/patients/add-family-history
31	7	7	medications	INSERT	\N	{"dosage": "500mg", "end_date": null, "frequency": "3 times a day", "created_at": "2025-10-13T21:03:11.870Z", "patient_id": 7, "start_date": null, "updated_at": "2025-10-13T21:03:11.870Z", "medication_id": 3, "medication_name": "Amoxillin", "medication_notes": null, "medication_is_active": true, "hospital_where_prescribed": null}	\N	Add Medication	2025-10-14 00:03:11.88771	\N	\N	POST	/api-v1/patients/add-medication
32	7	7	social_history	INSERT	\N	{"drug_use": "Current", "created_at": "2025-10-13T21:11:39.536Z", "patient_id": 7, "updated_at": "2025-10-13T21:11:39.536Z", "alcohol_use": "Occasional", "smoking_status": "Former", "support_system": null, "diet_description": null, "living_situation": "lives alone", "physical_activity": "gym everyday", "social_history_id": 4}	\N	Add Social History	2025-10-14 00:11:39.548386	\N	\N	POST	/api-v1/patients/add-social-history
33	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:04:18.946042	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
34	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:04:18.972928	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
35	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:04:26.93771	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
36	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:04:26.945239	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
37	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:08:46.621294	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
38	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:08:46.636356	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
39	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:15:10.181204	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
40	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:15:10.19508	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
41	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:15:11.838483	\N	\N	GET	/api-v1/patients/get-patient/8
42	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:15:11.846992	\N	\N	GET	/api-v1/patients/get-patient/8
43	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:15:51.503279	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
44	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:15:51.516244	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
45	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:15:54.136758	\N	\N	GET	/api-v1/patients/get-patient/7
46	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:15:54.146487	\N	\N	GET	/api-v1/patients/get-patient/7
47	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:22:17.682974	\N	\N	GET	/api-v1/patients/get-patient/7
48	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:22:17.697431	\N	\N	GET	/api-v1/patients/get-patient/7
49	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:22:18.584034	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
50	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:22:18.598691	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
51	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:22:20.256459	\N	\N	GET	/api-v1/patients/get-patient/7
52	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:22:20.271875	\N	\N	GET	/api-v1/patients/get-patient/7
53	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:23:00.946039	\N	\N	GET	/api-v1/patients/get-patient/7
54	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:23:00.965171	\N	\N	GET	/api-v1/patients/get-patient/7
55	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:02.249786	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
56	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:02.260034	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
57	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:19.799571	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
58	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:19.811759	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
59	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:23:22.372427	\N	\N	GET	/api-v1/patients/get-patient/8
60	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:23:22.382801	\N	\N	GET	/api-v1/patients/get-patient/8
61	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:23.849141	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
62	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:23.860002	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
63	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:23:25.971321	\N	\N	GET	/api-v1/patients/get-patient/7
64	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-14 23:23:25.984303	\N	\N	GET	/api-v1/patients/get-patient/7
65	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:27.427335	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
66	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-14 23:23:27.442467	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
67	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 00:50:29.824719	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
68	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 00:50:29.838307	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
69	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 00:50:31.895521	\N	\N	GET	/api-v1/patients/get-patient/8
70	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 00:50:31.906104	\N	\N	GET	/api-v1/patients/get-patient/8
71	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 00:50:35.896461	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
72	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 00:50:35.906775	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
73	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 00:50:38.009959	\N	\N	GET	/api-v1/patients/get-patient/7
74	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 00:50:38.029442	\N	\N	GET	/api-v1/patients/get-patient/7
75	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 00:52:11.79645	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
76	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 00:52:11.809363	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
77	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 00:56:33.175442	\N	\N	GET	/api-v1/patients/get-patient/8
78	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 00:56:33.240005	\N	\N	GET	/api-v1/patients/get-patient/8
79	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 01:43:17.56624	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
80	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 01:43:17.578892	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
81	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 01:43:48.727379	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
82	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 01:43:48.737989	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
83	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:06:49.63871	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
84	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:06:49.653683	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
85	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:09:21.516502	\N	\N	GET	/api-v1/patients/get-patient/7
86	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:09:21.565763	\N	\N	GET	/api-v1/patients/get-patient/7
87	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:09:44.422399	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
88	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:09:44.469581	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
89	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:09:47.518732	\N	\N	GET	/api-v1/patients/get-patient/8
90	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:09:47.561091	\N	\N	GET	/api-v1/patients/get-patient/8
91	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:12:36.234443	\N	\N	GET	/api-v1/patients/get-patient/8
92	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:12:41.944882	\N	\N	GET	/api-v1/patients/get-patient/8
93	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:12:41.967621	\N	\N	GET	/api-v1/patients/get-patient/8
94	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:12:45.578913	\N	\N	GET	/api-v1/patients/get-patient/8
95	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:12:45.622845	\N	\N	GET	/api-v1/patients/get-patient/8
96	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:20:57.131335	\N	\N	GET	/api-v1/patients/get-patient/8
97	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:20:57.182255	\N	\N	GET	/api-v1/patients/get-patient/8
98	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:46:34.365423	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
99	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:46:34.402031	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
100	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:46:37.537598	\N	\N	GET	/api-v1/patients/get-patient/7
101	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:46:37.579964	\N	\N	GET	/api-v1/patients/get-patient/7
102	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:46:46.218089	\N	\N	GET	/api-v1/patients/get-patient/7
103	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:47:00.857418	\N	\N	GET	/api-v1/patients/get-patient/7
104	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:47:00.905367	\N	\N	GET	/api-v1/patients/get-patient/7
240	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:17:29.140466	4	1	GET	/api-v1/hospitals/branches/4
105	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:48:22.791263	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
106	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:48:22.837731	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
107	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:27.147913	\N	\N	GET	/api-v1/patients/get-patient/3
108	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:27.258595	\N	\N	GET	/api-v1/patients/get-patient/3
109	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:29.852002	\N	\N	GET	/api-v1/patients/get-patient/3
110	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:37.058135	\N	\N	GET	/api-v1/patients/get-patient/3
111	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:37.082612	\N	\N	GET	/api-v1/patients/get-patient/3
112	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:49.154535	\N	\N	GET	/api-v1/patients/get-patient/3
113	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:52.095291	\N	\N	GET	/api-v1/patients/get-patient/3
114	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:48:52.107684	\N	\N	GET	/api-v1/patients/get-patient/3
115	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:11.202099	\N	\N	GET	/api-v1/patients/get-patient/3
116	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:14.263061	\N	\N	GET	/api-v1/patients/get-patient/3
117	7	3	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:14.286456	\N	\N	GET	/api-v1/patients/get-patient/3
118	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:49:16.522012	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
119	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 03:49:16.539461	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
120	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:18.839967	\N	\N	GET	/api-v1/patients/get-patient/7
121	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:18.880035	\N	\N	GET	/api-v1/patients/get-patient/7
122	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:31.227013	\N	\N	GET	/api-v1/patients/get-patient/7
123	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:33.129671	\N	\N	GET	/api-v1/patients/get-patient/7
124	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:37.050841	\N	\N	GET	/api-v1/patients/get-patient/7
125	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 03:49:37.065218	\N	\N	GET	/api-v1/patients/get-patient/7
126	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:08:22.461424	\N	\N	GET	/api-v1/patients/get-patient/7
127	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:11:51.138952	\N	\N	GET	/api-v1/patients/get-patient/7
128	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:11:51.196138	\N	\N	GET	/api-v1/patients/get-patient/7
129	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:11:56.024854	\N	\N	GET	/api-v1/patients/get-patient/7
130	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:12:08.766591	\N	\N	GET	/api-v1/patients/get-patient/7
131	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:12:08.817277	\N	\N	GET	/api-v1/patients/get-patient/7
132	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:12:11.139558	\N	\N	GET	/api-v1/patients/get-patient/7
133	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:12:13.431878	\N	\N	GET	/api-v1/patients/get-patient/7
134	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:12:13.476829	\N	\N	GET	/api-v1/patients/get-patient/7
135	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:13:05.04962	\N	\N	GET	/api-v1/patients/get-patient/7
136	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:13:06.460961	\N	\N	GET	/api-v1/patients/get-patient/7
137	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 04:13:06.505425	\N	\N	GET	/api-v1/patients/get-patient/7
138	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:21:25.161176	\N	\N	GET	/api-v1/patients/get-patient/7
139	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:21:25.21178	\N	\N	GET	/api-v1/patients/get-patient/7
140	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:21:28.173747	\N	\N	GET	/api-v1/patients/get-patient/7
141	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:21:33.284129	\N	\N	GET	/api-v1/patients/get-patient/7
142	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:21:33.307081	\N	\N	GET	/api-v1/patients/get-patient/7
143	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:23:02.161188	\N	\N	GET	/api-v1/patients/get-patient/7
144	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:23:02.208472	\N	\N	GET	/api-v1/patients/get-patient/7
145	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 07:23:10.069284	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
146	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 07:23:10.077181	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
147	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:23:13.276289	\N	\N	GET	/api-v1/patients/get-patient/7
148	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:23:13.318413	\N	\N	GET	/api-v1/patients/get-patient/7
149	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:27:00.20867	\N	\N	GET	/api-v1/patients/get-patient/7
150	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:27:04.675429	\N	\N	GET	/api-v1/patients/get-patient/7
151	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:27:04.700578	\N	\N	GET	/api-v1/patients/get-patient/7
152	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:40:13.316997	\N	\N	GET	/api-v1/patients/get-patient/7
153	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 07:40:13.364368	\N	\N	GET	/api-v1/patients/get-patient/7
241	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:17:29.155251	4	1	GET	/api-v1/hospitals/branches/4
154	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 14:39:52.801582	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
155	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 14:39:52.822663	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
156	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:43:36.752506	\N	\N	GET	/api-v1/patients/get-patient/8
157	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:43:36.767938	\N	\N	GET	/api-v1/patients/get-patient/8
158	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:43:45.47421	\N	\N	GET	/api-v1/patients/get-patient/8
159	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:44:11.200395	\N	\N	GET	/api-v1/patients/get-patient/8
160	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:44:11.217477	\N	\N	GET	/api-v1/patients/get-patient/8
161	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 14:44:32.46785	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
162	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 14:44:32.517873	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
163	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:44:37.912343	\N	\N	GET	/api-v1/patients/get-patient/8
164	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 14:44:37.923994	\N	\N	GET	/api-v1/patients/get-patient/8
165	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:03.398175	\N	\N	GET	/api-v1/patients/get-patient/8
166	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:11.39018	\N	\N	GET	/api-v1/patients/get-patient/8
167	7	8	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:11.413885	\N	\N	GET	/api-v1/patients/get-patient/8
168	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 15:59:38.816606	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
169	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 15:59:38.840615	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
170	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:41.865673	\N	\N	GET	/api-v1/patients/get-patient/7
171	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:41.875689	\N	\N	GET	/api-v1/patients/get-patient/7
172	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:50.210144	\N	\N	GET	/api-v1/patients/get-patient/7
173	7	7	patients	SELECT	\N	\N	::1	View Patient Details	2025-10-15 15:59:50.222074	\N	\N	GET	/api-v1/patients/get-patient/7
174	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 16:02:35.700651	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
175	7	\N	patients	SELECT	\N	\N	::1	List Patients	2025-10-15 16:02:35.740837	\N	\N	GET	/api-v1/patients/get-patients?page=1&limit=50&is_active=true&sort_by=created_at&sort_order=DESC
176	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:24:02.223977	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
177	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:24:20.345298	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
178	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:24:20.393065	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
179	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:29:45.156527	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
180	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:29:45.174863	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
181	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:31:30.18185	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
182	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:31:30.198566	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
183	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:50:49.788403	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
184	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:50:49.836116	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
185	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:52:01.242094	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
186	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:54:47.795914	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
187	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:54:47.844162	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
188	7	\N	branches	SELECT	\N	\N	::1	List Branches	2025-10-15 16:54:52.009478	\N	\N	GET	/api-v1/hospitals/branches/list?hospital_id=3
189	7	\N	branches	SELECT	\N	\N	::1	List Branches	2025-10-15 16:54:52.017246	\N	\N	GET	/api-v1/hospitals/branches/list?hospital_id=3
190	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:54:54.842704	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
191	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:54:54.884469	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
192	7	\N	branches	SELECT	\N	\N	::1	List Branches	2025-10-15 16:54:57.284111	\N	\N	GET	/api-v1/hospitals/branches/list?hospital_id=1
193	7	\N	branches	SELECT	\N	\N	::1	List Branches	2025-10-15 16:54:57.323424	\N	\N	GET	/api-v1/hospitals/branches/list?hospital_id=1
194	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:54:59.074462	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
195	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:54:59.120872	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
196	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:57:19.448377	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
197	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 16:57:19.460482	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
198	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:03.720541	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
199	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:03.766649	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
200	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:15.210712	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
201	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:15.255145	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
202	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:19.118308	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
203	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:19.165469	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
204	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:22.750047	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
205	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:22.796653	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
206	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:27.264336	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
207	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:27.311904	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
208	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:36.696265	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
209	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:06:36.762003	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
210	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:15:06.29751	\N	5	GET	/api-v1/hospitals/hospitals/5
211	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:15:06.31291	\N	5	GET	/api-v1/hospitals/hospitals/5
212	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:17:23.571132	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
213	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 17:17:23.616132	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
214	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:17:27.451234	\N	1	GET	/api-v1/hospitals/hospitals/1
215	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:17:27.492045	\N	1	GET	/api-v1/hospitals/hospitals/1
216	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:29:05.246308	\N	1	GET	/api-v1/hospitals/hospitals/1
217	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:29:26.035075	\N	1	GET	/api-v1/hospitals/hospitals/1
218	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 17:29:26.079325	\N	1	GET	/api-v1/hospitals/hospitals/1
219	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 19:21:32.166352	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
220	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 19:21:32.213791	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
221	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:21:35.225693	\N	2	GET	/api-v1/hospitals/hospitals/2
222	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:21:35.265857	\N	2	GET	/api-v1/hospitals/hospitals/2
223	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:21:47.677344	\N	2	GET	/api-v1/hospitals/hospitals/2
224	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:21:47.721662	\N	2	GET	/api-v1/hospitals/hospitals/2
225	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:48:20.135144	\N	2	GET	/api-v1/hospitals/hospitals/2
226	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:48:20.180094	\N	2	GET	/api-v1/hospitals/hospitals/2
227	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:57:02.211593	\N	2	GET	/api-v1/hospitals/hospitals/2
228	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:57:09.107168	\N	2	GET	/api-v1/hospitals/hospitals/2
229	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 19:57:09.149634	\N	2	GET	/api-v1/hospitals/hospitals/2
230	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:15:01.704606	\N	2	GET	/api-v1/hospitals/hospitals/2
231	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:15:01.716222	\N	2	GET	/api-v1/hospitals/hospitals/2
232	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:15:06.607295	\N	2	GET	/api-v1/hospitals/hospitals/2
233	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:15:06.614576	\N	2	GET	/api-v1/hospitals/hospitals/2
234	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:15:14.071823	\N	2	GET	/api-v1/hospitals/hospitals/2
235	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:15:14.08384	\N	2	GET	/api-v1/hospitals/hospitals/2
236	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 20:17:20.958355	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
237	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 20:17:20.969335	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
238	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:17:23.720893	\N	1	GET	/api-v1/hospitals/hospitals/1
239	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:17:23.73319	\N	1	GET	/api-v1/hospitals/hospitals/1
242	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:17:49.371151	\N	1	GET	/api-v1/hospitals/hospitals/1
243	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:17:49.38721	\N	1	GET	/api-v1/hospitals/hospitals/1
244	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:32:41.220936	\N	1	GET	/api-v1/hospitals/hospitals/1
245	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:32:41.236726	\N	1	GET	/api-v1/hospitals/hospitals/1
246	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 20:33:15.157275	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
247	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 20:33:15.17233	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
248	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:33:19.549924	\N	5	GET	/api-v1/hospitals/hospitals/5
249	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:33:19.561486	\N	5	GET	/api-v1/hospitals/hospitals/5
250	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 20:33:25.300779	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
251	7	\N	hospitals	SELECT	\N	\N	::1	List Hospitals	2025-10-15 20:33:25.315601	\N	\N	GET	/api-v1/hospitals/hospitals/list?page=1&limit=50&is_active=true&sort_by=hospital_name&sort_order=ASC
252	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:33:28.653711	\N	2	GET	/api-v1/hospitals/hospitals/2
253	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:33:28.667397	\N	2	GET	/api-v1/hospitals/hospitals/2
254	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:33:33.50118	3	2	GET	/api-v1/hospitals/branches/3
255	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:33:33.514207	3	2	GET	/api-v1/hospitals/branches/3
256	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:36:30.891582	\N	2	GET	/api-v1/hospitals/hospitals/2
257	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:36:30.906009	\N	2	GET	/api-v1/hospitals/hospitals/2
258	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:43:21.73088	2	2	GET	/api-v1/hospitals/branches/2
259	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:43:21.743022	2	2	GET	/api-v1/hospitals/branches/2
260	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:43:24.8752	\N	2	GET	/api-v1/hospitals/hospitals/2
261	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:43:24.887058	\N	2	GET	/api-v1/hospitals/hospitals/2
262	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:43:25.331707	3	2	GET	/api-v1/hospitals/branches/3
263	7	\N	branches	SELECT	\N	\N	::1	View Branch Details	2025-10-15 20:43:25.341616	3	2	GET	/api-v1/hospitals/branches/3
264	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:43:26.523537	\N	2	GET	/api-v1/hospitals/hospitals/2
265	7	\N	hospitals	SELECT	\N	\N	::1	View Hospital Details	2025-10-15 20:43:26.531369	\N	2	GET	/api-v1/hospitals/hospitals/2
266	7	\N	users	register_user	\N	{"email": "local.admin1@example.com", "role_id": 2, "user_id": 26, "username": "local_admin", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-16 05:10:55.882353	\N	\N	POST	/api-v1/users/register-user
267	26	\N	users	USER_PASSWORD_CHANGE	\N	\N	\N	\N	2025-10-16 05:37:02.381344	\N	\N	\N	\N
268	7	\N	users	register_user	\N	{"email": "doctor@example.com", "role_id": 3, "user_id": 27, "username": "doctor", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-10-16 08:48:46.348053	\N	\N	POST	/api-v1/users/register-user
269	7	\N	healthcare_providers	register_provider	\N	{"user_id": 27, "created_at": "2025-10-16T05:48:46.206Z", "updated_at": "2025-10-16T05:48:46.206Z", "provider_id": 6, "license_expiry": "2040-12-11T21:00:00.000Z", "license_number": "LC1234", "specialization": "Gynaecology"}	::1	CREATE	2025-10-16 08:48:46.362274	\N	\N	POST	/api-v1/users/register-user
270	7	\N	users	register_user	\N	{"email": "doctor@example.com", "role_id": 3, "user_id": 28, "username": "doctor", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-10-16 08:49:17.204906	\N	\N	POST	/api-v1/users/register-user
271	7	\N	healthcare_providers	register_provider	\N	{"user_id": 28, "created_at": "2025-10-16T05:49:17.054Z", "updated_at": "2025-10-16T05:49:17.054Z", "provider_id": 7, "license_expiry": "2040-12-11T21:00:00.000Z", "license_number": "LC1234", "specialization": "Gynaecology"}	::1	CREATE	2025-10-16 08:49:17.214314	\N	\N	POST	/api-v1/users/register-user
272	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": null, "is_primary": false, "start_date": null, "hospital_id": 1, "provider_id": 7, "provider_hospital_id": 8}	::1	CREATE	2025-10-16 08:49:17.218877	\N	1	POST	/api-v1/users/register-user
273	7	\N	hospitals	register_hospital	\N	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "country": "Kenya", "hospital_id": 6, "hospital_name": "Moi University", "hospital_type": "Public", "hospital_license_number": "hosi123456"}	::1	CREATE	2025-10-16 16:47:44.203201	\N	\N	POST	/api-v1/hospitals/register-hospital
275	26	\N	users	register_user	\N	{"email": "dankim@example.com", "role_id": 5, "user_id": 29, "username": "dan_kim", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-17 17:50:04.337138	\N	1	POST	/api-v1/users/register-user
276	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-17 17:58:48.011086	\N	\N	\N	\N
277	\N	\N	\N	\N	\N	\N	\N	\N	2025-10-17 18:41:19.054165	\N	\N	\N	\N
279	7	14	patients	INSERT	\N	\N	::1	Create	2025-10-17 18:51:53.447524	\N	1	POST	/api-v1/patients/register-patient
280	7	14	allergies	INSERT	\N	{"allergen": "Nuts", "reaction": "Rash", "verified": true, "allergy_id": 5, "created_at": "2025-10-17T16:02:19.298Z", "patient_id": 14, "updated_at": "2025-10-17T16:02:19.298Z", "allergy_severity": "Moderate"}	\N	Add Allergy	2025-10-17 19:02:19.305783	\N	\N	POST	/api-v1/patients/add-allergy
281	26	\N	users	register_user	\N	{"email": "kikigakii@example.com", "role_id": 3, "user_id": 30, "username": "kiki_gakii", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-10-18 18:03:18.030414	\N	1	POST	/api-v1/users/register-user
282	26	\N	healthcare_providers	register_provider	\N	{"user_id": 30, "created_at": "2025-10-18T15:03:17.526Z", "updated_at": "2025-10-18T15:03:17.526Z", "provider_id": 8, "license_expiry": "2030-02-01T21:00:00.000Z", "license_number": "121313w", "specialization": "Gynaecology"}	::1	CREATE	2025-10-18 18:03:18.082806	\N	1	POST	/api-v1/users/register-user
283	26	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": null, "is_primary": false, "start_date": null, "hospital_id": 1, "provider_id": 8, "provider_hospital_id": 9}	::1	CREATE	2025-10-18 18:03:18.08918	\N	1	POST	/api-v1/users/register-user
284	26	\N	users	register_user	\N	{"email": "p.daka@example.com", "role_id": 4, "user_id": 31, "username": "p_daka", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-18 18:08:28.473546	\N	1	POST	/api-v1/users/register-user
285	26	\N	healthcare_providers	register_provider	\N	{"user_id": 31, "created_at": "2025-10-18T15:08:28.311Z", "updated_at": "2025-10-18T15:08:28.311Z", "provider_id": 9, "license_expiry": "2040-02-19T21:00:00.000Z", "license_number": "LC4345", "specialization": "Gynaecology"}	::1	CREATE	2025-10-18 18:08:28.504833	\N	1	POST	/api-v1/users/register-user
286	26	\N	users	register_user	\N	{"email": "doctor1@example.com", "role_id": 3, "user_id": 32, "username": "doctor_user", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-10-19 02:32:20.52999	\N	1	POST	/api-v1/users/register-user
287	26	\N	healthcare_providers	register_provider	\N	{"user_id": 32, "created_at": "2025-10-18T23:32:20.290Z", "updated_at": "2025-10-18T23:32:20.290Z", "provider_id": 10, "license_expiry": "2040-12-19T21:00:00.000Z", "license_number": "LC1234321", "specialization": "Paediatrics"}	::1	CREATE	2025-10-19 02:32:20.577962	\N	1	POST	/api-v1/users/register-user
288	26	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": 1, "is_primary": false, "start_date": null, "hospital_id": 1, "provider_id": 10, "provider_hospital_id": 10}	::1	CREATE	2025-10-19 02:32:20.584111	1	1	POST	/api-v1/users/register-user
289	32	\N	users	USER_PASSWORD_CHANGE	\N	\N	\N	\N	2025-10-19 02:38:35.49533	\N	\N	\N	\N
290	26	\N	users	register_user	\N	{"email": "nurse1@example.com", "role_id": 4, "user_id": 33, "username": "nurse_user", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-20 01:55:09.327429	\N	1	POST	/api-v1/users/register-user
291	26	\N	healthcare_providers	register_provider	\N	{"user_id": 33, "created_at": "2025-10-19T22:55:09.099Z", "updated_at": "2025-10-19T22:55:09.099Z", "provider_id": 11, "license_expiry": "2050-12-11T21:00:00.000Z", "license_number": "NS1234", "specialization": "Paediatrics"}	::1	CREATE	2025-10-20 01:55:09.381213	\N	1	POST	/api-v1/users/register-user
292	33	\N	users	USER_PASSWORD_CHANGE	\N	\N	\N	\N	2025-10-20 01:57:30.066073	\N	\N	\N	\N
293	26	\N	users	register_user	\N	{"email": "reception1@gmail.com", "role_id": 5, "user_id": 34, "username": "reception_user", "branch_id": null, "hospital_id": 1}	::1	CREATE	2025-10-20 21:12:28.229523	\N	1	POST	/api-v1/users/register-user
294	34	\N	users	USER_PASSWORD_CHANGE	\N	\N	\N	\N	2025-10-20 21:13:06.566906	\N	\N	\N	\N
295	7	\N	hospitals	register_hospital	\N	{"city": "Nairobi", "email": "andersHospital@gmail.com", "country": "Kenya", "hospital_id": 7, "hospital_name": "Anders  Hospital", "hospital_type": "Teaching", "hospital_license_number": "HOS332211"}	::1	CREATE	2025-10-22 19:04:02.185719	\N	\N	POST	/api-v1/hospitals/register-hospital
296	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "anders@gmail.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Anders Westlands", "branch_type": "Emergency Center", "address_line": "tassia1", "contact_number": "+254769788900", "accredition_status": "Provisional", "branch_license_number": "BR33221"}	::1	Create	2025-10-22 19:12:14.259087	7	7	POST	/api-v1/hospitals/register-hospital-branch
297	7	\N	users	register_user	\N	{"email": "adrian@example.com", "role_id": 3, "user_id": 35, "username": "Adrian_Okari", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-10-22 22:27:35.473032	\N	\N	POST	/api-v1/users/register-user
298	7	\N	healthcare_providers	register_provider	\N	{"user_id": 35, "created_at": "2025-10-22T19:27:35.139Z", "updated_at": "2025-10-22T19:27:35.139Z", "provider_id": 12, "license_expiry": "2050-02-11T21:00:00.000Z", "license_number": "121313LIC", "specialization": "Lab Tech"}	::1	CREATE	2025-10-22 22:27:35.517362	\N	\N	POST	/api-v1/users/register-user
299	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": 7, "is_primary": false, "start_date": null, "hospital_id": 7, "provider_id": 12, "provider_hospital_id": 11}	::1	CREATE	2025-10-22 22:27:35.522045	7	7	POST	/api-v1/users/register-user
300	7	\N	users	register_user	\N	{"email": "user@exaple.com", "role_id": 4, "user_id": 36, "username": "user_exaple", "branch_id": 7, "hospital_id": 7}	::1	CREATE	2025-10-22 22:36:15.881369	\N	\N	POST	/api-v1/users/register-user
301	7	\N	healthcare_providers	register_provider	\N	{"user_id": 36, "created_at": "2025-10-22T19:36:15.728Z", "updated_at": "2025-10-22T19:36:15.728Z", "provider_id": 13, "license_expiry": "2030-12-01T21:00:00.000Z", "license_number": "NS12345", "specialization": "Gynaecology"}	::1	CREATE	2025-10-22 22:36:15.922781	\N	\N	POST	/api-v1/users/register-user
302	7	\N	users	register_user	\N	{"email": "damanth@exaple.com", "role_id": 4, "user_id": 37, "username": "Samath_user", "branch_id": null, "hospital_id": 7}	::1	CREATE	2025-10-22 22:42:38.804701	\N	\N	POST	/api-v1/users/register-user
303	7	\N	healthcare_providers	register_provider	\N	{"user_id": 37, "created_at": "2025-10-22T19:42:38.653Z", "updated_at": "2025-10-22T19:42:38.653Z", "provider_id": 14, "license_expiry": "2040-12-11T21:00:00.000Z", "license_number": "12131312LIC", "specialization": "Lab Tech"}	::1	CREATE	2025-10-22 22:42:38.845977	\N	\N	POST	/api-v1/users/register-user
304	7	15	patients	INSERT	\N	\N	::1	Create	2025-10-23 02:48:27.256332	\N	\N	POST	/api-v1/patients/register-patient
315	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 20:04:41.432874	\N	1	POST	/api-v1/medical-imaging/upload
316	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 20:37:20.239103	\N	1	POST	/api-v1/medical-imaging/upload
305	7	\N	hospitals	UPDATE	{"city": "Mombasa", "email": "coastclinic@hospital.com", "state": "Mombasa County", "country": "Kenya", "zip_code": "80100", "is_active": true, "created_at": "2025-10-03T22:23:05.148Z", "updated_at": "2025-10-03T22:23:05.148Z", "hospital_id": 3, "address_line": "78 Ocean Road", "hospital_name": "Mombasa Coast Clinic", "hospital_type": "Clinic", "contact_number": "+254700111444", "accredition_status": "Not Accredited", "hospital_license_number": "LIC-KE-0003"}	{"city": "Mombasa", "email": "coastclinical@hospital.com", "state": "Mombasa County", "country": "Kenya", "zip_code": "80100", "is_active": true, "created_at": "2025-10-03T22:23:05.148Z", "updated_at": "2025-11-11T20:02:49.972Z", "hospital_id": 3, "address_line": "78 Ocean Road", "hospital_name": "Mombasa Coast Clinic", "hospital_type": "Clinic", "contact_number": "+254700111444", "accredition_status": "Not Accredited", "hospital_license_number": "LIC-KE-0003"}	::1	Update	2025-11-11 23:02:49.972798	\N	3	PUT	/api-v1/hospitals/update-hospital
306	7	\N	hospitals	UPDATE	{"city": "Mombasa", "email": "coastclinical@hospital.com", "state": "Mombasa County", "country": "Kenya", "zip_code": "80100", "is_active": true, "created_at": "2025-10-03T22:23:05.148Z", "updated_at": "2025-11-11T20:02:49.972Z", "hospital_id": 3, "address_line": "78 Ocean Road", "hospital_name": "Mombasa Coast Clinic", "hospital_type": "Clinic", "contact_number": "+254700111444", "accredition_status": "Not Accredited", "hospital_license_number": "LIC-KE-0003"}	{"city": "Mombasa", "email": "coastclinical@hospital.com", "state": "Mombasa County", "country": "Kenya", "zip_code": "80100", "is_active": true, "created_at": "2025-10-03T22:23:05.148Z", "updated_at": "2025-11-11T20:08:17.084Z", "hospital_id": 3, "address_line": "78 Ocean Road", "hospital_name": "Mombasa Coast Clinic", "hospital_type": "Clinic", "contact_number": "+254700111449", "accredition_status": "Not Accredited", "hospital_license_number": "LIC-KE-0003"}	::1	Update	2025-11-11 23:08:17.084082	\N	3	PUT	/api-v1/hospitals/update-hospital
307	7	\N	hospitals	UPDATE	{"city": "Nakuru", "email": "kabarakhosi@gmail.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-12T20:21:16.680Z", "updated_at": "2025-10-12T20:21:16.680Z", "hospital_id": 5, "address_line": "Kabarak University", "hospital_name": "Kabarak Uni Hospital", "hospital_type": "Public", "contact_number": "+254769400801", "accredition_status": "Accredited", "hospital_license_number": "hosi123"}	{"city": "Nakuru", "email": "kabarakhosi@gmail.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-12T20:21:16.680Z", "updated_at": "2025-11-11T20:14:02.058Z", "hospital_id": 5, "address_line": "Kabarak University", "hospital_name": "Kabarak Uni Hospital", "hospital_type": "Public", "contact_number": "+254769400801", "accredition_status": "Accredited", "hospital_license_number": "hosi123"}	::1	Update	2025-11-11 23:14:02.05862	\N	5	PUT	/api-v1/hospitals/update-hospital
308	26	\N	users	ADMIN_UPDATE_USER	\N	\N	\N	UPDATE	2025-11-11 23:38:00.40129	\N	\N	\N	\N
309	26	3	patients	UPDATE	{"email": "jane.doe@example.com", "gender": "female", "religion": "Christian", "ethnicity": "African", "is_active": true, "last_name": "Diana", "blood_type": "O+", "created_at": "2025-10-05T14:31:08.322Z", "first_name": "Jane", "occupation": "Teacher", "patient_id": 3, "updated_at": "2025-10-05T14:35:53.351Z", "is_deceased": false, "middle_name": "A.", "national_id": "34567890", "address_line": "Kilimani, Nairobi", "date_of_birth": "1990-05-19T21:00:00.000Z", "date_of_death": null, "marital_status": "Married", "primary_number": "+254712345678", "country_of_birth": "Kenya", "secondary_number": "+254701234567", "preffered_language": "English", "country_of_residence": "Kenya", "emergency_contact1_name": "John Doe", "emergency_contact2_name": "Mary Achieng", "emergency_contact1_number": "+254701999999", "emergency_contact2_number": "+254799888888", "primary_insurance_provider": "AAR Insurance", "secondary_insurance_provider": "Jubilee Insurance", "emergency_contact1_relationship": "Spouse", "emergency_contact2_relationship": "Sister", "primary_insurance_policy_number": "AAR-PL-44321", "secondary_insurance_policy_number": "JUB-PL-55422"}	\N	\N	Update Patient	2025-11-12 01:24:56.6681	\N	\N	PUT	/api-v1/patients/update-patient
310	26	3	patients	UPDATE	{"email": "jane.doe@example.com", "gender": "female", "religion": "Christian", "ethnicity": "African", "is_active": true, "last_name": "Diana", "blood_type": "O+", "created_at": "2025-10-05T14:31:08.322Z", "first_name": "Jane", "occupation": "Teacher", "patient_id": 3, "updated_at": "2025-11-11T22:24:56.622Z", "is_deceased": false, "middle_name": "Alice", "national_id": "34567890", "address_line": "Kilimani, Nairobi", "date_of_birth": "1990-05-18T21:00:00.000Z", "date_of_death": null, "marital_status": "Married", "primary_number": "+254712345678", "country_of_birth": "Kenya", "secondary_number": "+254701234567", "preffered_language": "English", "country_of_residence": "Kenya", "emergency_contact1_name": "John Doe", "emergency_contact2_name": "Mary Achieng", "emergency_contact1_number": "+254701999999", "emergency_contact2_number": "+254799888888", "primary_insurance_provider": "AAR Insurance", "secondary_insurance_provider": "Jubilee Insurance", "emergency_contact1_relationship": "Spouse", "emergency_contact2_relationship": "Sister", "primary_insurance_policy_number": "AAR-PL-44321", "secondary_insurance_policy_number": "JUB-PL-55422"}	\N	\N	Update Patient	2025-11-12 01:25:15.520627	\N	\N	PUT	/api-v1/patients/update-patient
311	26	3	patients	UPDATE	{"email": "jane.doe@example.com", "gender": "female", "religion": "Christian", "ethnicity": "African", "is_active": true, "last_name": "Diana", "blood_type": "O+", "created_at": "2025-10-05T14:31:08.322Z", "first_name": "Jane", "occupation": "Teacher", "patient_id": 3, "updated_at": "2025-11-11T22:25:15.510Z", "is_deceased": false, "middle_name": "Alice", "national_id": "34567890", "address_line": "Kilimani, Nairobi", "date_of_birth": "1990-05-17T21:00:00.000Z", "date_of_death": null, "marital_status": "married", "primary_number": "+254712345678", "country_of_birth": "Kenya", "secondary_number": "+254701234567", "preffered_language": "English", "country_of_residence": "Kenya", "emergency_contact1_name": "John Doe", "emergency_contact2_name": "Mary Achieng", "emergency_contact1_number": "+254701999999", "emergency_contact2_number": "+254799888888", "primary_insurance_provider": "AAR Insurance", "secondary_insurance_provider": "Jubilee Insurance", "emergency_contact1_relationship": "Spouse", "emergency_contact2_relationship": "Sister", "primary_insurance_policy_number": "AAR-PL-44321", "secondary_insurance_policy_number": "JUB-PL-55422"}	\N	\N	Update Patient	2025-11-12 01:25:53.841925	\N	\N	PUT	/api-v1/patients/update-patient
312	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 19:13:35.431587	\N	1	POST	/api-v1/medical-imaging/upload
313	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 19:16:51.368848	\N	1	POST	/api-v1/medical-imaging/upload
314	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 19:57:47.144568	\N	1	POST	/api-v1/medical-imaging/upload
317	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 20:38:03.427817	\N	1	POST	/api-v1/medical-imaging/upload
318	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 20:39:51.498226	\N	1	POST	/api-v1/medical-imaging/upload
319	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 6316032, "files_uploaded": 12}	::1	CREATE	2025-11-17 20:50:31.625308	\N	1	POST	/api-v1/medical-imaging/upload
320	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 21:14:26.063307	\N	1	POST	/api-v1/medical-imaging/upload
321	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 21:16:43.943552	\N	1	POST	/api-v1/medical-imaging/upload
322	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 21:22:10.0156	\N	1	POST	/api-v1/medical-imaging/upload
323	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 1052672, "files_uploaded": 2}	::1	CREATE	2025-11-17 21:26:05.371285	\N	1	POST	/api-v1/medical-imaging/upload
324	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 7895040, "files_uploaded": 15}	::1	CREATE	2025-11-17 21:30:57.82082	\N	1	POST	/api-v1/medical-imaging/upload
325	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 21:38:16.178358	\N	1	POST	/api-v1/medical-imaging/upload
326	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-17 22:11:00.093508	\N	1	POST	/api-v1/medical-imaging/upload
327	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 00:02:24.018465	\N	1	POST	/api-v1/medical-imaging/upload
328	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 00:10:20.670943	\N	1	POST	/api-v1/medical-imaging/upload
329	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 00:15:30.22673	\N	1	POST	/api-v1/medical-imaging/upload
330	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 00:32:24.099613	\N	1	POST	/api-v1/medical-imaging/upload
331	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 00:39:10.49692	\N	1	POST	/api-v1/medical-imaging/upload
332	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 00:42:26.801222	\N	1	POST	/api-v1/medical-imaging/upload
365	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 01:13:10.805425	\N	1	POST	/api-v1/medical-imaging/upload
366	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 01:21:57.043201	\N	1	POST	/api-v1/medical-imaging/upload
367	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 526336, "files_uploaded": 1}	::1	CREATE	2025-11-18 01:48:50.048992	\N	1	POST	/api-v1/medical-imaging/upload
368	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 2623488, "files_uploaded": 1}	::1	CREATE	2025-11-18 21:02:56.100306	\N	1	POST	/api-v1/medical-imaging/upload
369	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 13117440, "files_uploaded": 5}	::1	CREATE	2025-11-18 21:13:24.584078	\N	1	POST	/api-v1/medical-imaging/upload
370	26	\N	imaging_results	upload_dicom_images	\N	{"visit_id": "11", "total_size": 58800, "files_uploaded": 1}	::1	CREATE	2025-11-18 22:14:21.886408	\N	1	POST	/api-v1/medical-imaging/upload
371	26	\N	imaging_studies	upload_dicom_study	\N	{"visit_id": "11", "total_size": 52427248, "files_uploaded": 891, "studies_created": 1}	::1	CREATE	2025-11-19 02:01:41.861951	\N	1	POST	/api-v1/medical-imaging/upload-study
372	26	\N	imaging_studies	upload_dicom_study	\N	{"visit_id": "11", "total_size": 127503952, "files_uploaded": 237, "studies_created": 1}	::1	CREATE	2025-11-19 03:00:42.924638	\N	1	POST	/api-v1/medical-imaging/upload-study
373	26	\N	imaging_studies	upload_dicom_study	\N	{"visit_id": "11", "total_size": 52438296, "files_uploaded": 891, "studies_created": 1}	::1	CREATE	2025-11-19 21:38:03.680527	\N	1	POST	/api-v1/medical-imaging/upload-study
374	32	3	allergies	INSERT	\N	{"allergen": "Latex", "reaction": "Rash", "verified": true, "allergy_id": 6, "created_at": "2025-11-24T01:52:57.879Z", "patient_id": 3, "updated_at": "2025-11-24T01:52:57.879Z", "allergy_severity": "Moderate"}	\N	Add Allergy	2025-11-24 04:52:57.900777	\N	\N	POST	/api-v1/patients/add-allergy
375	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-24 10:23:18.222988	\N	1	\N	\N
376	32	15	allergies	INSERT	\N	{"allergen": "Nuts", "reaction": "Throat closes", "verified": true, "allergy_id": 7, "created_at": "2025-11-25T20:19:34.816Z", "patient_id": 15, "updated_at": "2025-11-25T20:19:34.816Z", "allergy_severity": "Moderate"}	\N	Add Allergy	2025-11-25 23:19:34.839796	\N	\N	POST	/api-v1/patients/add-allergy
377	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-26 00:11:03.555021	\N	1	\N	\N
378	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-26 00:23:28.110651	\N	1	\N	\N
379	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-26 00:23:39.591707	\N	1	\N	\N
380	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-26 00:23:54.90985	\N	1	\N	\N
381	7	\N	hospitals	register_hospital	\N	{"city": "Nairobi", "email": "alchemist@example.ke", "country": "Kenya", "hospital_id": 8, "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "hospital_license_number": "LIC-KE-1738"}	::1	CREATE	2025-11-26 00:44:40.564856	\N	\N	POST	/api-v1/hospitals/register-hospital
387	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Alchemist Down Hill", "branch_type": "Diagnostic Center", "address_line": "Imara Daima", "contact_number": "+25476909323", "accredition_status": "Pending", "branch_license_number": "BL123432"}	::1	Create	2025-11-26 01:19:46.329429	\N	\N	POST	/api-v1/hospitals/register-hospital-branch
382	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-11-25T21:44:40.560Z", "deleted_at": null, "updated_at": "2025-11-25T21:44:40.560Z", "hospital_id": 8, "address_line": "Ubondo", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254766666666", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T21:44:40.560Z", "deleted_at": "2025-11-25T21:55:54.486Z", "updated_at": "2025-11-25T21:44:40.560Z", "hospital_id": 8, "address_line": "Ubondo", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254766666666", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-1738"}	::1	Soft Delete	2025-11-26 00:55:54.48677	\N	\N	PUT	/api-v1/hospitals/hospitals/deactivate/8
384	7	\N	hospitals	DELETE	{"city": "Nairobi", "note": "Hospital ID 8 was permanently deleted", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T21:44:40.560Z", "deleted_at": "2025-11-25T21:55:54.486Z", "updated_at": "2025-11-25T21:44:40.560Z", "hospital_id": 8, "address_line": "Ubondo", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254766666666", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-1738"}	\N	::1	Hard Delete	2025-11-26 01:03:46.911878	\N	\N	DELETE	/api-v1/hospitals/hospitals/delete/8
385	7	\N	hospitals	register_hospital	\N	{"city": "Nairobi", "email": "alchemist@example.ke", "country": "Kenya", "hospital_id": 9, "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "hospital_license_number": "LIC-KE-1738"}	::1	CREATE	2025-11-26 01:04:32.348791	\N	\N	POST	/api-v1/hospitals/register-hospital
386	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "AlchemistUpperhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Alchemist Upper Hill", "branch_type": "Emergency Center", "address_line": "Imara ", "contact_number": "+254769001283", "accredition_status": "Pending", "branch_license_number": "LIC-1345"}	::1	Create	2025-11-26 01:17:06.83486	\N	\N	POST	/api-v1/hospitals/register-hospital-branch
388	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-11-25T22:04:32.346Z", "deleted_at": null, "updated_at": "2025-11-25T22:04:32.346Z", "hospital_id": 9, "address_line": "Umbeya", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254766666666", "accredition_status": "Provisional", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:04:32.346Z", "deleted_at": "2025-11-25T22:21:00.850Z", "updated_at": "2025-11-25T22:04:32.346Z", "hospital_id": 9, "address_line": "Umbeya", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254766666666", "accredition_status": "Provisional", "hospital_license_number": "LIC-KE-1738"}	::1	Soft Delete	2025-11-26 01:21:00.850647	\N	\N	PUT	/api-v1/hospitals/hospitals/deactivate/9
389	7	\N	hospitals	DELETE	{"city": "Nairobi", "note": "Hospital ID 9 was permanently deleted", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:04:32.346Z", "deleted_at": "2025-11-25T22:21:00.850Z", "updated_at": "2025-11-25T22:04:32.346Z", "hospital_id": 9, "address_line": "Umbeya", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254766666666", "accredition_status": "Provisional", "hospital_license_number": "LIC-KE-1738"}	\N	::1	Hard Delete	2025-11-26 01:23:35.264058	\N	\N	DELETE	/api-v1/hospitals/hospitals/delete/9
390	7	\N	hospitals	register_hospital	\N	{"city": "Nairobi", "email": "alchemist@example.ke", "country": "Kenya", "hospital_id": 10, "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "hospital_license_number": "LIC-KE-1738"}	::1	CREATE	2025-11-26 01:25:42.92454	\N	\N	POST	/api-v1/hospitals/register-hospital
396	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Alchemist Down Hill", "branch_type": "Satellite Clinic", "address_line": "Imara Daima", "contact_number": "+254769332112", "accredition_status": "Pending", "branch_license_number": "B-222"}	::1	Create	2025-11-26 01:36:00.676961	\N	11	POST	/api-v1/hospitals/register-hospital-branch
392	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-11-25T22:25:42.919Z", "deleted_at": null, "updated_at": "2025-11-25T22:25:42.919Z", "hospital_id": 10, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:25:42.919Z", "deleted_at": "2025-11-25T22:26:39.963Z", "updated_at": "2025-11-25T22:25:42.919Z", "hospital_id": 10, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-1738"}	::1	Soft Delete	2025-11-26 01:26:39.963301	\N	\N	PUT	/api-v1/hospitals/hospitals/deactivate/10
391	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "AlchemistUpperhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Alchemist Upper Hill", "branch_type": "Diagnostic Center", "address_line": "Imara Daima", "contact_number": "+254769983232", "accredition_status": "Accredited", "branch_license_number": "B-1212"}	::1	Create	2025-11-26 01:26:27.578444	\N	\N	POST	/api-v1/hospitals/register-hospital-branch
393	7	\N	hospitals	DELETE	{"city": "Nairobi", "note": "Hospital ID 10 was permanently deleted", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:25:42.919Z", "deleted_at": "2025-11-25T22:26:39.963Z", "updated_at": "2025-11-25T22:25:42.919Z", "hospital_id": 10, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Accredited", "hospital_license_number": "LIC-KE-1738"}	\N	::1	Hard Delete	2025-11-26 01:26:46.63404	\N	\N	DELETE	/api-v1/hospitals/hospitals/delete/10
394	7	\N	hospitals	register_hospital	\N	{"city": "Nairobi", "email": "alchemist@example.ke", "country": "Kenya", "hospital_id": 11, "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "hospital_license_number": "LIC-KE-1738"}	::1	CREATE	2025-11-26 01:32:04.081446	\N	\N	POST	/api-v1/hospitals/register-hospital
395	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "AlchemistUpperhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Alchemist Upper Hill", "branch_type": "Diagnostic Center", "address_line": "Imara Daima", "contact_number": "+254769990990", "accredition_status": "Pending", "branch_license_number": "B-1212"}	::1	Create	2025-11-26 01:32:41.50979	11	11	POST	/api-v1/hospitals/register-hospital-branch
397	7	\N	branches	UPDATE	{"city": "Nairobi", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_id": 12, "is_active": true, "created_at": "2025-11-25T22:36:00.676Z", "updated_at": "2025-11-25T22:36:00.676Z", "branch_name": "Alchemist Down Hill", "branch_type": "Satellite Clinic", "hospital_id": 11, "address_line": "Imara Daima", "contact_number": "+254769332112", "accredition_status": "Pending", "branch_license_number": "B-222"}	{"city": "Nairobi", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_id": 12, "is_active": false, "created_at": "2025-11-25T22:36:00.676Z", "updated_at": "2025-11-25T22:36:00.676Z", "branch_name": "Alchemist Down Hill", "branch_type": "Satellite Clinic", "hospital_id": 11, "address_line": "Imara Daima", "contact_number": "+254769332112", "accredition_status": "Pending", "branch_license_number": "B-222"}	::1	Soft Delete	2025-11-26 01:36:24.143323	\N	11	PUT	/api-v1/hospitals/branches/deactivate/12
398	7	\N	branches	DELETE	{"city": "Nairobi", "note": "Branch ID 12 was permanently deleted", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_id": 12, "is_active": false, "created_at": "2025-11-25T22:36:00.676Z", "updated_at": "2025-11-25T22:36:00.676Z", "branch_name": "Alchemist Down Hill", "branch_type": "Satellite Clinic", "hospital_id": 11, "address_line": "Imara Daima", "contact_number": "+254769332112", "accredition_status": "Pending", "branch_license_number": "B-222"}	\N	::1	Hard Delete	2025-11-26 01:36:33.964517	\N	11	DELETE	/api-v1/hospitals/branches/delete/12
399	7	\N	users	register_user	\N	{"email": "Occur@gmail.com", "role_id": 3, "user_id": 38, "username": "ooccur0082", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-11-26 02:08:35.842848	\N	\N	POST	/api-v1/users/register-user
400	7	\N	healthcare_providers	register_provider	\N	{"country": "Kenya", "user_id": 38, "created_at": "2025-11-25T23:08:35.690Z", "updated_at": "2025-11-25T23:08:35.690Z", "provider_id": 15, "license_expiry": "2035-11-30T21:00:00.000Z", "license_number": "LIC535334", "specialization": "Paediatrics"}	::1	CREATE	2025-11-26 02:08:35.853207	\N	\N	POST	/api-v1/users/register-user
401	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": 11, "is_primary": false, "start_date": "2025-11-24T21:00:00.000Z", "hospital_id": 11, "provider_id": 15, "provider_hospital_id": 12}	::1	CREATE	2025-11-26 02:08:35.857498	11	11	POST	/api-v1/users/register-user
402	7	\N	users	register_user	\N	{"email": "somber@exapmle.com", "role_id": 5, "user_id": 40, "username": "smwangi9069", "branch_id": null, "hospital_id": 11}	::1	CREATE	2025-11-26 02:11:44.140091	\N	\N	POST	/api-v1/users/register-user
403	7	\N	users	register_user	\N	{"email": "12121212@example.com", "role_id": 5, "user_id": 41, "username": "aasasa9059", "branch_id": 11, "hospital_id": 11}	::1	CREATE	2025-11-26 02:15:47.349596	\N	\N	POST	/api-v1/users/register-user
404	7	\N	users	register_user	\N	{"email": "OOccur@example.com", "role_id": 3, "user_id": 42, "username": "ooccur0043", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-11-26 02:18:57.55276	\N	\N	POST	/api-v1/users/register-user
405	7	\N	users	register_user	\N	{"email": "OOccur@example.com", "role_id": 3, "user_id": 43, "username": "ooccur0043", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-11-26 02:19:08.798706	\N	\N	POST	/api-v1/users/register-user
406	7	\N	healthcare_providers	register_provider	\N	{"country": "Uganda", "user_id": 43, "created_at": "2025-11-25T23:19:08.652Z", "updated_at": "2025-11-25T23:19:08.652Z", "provider_id": 17, "license_expiry": "2040-12-11T21:00:00.000Z", "license_number": "3213RF343WE", "specialization": "Gynaecology"}	::1	CREATE	2025-11-26 02:19:08.808428	\N	\N	POST	/api-v1/users/register-user
407	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": 11, "is_primary": false, "start_date": "2025-11-24T21:00:00.000Z", "hospital_id": 11, "provider_id": 17, "provider_hospital_id": 13}	::1	CREATE	2025-11-26 02:19:08.810267	11	11	POST	/api-v1/users/register-user
408	7	\N	users	register_user	\N	{"email": "me@example.com", "role_id": 4, "user_id": 44, "username": "msir8050", "branch_id": 11, "hospital_id": 11}	::1	CREATE	2025-11-26 02:23:15.23299	\N	\N	POST	/api-v1/users/register-user
409	7	\N	users	register_user	\N	{"email": "me@example.com", "role_id": 4, "user_id": 45, "username": "msir8050", "branch_id": 11, "hospital_id": 11}	::1	CREATE	2025-11-26 02:23:24.03947	\N	\N	POST	/api-v1/users/register-user
410	7	\N	healthcare_providers	register_provider	\N	{"country": "Kenya", "user_id": 45, "created_at": "2025-11-25T23:23:23.941Z", "updated_at": "2025-11-25T23:23:23.941Z", "provider_id": 19, "license_expiry": "2050-12-11T21:00:00.000Z", "license_number": "4322343FSA", "specialization": "Gynaecology"}	::1	CREATE	2025-11-26 02:23:24.041663	\N	\N	POST	/api-v1/users/register-user
412	7	\N	users	register_user	\N	{"email": "santa@example.com", "role_id": 3, "user_id": 47, "username": "sclaus8055", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-11-26 04:24:26.36765	\N	\N	POST	/api-v1/users/register-user
411	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_name": "Alchemist Down Hill", "branch_type": "Outpatient Center", "address_line": "Imara Daima", "contact_number": "+254777777777", "accredition_status": "Pending", "branch_license_number": "BL1232121"}	::1	Create	2025-11-26 04:19:54.614846	\N	11	POST	/api-v1/hospitals/register-hospital-branch
413	7	\N	healthcare_providers	register_provider	\N	{"country": "Kenya", "user_id": 47, "created_at": "2025-11-26T01:24:26.225Z", "updated_at": "2025-11-26T01:24:26.225Z", "provider_id": 20, "license_expiry": "2050-12-11T21:00:00.000Z", "license_number": "MD434343211", "specialization": "Gynaecology"}	::1	CREATE	2025-11-26 04:24:26.378431	\N	\N	POST	/api-v1/users/register-user
414	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": 11, "is_primary": false, "start_date": "2025-11-25T21:00:00.000Z", "hospital_id": 11, "provider_id": 20, "provider_hospital_id": 14}	::1	CREATE	2025-11-26 04:24:26.380937	11	11	POST	/api-v1/users/register-user
415	7	\N	users	register_user	\N	{"email": "kagz@exaple.com", "role_id": 3, "user_id": 48, "username": "hkagutho0033", "branch_id": null, "hospital_id": null}	::1	CREATE	2025-11-26 04:41:51.605354	\N	\N	POST	/api-v1/users/register-user
416	7	\N	healthcare_providers	register_provider	\N	{"country": "Kenya", "user_id": 48, "created_at": "2025-11-26T01:41:51.457Z", "updated_at": "2025-11-26T01:41:51.457Z", "provider_id": 21, "license_expiry": "2090-12-11T21:00:00.000Z", "license_number": "1738ME", "specialization": "Cardiology"}	::1	CREATE	2025-11-26 04:41:51.611972	\N	\N	POST	/api-v1/users/register-user
417	7	\N	provider_hospitals	assign_provider_to_hospital	\N	{"end_date": null, "branch_id": null, "is_primary": false, "start_date": "2025-11-25T21:00:00.000Z", "hospital_id": 11, "provider_id": 21, "provider_hospital_id": 15}	::1	CREATE	2025-11-26 04:41:51.613418	\N	11	POST	/api-v1/users/register-user
418	7	\N	provider_hospitals	REGISTER_EXISTING_PRACTITIONER	\N	\N	\N	\N	2025-11-26 04:59:20.628304	\N	\N	\N	\N
419	7	\N	users	deactivate_user	{"user_id": 45, "account_status": "active"}	\N	::1	UPDATE	2025-11-26 15:26:35.682912	\N	\N	PUT	/api-v1/users/deactivate-user/45
420	7	\N	users	reactivate_user	{"user_id": 45, "account_status": "suspended"}	\N	::1	UPDATE	2025-11-26 15:38:54.787318	\N	\N	PUT	/api-v1/users/reactivate-user/45
421	7	\N	users	deactivate_user	{"user_id": 45, "account_status": "active"}	\N	::1	UPDATE	2025-11-26 15:39:05.956483	\N	\N	PUT	/api-v1/users/deactivate-user/45
422	7	\N	users	reactivate_user	{"user_id": 45, "account_status": "inactive"}	\N	::1	UPDATE	2025-11-26 15:39:21.652114	\N	\N	PUT	/api-v1/users/reactivate-user/45
423	7	\N	users	deactivate_user	{"user_id": 45, "account_status": "active"}	\N	::1	UPDATE	2025-11-26 15:39:30.592533	\N	\N	PUT	/api-v1/users/deactivate-user/45
424	7	\N	users	reactivate_user	{"user_id": 45, "account_status": "inactive"}	\N	::1	UPDATE	2025-11-26 15:52:47.847777	\N	\N	PUT	/api-v1/users/reactivate-user/45
425	7	\N	users	deactivate_user	{"user_id": 45, "account_status": "active"}	\N	::1	UPDATE	2025-11-26 15:52:54.830159	\N	\N	PUT	/api-v1/users/deactivate-user/45
426	7	\N	users	delete_user_permanently	{"email": "me@example.com", "role_id": 4, "user_id": 45, "username": "msir8050", "last_name": "Sir", "first_name": "Me", "employee_id": "Emp5423432", "visit_count": 0, "audit_log_count": 0, "deletion_reason": "USER NOT NEEDED"}	\N	::1	DELETE	2025-11-26 15:57:05.062316	\N	\N	DELETE	/api-v1/users/delete-user-permanently/45
427	26	\N	users	deactivate_user	{"user_id": 30, "account_status": "active"}	\N	::1	UPDATE	2025-11-26 16:13:14.907699	\N	1	PUT	/api-v1/users/deactivate-user/30
428	7	\N	users	reactivate_user	{"user_id": 30, "account_status": "inactive"}	\N	::1	UPDATE	2025-11-26 16:38:32.513418	\N	\N	PUT	/api-v1/users/reactivate-user/30
429	32	16	patients	INSERT	\N	\N	::1	Create	2025-11-26 16:51:20.813402	\N	1	POST	/api-v1/patients/register-patient
430	32	18	patients	INSERT	\N	\N	::1	Create	2025-11-26 16:54:44.086247	\N	1	POST	/api-v1/patients/register-patient
431	32	20	patients	INSERT	\N	\N	::1	Create	2025-11-26 17:00:03.713159	\N	1	POST	/api-v1/patients/register-patient
432	32	21	patients	INSERT	\N	\N	::1	Create	2025-11-26 17:34:20.344422	\N	1	POST	/api-v1/patients/register-patient
439	32	23	patients	INSERT	\N	\N	::1	Create	2025-11-26 19:44:28.900115	\N	1	POST	/api-v1/patients/register-patient
440	\N	\N	audit_logs	Cleanup	\N	{"cleanup_date": "2025-11-28T23:00:00.144Z", "total_deleted": 0, "deletion_summary": [{"deleted": 0, "category": "verbose", "retention_days": 90}, {"deleted": 0, "category": "general", "retention_days": 365}, {"deleted": 0, "category": "patient_data", "retention_days": 1825}, {"deleted": 0, "category": "critical", "retention_days": 730}, {"deleted": 0, "category": "financial", "retention_days": 2555}]}	\N	System	2025-11-29 02:00:00.093812	\N	\N	\N	\N
441	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 02:52:08.763064	\N	\N	\N	\N
442	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:01:38.023266	\N	\N	\N	\N
443	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:07:28.779812	\N	\N	\N	\N
444	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:07:40.740438	\N	\N	\N	\N
445	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:08:28.538834	\N	\N	\N	\N
446	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:12:58.442555	\N	\N	\N	\N
447	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": null, "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": "2025-11-29T00:26:06.375Z", "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	::1	Soft Delete	2025-11-29 03:26:06.375683	\N	11	PUT	/api-v1/hospitals/hospitals/deactivate/11
448	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": "2025-11-29T00:26:06.375Z", "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": "2025-11-29T00:26:27.842Z", "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	::1	Soft Delete	2025-11-29 03:26:27.842883	\N	11	PUT	/api-v1/hospitals/hospitals/deactivate/11
450	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": "2025-11-29T00:26:27.842Z", "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": "2025-11-29T00:31:26.434Z", "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	::1	Soft Delete	2025-11-29 03:31:26.434841	\N	11	PUT	/api-v1/hospitals/hospitals/deactivate/11
455	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": "2025-11-29T00:31:26.434Z", "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	{"city": "Nairobi", "email": "alchemist@example.ke", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-11-25T22:32:04.079Z", "deleted_at": null, "updated_at": "2025-11-25T22:32:04.079Z", "hospital_id": 11, "address_line": "Imara Daima", "hospital_name": "Alchemist National Hospital", "hospital_type": "Private", "contact_number": "+254769666666", "accredition_status": "Pending", "hospital_license_number": "LIC-KE-1738"}	::1	Reactivation	2025-11-29 03:50:34.662112	\N	11	PUT	/api-v1/hospitals/hospitals/reactivate/11
457	7	\N	branches	DELETE	{"city": "Nairobi", "email": "AlchemistDownhill@example.com", "state": "Nairobi", "country": "Kenya", "zip_code": "00100", "branch_id": 13, "is_active": true, "created_at": "2025-11-26T01:19:54.614Z", "updated_at": "2025-11-26T01:19:54.614Z", "branch_name": "Alchemist Down Hill", "branch_type": "Outpatient Center", "hospital_id": 11, "address_line": "Imara Daima", "contact_number": "+254777777777", "accredition_status": "Pending", "branch_license_number": "BL1232121"}	\N	::1	Hard Delete	2025-11-29 03:54:30.580683	\N	11	DELETE	/api-v1/hospitals/branches/delete/13
458	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": null, "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": "2025-11-29T00:54:51.928Z", "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	::1	Soft Delete	2025-11-29 03:54:51.928996	\N	\N	PUT	/api-v1/hospitals/hospitals/deactivate/6
459	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": "2025-11-29T00:54:51.928Z", "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": null, "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	::1	Reactivation	2025-11-29 03:54:57.823793	\N	\N	PUT	/api-v1/hospitals/hospitals/reactivate/6
449	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": null, "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": "2025-11-29T00:30:06.515Z", "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	::1	Soft Delete	2025-11-29 03:30:06.515704	\N	\N	PUT	/api-v1/hospitals/hospitals/deactivate/6
451	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": "2025-11-29T00:30:06.515Z", "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": "2025-11-29T00:31:58.516Z", "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	::1	Soft Delete	2025-11-29 03:31:58.516612	\N	\N	PUT	/api-v1/hospitals/hospitals/deactivate/6
452	7	\N	hospitals	UPDATE	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": false, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": "2025-11-29T00:31:58.516Z", "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": null, "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	::1	Reactivation	2025-11-29 03:41:41.171061	\N	\N	PUT	/api-v1/hospitals/hospitals/reactivate/6
461	7	\N	hospitals	DELETE	{"city": "Nairobi", "email": "moi.uni@exapmle.com", "state": "Uasin Gishu", "country": "Kenya", "zip_code": "00100", "is_active": true, "created_at": "2025-10-16T13:47:44.187Z", "deleted_at": null, "updated_at": "2025-10-16T13:47:44.187Z", "hospital_id": 6, "address_line": "tassia1", "hospital_name": "Moi University", "hospital_type": "Public", "contact_number": "+254769400811", "accredition_status": "Pending", "hospital_license_number": "hosi123456"}	\N	::1	Hard Delete	2025-11-29 03:55:37.671769	\N	\N	DELETE	/api-v1/hospitals/hospitals/delete/6
274	7	\N	branches	INSERT	\N	{"city": "Nairobi", "email": "example@example.com", "state": "nyanza", "country": "Kenya", "zip_code": "00100", "branch_name": "Kitale Clinic", "branch_type": "Satellite Clinic", "address_line": "tassia1", "contact_number": "+254769400821", "accredition_status": "Not Accredited", "branch_license_number": "M12345"}	::1	Create	2025-10-16 16:51:43.169471	\N	\N	POST	/api-v1/hospitals/register-hospital-branch
453	7	\N	branches	UPDATE	{"city": "Nairobi", "email": "example@example.com", "state": "nyanza", "country": "Kenya", "zip_code": "00100", "branch_id": 6, "is_active": true, "created_at": "2025-10-16T13:51:43.169Z", "updated_at": "2025-10-16T13:51:43.169Z", "branch_name": "Kitale Clinic", "branch_type": "Satellite Clinic", "hospital_id": 6, "address_line": "tassia1", "contact_number": "+254769400821", "accredition_status": "Not Accredited", "branch_license_number": "M12345"}	{"city": "Nairobi", "email": "example@example.com", "state": "nyanza", "country": "Kenya", "zip_code": "00100", "branch_id": 6, "is_active": false, "created_at": "2025-10-16T13:51:43.169Z", "updated_at": "2025-10-16T13:51:43.169Z", "branch_name": "Kitale Clinic", "branch_type": "Satellite Clinic", "hospital_id": 6, "address_line": "tassia1", "contact_number": "+254769400821", "accredition_status": "Not Accredited", "branch_license_number": "M12345"}	::1	Soft Delete	2025-11-29 03:49:59.910527	\N	\N	PUT	/api-v1/hospitals/branches/deactivate/6
454	7	\N	branches	UPDATE	{"city": "Nairobi", "email": "example@example.com", "state": "nyanza", "country": "Kenya", "zip_code": "00100", "branch_id": 6, "is_active": false, "created_at": "2025-10-16T13:51:43.169Z", "updated_at": "2025-10-16T13:51:43.169Z", "branch_name": "Kitale Clinic", "branch_type": "Satellite Clinic", "hospital_id": 6, "address_line": "tassia1", "contact_number": "+254769400821", "accredition_status": "Not Accredited", "branch_license_number": "M12345"}	{"city": "Nairobi", "email": "example@example.com", "state": "nyanza", "country": "Kenya", "zip_code": "00100", "branch_id": 6, "is_active": true, "created_at": "2025-10-16T13:51:43.169Z", "updated_at": "2025-10-16T13:51:43.169Z", "branch_name": "Kitale Clinic", "branch_type": "Satellite Clinic", "hospital_id": 6, "address_line": "tassia1", "contact_number": "+254769400821", "accredition_status": "Not Accredited", "branch_license_number": "M12345"}	::1	Reactivation	2025-11-29 03:50:09.183143	\N	\N	PUT	/api-v1/hospitals/branches/reactivate/6
462	7	\N	users	deactivate_user	{"user_id": 28, "account_status": "active"}	\N	::1	UPDATE	2025-11-29 03:57:06.133378	\N	\N	PUT	/api-v1/users/deactivate-user/28
463	7	\N	users	reactivate_user	{"user_id": 28, "account_status": "inactive"}	\N	::1	UPDATE	2025-11-29 03:57:17.692378	\N	\N	PUT	/api-v1/users/reactivate-user/28
464	7	\N	users	delete_user_permanently	{"email": "doctor@example.com", "role_id": 3, "user_id": 28, "username": "doctor", "last_name": "focus", "first_name": "sammy", "employee_id": "999", "visit_count": 0, "audit_log_count": 0, "deletion_reason": "Some excuse"}	\N	::1	DELETE	2025-11-29 03:57:39.10464	\N	\N	DELETE	/api-v1/users/delete-user-permanently/28
465	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:58:38.865859	\N	\N	\N	\N
466	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:59:01.64639	\N	\N	\N	\N
467	\N	\N	\N	\N	\N	\N	\N	\N	2025-11-29 03:59:32.73817	\N	\N	\N	\N
470	32	25	patients	INSERT	\N	\N	::1	Create	2025-11-29 04:09:39.4109	\N	1	POST	/api-v1/patients/register-patient
471	32	25	chronic_conditions	INSERT	\N	\N	::1	Create	2025-11-29 04:09:39.4109	\N	1	POST	/api-v1/patients/register-patient
472	32	25	family_history	INSERT	\N	\N	::1	Create	2025-11-29 04:09:39.4109	\N	1	POST	/api-v1/patients/register-patient
473	32	25	social_history	INSERT	\N	\N	::1	Create	2025-11-29 04:09:39.4109	\N	1	POST	/api-v1/patients/register-patient
474	32	\N	imaging_studies	delete_study	{"findings": "Random data", "modality": "PT", "visit_id": 11, "body_part": "Other", "created_at": "2025-11-19T18:37:37.965Z", "study_date": "2013-07-23T00:00:00.000Z", "updated_at": "2025-11-19T18:37:37.965Z", "uploaded_by": 26, "series_count": 11, "dicom_metadata": {"Rows": "168", "Units": "BQML", "Columns": "168", "HighBit": "15", "StudyID": "6", "Modality": "PT", "AxialMash": "5\\\\6", "ImageType": "ORIGINAL\\\\PRIMARY", "PatientID": "QIN-PET-Phantom-UI-01", "PixelData": null, "StudyDate": "20130723", "StudyTime": "200738.906000", "BitsStored": "16", "ImageIndex": "1", "PatientAge": "001D", "PatientSex": "O", "SeriesDate": "20130723", "SeriesTime": "201059.859000", "SeriesType": "DYNAMIC\\\\IMAGE", "ContentDate": "20130725", "ContentTime": "152750.000000", "DecayFactor": "1.09771", "PatientName": "QIN-PET-Phantom-UI-01", "RescaleType": "BQML", "SOPClassUID": "1.2.840.10008.5.1.4.1.1.128", "StationName": "CT58503", "WindowWidth": "3.789E3", "CountsSource": "EMISSION", "Manufacturer": "SIEMENS", "PixelSpacing": "3.39403\\\\3.39403", "ProtocolName": "PETCT_Body_LM", "RescaleSlope": "3.28227E-1", "SeriesNumber": "4", "WindowCenter": "2.105E3", "BitsAllocated": "16", "ImageComments": "AC_CT", "PatientWeight": "9.73", "SliceLocation": "2.53285E2", "CollimatorType": "NONE", "CorrectedImage": "NORM\\\\DTIM\\\\ATTN\\\\SCAT\\\\DECY", "InstanceNumber": "1", "NumberOfSlices": "81", "PrivateCreator": "SIEMENS MEDCOM HEADER", "SOPInstanceUID": "1.3.12.2.1107.5.1.4.1001.30000013072513125762500009703", "SliceThickness": "2.025", "AccessionNumber": "", "AcquisitionDate": "20130723", "AcquisitionTime": "201059.858997", "AxialAcceptance": "2.7E1", "DecayCorrection": "START", "InstitutionName": "UIHC, PET Imaging, Biogr-40", "PatientPosition": "HFS", "SamplesPerPixel": "1", "BodyPartExamined": "PHANTOM", "PMTFInformation1": "202.0.18575808", "PMTFInformation2": null, "PMTFInformation3": null, "PMTFInformation4": "DB TO DICOM ", "PatientBirthDate": "20130723", "RescaleIntercept": "0", "SoftwareVersions": "PET/CT 2009A", "StudyDescription": "QIN-PET-Phantom-UI", "StudyInstanceUID": "1.3.12.2.1107.5.1.4.1001.30000013072312595670300000027", "AcquisitionNumber": "2001", "ConvolutionKernel": "XYZ Gauss7.00", "SeriesDescription": "HIstatistics_LOcontrast", "SeriesInstanceUID": "1.3.12.2.1107.5.1.4.1001.30000013072513125762500009702", "DeviceSerialNumber": "10000", "FrameReferenceTime": "8.857965E5", "NumberOfTimeSlices": "1", "Unknown Tag & Data": null, "ActualFrameDuration": "1800000", "FrameOfReferenceUID": "1.3.12.2.1107.5.1.4.1001.30000013072312531343700001801", "PixelRepresentation": "1", "ImagePositionPatient": "-2.8551547E2\\\\-3.8879556E2\\\\2.53285E2", "ReconstructionMethod": "OSEM3D 4i8s", "DateOfLastCalibration": "20130723\\\\20130603", "DoseCalibrationFactor": "3.02365E7", "ManufacturerModelName": "1093", "ScatterFractionFactor": "2.99272E-3", "TimeOfLastCalibration": "070435.125000\\\\183830.000000", "LargestImagePixelValue": null, "PatientIdentityRemoved": "YES", "ReferringPhysicianName": "", "ImageOrientationPatient": "1\\\\0\\\\0\\\\0\\\\1\\\\0", "RandomsCorrectionMethod": "DLYD", "ScatterCorrectionMethod": "Model-based", "SmallestImagePixelValue": null, "EnergyWindowRangeSequence": [{"EnergyWindowLowerLimit": "4.35E2", "EnergyWindowUpperLimit": "6.5E2"}], "PhotometricInterpretation": "MONOCHROME2", "PositionReferenceIndicator": "", "AttenuationCorrectionMethod": "measured,AC_CT", "InstitutionalDepartmentName": "Department", "RequestedProcedureDescription": "PET PETCT_Body_LM (Adult)", "NumberOfSeriesRelatedInstances": "81", "PatientOrientationCodeSequence": [{"CodeValue": "F-10450", "CodeMeaning": "recumbent", "MappingResource": "DCMR", "ContextIdentifier": "19", "ContextGroupVersion": "20020904000000.000000", "CodingSchemeDesignator": "99SDM", "PatientOrientationModifierCodeSequence": [{"CodeValue": "F-10340", "CodeMeaning": "supine", "MappingResource": "DCMR", "ContextIdentifier": "20", "ContextGroupVersion": "20020904000000.000000", "CodingSchemeDesignator": "99SDM"}]}], "PatientGantryRelationshipCodeSequence": [{"CodeValue": "F-10470", "CodeMeaning": "headfirst", "MappingResource": "DCMR", "ContextIdentifier": "21", "ContextGroupVersion": "20020904000000.000000", "CodingSchemeDesignator": "99SDM"}], "RadiopharmaceuticalInformationSequence": [{"RadionuclideHalfLife": "6.5862E3", "RadionuclideTotalDose": "3.94e7", "RadionuclideCodeSequence": [{"CodeValue": "C-111A1", "CodeMeaning": "F^18^[^18^Fluorine]", "MappingResource": "DCMR", "ContextIdentifier": "4020", "ContextGroupVersion": "20020904000000.000000", "CodingSchemeDesignator": "SNM3"}], "RadionuclidePositronFraction": "9.7E-1", "RadiopharmaceuticalStartTime": "183900.000000"}]}, "instance_count": 891, "recommendations": "Will find out", "total_file_size": "52438296", "imaging_study_id": 2, "orthanc_study_id": "fbcfeadd-04a0ba68-0a9f287c-e5775544-ff161ff4", "study_description": "QIN-PET-Phantom-UI", "study_instance_uid": "1.3.12.2.1107.5.1.4.1001.30000013072312595670300000027"}	\N	::1	DELETE	2025-11-29 19:28:19.827455	\N	1	DELETE	/api-v1/medical-imaging/studies/2
475	34	\N	visits	reopen_visit	{"visit_status": "closed"}	{"visit_status": "open"}	::1	UPDATE	2025-11-29 19:37:02.475877	\N	1	\N	\N
476	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-29 19:38:26.679846	\N	1	\N	\N
477	34	\N	visits	reopen_visit	{"visit_status": "closed"}	{"visit_status": "open"}	::1	UPDATE	2025-11-29 20:30:07.517526	\N	1	\N	\N
478	34	\N	visits	close_visit	{"visit_status": "open"}	{"visit_status": "closed"}	::1	UPDATE	2025-11-29 20:36:36.045865	\N	1	\N	\N
479	\N	\N	audit_logs	Cleanup	\N	{"cleanup_date": "2025-11-29T23:00:00.167Z", "total_deleted": 0, "deletion_summary": [{"deleted": 0, "category": "verbose", "retention_days": 90}, {"deleted": 0, "category": "general", "retention_days": 365}, {"deleted": 0, "category": "patient_data", "retention_days": 1825}, {"deleted": 0, "category": "critical", "retention_days": 730}, {"deleted": 0, "category": "financial", "retention_days": 2555}]}	\N	System	2025-11-30 02:00:00.135958	\N	\N	\N	\N
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (branch_id, hospital_id, branch_name, branch_type, branch_license_number, address_line, accredition_status, state, city, country, zip_code, email, contact_number, is_active, created_at, updated_at) FROM stdin;
2	2	Nairobi Heart Center - Upper Hill	Specialty	BR-KE-2001	Upper Hill Medical Plaza	Accredited	Nairobi County	Nairobi	Kenya	00101	nairobiheart.upperhill@hospital.com	+254700333111	t	2025-10-04 01:23:37.855869	2025-10-04 01:23:37.855869
3	2	Mombasa Coast Clinic - Nyali	Clinic	BR-KE-3001	Nyali Road, Mombasa	Pending Accreditation	Mombasa County	Mombasa	Kenya	80102	coastclinic.nyali@hospital.com	+254700444111	t	2025-10-04 01:23:54.485443	2025-10-04 01:23:54.485443
1	1	St. Mary Westlands Outpatient - Updated	General	BR-KE-1001	Westlands Road, Nairobi	Accredited	Nairobi County	Nairobi	Kenya	00200	westlands.outpatient@stmary.com	+254711222333	t	2025-10-04 01:23:21.940602	2025-10-04 02:39:16.183191
4	1	St. Mary Westlands Specialty Clinic	Specialty Clinic	LIC-KE-B001	58 Peponi Road, Westlands	Accredited	Nairobi County	Nairobi	Kenya	00100	stmarywestlandsclinic@hospital.com	+254701445567	t	2025-10-07 02:23:11.4242	2025-10-07 02:39:51.038984
5	3	Karen clinic	Satellite Clinic	BL123	tassia1	Accredited	Nairobi	Nairobi	Kenya	00100	branch@gmail.com	+254769400801	t	2025-10-12 23:42:02.324446	2025-10-12 23:42:02.324446
7	7	Anders Westlands	Emergency Center	BR33221	tassia1	Provisional	Nairobi	Nairobi	Kenya	00100	anders@gmail.com	+254769788900	t	2025-10-22 19:12:14.259087	2025-10-22 19:12:14.259087
11	11	Alchemist Upper Hill	Diagnostic Center	B-1212	Imara Daima	Pending	Nairobi	Nairobi	Kenya	00100	AlchemistUpperhill@example.com	+254769990990	t	2025-11-26 01:32:41.50979	2025-11-26 01:32:41.50979
\.


--
-- Data for Name: chronic_conditions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chronic_conditions (condition_id, patient_id, icd_codes_version, icd_code, condition_name, diagnosed_date, current_status, condition_severity, management_plan, condition_notes, is_active, last_reviewed, created_at, updated_at) FROM stdin;
2	3	ICD-10	E11.9	Type 2 Diabetes Mellitus	2018-05-10	In remission	Mild	Continue with diet and exercise	Patient reports stable glucose levels	t	2025-09-30 00:00:00	2025-10-05 17:50:32.211165	2025-10-05 18:08:26.151695
3	7	ICD-10	E11	Type 2 Diabetes Mellitus	2023-01-10	Controlled	Moderate	Diet control, exercise, and medication	Patient responding well to treatment	t	\N	2025-10-07 04:49:26.400417	2025-10-07 04:49:26.400417
4	7	ICD-10	E11.9	Diabetes	2003-12-12	In Remission	Mild			t	\N	2025-10-13 23:44:52.879299	2025-10-13 23:44:52.879299
7	25	ICD-10	E11.9	Diabetes type 2	2015-12-12	Controlled	Moderate	Proper diet and exercise. Medication if necessary	\N	t	\N	2025-11-29 04:09:39.4109	2025-11-29 04:09:39.4109
\.


--
-- Data for Name: data_exports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_exports (export_id, requested_by, patient_id, export_type, date_range, export_format, file_path, file_size, export_status, requested_at, completed_at, download_count, expires_at) FROM stdin;
\.


--
-- Data for Name: diagnoses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.diagnoses (diagnosis_id, visit_id, diagnosis_type, diagnosis_name, icd_codes_version, icd_code, is_chronic, diagnosis_description, severity, created_at) FROM stdin;
1	2	Primary	Hypertension	ICD-10	I10	t	Elevated blood pressure requiring lifestyle modification and medication	Moderate	2025-10-05 18:30:40.44781
2	4	Primary	Diabetes	ICD-10	E11.9	t	Diabetic	Moderate	2025-10-13 03:31:54.746458
3	9	Primary	Upper Respiratory Tract Infection	ICD-10	J06.9	f	Likely viral infection presenting with cough and mild fever.	Moderate	2025-10-25 04:14:48.140262
4	10	Primary	Upper Respiratory Tract Infection	ICD-10	E11.9	f	Likely viral infection presenting with cough and mild fever.	Moderate	2025-10-25 04:15:20.745096
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.error_logs (error_id, error_message, stack_trace, occurred_at) FROM stdin;
\.


--
-- Data for Name: family_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.family_history (family_history_id, patient_id, relative_name, relationship, relative_patient_id, relative_condition_name, age_of_onset, family_history_notes, created_at, updated_at) FROM stdin;
2	3	John Doe	Father	\N	Diabetes	45	Father also developed Type 2 diabetes at age 50	2025-10-05 17:51:05.919639	2025-10-05 18:09:39.597276
3	7	Mary Muthoni	Mother	\N	Hypertension	55	Mother diagnosed at age 55	2025-10-07 04:49:26.400417	2025-10-07 04:49:26.400417
4	7	michael Ogara	Father	\N	heart disease	\N	\N	2025-10-14 00:01:20.56868	2025-10-14 00:01:20.56868
6	25	Rachel Wanjiru	mother	\N	Diabetes	55	Diabetes appears in multiple family members	2025-11-29 04:09:39.4109	2025-11-29 04:09:39.4109
\.


--
-- Data for Name: healthcare_providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.healthcare_providers (user_id, provider_id, license_number, license_expiry, specialization, created_at, updated_at, country) FROM stdin;
12	2	LIC-NUR-0002	2029-08-10	Pediatrics	2025-10-04 01:48:46.812879	2025-10-04 01:48:46.812879	\N
11	1	DOC-KE-2025-1001	2028-12-31	Cardiothoracic Surgery	2025-10-04 01:43:08.459083	2025-10-04 03:13:35.558333	\N
16	3	MED-123456-KMPDC	2030-06-15	Cardiologist	2025-10-05 19:27:57.960412	2025-10-05 19:27:57.960412	\N
24	5	122333	2030-12-31	Paediatrics	2025-10-12 00:56:52.813136	2025-10-12 00:56:52.813136	\N
31	9	LC4345	2040-02-20	Gynaecology	2025-10-18 18:08:28.311688	2025-10-18 18:08:28.311688	\N
32	10	LC1234321	2040-12-20	Paediatrics	2025-10-19 02:32:20.290491	2025-10-19 02:32:20.290491	\N
33	11	NS1234	2050-12-12	Paediatrics	2025-10-20 01:55:09.099372	2025-10-20 01:55:09.099372	\N
35	12	121313LIC	2050-02-12	Lab Tech	2025-10-22 22:27:35.139266	2025-10-22 22:27:35.139266	\N
36	13	NS12345	2030-12-02	Gynaecology	2025-10-22 22:36:15.728012	2025-10-22 22:36:15.728012	\N
37	14	12131312LIC	2040-12-12	Lab Tech	2025-10-22 22:42:38.653074	2025-10-22 22:42:38.653074	\N
30	8	121313w	2030-02-01	Gynaecology	2025-10-18 18:03:17.526827	2025-11-11 23:38:00.40129	\N
38	15	LIC535334	2035-12-01	Paediatrics	2025-11-26 02:08:35.690533	2025-11-26 02:08:35.690533	Kenya
43	17	3213RF343WE	2040-12-12	Gynaecology	2025-11-26 02:19:08.652498	2025-11-26 02:19:08.652498	Uganda
47	20	MD434343211	2050-12-12	Gynaecology	2025-11-26 04:24:26.225696	2025-11-26 04:24:26.225696	Kenya
48	21	1738ME	2090-12-12	Cardiology	2025-11-26 04:41:51.457247	2025-11-26 04:41:51.457247	Kenya
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hospitals (hospital_id, hospital_name, hospital_type, hospital_license_number, address_line, country, state, city, zip_code, email, is_active, accredition_status, contact_number, created_at, updated_at, deleted_at) FROM stdin;
1	St. Mary General Hospital - Updated	General	LIC-KE-0001	123 Riverside Drive	Kenya	Nairobi County	Nairobi	00100	info@stmaryreferral.com	t	Accredited	+254700222333	2025-10-04 01:17:04.686956	2025-10-04 02:36:50.124469	\N
4	Eldoret Regional Referral Hospital	General	LIC-KE-0004	12 Kapsoya Street	Kenya	Uasin Gishu County	Eldoret	30100	eldoretreferral@hospital.com	t	Accredited	+254700555666	2025-10-07 02:13:53.255247	2025-10-07 02:13:53.255247	\N
2	Nairobi Heart Institute and Research Center [UPDATED]	Specialty	LIC-KE-0002-UPDATED	45 Heartland Avenue	Kenya	Nairobi County	Nairobi	00100	nairobiheart@hospital.com	t	Accredited	+254700111333	2025-10-04 01:22:51.042444	2025-10-07 02:26:32.042682	\N
7	Anders  Hospital	Teaching	HOS332211	tassia1	Kenya	Nairobi	Nairobi	00100	andersHospital@gmail.com	t	Provisional	+254769488998	2025-10-22 19:04:02.16838	2025-10-22 19:04:02.16838	\N
3	Mombasa Coast Clinic	Clinic	LIC-KE-0003	78 Ocean Road	Kenya	Mombasa County	Mombasa	80100	coastclinical@hospital.com	t	Not Accredited	+254700111449	2025-10-04 01:23:05.148782	2025-11-11 23:08:17.084082	\N
5	Kabarak Uni Hospital	Public	hosi123	Kabarak University	Kenya	Uasin Gishu	Nakuru	00100	kabarakhosi@gmail.com	t	Accredited	+254769400801	2025-10-12 23:21:16.680739	2025-11-11 23:14:02.05862	\N
11	Alchemist National Hospital	Private	LIC-KE-1738	Imara Daima	Kenya	Nairobi	Nairobi	00100	alchemist@example.ke	t	Pending	+254769666666	2025-11-26 01:32:04.079113	2025-11-26 01:32:04.079113	\N
\.


--
-- Data for Name: imaging_instances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.imaging_instances (imaging_instance_id, imaging_series_id, orthanc_instance_id, sop_instance_uid, instance_number, file_name, file_size, dicom_metadata, created_at) FROM stdin;
\.


--
-- Data for Name: imaging_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.imaging_results (imaging_result_id, visit_id, findings, recommendations, created_at, orthanc_study_id, orthanc_series_id, orthanc_instance_id, modality, study_description, series_description, body_part, study_date, dicom_metadata, file_size, instance_count, uploaded_by, patient_id) FROM stdin;
\.


--
-- Data for Name: imaging_series; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.imaging_series (imaging_series_id, imaging_study_id, orthanc_series_id, series_instance_uid, series_number, series_description, modality, body_part, instance_count, series_file_size, dicom_metadata, created_at) FROM stdin;
\.


--
-- Data for Name: imaging_studies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.imaging_studies (imaging_study_id, visit_id, orthanc_study_id, study_instance_uid, modality, study_description, body_part, study_date, series_count, instance_count, total_file_size, dicom_metadata, findings, recommendations, uploaded_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lab_tests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lab_tests (lab_test_id, visit_id, priority, test_code, test_name, pdf_key, findings, recommendations, lab_notes, created_by, created_at) FROM stdin;
2	11	normal	cbc 1	Complete Blood Count 	users/26/lab-tests/test-1763576488210.pdf	Increased White blood cells	Antibiotics	none	26	2025-11-19 21:21:32.834603
\.


--
-- Data for Name: medications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.medications (medication_id, patient_id, medication_name, dosage, frequency, start_date, end_date, medication_is_active, hospital_where_prescribed, medication_notes, created_at, updated_at) FROM stdin;
1	3	Amoxicillin	250mg	Once daily	2025-10-01	2025-10-12	f	Nairobi General Hospital	Dosage reduced after improvement	2025-10-05 17:45:16.468301	2025-10-05 18:06:48.075747
2	7	Metformin	500mg	Twice daily	2023-01-15	\N	t	Nairobi Hospital	For Type 2 Diabetes management	2025-10-07 04:49:26.400417	2025-10-07 04:49:26.400417
3	7	Amoxillin	500mg	3 times a day	\N	\N	t	\N	\N	2025-10-14 00:03:11.870006	2025-10-14 00:03:11.870006
\.


--
-- Data for Name: patient_identifiers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patient_identifiers (identifier_id, patient_id, hospital_id, patient_mrn) FROM stdin;
2	3	\N	MRN-001
6	7	1	MRN2024001
7	8	1	MRN1
8	10	1	MRN2025
10	13	1	MRN2021
11	14	1	MRN2019
12	15	\N	
13	16	1	
15	18	1	mty987
17	20	1	12122342314
18	21	1	H1-20251126-96JY
20	23	1	H1-20251126-8IBZ
22	25	1	H1-20251129-43IV
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.patients (patient_id, first_name, middle_name, last_name, country_of_birth, country_of_residence, national_id, date_of_birth, gender, marital_status, blood_type, occupation, address_line, email, primary_number, secondary_number, emergency_contact1_name, emergency_contact1_number, emergency_contact1_relationship, emergency_contact2_name, emergency_contact2_number, emergency_contact2_relationship, primary_insurance_provider, primary_insurance_policy_number, secondary_insurance_provider, secondary_insurance_policy_number, is_active, ethnicity, preffered_language, religion, is_deceased, date_of_death, created_at, updated_at, birth_certificate_number, deleted_at) FROM stdin;
7	Alice	Wanjiru	Muthoni	Kenya	Kenya	12345678	1985-06-15	female	Married	O+	Teacher	123 Kimathi Street, Nairobi	alice.muthoni@email.com	+254712345678	+254723456789	John Muthoni	+254734567890	Husband	Jane Wanjiru	+254745678901	Sister	AAR Insurance	AAR2024001	Britam	BRT2024001	t	Kikuyu	English	Christian	f	\N	2025-10-07 04:49:26.400417	2025-10-07 04:49:26.400417	\N	\N
8	sammy	K	focus	Kenya	Kenya	12121221	1999-12-09	male	single	A+	Miner	tassia1	sammyfocus07@gmail.com	+254769400801		Dina	0769400801	Parent	kim	0769400801	parent	NHIF	09009			t	Black	English	Christian	f	\N	2025-10-12 23:06:00.950942	2025-10-12 23:06:00.950942	\N	\N
10	Dan	K	Kamau	Kenya	Kenya	000990909	1980-03-03	male	single	A+	Miner	tassia1	dankimani@example.com	+254769400801								NHIF	0909090990	SHA	12121312	t	Black	English	Muslim	f	\N	2025-10-17 17:58:47.895268	2025-10-17 17:58:47.895268	\N	\N
13	Braweson		Akong	Sudan	Kenya	8447384	2000-12-12	male	divorced	AB-	Clown	Imara Daima	braweson@example.com	0722113344								\N	\N	\N	\N	t	Black	Swahili	Atheist	f	\N	2025-10-17 18:48:26.001458	2025-10-17 18:48:26.001458	\N	\N
14	sammy	Focus	focus	Kenya	Kenya	0987634	1999-12-21	female	single	A+	Miner	tassia1	sammy@gmail.com	+254769400801								\N	\N	\N	\N	t	Black	English	Muslim	f	\N	2025-10-17 18:51:53.447524	2025-10-17 18:51:53.447524	\N	\N
15	daniel		Occuring	Kenya	Kenya	23456543	1930-12-12	male	widowed	A-	Elder	Imara Daima		+254769400811		sammy focus	0769400801	Child				\N	\N	\N	\N	t	Black	Swahili	\N	f	\N	2025-10-23 02:48:27.256332	2025-10-23 02:48:27.256332	\N	\N
3	Jane	Alice	Diana	Kenya	Kenya	34567890	1990-05-17	female	married	O+	Principal	Kilimani, Nairobi	jane.doe@example.com	+254712345678	+254701234567	John Doe	+254701999999	Spouse	Mary Achieng	+254799888888	Sister	AAR Insurance	AAR-PL-44321	Jubilee Insurance	JUB-PL-55422	t	African	English	Christian	f	\N	2025-10-05 17:31:08.322677	2025-11-12 01:25:53.837732	\N	\N
16	Occuring	F	Occur	Kenya	Kenya	4175526	1990-12-12	male	single	A+	Musician	Imara Daima	occuring@gmail.com	+254769987671								\N	\N	\N	\N	t	Black	Swahili	Atheist	f	\N	2025-11-26 16:51:20.813402	2025-11-26 16:51:20.813402	\N	\N
18	anne	D	Kinyua	Kenya	Kenya	98738191	2001-12-12	female	widowed	A-	Dancer	Imara Daima	annekinyua@example.com	+254769400801								\N	\N	\N	\N	t	African	\N	\N	f	\N	2025-11-26 16:54:44.086247	2025-11-26 16:54:44.086247	\N	\N
20	onono	Focus	Nun	Kenya	Kenya	09012121	2000-12-12	male	married	AB-	Elder	Imara Daima	onono@example.com	+254769928181								\N	\N	\N	\N	t	Black	Swahili	Muslim	f	\N	2025-11-26 17:00:03.713159	2025-11-26 17:00:03.713159	\N	\N
21	Hon		Amolo	Kenya	Kenya	0989098	1970-12-12	male	divorced	O+	Politician	Imara Daima	HON@example.com	+254722112211	212121212							\N	\N	\N	\N	t	African	Swahili	Christian	f	\N	2025-11-26 17:34:20.344422	2025-11-26 17:34:20.344422	\N	\N
23	Okari	Focus	Nare	Kenya	Kenya	\N	2020-12-12	male	single	A+		Imara Daima	\N	+254769323742		Sammy Focus Mwangi	0769400801	Brother				NHIF	POL-123123	\N	\N	t	Black	Swahili	Christian	f	\N	2025-11-26 19:44:28.900115	2025-11-29 03:59:01.599848	1738998090	2025-11-29 03:58:38.815747
25	Esther	Wanjohi	Muthoni	Kenya	Kenya	12436675	1985-04-29	female	single	O+	Sales Rep	Imara Daima	sonnywanjohi@gmail.com	+254777923429		Sammy Focus Mwangi	0769400801	Child				Jubilee	AR12421232	\N	\N	t	Black	English	Christian	f	\N	2025-11-29 04:09:39.4109	2025-11-29 04:09:39.4109	\N	\N
\.


--
-- Data for Name: provider_hospitals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.provider_hospitals (provider_hospital_id, provider_id, hospital_id, start_date, end_date, is_primary, branch_id) FROM stdin;
1	1	1	2020-06-01	\N	f	\N
2	2	3	2021-02-01	\N	f	\N
3	1	2	\N	\N	f	\N
4	3	1	2020-01-01	\N	f	\N
5	3	2	2025-10-05	\N	f	\N
6	5	1	\N	\N	f	\N
9	8	1	\N	\N	f	\N
10	10	1	\N	\N	f	1
11	12	7	\N	\N	f	7
12	15	11	2025-11-25	\N	f	11
13	17	11	2025-11-25	\N	f	11
14	20	11	2025-11-26	\N	f	11
15	21	11	2025-11-26	\N	f	\N
21	21	4	2025-11-26	\N	f	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (role_id, role_name, role_description, permissions, is_active, created_at) FROM stdin;
1	superadmin	Has unrestricted system-wide access including user, hospital, and data management.	{"logs": {"view": true, "export": true}, "clinical": {"treat": true, "diagnose": true, "prescribe": true, "order_tests": true}, "patient_records": {"edit": true, "view": true, "create": true, "delete": true}, "user_management": {"edit": true, "view": true, "create": true, "delete": true}, "hospital_management": {"edit": true, "view": true, "create": true, "delete": true}}	t	2025-10-02 17:03:17.967003
2	localadmin	Hospital administrator with authority over staff and patient data within their hospital.	{"logs": {"view": true, "export": true}, "clinical": {"treat": false, "diagnose": false, "prescribe": false, "order_tests": false}, "patient_records": {"edit": true, "view": true, "create": true, "delete": true}, "user_management": {"edit": true, "view": true, "create": true, "delete": true}, "hospital_management": {"edit": true, "view": true, "create": false, "delete": false}}	t	2025-10-02 17:03:17.970084
3	medicalprovider	Licensed provider who can diagnose, treat, prescribe, and order tests.	{"logs": {"view": false, "export": false}, "clinical": {"treat": true, "diagnose": true, "prescribe": true, "order_tests": true}, "patient_records": {"edit": true, "view": true, "create": false, "delete": false}}	t	2025-10-02 17:03:17.971123
4	nurse	Nurse with authority to record vitals, assist in patient care, and maintain care notes.	{"clinical": {"treat": false, "diagnose": false, "prescribe": false, "order_tests": false}, "patient_records": {"edit": true, "view": true, "create": false, "delete": false}}	t	2025-10-02 17:03:17.972115
5	receptionist	Responsible for patient registration, scheduling, and check-in/out.	{"patient_records": {"edit": true, "view": true, "create": true, "delete": false}}	t	2025-10-02 17:03:17.973098
\.


--
-- Data for Name: social_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.social_history (social_history_id, patient_id, smoking_status, alcohol_use, drug_use, physical_activity, diet_description, living_situation, support_system, created_at, updated_at) FROM stdin;
2	3	Quit smoking	None	None	Exercises 5 times per week	Vegetarian diet	Lives with spouse and one child	Joined community fitness group	2025-10-05 17:51:55.749807	2025-10-05 18:15:56.133489
3	7	Never smoked	Social drinker, 1-2 drinks per week	None	Moderate exercise 3 times per week	Balanced diet, low sugar intake	Lives with spouse and 2 children	Strong family support	2025-10-07 04:49:26.400417	2025-10-07 04:49:26.400417
4	7	Former	Occasional	Current	gym everyday	\N	lives alone	\N	2025-10-14 00:11:39.536104	2025-10-14 00:11:39.536104
6	25	Never	Occasional	None	Walks daily. Low physical activity.	Mostly fruits and vegetables	lives alone	Family lives some hours away. Son lives around though	2025-11-29 04:09:39.4109	2025-11-29 04:09:39.4109
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_logs (log_id, log_level, component, message, error_code, stack_trace, additional_data, "timestamp") FROM stdin;
\.


--
-- Data for Name: treatments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.treatments (treatment_id, visit_id, treatment_name, treatment_type, procedure_code, treatment_description, start_date, end_date, outcome, complications, follow_up_required, treatment_notes, created_at) FROM stdin;
1	2	Blood Pressure Monitoring	Observation	BP-OBS-01	Monitor BP every 4 hours	2025-10-04 08:00:00	2025-10-06 20:00:00	Ongoing	\N	t	Patient should reduce salt intake and exercise regularly	2025-10-05 18:34:11.974285
2	4	Chemotherapy	Medication	\N	dsdsd	2021-12-12 00:00:00	2028-12-12 00:00:00	Ongoing	\N	f	\N	2025-10-13 04:55:28.679554
3	4	Physical therapy	Therapy	\N	\N	\N	\N	Ongoing	\N	f	\N	2025-10-13 04:55:47.124857
4	10	Symptomatic Treatment	Medication	\N	Advised rest, warm fluids, and paracetamol as needed.	2025-10-25 00:00:00	0005-10-28 00:00:00	Ongoing	\N	f	Return if symptoms worsen or persist beyond a week.	2025-10-25 04:17:07.302494
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (user_id, first_name, middle_name, last_name, username, employee_id, hospital_id, department, date_of_birth, gender, email, contact_info, address_line, password_hash, role_id, last_login, employment_status, account_status, must_change_password, updated_at, created_at, branch_id) FROM stdin;
22	Sasha	Focus	Bordeaux	ssaa	8943	2	Gynaecology	2000-02-02	female	sasha@email.com	0720202020	Imara Daima	$2b$10$7jrSDEhXZrpkhnsA4/5V.O03DTz0EfkiTVguGW5svG/tIY9WxmE7.	2	\N	active	active	t	2025-10-12 00:46:50.427193	2025-10-12 00:46:50.427193	\N
23	michael	s	kim	mk11	333	1	Laboratory	2000-12-03	male	mKim@gmail.com	0777777777	tassia1	$2b$10$XyJnJ/1xqOfS3TRIv1gPN.3uw.yDLQ5dCOFtfuDj2tA8ykFpMwLOO	1	\N	active	active	t	2025-10-12 00:54:37.664053	2025-10-12 00:54:37.664053	\N
16	James	Mwangi	Kamau	dr_james	EMP-DOC-0012	\N	Cardiology	1980-11-05	male	dr.james.kamau@example.com	+254711999888	Nairobi West, Langata Road	$2b$10$r8RHNh2dVyojQ2qpPWG1uuZsW4mI53yjgRGnAgjyquH/2XXpu5pQC	3	2025-10-05 19:31:50.904763	active	active	f	2025-10-05 19:27:57.960412	2025-10-05 19:27:57.960412	\N
24	kim	s	dan	kimdan	333221	\N	Gynaecology	2000-11-11	male	kimdan@gmail.com	0111111111	\N	$2b$10$/mc2N94Xc28f/Km5mzJi2O2//dgzQbZ09ro9IB6KkfIdmK/IwopN.	3	\N	active	active	t	2025-10-12 00:56:52.813136	2025-10-12 00:56:52.813136	\N
17	Sarah	Jane	Mwangi	smwangi	EMP002	1	Front Desk	1995-03-20	female	sarah.mwangi@hospital.com	+254722334455	45 Moi Avenue, Nairobi	$2b$10$payNehDWmWfLQJXn4VufDu/igjXfkgBA3LnynIZSaFUc9Gdqh.Ota	5	\N	active	active	t	2025-10-07 04:25:51.170087	2025-10-07 04:25:51.170087	1
29	Dan	Focus	Kamau	dan_kim	122133	1	Reception	1990-01-12	male	dankim@example.com	0711223344	tassia1	$2b$10$uSK4LJ67dFpWVXy/xdh9u.bPSvHPZQL9ulr2Gdqu/0f5G64QP8ya6	5	\N	active	active	t	2025-10-17 17:50:04.09353	2025-10-17 17:50:04.09353	\N
35	Adrian	Lazarus	Okari	Adrian_Okari	EMP22334455	\N	Laboratory	2001-12-12	male	adrian@example.com	0833221188	Tassia	$2b$10$slLXR7dwQZ7whq0s7ldBVuZbwwy7IsifKB7Pp9O2G86Njg8ZxVDVO	3	\N	active	active	t	2025-10-22 22:27:35.139266	2025-10-22 22:27:35.139266	\N
9	Jane	A.	Smith	jane_admin	EMP-ADM-1002	1	Administration	1982-09-14	female	jane.smith@hospital.com	+254700111222	456 Elm Street	$2b$10$kVBS8pUewe8QRTTN20FJqOz4lBNtrD1hXjGnGklCBTso17zjsQ5si	2	\N	active	active	t	2025-10-04 01:32:14.41257	2025-10-04 01:32:14.41257	\N
12	Sarah	A.	Kamau	nurse_kamau	EMP-NUR-0001	\N	Nursing	1995-08-10	female	nurse.kamau@example.com	+254711223344	56 Nurses Estate, Mombasa	$2b$10$w2baD7YjhsbLZYfOiCmIT.6zNWlTJxp0SK5kjSxZVqxW5/vYEN/Ca	3	\N	active	active	t	2025-10-04 01:48:46.812879	2025-10-04 01:48:46.812879	\N
13	Jane	W.	Mwangi	local_admin22	EMP-LADM-0001	\N	Administration	1990-02-20	female	jane.mwangi@hospital.com	+254711223344	Kenyatta Avenue, Nairobi	$2b$10$EWn5uJbumWPDpA5WIWvTQO6dMwWpovwMTYpHwtHKT9H.TJYCMPQ82	1	\N	active	active	t	2025-10-04 02:19:50.008227	2025-10-04 02:19:50.008227	\N
14	Peter	M.	Njoroge	reception_peter	EMP-REC-0001	1	Front Desk	1995-11-05	male	peter.njoroge@hospital.com	+254744556677	CBD, Nairobi	$2b$10$/9eAEf7RO/n1GaY.YTFqEOfOA1Rk1KxsAz4B/NGNnGlXQFgcyI/kS	5	\N	active	active	t	2025-10-04 02:24:40.520127	2025-10-04 02:24:40.520127	\N
10	Grace	Nyambura	Otieno	local_admin_grace	EMP-LAD-0001	2	Human Resources	1990-03-12	female	local.admin@example.com	+254799888777	99 HR Office, Nairobi	$2b$10$gTp6o/7Ipjz8epjxjRta7OVsC8eJyQ3ToQeSBUH783O9A5cm1y05.	2	\N	active	active	t	2025-10-04 03:10:51.877497	2025-10-04 01:42:49.282208	\N
11	John	M.	Mwangi	dr_mwangi	EMP-DOC-0001	\N	Cardiology	1980-01-20	male	dr.mwangi@example.com	+254701999888	45 Surgeon Plaza, Nairobi	$2b$10$FMHw7KoaZUY3Y9PRMqDRIOtA1bj3cyLMEOAABVhmQGmsBNjiOs7le	3	\N	active	active	t	2025-10-04 03:13:35.558333	2025-10-04 01:43:08.459083	\N
19	John	Michael	Doe	johndoe	EMP00	1	Radiology	1990-04-12	male	john.doe@example.com	+254712345678	Nairobi, Kenya	$2b$10$wLqlb817B.2c1rWh8ZgK0u8Je.O6bCMDPTR1OAXEdii8sldwbRlyC	2	\N	active	active	t	2025-10-12 00:11:19.642847	2025-10-12 00:11:19.642847	1
15	David	O.	Muriuki	local_admin_david	EMP-LADM-0002	1	Administration	1988-07-14	male	david.muriuki@example.com	+254711555111	Kenyatta Road, Nairobi	$2b$10$.hr6I2XQqX7qU4cItv7lM.ukPZmo2Fzg2SprFYONql6lSzfKmVDWq	2	2025-10-04 03:54:21.752581	active	active	f	2025-10-04 03:18:09.213133	2025-10-04 03:18:09.213133	\N
40	Somber	Focus	Mwangi	smwangi9069	dsk132421	11	Front Desk	1990-12-12	male	somber@exapmle.com	0122335543	Imara Daima	$2b$10$ICDGslB1X0BttrMHfsbE7OzGeclRyMCWo4qFVvlsr2MA9sxusolGe	5	\N	active	active	t	2025-11-26 02:11:43.997275	2025-11-26 02:11:43.997275	\N
33	nurse	\N	nursey	nurse_user	EMP32211	1	Gynaecology	1990-12-01	female	nurse1@example.com	0899887766	tassia	$2b$10$4e/sv2wsIp4nMDCLMh82lehmIZ52xA6FuStDCFOL469HoRCLNRrga	4	2025-10-26 23:28:24.796666	active	active	f	2025-10-20 01:55:09.099372	2025-10-20 01:55:09.099372	\N
36	dan	Focus	Ak	user_exaple	221121	7	Lab	2000-12-12	female	user@exaple.com	0933224343	tassia1	$2b$10$4AGW.MBtvzw7dScRM.8Sk.GEMyvI.xFSoLn6JqKL3aNtnfmRVPeia	4	\N	active	active	t	2025-10-22 22:36:15.728012	2025-10-22 22:36:15.728012	7
21	sammy	k	focus	aass	122333	1	Gynaecology	1999-01-12	male	sammyfocus07@gmail.com	0720989796	tassia1	$2b$10$/xVRtAaARE1TMoAsmUbK8eAcC.8sXsJZ3RCZWlK0RLRlO1Lirkkfi	2	\N	active	active	t	2025-10-12 00:42:55.303849	2025-10-12 00:42:55.303849	\N
31	daka	\N	Paka	p_daka	6545654	1	Gynaecology	2000-12-12	female	p.daka@example.com	0720999090	tassia1	$2b$10$ngzi1DcHqfhsXRnzCODnS.aXD2oKp3lEbDFOYH8AN91CqYhLqaRoq	4	\N	active	active	t	2025-10-18 18:08:28.311688	2025-10-18 18:08:28.311688	\N
37	Samanth	Focus	Dan	Samath_user	HR234	7	Laboratory	1990-12-22	female	damanth@exaple.com	0799883322	Imara Daima	$2b$10$LDEfwdtuExSMi905qkXwtO/CbWaoYhLPfUvQtG0oyEv.12e3.Aay.	4	\N	active	active	t	2025-10-22 22:42:38.653074	2025-10-22 22:42:38.653074	\N
41	aasas	Focus	asasa	aasasa9059	dre1231	11	Reception	1990-12-12	female	12121212@example.com	0720989796	Imara Daima	$2b$10$YWA2vDoNLLlRhmfQcStKOur.2C/OJSlvb13BPDXUywNIZq1Pks6kS	5	\N	active	active	t	2025-11-26 02:15:47.204081	2025-11-26 02:15:47.204081	11
38	Occuring	Focus	Occur	ooccur0082	EMP121212	\N	Gynaecology	2000-12-01	male	Occur@gmail.com	0111222333	Imara Daima	$2b$10$hlZCxsBI/xhK4lDwoMFC0.y3CQaPYih5Fwdk76XA9anF/vlUabBB.	3	\N	active	active	t	2025-11-26 02:08:35.690533	2025-11-26 02:08:35.690533	\N
43	Occur	f	Occur	ooccur0043	EMP-123453224	\N	Paediatrics	2000-12-02	female	OOccur@example.com	0729324323	Imara Daima	$2b$10$gzxWchEZgwlxSTw3hS1b1.NqLDIZTYBojB6smJDkXL3eBrjKBKWRW	3	\N	active	active	t	2025-11-26 02:19:08.652498	2025-11-26 02:19:08.652498	\N
47	Santa	Focus	Claus	sclaus8055	EID221132	\N	Gynaecology	1980-12-12	male	santa@example.com	0122112211	Imara Daima	$2b$10$d0Vv0qtrqyDjZ9EuRCVZYe.s7PLB.W/nGJEjYgi.031oJlq1ubR2K	3	\N	active	active	t	2025-11-26 04:24:26.225696	2025-11-26 04:24:26.225696	\N
48	Hojn	Focus	Kagutho	hkagutho0033	1738ME	\N	Cardiology	2000-12-12	male	kagz@exaple.com	0790233438	Imara Daima	$2b$10$pJQ5aEz3RL3vYYw5VGBWoeZHr3vUEN7DhcKRh0/h865aQPBJjBuIa	3	\N	active	active	t	2025-11-26 04:41:51.457247	2025-11-26 04:41:51.457247	\N
26	sammy	l	focus	local_admin	33322111	1	Gynaecology	1999-12-12	male	local.admin1@example.com	0720989796	tassia1	$2b$10$otNSsqX4dk7Pmt0e/rPuzuM9SaLMRkHBkqz8BR/aw8Xtch7Jw/SmO	2	2025-11-26 16:39:30.588777	active	active	f	2025-10-16 05:10:55.661417	2025-10-16 05:10:55.661417	\N
30	Kiki	larry	Gakii	kiki_gakii	smd1233	\N	Gynaecology	1990-12-20	female	kikigakii@example.com	0721212121	tassia	$2b$10$ZsjlNF4qUZ1DcOobCmiG4eWGB6bateVW3eVjdjBZ8kToXTWNrJeIK	3	\N	active	active	t	2025-11-26 16:38:32.462043	2025-10-18 18:03:17.526827	\N
7	Sammy	K.	Focus	global_admin	EMP-ADM-0001	\N	\N	1985-06-15	male	sammy.focus@example.com	+254712345678	123 Admin HQ, Nairobi, Kenya	$2b$10$f4ueP3LgOYN8tHWWDZp0bueGYkJSbxNt4G.12lqpe.cdhUSKhttXO	1	2025-11-29 03:15:43.034026	active	active	f	2025-10-04 02:45:04.635988	2025-10-02 19:24:40.438524	\N
34	front	\N	desk	reception_user	RE123	1	Front Desk	2003-12-12	male	reception1@gmail.com	0788998877	Fedha	$2b$10$mPiSTkf3etPcJfDKuIlhc.ICctPCNXksaZ8Mk7Tj0M89aFKcugs72	5	2025-11-29 20:36:25.112583	active	active	f	2025-10-20 21:12:28.079758	2025-10-20 21:12:28.079758	\N
32	doctor	\N	Doc	doctor_user	empl123	\N	Paediatrics	2004-12-01	male	doctor1@example.com	0720989790	tassia1	$2b$10$T4aJvxvde9QNQArF3qk5C.my6HgR0bzUEWECEbGvdH/uU/IIoJHsO	3	2025-11-29 20:36:51.241359	active	active	f	2025-10-19 02:32:20.290491	2025-10-19 02:32:20.290491	\N
\.


--
-- Data for Name: visit_prescriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visit_prescriptions (prescription_id, visit_id, medication_name, dosage, frequency, start_date, end_date, refills_allowed, instructions, is_active, created_at) FROM stdin;
2	2	Amlodipine	5 mg	Once daily	2025-10-04	2025-11-04	2	Take one tablet daily after breakfast	t	2025-10-05 18:34:41.79805
3	4	Amoxillin	500mg	3 times a day	2003-03-12	2020-12-12	0	D not take with food	t	2025-10-13 03:46:05.909173
4	4	Amoxillin	500mg	3 times a day	2000-12-12	2020-12-12	0	die	t	2025-10-13 04:11:20.072217
7	4	Amoxillin	500mg	3 times a day	2000-12-12	2040-12-12	0	none	t	2025-10-13 04:25:56.04517
8	4	pennicilin	500mg	3 times a day	\N	\N	0	\N	t	2025-10-13 04:27:18.64927
9	10	Amoxillin	500mg	3 times a day	2025-10-25	2025-10-28	1	Take with water after meals.	t	2025-10-25 04:18:28.908061
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.visits (visit_id, visit_number, visit_type, patient_id, provider_id, hospital_id, visit_date, priority_level, referring_provider_name, referring_provider_hospital, reason_for_visit, admission_status, discharge_date, notes, created_at, updated_at, branch_id, user_id, visit_status) FROM stdin;
4	v0010	Outpatient	7	\N	3	2025-10-13 00:08:02.583694	Low	dr john	Aga khan	PAIN IN GROIN	\N	\N	REALLY PAINFUL	2025-10-13 00:08:02.583694	2025-10-13 00:08:02.583694	1	\N	open
5	V202510-0393	Inpatient	10	\N	1	2025-10-17 18:00:01.336268	Routine			Pain in balls	discharged	2025-10-20 20:06:44.372	Cut off balls	2025-10-17 18:00:01.336268	2025-10-20 20:06:44.458121	\N	\N	closed
12	V202511-3471	Surgical	3	\N	1	2025-11-24 10:46:51.824934	critical	\N	\N	Sharp Pain in sides and Lower abdomen	admitted	\N	Appendix removal surgery	2025-11-24 10:46:51.824934	2025-11-24 10:46:51.824934	1	32	open
2	VIS-2025-0001	Outpatient	3	2	1	2025-10-05 18:24:28.315397	urgent	Dr. Lucy Wanjiku	Kenyatta National Hospital	Persistent chest pain and shortness of breath	discharged	2025-11-24 10:52:20.995	Patient referred by KNH cardiology department	2025-10-05 18:24:28.315397	2025-11-24 10:52:21.007653	\N	\N	closed
8	V202510-8811	Emergency	14	\N	1	2025-10-20 23:53:12.990571	high			Heart failure	discharged	2025-11-24 10:52:28.068	Unconscious	2025-10-20 23:53:12.990571	2025-11-24 10:52:28.073972	\N	34	open
10	V202510-7197	Follow-up	3	\N	1	2025-10-25 04:07:27.665754	high			Persistent cough and mild fever for 3 days	\N	\N		2025-10-25 04:07:27.665754	2025-11-26 00:11:03.551688	\N	26	closed
9	V202510-6033	Surgical	14	\N	1	2025-10-21 05:29:21.569048	critical			jaundice	admitted	\N	no saving her	2025-10-21 05:29:21.569048	2025-11-26 00:23:28.106737	\N	33	closed
7	V202510-3929	Consultation	14	\N	1	2025-10-19 21:23:07.895991	Low	Dr Marie	Aga khan	Pain in groin	\N	\N	Amputate sexual organs	2025-10-19 21:23:07.895991	2025-11-26 00:23:39.589728	1	32	closed
6	V202510-8330	Follow-up	14	\N	1	2025-10-19 00:30:12.339413	Low			Pain in groin 	\N	\N	Remove groin	2025-10-19 00:30:12.339413	2025-11-26 00:23:54.908168	\N	26	closed
13	V202511-0902	Emergency	25	\N	1	2025-11-29 04:14:50.119651	high	Dr Marie	Aga khan	General weakness and Lack of brath earlier	admitted	\N	Patient has been to 3 different hospitals in the past week due to excessive fatigue	2025-11-29 04:14:50.119651	2025-11-29 04:14:50.119651	1	32	open
14	V202511-1659	Outpatient	18	\N	1	2025-11-29 04:18:32.982743	normal	Dr Marie	Aga khan	Pain in chest	\N	\N	\N	2025-11-29 04:18:32.982743	2025-11-29 04:18:32.982743	1	32	open
15	V202511-2520	Outpatient	18	\N	1	2025-11-29 04:23:16.410202	normal	Dr Marie	Aga khan	Pain in chest	\N	\N	\N	2025-11-29 04:23:16.410202	2025-11-29 04:23:16.410202	1	32	open
11	V202511-9275	Consultation	15	\N	1	2025-11-16 20:47:11.605902	normal	\N	\N	chest pains	\N	\N	\N	2025-11-16 20:47:11.605902	2025-11-29 20:36:36.043271	\N	26	closed
\.


--
-- Data for Name: vitals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vitals (vital_id, visit_id, blood_pressure, heart_rate, respiratory_rate, temperature, oxygen_saturation, weight, weight_unit, height, height_unit, bmi, recorded_by, created_at) FROM stdin;
2	2	130/85	78	20	36.80	97.50	72.40	kg	175.00	cm	23.60	\N	2025-10-05 18:26:52.74931
3	4	120/80	60	14	33.00	96.00	70.00	kg	170.00	cm	22.86	\N	2025-10-13 04:02:29.420391
4	10	118/76	66	22	37.70	91.00	70.00	kg	175.00	cm	\N	\N	2025-10-25 04:13:35.644802
\.


--
-- Name: access_logs_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.access_logs_access_id_seq', 1, false);


--
-- Name: ai_summaries_summary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_summaries_summary_id_seq', 1, false);


--
-- Name: allergies_allergy_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.allergies_allergy_id_seq', 8, true);


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 479, true);


--
-- Name: branches_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.branches_branch_id_seq', 13, true);


--
-- Name: chronic_conditions_condition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chronic_conditions_condition_id_seq', 7, true);


--
-- Name: data_exports_export_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.data_exports_export_id_seq', 1, false);


--
-- Name: diagnoses_diagnosis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.diagnoses_diagnosis_id_seq', 4, true);


--
-- Name: error_logs_error_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.error_logs_error_id_seq', 1, false);


--
-- Name: family_history_family_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.family_history_family_history_id_seq', 6, true);


--
-- Name: healthcare_providers_provider_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.healthcare_providers_provider_id_seq', 21, true);


--
-- Name: hospitals_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hospitals_hospital_id_seq', 11, true);


--
-- Name: imaging_instances_imaging_instance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.imaging_instances_imaging_instance_id_seq', 1, false);


--
-- Name: imaging_results_imaging_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.imaging_results_imaging_result_id_seq', 1, false);


--
-- Name: imaging_series_imaging_series_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.imaging_series_imaging_series_id_seq', 1, false);


--
-- Name: imaging_studies_imaging_study_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.imaging_studies_imaging_study_id_seq', 1, false);


--
-- Name: lab_tests_lab_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lab_tests_lab_test_id_seq', 2, true);


--
-- Name: medications_medication_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.medications_medication_id_seq', 4, true);


--
-- Name: patient_identifiers_identifier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patient_identifiers_identifier_id_seq', 22, true);


--
-- Name: patients_patient_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.patients_patient_id_seq', 25, true);


--
-- Name: provider_hospitals_provider_hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.provider_hospitals_provider_hospital_id_seq', 21, true);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 5, true);


--
-- Name: social_history_social_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.social_history_social_history_id_seq', 6, true);


--
-- Name: system_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_logs_log_id_seq', 1, false);


--
-- Name: treatments_treatment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.treatments_treatment_id_seq', 4, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 48, true);


--
-- Name: visit_prescriptions_prescription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visit_prescriptions_prescription_id_seq', 9, true);


--
-- Name: visits_visit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.visits_visit_id_seq', 15, true);


--
-- Name: vitals_vital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vitals_vital_id_seq', 4, true);


--
-- Name: access_logs access_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_pkey PRIMARY KEY (access_id);


--
-- Name: ai_summaries ai_summaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_summaries
    ADD CONSTRAINT ai_summaries_pkey PRIMARY KEY (summary_id);


--
-- Name: allergies allergies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allergies
    ADD CONSTRAINT allergies_pkey PRIMARY KEY (allergy_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- Name: branches branches_hospital_id_branch_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_branch_name_key UNIQUE (hospital_id, branch_name);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (branch_id);


--
-- Name: chronic_conditions chronic_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chronic_conditions
    ADD CONSTRAINT chronic_conditions_pkey PRIMARY KEY (condition_id);


--
-- Name: data_exports data_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_pkey PRIMARY KEY (export_id);


--
-- Name: diagnoses diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_pkey PRIMARY KEY (diagnosis_id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (error_id);


--
-- Name: family_history family_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_history
    ADD CONSTRAINT family_history_pkey PRIMARY KEY (family_history_id);


--
-- Name: healthcare_providers healthcare_providers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_license_number_key UNIQUE (license_number);


--
-- Name: healthcare_providers healthcare_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_pkey PRIMARY KEY (provider_id);


--
-- Name: healthcare_providers healthcare_providers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_user_id_key UNIQUE (user_id);


--
-- Name: hospitals hospitals_contact_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_contact_number_key UNIQUE (contact_number);


--
-- Name: hospitals hospitals_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_email_key UNIQUE (email);


--
-- Name: hospitals hospitals_hospital_license_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_hospital_license_number_key UNIQUE (hospital_license_number);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (hospital_id);


--
-- Name: imaging_instances imaging_instances_orthanc_instance_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_instances
    ADD CONSTRAINT imaging_instances_orthanc_instance_id_key UNIQUE (orthanc_instance_id);


--
-- Name: imaging_instances imaging_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_instances
    ADD CONSTRAINT imaging_instances_pkey PRIMARY KEY (imaging_instance_id);


--
-- Name: imaging_results imaging_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_pkey PRIMARY KEY (imaging_result_id);


--
-- Name: imaging_series imaging_series_orthanc_series_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_series
    ADD CONSTRAINT imaging_series_orthanc_series_id_key UNIQUE (orthanc_series_id);


--
-- Name: imaging_series imaging_series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_series
    ADD CONSTRAINT imaging_series_pkey PRIMARY KEY (imaging_series_id);


--
-- Name: imaging_studies imaging_studies_orthanc_study_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_studies
    ADD CONSTRAINT imaging_studies_orthanc_study_id_key UNIQUE (orthanc_study_id);


--
-- Name: imaging_studies imaging_studies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_studies
    ADD CONSTRAINT imaging_studies_pkey PRIMARY KEY (imaging_study_id);


--
-- Name: imaging_studies imaging_studies_study_instance_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_studies
    ADD CONSTRAINT imaging_studies_study_instance_uid_key UNIQUE (study_instance_uid);


--
-- Name: lab_tests lab_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_pkey PRIMARY KEY (lab_test_id);


--
-- Name: medications medications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_pkey PRIMARY KEY (medication_id);


--
-- Name: patient_identifiers patient_identifiers_hospital_id_patient_mrn_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_identifiers
    ADD CONSTRAINT patient_identifiers_hospital_id_patient_mrn_key UNIQUE (hospital_id, patient_mrn);


--
-- Name: patient_identifiers patient_identifiers_patient_id_hospital_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_identifiers
    ADD CONSTRAINT patient_identifiers_patient_id_hospital_id_key UNIQUE (patient_id, hospital_id);


--
-- Name: patient_identifiers patient_identifiers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_identifiers
    ADD CONSTRAINT patient_identifiers_pkey PRIMARY KEY (identifier_id);


--
-- Name: patients patients_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_email_key UNIQUE (email);


--
-- Name: patients patients_national_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_national_id_key UNIQUE (national_id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (patient_id);


--
-- Name: patients patients_primary_insurance_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_primary_insurance_policy_number_key UNIQUE (primary_insurance_policy_number);


--
-- Name: patients patients_secondary_insurance_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_secondary_insurance_policy_number_key UNIQUE (secondary_insurance_policy_number);


--
-- Name: provider_hospitals provider_hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_hospitals
    ADD CONSTRAINT provider_hospitals_pkey PRIMARY KEY (provider_hospital_id);


--
-- Name: provider_hospitals provider_hospitals_provider_id_hospital_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_hospitals
    ADD CONSTRAINT provider_hospitals_provider_id_hospital_id_key UNIQUE (provider_id, hospital_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: social_history social_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_history
    ADD CONSTRAINT social_history_pkey PRIMARY KEY (social_history_id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (log_id);


--
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (treatment_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: visit_prescriptions visit_prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_prescriptions
    ADD CONSTRAINT visit_prescriptions_pkey PRIMARY KEY (prescription_id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (visit_id);


--
-- Name: visits visits_visit_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_visit_number_key UNIQUE (visit_number);


--
-- Name: vitals vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_pkey PRIMARY KEY (vital_id);


--
-- Name: idx_access_timestamp_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_timestamp_desc ON public.access_logs USING btree ("timestamp" DESC);


--
-- Name: idx_access_user_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_access_user_timestamp ON public.access_logs USING btree (user_id, "timestamp");


--
-- Name: idx_active_patients; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_active_patients ON public.patients USING btree (patient_id) WHERE (is_active = true);


--
-- Name: idx_active_providers; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_active_providers ON public.users USING btree (user_id) WHERE (employment_status = 'active'::public.employment_status_enum);


--
-- Name: idx_audit_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_patient ON public.audit_logs USING btree (patient_id);


--
-- Name: idx_audit_timestamp_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_timestamp_desc ON public.audit_logs USING btree ("timestamp" DESC);


--
-- Name: idx_audit_user_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user_timestamp ON public.audit_logs USING btree (user_id, "timestamp");


--
-- Name: idx_diagnosis_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diagnosis_visit ON public.diagnoses USING btree (visit_id);


--
-- Name: idx_hospital_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hospital_provider ON public.provider_hospitals USING btree (hospital_id, provider_id);


--
-- Name: idx_imaging_instances_orthanc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_instances_orthanc ON public.imaging_instances USING btree (orthanc_instance_id);


--
-- Name: idx_imaging_instances_series; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_instances_series ON public.imaging_instances USING btree (imaging_series_id);


--
-- Name: idx_imaging_modality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_modality ON public.imaging_results USING btree (modality);


--
-- Name: idx_imaging_orthanc_instance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_orthanc_instance ON public.imaging_results USING btree (orthanc_instance_id);


--
-- Name: idx_imaging_orthanc_series; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_orthanc_series ON public.imaging_results USING btree (orthanc_series_id);


--
-- Name: idx_imaging_orthanc_series_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_orthanc_series_id ON public.imaging_results USING btree (orthanc_series_id);


--
-- Name: idx_imaging_orthanc_study; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_orthanc_study ON public.imaging_results USING btree (orthanc_study_id);


--
-- Name: idx_imaging_orthanc_study_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_orthanc_study_id ON public.imaging_results USING btree (orthanc_study_id);


--
-- Name: idx_imaging_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_patient_id ON public.imaging_results USING btree (patient_id);


--
-- Name: idx_imaging_series_modality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_series_modality ON public.imaging_series USING btree (modality);


--
-- Name: idx_imaging_series_orthanc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_series_orthanc ON public.imaging_series USING btree (orthanc_series_id);


--
-- Name: idx_imaging_series_study; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_series_study ON public.imaging_series USING btree (imaging_study_id);


--
-- Name: idx_imaging_studies_modality; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_studies_modality ON public.imaging_studies USING btree (modality);


--
-- Name: idx_imaging_studies_orthanc_study; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_studies_orthanc_study ON public.imaging_studies USING btree (orthanc_study_id);


--
-- Name: idx_imaging_studies_study_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_studies_study_date ON public.imaging_studies USING btree (study_date);


--
-- Name: idx_imaging_studies_study_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_studies_study_uid ON public.imaging_studies USING btree (study_instance_uid);


--
-- Name: idx_imaging_studies_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_studies_uploaded_by ON public.imaging_studies USING btree (uploaded_by);


--
-- Name: idx_imaging_studies_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_studies_visit ON public.imaging_studies USING btree (visit_id);


--
-- Name: idx_imaging_study_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_study_date ON public.imaging_results USING btree (study_date);


--
-- Name: idx_imaging_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_imaging_visit ON public.imaging_results USING btree (visit_id);


--
-- Name: idx_patient_dob; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_dob ON public.patients USING btree (date_of_birth);


--
-- Name: idx_patient_mrn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_mrn ON public.patient_identifiers USING btree (patient_mrn);


--
-- Name: idx_patient_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_name ON public.patients USING btree (last_name, first_name);


--
-- Name: idx_patient_national_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_national_id ON public.patients USING btree (national_id);


--
-- Name: idx_patients_birth_cert; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_birth_cert ON public.patients USING btree (birth_certificate_number) WHERE (birth_certificate_number IS NOT NULL);


--
-- Name: idx_provider_hospital; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_hospital ON public.provider_hospitals USING btree (provider_id, hospital_id);


--
-- Name: idx_provider_license; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_license ON public.healthcare_providers USING btree (license_number);


--
-- Name: idx_provider_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_name ON public.users USING btree (last_name, first_name);


--
-- Name: idx_provider_primary_hospital; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_provider_primary_hospital ON public.provider_hospitals USING btree (provider_id) WHERE (is_primary = true);


--
-- Name: idx_visit_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_date ON public.visits USING btree (visit_date);


--
-- Name: idx_visit_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_patient ON public.visits USING btree (patient_id);


--
-- Name: idx_visit_patient_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_patient_date ON public.visits USING btree (patient_id, visit_date);


--
-- Name: idx_visit_prescriptions_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_prescriptions_visit ON public.visit_prescriptions USING btree (visit_id);


--
-- Name: idx_visit_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_provider ON public.visits USING btree (provider_id);


--
-- Name: idx_visit_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_visit_status ON public.visits USING btree (visit_status);


--
-- Name: idx_vitals_visit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vitals_visit ON public.vitals USING btree (visit_id);


--
-- Name: imaging_instances trigger_update_series_stats_on_instance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_series_stats_on_instance AFTER INSERT OR DELETE OR UPDATE ON public.imaging_instances FOR EACH ROW EXECUTE FUNCTION public.update_series_statistics();


--
-- Name: imaging_series trigger_update_study_stats_on_series; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_study_stats_on_series AFTER INSERT OR DELETE OR UPDATE ON public.imaging_series FOR EACH ROW EXECUTE FUNCTION public.update_study_statistics();


--
-- Name: access_logs access_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: access_logs access_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_logs
    ADD CONSTRAINT access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: ai_summaries ai_summaries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_summaries
    ADD CONSTRAINT ai_summaries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: ai_summaries ai_summaries_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_summaries
    ADD CONSTRAINT ai_summaries_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.healthcare_providers(provider_id);


--
-- Name: allergies allergies_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.allergies
    ADD CONSTRAINT allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: audit_logs audit_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: branches branches_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- Name: chronic_conditions chronic_conditions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chronic_conditions
    ADD CONSTRAINT chronic_conditions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: data_exports data_exports_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: data_exports data_exports_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_exports
    ADD CONSTRAINT data_exports_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(user_id);


--
-- Name: diagnoses diagnoses_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnoses
    ADD CONSTRAINT diagnoses_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- Name: family_history family_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_history
    ADD CONSTRAINT family_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: family_history family_history_relative_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family_history
    ADD CONSTRAINT family_history_relative_patient_id_fkey FOREIGN KEY (relative_patient_id) REFERENCES public.patients(patient_id);


--
-- Name: healthcare_providers healthcare_providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.healthcare_providers
    ADD CONSTRAINT healthcare_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: imaging_instances imaging_instances_imaging_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_instances
    ADD CONSTRAINT imaging_instances_imaging_series_id_fkey FOREIGN KEY (imaging_series_id) REFERENCES public.imaging_series(imaging_series_id) ON DELETE CASCADE;


--
-- Name: imaging_results imaging_results_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: imaging_results imaging_results_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- Name: imaging_results imaging_results_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_results
    ADD CONSTRAINT imaging_results_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- Name: imaging_series imaging_series_imaging_study_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_series
    ADD CONSTRAINT imaging_series_imaging_study_id_fkey FOREIGN KEY (imaging_study_id) REFERENCES public.imaging_studies(imaging_study_id) ON DELETE CASCADE;


--
-- Name: imaging_studies imaging_studies_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_studies
    ADD CONSTRAINT imaging_studies_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- Name: imaging_studies imaging_studies_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.imaging_studies
    ADD CONSTRAINT imaging_studies_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- Name: lab_tests lab_tests_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_tests
    ADD CONSTRAINT lab_tests_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- Name: medications medications_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medications
    ADD CONSTRAINT medications_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: patient_identifiers patient_identifiers_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_identifiers
    ADD CONSTRAINT patient_identifiers_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- Name: patient_identifiers patient_identifiers_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_identifiers
    ADD CONSTRAINT patient_identifiers_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id) ON DELETE CASCADE;


--
-- Name: provider_hospitals provider_hospitals_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_hospitals
    ADD CONSTRAINT provider_hospitals_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE CASCADE;


--
-- Name: provider_hospitals provider_hospitals_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_hospitals
    ADD CONSTRAINT provider_hospitals_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id) ON DELETE CASCADE;


--
-- Name: provider_hospitals provider_hospitals_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_hospitals
    ADD CONSTRAINT provider_hospitals_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(provider_id) ON DELETE CASCADE;


--
-- Name: social_history social_history_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_history
    ADD CONSTRAINT social_history_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: treatments treatments_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- Name: users users_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id) ON DELETE SET NULL;


--
-- Name: users users_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- Name: visit_prescriptions visit_prescriptions_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visit_prescriptions
    ADD CONSTRAINT visit_prescriptions_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- Name: visits visits_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(branch_id);


--
-- Name: visits visits_hospital_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES public.hospitals(hospital_id);


--
-- Name: visits visits_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(patient_id);


--
-- Name: visits visits_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.healthcare_providers(provider_id);


--
-- Name: visits visits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: vitals vitals_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.healthcare_providers(provider_id);


--
-- Name: vitals vitals_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vitals
    ADD CONSTRAINT vitals_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id);


--
-- PostgreSQL database dump complete
--

\unrestrict gblXB7jwLeok2cm2UKqkgidUbetDSAKgf1GDhZ1ut26DbMYHXRmqzvQ8et1visR

