/*
  # Create waterpoints table

  1. New Tables
    - `waterpoints`
      - `id` (uuid, primary key)
      - `name` (text, name of the water point)
      - `type` (text, type of water source: borehole, well, tap)
      - `status` (text, operational status: functional, faulty, under_repair)
      - `latitude` (double precision, GPS latitude)
      - `longitude` (double precision, GPS longitude)
      - `community` (text, community/area name)
      - `lga` (text, Local Government Area)
      - `description` (text, optional description)
      - `photo_url` (text, optional photo URL)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on `waterpoints` table
    - Public SELECT policy (anyone can view waterpoints on the map)
    - Authenticated INSERT policy (logged-in admins can add waterpoints)
    - Authenticated UPDATE policy (logged-in admins can update waterpoints)
    - Authenticated DELETE policy (logged-in admins can delete waterpoints)

  3. Indexes
    - Index on `status` for filtering
    - Index on `type` for filtering
    - Index on `lga` for filtering
*/

CREATE TABLE IF NOT EXISTS waterpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'borehole',
  status text NOT NULL DEFAULT 'functional',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  community text NOT NULL DEFAULT '',
  lga text NOT NULL DEFAULT '',
  description text DEFAULT '',
  photo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE waterpoints ENABLE ROW LEVEL SECURITY;

-- Public read access (citizens can view the map)
CREATE POLICY "Public can view waterpoints"
  ON waterpoints FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can insert waterpoints
CREATE POLICY "Authenticated users can add waterpoints"
  ON waterpoints FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update waterpoints
CREATE POLICY "Authenticated users can update waterpoints"
  ON waterpoints FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete waterpoints
CREATE POLICY "Authenticated users can delete waterpoints"
  ON waterpoints FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_waterpoints_status ON waterpoints(status);
CREATE INDEX IF NOT EXISTS idx_waterpoints_type ON waterpoints(type);
CREATE INDEX IF NOT EXISTS idx_waterpoints_lga ON waterpoints(lga);
