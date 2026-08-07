-- 003_baseline_schema.sql
-- Baseline schema for the five tables that predate the migrations directory.
--
-- IMPORTANT: captured from the LOCAL dev database (2026-08-07), whose tables
-- were hand-created from the column usage in server.js. Production may differ
-- in details (defaults, constraints, index names). Before trusting this as the
-- production baseline, diff it against Heroku:
--   heroku pg:psql -a gentle-mesa-48529 -c '\d+ plaster_calculations'
--
-- Do NOT run this against production; those tables already exist. It exists so
-- a fresh local database can be created in one step, and so the schema is in
-- version control at all.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public.kiln_ceramic_records (
    id integer NOT NULL,
    room_temp text,
    low_fire_start_time text,
    medium_fire_start_time text,
    high_fire_start_time text,
    kiln_turn_off_time text,
    loading_notes text,
    unloading_notes text,
    firing_complete boolean DEFAULT false NOT NULL,
    rating text,
    cone_type text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.kiln_ceramic_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.kiln_ceramic_records_id_seq OWNED BY public.kiln_ceramic_records.id;
CREATE TABLE public.kiln_glass_records (
    id integer NOT NULL,
    room_temp text,
    loading_notes text,
    unloading_notes text,
    fire_time_hr text,
    fire_time_m text,
    glass_type text,
    glass_type_other text,
    mode text,
    auto_speed text,
    auto_process text,
    auto_mod_temp text,
    auto_mod_hr text,
    auto_mod_m text,
    pro_table_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.kiln_glass_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.kiln_glass_records_id_seq OWNED BY public.kiln_glass_records.id;
CREATE TABLE public.plaster_calculations (
    id integer NOT NULL,
    length numeric,
    width numeric,
    height numeric,
    volume numeric,
    water numeric,
    plaster_lbs numeric,
    plaster_oz numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.plaster_calculations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.plaster_calculations_id_seq OWNED BY public.plaster_calculations.id;
CREATE TABLE public.pro_table (
    id integer NOT NULL,
    name text,
    slot text,
    segs text,
    rate_temp_hr_m_1 text,
    rate_temp_hr_m_2 text,
    rate_temp_hr_m_3 text,
    rate_temp_hr_m_4 text,
    rate_temp_hr_m_5 text,
    rate_temp_hr_m_6 text,
    rate_temp_hr_m_7 text,
    rate_temp_hr_m_8 text,
    skip text,
    add_time_hr text,
    add_time_m text,
    adjusted_temp text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.pro_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.pro_table_id_seq OWNED BY public.pro_table.id;
CREATE TABLE public.spotify_mcp_tokens (
    id integer NOT NULL,
    access_token text,
    refresh_token text,
    expires_at bigint,
    token_type text,
    scope text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE ONLY public.kiln_ceramic_records ALTER COLUMN id SET DEFAULT nextval('public.kiln_ceramic_records_id_seq'::regclass);
ALTER TABLE ONLY public.kiln_glass_records ALTER COLUMN id SET DEFAULT nextval('public.kiln_glass_records_id_seq'::regclass);
ALTER TABLE ONLY public.plaster_calculations ALTER COLUMN id SET DEFAULT nextval('public.plaster_calculations_id_seq'::regclass);
ALTER TABLE ONLY public.pro_table ALTER COLUMN id SET DEFAULT nextval('public.pro_table_id_seq'::regclass);
ALTER TABLE ONLY public.kiln_ceramic_records
    ADD CONSTRAINT kiln_ceramic_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.kiln_glass_records
    ADD CONSTRAINT kiln_glass_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.plaster_calculations
    ADD CONSTRAINT plaster_calculations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pro_table
    ADD CONSTRAINT pro_table_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.spotify_mcp_tokens
    ADD CONSTRAINT spotify_mcp_tokens_pkey PRIMARY KEY (id);
