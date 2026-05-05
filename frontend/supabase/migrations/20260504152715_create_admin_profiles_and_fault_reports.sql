/*
  # Create admin_profiles and fault_reports tables

  1. New Tables
    - `admin_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, admin's display name)
      - `role` (text, default 'admin', for future role differentiation)
      - `created_at` (timestamptz)

    - `fault_reports`
      - `id` (uuid, primary key)
      - `waterpoint_id` (uuid, references waterpoints, nullable - can be a new report not linked to existing point)
      - `reporter_name` (text, name of the citizen reporter)
      - `reporter_phone` (text, contact phone number)
      - `description` (text, description of the fault)
      - `photo_url` (text, URL of uploaded photographic evidence)
      - `latitude` (double precision, GPS latitude of the report)
      - `longitude` (double precision, GPS longitude of the report)
      - `community` (text, community name)
      - `status` (text, default 'pending' - pending, verified, dismissed, resolved)
      - `reviewed_by` (uuid, references admin_profiles, nullable)
      - `reviewed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - admin_profiles: users can read/update own profile, authenticated users can read all profiles
    - fault_reports: public can insert (citizens report faults), authenticated can read/update all reports

  3. Indexes
    - Index on fault_reports.status for filtering
    - Index on fault_reports.waterpoint_id for joins
    - Index on fault_reports.created_at for sorting
*/

-- Admin profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can read all profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Fault reports table
CREATE TABLE IF NOT EXISTS fault_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waterpoint_id uuid REFERENCES waterpoints(id) ON DELETE SET NULL,
  reporter_name text NOT NULL DEFAULT '',
  reporter_phone text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  photo_url text DEFAULT '',
  latitude double precision,
  longitude double precision,
  community text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES admin_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fault_reports ENABLE ROW LEVEL SECURITY;

-- Citizens can submit reports (public insert via anon key)
CREATE POLICY "Anyone can submit fault reports"
  ON fault_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users (admins) can read all reports
CREATE POLICY "Authenticated users can read fault reports"
  ON fault_reports FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (admins) can update reports (verify, dismiss, resolve)
CREATE POLICY "Authenticated users can update fault reports"
  ON fault_reports FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admins) can delete reports
CREATE POLICY "Authenticated users can delete fault reports"
  ON fault_reports FOR DELETE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fault_reports_status ON fault_reports(status);
CREATE INDEX IF NOT EXISTS idx_fault_reports_waterpoint_id ON fault_reports(waterpoint_id);
CREATE INDEX IF NOT EXISTS idx_fault_reports_created_at ON fault_reports(created_at DESC);
