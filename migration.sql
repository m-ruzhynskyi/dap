DROP TABLE IF EXISTS equipment_history;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS equipment;

CREATE TABLE equipment (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "inventoryNumber" VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    "dateAdded" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "createdBy" VARCHAR(255),
    "lastModifiedBy" VARCHAR(255)
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(255)
);

CREATE TABLE equipment_history (
    id UUID PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    equipment_id UUID,
    equipment_name VARCHAR(255),
    equipment_inventory_number VARCHAR(255),
    details TEXT,
    changed_by VARCHAR(255),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);


INSERT INTO users (id, username, password, role, department)
VALUES ('5a8f4c80-9b3e-4f7d-8a2b-1c9d0e6f3a8c', 'admin', 'admin', 'admin', 'Адміністрація');

INSERT INTO users (id, username, password, role, department)
VALUES ('c2b1e0d3-5a7f-4b9c-8d6e-3f5a2b1c0d9e', 'useradmin', '123456', 'user', 'ІТ Відділ');
