-- =====================================================
-- BANGKALAN PUBLIC SERVICE — Supabase SQL Setup
-- Run this in: Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'officer')),
  kecamatan text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. REPORT CATEGORIES
CREATE TABLE IF NOT EXISTS report_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_name text,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON report_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON report_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  contact_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id),
  reporter_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES report_categories(id),
  category_name text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  status text NOT NULL DEFAULT 'waiting_verification'
    CHECK (status IN ('waiting_verification', 'verified', 'assigned', 'in_progress', 'completed', 'rejected', 'duplicate', 'need_evidence')),
  kecamatan text,
  address text,
  latitude double precision,
  longitude double precision,
  photo_urls text[] DEFAULT '{}',
  assigned_department_id uuid REFERENCES departments(id),
  assigned_officer_id uuid REFERENCES profiles(id),
  admin_note text,
  completion_note text,
  completion_photo_urls text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public reports are visible to all
CREATE POLICY "Anyone can view public reports" ON reports
  FOR SELECT USING (is_public = true);

-- Citizens can view their own reports
CREATE POLICY "Citizens can view own reports" ON reports
  FOR SELECT USING (reporter_id = auth.uid());

-- Citizens can insert reports
CREATE POLICY "Citizens can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can do anything
CREATE POLICY "Admins can manage all reports" ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'officer')));

-- 5. REPORT STATUS HISTORIES
CREATE TABLE IF NOT EXISTS report_status_histories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  updated_by uuid REFERENCES profiles(id),
  updated_by_role text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_status_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Report parties can view histories" ON report_status_histories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_id
      AND (r.reporter_id = auth.uid() OR r.is_public = true
           OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer')))
    )
  );
CREATE POLICY "Authenticated can insert histories" ON report_status_histories
  FOR INSERT WITH CHECK (auth.uid() = updated_by);

-- 6. OFFICER TASKS
CREATE TABLE IF NOT EXISTS officer_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  officer_id uuid NOT NULL REFERENCES profiles(id),
  department_id uuid REFERENCES departments(id),
  status text NOT NULL DEFAULT 'assigned',
  note text,
  deadline timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE officer_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Officers can view own tasks" ON officer_tasks
  FOR SELECT USING (officer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Officers can update own tasks" ON officer_tasks
  FOR UPDATE USING (officer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert tasks" ON officer_tasks
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'officer')));

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- 8. REPORT RESPONSES
CREATE TABLE IF NOT EXISTS report_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  message text NOT NULL,
  image_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view responses" ON report_responses
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert responses" ON report_responses
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 9. SATISFACTION RATINGS
CREATE TABLE IF NOT EXISTS satisfaction_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_resolved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE satisfaction_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ratings" ON satisfaction_ratings FOR SELECT USING (true);
CREATE POLICY "Citizens can insert own ratings" ON satisfaction_ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- TRIGGER: auto-create profile on sign up
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Warga'),
    new.email,
    'citizen'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Report Categories
INSERT INTO report_categories (name, icon_name, description) VALUES
  ('Jalan Rusak', 'road', 'Jalan berlubang, retak, atau tidak layak dilalui'),
  ('Lampu Jalan Mati', 'lamp', 'Lampu penerangan jalan yang mati atau rusak'),
  ('Sampah Menumpuk', 'trash', 'Tumpukan sampah yang tidak terurus'),
  ('Drainase Tersumbat', 'drain', 'Saluran air atau selokan yang tersumbat'),
  ('Banjir / Genangan Air', 'flood', 'Banjir atau genangan air di jalan'),
  ('Fasilitas Umum Rusak', 'facility', 'Taman, bangku, atau fasilitas umum yang rusak'),
  ('Rambu Lalu Lintas Rusak', 'traffic', 'Rambu, marka, atau traffic light rusak'),
  ('Pohon Tumbang', 'tree', 'Pohon tumbang yang menghalangi jalan'),
  ('Kebersihan Lingkungan', 'clean', 'Masalah kebersihan lingkungan sekitar'),
  ('Lainnya', 'other', 'Kategori laporan lainnya')
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (name, description, contact_number) VALUES
  ('Dinas Pekerjaan Umum dan Penataan Ruang', 'Bertanggung jawab atas infrastruktur jalan dan fasilitas umum', '(031) 3095xxx'),
  ('Dinas Lingkungan Hidup', 'Bertanggung jawab atas kebersihan dan pengelolaan sampah', '(031) 3095xxx'),
  ('Dinas Perhubungan', 'Bertanggung jawab atas rambu lalu lintas dan transportasi', '(031) 3095xxx'),
  ('Badan Penanggulangan Bencana Daerah', 'Bertanggung jawab atas penanganan bencana dan darurat', '(031) 3095xxx'),
  ('Dinas Perumahan Rakyat dan Kawasan Permukiman', 'Bertanggung jawab atas perumahan dan kawasan pemukiman', '(031) 3095xxx')
ON CONFLICT DO NOTHING;

-- Example public reports
INSERT INTO reports (reporter_id, reporter_name, title, description, category_name, urgency, status, kecamatan, address, is_public)
SELECT
  (SELECT id FROM profiles LIMIT 1),
  'Warga Bangkalan',
  'Jalan Berlubang di Jl. Soekarno Hatta',
  'Terdapat lubang besar di tengah jalan Soekarno Hatta yang membahayakan pengendara, terutama pada malam hari.',
  'Jalan Rusak',
  'high',
  'waiting_verification',
  'Bangkalan',
  'Jl. Soekarno Hatta, depan Pasar Bangkalan',
  true
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STORAGE BUCKETS (run via Supabase Dashboard)
-- =====================================================
-- Create the following public buckets in Storage:
-- 1. report-photos
-- 2. completion-photos
-- 3. response-photos
-- 4. profile-photos
--
-- Set policy for each bucket:
-- INSERT: authenticated users
-- SELECT: public

-- =====================================================
-- DYNAMIC UPDATES
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);
