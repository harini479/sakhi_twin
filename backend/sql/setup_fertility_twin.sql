-- Enable pgvector if not enabled
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS session_states CASCADE;
DROP TABLE IF EXISTS logic_vault CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. PROFILES TABLE
-- Maps WhatsApp remoteJid directly to the specific clinic patient
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remote_jid TEXT UNIQUE NOT NULL, -- WhatsApp mapping (e.g., '919876543210@s.whatsapp.net')
    name TEXT NOT NULL,
    age INT,
    treatment_cycle TEXT,
    clinical_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SESSION STATES TABLE
-- Controls who is active: ops (Admin/Nudge), twin (Clinical RAG), doctor (Manual override)
CREATE TABLE session_states (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    active_handler TEXT DEFAULT 'ops' CHECK (active_handler IN ('ops', 'twin', 'doctor')),
    is_emergency BOOLEAN DEFAULT FALSE,
    current_logic_branch TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MESSAGES TABLE
-- Strictly logs WhatsApp traffic. Frontends poll this table via Supabase Realtime.
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender TEXT CHECK (sender IN ('patient', 'twin', 'ops', 'doctor')),
    source TEXT DEFAULT 'whatsapp',
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LOGIC VAULT (HRAG KNOWLEDGE HUB)
-- The "Brain" of the Digital Twin. Strict clinical rules isolated from the Operations logic.
CREATE TABLE logic_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    header_path TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Assuming OpenAI text-embedding-3-small standard
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- SEED DATA: LOGIC VAULT (20 FERTILITY ROWS)
-- ==========================================
INSERT INTO logic_vault (category, header_path, content) VALUES
('IVF_Protocol', 'IVF / Stimulation Phase / Gonal-F', 'Gonal-F is typically administered in the evening between 7 PM and 9 PM. Consistency is key for optimal follicle stimulation. Rotate injection sites on the abdomen to prevent bruising.'),
('IVF_Protocol', 'IVF / Stimulation Phase / Cetrotide', 'Cetrotide is an antagonist used to prevent premature ovulation. It is usually added around Day 5-7 of stimulation when the lead follicle reaches 14mm. Side effects include a localized itchy rash at the injection site which resolves in 30 minutes.'),
('IVF_Protocol', 'IVF / Trigger Shot / hCG', 'The trigger shot (Ovidrel or hCG) must be taken EXACTLY 36 hours before the scheduled egg retrieval. Timing is absolutely critical. Do not alter the time under any circumstances.'),
('IVF_Protocol', 'IVF / Egg Retrieval / Pre-Op', 'Fast for 8 hours before the egg retrieval. No food, water, or gum. Wear comfortable clothing. Please arrange for an adult to drive you home, as you will be under mild anesthesia.'),
('IVF_Protocol', 'IVF / Egg Retrieval / OHSS Risk', 'Ovarian Hyperstimulation Syndrome (OHSS) risk is high if E2 > 3500 pg/mL or >20 eggs retrieved. Symptoms include severe bloating, reduced urine output, and shortness of breath. Hydrate with electrolyte-rich fluids and trigger TRIAGE_STEP_BACK.'),
('IVF_Protocol', 'IVF / Post-Retrieval / Normal Symptoms', 'Mild to moderate pelvic cramping and light spotting are normal for 1-3 days after egg retrieval. Use a heating pad and take Acetaminophen PRN. Do NOT use NSAIDs like Ibuprofen.'),
('IVF_Protocol', 'IVF / Embryo Development / Day 3 vs Day 5', 'Embryos are graded on Day 3 (cleavage stage) and Day 5/6 (blastocyst stage). Day 5 transfers generally have higher implantation rates. The embryology lab will update you via WhatsApp on Day 1, Day 3, and Day 5/6.'),
('IVF_Protocol', 'IVF / Embryo Transfer / Pre-Op', 'For the embryo transfer, arrive with a full bladder. Drink 32 ounces of fluid one hour prior. The procedure is painless, similar to a Pap smear, and does not require anesthesia.'),
('IVF_Protocol', 'IVF / Post-Transfer / Progesterone', 'Progesterone (injections or vaginal suppositories) is mandatory to support the uterine lining. Do NOT stop progesterone unless explicitly instructed by the clinic, even if you experience spotting.'),
('IVF_Protocol', 'IVF / Post-Transfer / Normal Symptoms', 'Light spotting and mild cramping 5-9 days post-transfer are normal and may represent implantation. Continue all medications. Avoid lifting heavy objects or high-impact exercise.'),

('IUI_Timeline', 'IUI / Baseline Scan', 'Call the clinic on Day 1 of your period to schedule a Day 2/3 baseline scan and bloodwork. This ensures you have no cysts before starting stimulation medications (Letrozole or Clomid).'),
('IUI_Timeline', 'IUI / Mid-Cycle Scan', 'A follicle tracking scan is scheduled around Day 10-12 to check the size of the follicles and thickness of the uterine lining (target > 7mm).'),
('IUI_Timeline', 'IUI / Trigger Timing', 'Once a follicle reaches 18-20mm, a trigger shot is given. The IUI procedure is then scheduled for 24-36 hours post-trigger.'),
('IUI_Timeline', 'IUI / Day of Procedure', 'On IUI day, the partner provides a semen sample which is washed and prepped for 1-2 hours. The actual IUI procedure takes just 5 minutes. You may rest for 10-15 minutes afterward.'),
('IUI_Timeline', 'IUI / Two Week Wait', 'During the 14-day wait after IUI, do not take home pregnancy tests before Day 14, as the trigger shot contains hCG and can cause a false positive result (Chemical Pregnancy artifact).'),

('Egg_Freezing', 'Egg Freezing / Initial Consultation', 'The first step is an AMH (Anti-Mullerian Hormone) blood test and antral follicle count ultrasound to assess your ovarian reserve and determine the expected yield per cycle.'),
('Egg_Freezing', 'Egg Freezing / Stimulation', 'Stimulation protocols last 10-12 days using injectable gonadotropins. You will have 3-5 ultrasound monitoring appointments during this time.'),
('Egg_Freezing', 'Egg Freezing / Post-Op Recovery', 'Recovery is rapid. Most women return to work within 1-2 days. You will get your period roughly 10-14 days after the retrieval. Avoid strenuous exercise until your period arrives due to enlarged ovaries.'),

('Medication_Guide', 'Meds / Storage / Refrigeration', 'Gonal-F, Follistim, Ovidrel, and Cetrotide must be stored in the refrigerator until ready to use. Menopur and Progesterone in Oil (PIO) should be stored at room temperature away from direct light.'),
('Medication_Guide', 'Meds / Progesterone in Oil Injection', 'PIO is given intramuscularly in the upper outer quadrant of the buttocks. Warm the vial in your hands or a heating pad for 2 minutes before drawing to thin the oil. Massage the area post-injection.');

-- ==========================================
-- MAPPINGS: WHATSAPP REMOTE-JID DUMMY ACCOUNTS
-- ==========================================
INSERT INTO profiles (id, remote_jid, name, age, treatment_cycle, clinical_flags) VALUES
('11111111-1111-1111-1111-111111111111', '919876543210@s.whatsapp.net', 'Aasha', 32, 'IVF-ICSI Day 14', '["High AMH", "PCOS"]'::jsonb),
('22222222-2222-2222-2222-222222222222', '919876543211@s.whatsapp.net', 'Ananya S.', 34, 'FET Day 6', '["Endometriosis"]'::jsonb);

INSERT INTO session_states (user_id, active_handler, current_logic_branch) VALUES
('11111111-1111-1111-1111-111111111111', 'twin', 'post_op_recovery'),
('22222222-2222-2222-2222-222222222222', 'ops', 'routine_checkin');
