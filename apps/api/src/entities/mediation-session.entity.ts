import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "mediation_sessions" })
@Index(["tenantId"])
export class MediationSession {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "workflow_id", type: "uuid" })
    workflowId!: string;

    @Column({ name: "session_id", type: "uuid", nullable: true })
    sessionId?: string | null;

    @Column({ name: "party_a_contact_id", type: "uuid" })
    partyAContactId!: string;

    @Column({ name: "party_b_contact_id", type: "uuid", nullable: true })
    partyBContactId?: string | null;

    @Column({ name: "party_a_role", type: "varchar", length: 50 })
    partyARole!: string;

    @Column({ name: "party_b_role", type: "varchar", length: 50 })
    partyBRole!: string;

    @Column({ type: "jsonb", default: () => "'{}'" })
    context!: Record<string, unknown>;

    @Column({ type: "varchar", length: 50, default: "active" })
    status!: string;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}

