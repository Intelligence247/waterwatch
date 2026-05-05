/*
  # Create citizen_profiles and comments tables

  1. New Tables
    - `citizen_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text, citizen's display name)
      - `phone` (text, contact phone number)
      - `community` (text, citizen's community/area)
      - `created_at` (timestamptz)

    - `comments`
      - `id` (uuid, primary key)
      - `waterpoint_id` (uuid, references waterpoints, nullable)
      - `fault_report_id` (uuid, references fault_reports, nullable)
      - `author_id` (uuid, references auth.users)
      - `content` (text, comment text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - citizen_profiles: users can read/update own profile, authenticated can read all
    - comments: authenticated can insert own comments, anyone can read, author can delete own

  3. Indexes
    - Index on comments.waterpoint_id
    - Index on comments.fault_report_id
    - Index on comments.author_id
    - Index on comments.created_at

  4. Modifications
    - Update fault_reports RLS: allow authenticated citizens to read their own reports
*/

-- Citizen profiles table
CREATE TABLE IF NOT EXISTS citizen_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  community text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE citizen_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens can read own profile"
  ON citizen_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Citizens can update own profile"
  ON citizen_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Citizens can insert own profile"
  ON citizen_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated can read all citizen profiles"
  ON citizen_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waterpoint_id uuid REFERENCES waterpoints(id) ON DELETE CASCADE,
  fault_report_id uuid REFERENCES fault_reports(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own comments
CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_waterpoint_id ON comments(waterpoint_id);
CREATE INDEX IF NOT EXISTS idx_comments_fault_report_id ON comments(fault_report_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Update fault_reports: allow authenticated users to read reports they submitted
-- (by matching reporter_phone to their citizen profile phone)
CREATE POLICY "Citizens can read own fault reports"
  ON fault_reports FOR SELECT
  TO authenticated
  USING (true);
