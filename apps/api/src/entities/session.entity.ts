import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "sessions" })
@Index(["tenantId"])
@Index(["contactId"])
export class Session {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "workflow_id", type: "uuid" })
    workflowId!: string;

    @Column({ name: "contact_id", type: "uuid" })
    contactId!: string;

    @Column({ type: "jsonb", default: () => "'{}'" })
    state!: Record<string, unknown>;

    @Column({ name: "current_step", type: "varchar", length: 100, nullable: true })
    currentStep?: string | null;

    @Column({ type: "varchar", length: 50, default: "active" })
    status!: string;

    @Column({ type: "jsonb", default: () => "'{}'" })
    context!: Record<string, unknown>;

    @CreateDateColumn({ name: "started_at", type: "timestamptz" })
    startedAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;

    @Column({ name: "completed_at", type: "timestamptz", nullable: true })
    completedAt?: Date | null;
}

