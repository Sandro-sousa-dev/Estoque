
-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Create active user check function  
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND ativo = true
  )
$$;

-- Update profiles policies: only admins can update other profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

-- Tighten write policies to active users only
DROP POLICY IF EXISTS "Authenticated users can insert produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can update produtos" ON public.produtos;
DROP POLICY IF EXISTS "Authenticated users can delete produtos" ON public.produtos;
CREATE POLICY "Active users can insert produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY "Active users can update produtos" ON public.produtos FOR UPDATE TO authenticated USING (public.is_active_user());
CREATE POLICY "Active users can delete produtos" ON public.produtos FOR DELETE TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Authenticated users can insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Authenticated users can delete funcionarios" ON public.funcionarios;
CREATE POLICY "Active users can insert funcionarios" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY "Active users can update funcionarios" ON public.funcionarios FOR UPDATE TO authenticated USING (public.is_active_user());
CREATE POLICY "Active users can delete funcionarios" ON public.funcionarios FOR DELETE TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Authenticated users can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Authenticated users can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "Authenticated users can delete empresas" ON public.empresas;
CREATE POLICY "Active users can insert empresas" ON public.empresas FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY "Active users can update empresas" ON public.empresas FOR UPDATE TO authenticated USING (public.is_active_user());
CREATE POLICY "Active users can delete empresas" ON public.empresas FOR DELETE TO authenticated USING (public.is_active_user());

DROP POLICY IF EXISTS "Authenticated users can insert movimentacoes" ON public.movimentacoes;
CREATE POLICY "Active users can insert movimentacoes" ON public.movimentacoes FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
