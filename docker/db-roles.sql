-- Dev only. The supabase/postgres image creates these roles but not their
-- passwords; the services connect as them, so set them to POSTGRES_PASSWORD
-- (same as Supabase's own docker-compose "roles.sql").
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
