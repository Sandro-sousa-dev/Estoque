
-- Create unidades table for managing measurement units
CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sigla text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view unidades" ON public.unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Active users can insert unidades" ON public.unidades FOR INSERT TO authenticated WITH CHECK (is_active_user());
CREATE POLICY "Active users can delete unidades" ON public.unidades FOR DELETE TO authenticated USING (is_active_user());
CREATE POLICY "Active users can update unidades" ON public.unidades FOR UPDATE TO authenticated USING (is_active_user());

-- Insert default measurement units
INSERT INTO public.unidades (nome, sigla) VALUES
  ('Unidade', 'un'),
  ('Par', 'Par'),
  ('Metro', 'm'),
  ('Quilograma', 'kg'),
  ('Litro', 'L'),
  ('Saco 50kg', 'Saco 50kg'),
  ('Caixa', 'cx'),
  ('Peça', 'pç'),
  ('Rolo', 'rl');

-- Create alert_config table for stock alert email settings
CREATE TABLE public.alert_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_alerta text NOT NULL,
  alerta_estoque_baixo boolean NOT NULL DEFAULT true,
  alerta_pre_vencimento boolean NOT NULL DEFAULT true,
  dias_pre_vencimento integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view alert_config" ON public.alert_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert alert_config" ON public.alert_config FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin can update alert_config" ON public.alert_config FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admin can delete alert_config" ON public.alert_config FOR DELETE TO authenticated USING (is_admin());

-- Insert default alert config
INSERT INTO public.alert_config (email_alerta) VALUES ('sousasandro419@gmail.com');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.unidades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_config;
