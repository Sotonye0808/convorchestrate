import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "contacts" })
@Index(["tenantId", "phone"], { unique: true })
@Index(["tenantId"])
export class Contact {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ type: "varchar", length: 30 })
    phone!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    name?: string | null;

    @Column({ type: "jsonb", default: () => "'{}'" })
    metadata!: Record<string, unknown>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}

