import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema20260506000000 implements MigrationInterface {
    name = "InitSchema20260506000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        config JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workflow_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        config JSONB NOT NULL,
        version INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, workflow_id, version)
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        phone VARCHAR(30) NOT NULL,
        name VARCHAR(255),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, phone)
      );

      CREATE TABLE IF NOT EXISTS contact_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        tagged_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, contact_id, tag)
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL REFERENCES workflows(id),
        contact_id UUID NOT NULL REFERENCES contacts(id),
        state JSONB DEFAULT '{}'::jsonb,
        current_step VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        context JSONB DEFAULT '{}'::jsonb,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS mediation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL REFERENCES workflows(id),
        session_id UUID REFERENCES sessions(id),
        party_a_contact_id UUID NOT NULL REFERENCES contacts(id),
        party_b_contact_id UUID NOT NULL REFERENCES contacts(id),
        party_a_role VARCHAR(50) NOT NULL,
        party_b_role VARCHAR(50) NOT NULL,
        context JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        session_id UUID REFERENCES sessions(id),
        contact_id UUID REFERENCES contacts(id),
        event_type VARCHAR(100) NOT NULL,
        direction VARCHAR(10),
        payload JSONB DEFAULT '{}'::jsonb,
        trace_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id),
        session_id UUID REFERENCES sessions(id),
        type VARCHAR(50) NOT NULL,
        original_filename VARCHAR(500),
        storage_path VARCHAR(500) NOT NULL,
        ocr_text TEXT,
        ocr_confidence FLOAT,
        metadata JSONB DEFAULT '{}'::jsonb,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_contact ON sessions(contact_id);
      CREATE INDEX IF NOT EXISTS idx_event_logs_tenant ON event_logs(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_event_logs_trace ON event_logs(trace_id);
      CREATE INDEX IF NOT EXISTS idx_contact_tags_tenant_contact ON contact_tags(tenant_id, contact_id);
      CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      DROP TABLE IF EXISTS admin_users;
      DROP TABLE IF EXISTS media;
      DROP TABLE IF EXISTS event_logs;
      DROP TABLE IF EXISTS mediation_sessions;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS contact_tags;
      DROP TABLE IF EXISTS contacts;
      DROP TABLE IF EXISTS workflows;
      DROP TABLE IF EXISTS tenants;
    `);
    }
}
