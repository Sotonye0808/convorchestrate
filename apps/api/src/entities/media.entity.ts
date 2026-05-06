import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "media" })
@Index(["tenantId"])
export class Media {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "contact_id", type: "uuid", nullable: true })
    contactId?: string | null;

    @Column({ name: "session_id", type: "uuid", nullable: true })
    sessionId?: string | null;

    @Column({ type: "varchar", length: 50 })
    type!: string;

    @Column({ name: "original_filename", type: "varchar", length: 500, nullable: true })
    originalFilename?: string | null;

    @Column({ name: "storage_path", type: "varchar", length: 500 })
    storagePath!: string;

    @Column({ name: "ocr_text", type: "text", nullable: true })
    ocrText?: string | null;

    @Column({ name: "ocr_confidence", type: "float", nullable: true })
    ocrConfidence?: number | null;

    @Column({ type: "jsonb", default: () => "'{}'" })
    metadata!: Record<string, unknown>;

    @CreateDateColumn({ name: "uploaded_at", type: "timestamptz" })
    uploadedAt!: Date;
}

