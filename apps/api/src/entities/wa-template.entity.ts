import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "wa_templates" })
@Index(["tenantId"])
export class WATemplate {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "varchar", length: 10, default: "en_US" })
    language!: string;

    @Column({ type: "varchar", length: 50 })
    category!: string;

    @Column({ type: "jsonb", default: () => "'[]'" })
    components!: Record<string, unknown>[];

    @Column({ name: "meta_status", type: "varchar", length: 30, default: "draft" })
    metaStatus!: string;

    @Column({ name: "meta_id", type: "varchar", length: 100, nullable: true })
    metaId?: string | null;

    @Column({ name: "reject_reason", type: "text", nullable: true })
    rejectReason?: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
