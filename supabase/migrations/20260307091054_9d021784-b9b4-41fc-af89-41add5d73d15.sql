
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  ativo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  INSERT INTO public.profiles (id, email, role, ativo)
  VALUES (NEW.id, NEW.email, CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END, CASE WHEN user_count = 0 THEN true ELSE false END);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Produtos table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'un',
  estoque_minimo INT NOT NULL DEFAULT 0,
  quantidade_atual INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view produtos" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update produtos" ON public.produtos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete produtos" ON public.produtos FOR DELETE TO authenticated USING (true);

-- Funcionarios table
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  funcao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert funcionarios" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update funcionarios" ON public.funcionarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete funcionarios" ON public.funcionarios FOR DELETE TO authenticated USING (true);

-- Empresas table
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view empresas" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update empresas" ON public.empresas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete empresas" ON public.empresas FOR DELETE TO authenticated USING (true);

-- Movimentacoes table
CREATE TABLE public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade INT NOT NULL,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  empresa_id UUID REFERENCES public.empresas(id),
  validade_lote DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view movimentacoes" ON public.movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert movimentacoes" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
