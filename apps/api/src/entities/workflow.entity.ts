import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "workflows" })
@Index(["tenantId", "workflowId", "version"], { unique: true })
@Index(["tenantId"])
export class Workflow {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "workflow_id", type: "varchar", length: 100 })
    workflowId!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 50 })
    type!: string;

    @Column({ type: "jsonb" })
    config!: Record<string, unknown>;

    @Column({ type: "int", default: 1 })
    version!: number;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}

