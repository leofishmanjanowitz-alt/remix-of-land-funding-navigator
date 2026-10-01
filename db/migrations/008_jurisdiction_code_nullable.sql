-- Some municipal boundary layers publish no place code.
ALTER TABLE jurisdictions ALTER COLUMN code DROP NOT NULL;
