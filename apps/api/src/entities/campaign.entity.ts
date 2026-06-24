import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "campaigns" })
@Index(["tenantId"])
export class Campaign {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ name: "workflow_id", type: "varchar", length: 100 })
    workflowId!: string;

    @Column({ type: "varchar", length: 50, default: "draft" })
    status!: string;

    @Column({ name: "contact_list", type: "jsonb" })
    contactList!: string[];

    @Column({ name: "total_count", type: "int", default: 0 })
    totalCount!: number;

    @Column({ name: "sent_count", type: "int", default: 0 })
    sentCount!: number;

    @Column({ name: "failed_count", type: "int", default: 0 })
    failedCount!: number;

    @Column({ name: "started_at", type: "timestamptz", nullable: true })
    startedAt?: Date | null;

    @Column({ name: "completed_at", type: "timestamptz", nullable: true })
    completedAt?: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
