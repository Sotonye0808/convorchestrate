import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "tenants" })
@Index(["slug"], { unique: true })
export class Tenant {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 100 })
    slug!: string;

    @Column({ name: "phone_number_id", type: "varchar", length: 100, nullable: true })
    phoneNumberId?: string | null;

    @Column({ name: "access_token", type: "text", nullable: true })
    accessToken?: string | null;

    @Column({ name: "app_secret", type: "varchar", length: 255, nullable: true })
    appSecret?: string | null;

    @Column({ name: "app_id", type: "varchar", length: 100, nullable: true })
    appId?: string | null;

    @Column({ name: "waba_id", type: "varchar", length: 100, nullable: true })
    wabaId?: string | null;

    @Column({ type: "jsonb", default: () => "'{}'" })
    config!: Record<string, unknown>;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}

