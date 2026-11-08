INSERT INTO waste_categories (name) VALUES
  ('Plastic'),('Paper'),('Cardboard'),('Metal'),
  ('Glass'),('E-Waste'),('Textiles'),('Reusable Items')
ON CONFLICT (name) DO NOTHING;
