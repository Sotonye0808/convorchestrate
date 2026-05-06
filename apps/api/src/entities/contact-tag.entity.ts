import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "contact_tags" })
@Index(["tenantId", "contactId", "tag"], { unique: true })
@Index(["tenantId", "contactId"])
export class ContactTag {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "contact_id", type: "uuid" })
    contactId!: string;

    @Column({ type: "varchar", length: 100 })
    tag!: string;

    @Column({ type: "jsonb", default: () => "'{}'" })
    metadata!: Record<string, unknown>;

    @CreateDateColumn({ name: "tagged_at", type: "timestamptz" })
    taggedAt!: Date;
}

