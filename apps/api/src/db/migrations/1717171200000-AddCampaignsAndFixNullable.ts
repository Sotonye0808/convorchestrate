import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCampaignsAndFixNullable1717171200000 implements MigrationInterface {
    name = "AddCampaignsAndFixNullable1717171200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                workflow_id VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'draft',
                contact_list JSONB NOT NULL DEFAULT '[]'::jsonb,
                total_count INTEGER NOT NULL DEFAULT 0,
                sent_count INTEGER NOT NULL DEFAULT 0,
                failed_count INTEGER NOT NULL DEFAULT 0,
                started_at TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns (tenant_id);
        `);

        await queryRunner.query(`
            ALTER TABLE mediation_sessions ALTER COLUMN party_b_contact_id DROP NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_campaigns_tenant;
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS campaigns;
        `);

        await queryRunner.query(`
            ALTER TABLE mediation_sessions ALTER COLUMN party_b_contact_id SET NOT NULL;
        `);
    }
}
