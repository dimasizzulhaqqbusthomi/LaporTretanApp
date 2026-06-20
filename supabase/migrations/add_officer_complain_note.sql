-- Migration: Add officer_complain_note column to reports table
-- Run this SQL in your Supabase SQL Editor dashboard

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS officer_complain_note TEXT DEFAULT NULL;
