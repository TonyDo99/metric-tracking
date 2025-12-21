-- Initialize schema to match current TypeORM entities and seed Distance/Temperature units

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET search_path = public;

-- Create tables
CREATE TABLE IF NOT EXISTS tb_unit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS tb_unit_attribute (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  base BOOLEAN NOT NULL DEFAULT FALSE,
  unit_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT fk_unit_attr_unit FOREIGN KEY ("unit_id") REFERENCES tb_unit(id) ON DELETE CASCADE
);


-- Matches default table name for UnitValEntity (snake_case of class name)
CREATE TABLE IF NOT EXISTS tb_unit_val (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(255) NOT NULL,
  attributes_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT fk_unit_val_attr FOREIGN KEY ("attributes_id") REFERENCES tb_unit_attribute(id) ON DELETE CASCADE
);

-- Ensure each attribute name is unique within its unit
CREATE UNIQUE INDEX IF NOT EXISTS ux_tb_unit_attribute_name_unit ON tb_unit_attribute (name, "unit_id");

-- Helpful indexes for foreign keys
CREATE INDEX IF NOT EXISTS ix_tb_unit_attribute_unit_id ON tb_unit_attribute("unit_id");
CREATE INDEX IF NOT EXISTS ix_tb_unit_val_attributes_id ON tb_unit_val("attributes_id");

-- Trigger to auto-update "updated_at" columns
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tb_unit_set_updated_at') THEN
    CREATE TRIGGER trg_tb_unit_set_updated_at
    BEFORE UPDATE ON tb_unit
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tb_unit_val_set_updated_at') THEN
    CREATE TRIGGER trg_tb_unit_val_set_updated_at
    BEFORE UPDATE ON tb_unit_val
    FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END $$;

-- Seed data for units and attributes
DO $$
DECLARE
  distance_id UUID;
  temperature_id UUID;
BEGIN
  SELECT id INTO distance_id FROM tb_unit WHERE name = 'Distance';
  IF distance_id IS NULL THEN
    INSERT INTO tb_unit (name) VALUES ('Distance') RETURNING id INTO distance_id;
  END IF;

  SELECT id INTO temperature_id FROM tb_unit WHERE name = 'Temperature';
  IF temperature_id IS NULL THEN
    INSERT INTO tb_unit (name) VALUES ('Temperature') RETURNING id INTO temperature_id;
  END IF;

  -- Distance attributes
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'meter' AND "unit_id" = distance_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('meter', TRUE, distance_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'centimeter' AND "unit_id" = distance_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('centimeter', FALSE, distance_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'inch' AND "unit_id" = distance_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('inch', FALSE, distance_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'feet' AND "unit_id" = distance_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('feet', FALSE, distance_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'yard' AND "unit_id" = distance_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('yard', FALSE, distance_id);
  END IF;

  -- Temperature attributes
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'celsius' AND "unit_id" = temperature_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('celsius', TRUE, temperature_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'fahrenheit' AND "unit_id" = temperature_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('fahrenheit', FALSE, temperature_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tb_unit_attribute WHERE name = 'kelvin' AND "unit_id" = temperature_id) THEN
    INSERT INTO tb_unit_attribute (name, base, "unit_id") VALUES ('kelvin', FALSE, temperature_id);
  END IF;
END $$;

-- Done
