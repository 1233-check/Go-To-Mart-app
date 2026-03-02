-- Run this snippet in your Supabase SQL Editor to allow Store Staff to update Inventory stock
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Admins and Staff can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff'))
);
