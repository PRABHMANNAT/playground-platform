-- Development-only application role; migrations use the postgres owner separately.
CREATE ROLE playground_app LOGIN PASSWORD 'local-app-only';
