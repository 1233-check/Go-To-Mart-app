---
description: How to add a new Supabase table or modify schema for Go To Mart
---

# Adding/Modifying Database Schema

## Steps

1. **Design the table** — Define columns, types, and relationships:
   - Use `UUID` primary keys with `uuid_generate_v4()`
   - Add `created_at TIMESTAMPTZ DEFAULT now()`
   - Reference `profiles(id)` for user relationships
   - Add CHECK constraints for enums

2. **Apply via Supabase MCP** — Use the `apply_migration` tool:
   ```sql
   CREATE TABLE IF NOT EXISTS table_name (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     -- columns
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```

3. **Enable RLS** — Always add Row Level Security:
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   
   -- Public read
   CREATE POLICY "table viewable by everyone" ON table_name
     FOR SELECT USING (true);
   
   -- Admin manage
   CREATE POLICY "Admins manage table" ON table_name FOR ALL USING (
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
   );
   ```

4. **Add indexes** for frequently queried columns:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);
   ```

5. **Enable realtime** if needed:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE table_name;
   ```

6. **Update TypeScript types** (optional):
   - Use `generate_typescript_types` MCP tool

## RLS Policy Patterns

| Access Level | Policy |
|---|---|
| Public read | `FOR SELECT USING (true)` |
| Own data only | `USING (auth.uid() = user_id)` |
| Staff access | `USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'store_staff')))` |
| Admin only | `USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))` |

## Project Info
- **Project ID:** `ahitvfafdnvmkkfvghbe`
- **Region:** ap-south-1
- **Database host:** db.ahitvfafdnvmkkfvghbe.supabase.co
