import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "event_logs" })
@Index(["tenantId"])
@Index(["traceId"])
export class EventLog {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "session_id", type: "uuid", nullable: true })
    sessionId?: string | null;

    @Column({ name: "contact_id", type: "uuid", nullable: true })
    contactId?: string | null;

    @Column({ name: "event_type", type: "varchar", length: 100 })
    eventType!: string;

    @Column({ type: "varchar", length: 10, nullable: true })
    direction?: string | null;

    @Column({ type: "jsonb", default: () => "'{}'" })
    payload!: Record<string, unknown>;

    @Column({ name: "trace_id", type: "varchar", length: 100, nullable: true })
    traceId?: string | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}

