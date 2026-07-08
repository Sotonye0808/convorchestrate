import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Campaign } from "./campaign.entity";
import { Contact } from "./contact.entity";

@Entity({ name: "campaign_messages" })
@Index(["campaignId"])
@Index(["waMessageId"])
@Index(["tenantId"])
export class CampaignMessage {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ name: "campaign_id", type: "uuid" })
    campaignId!: string;

    @ManyToOne(() => Campaign, (c) => c.messages)
    @JoinColumn({ name: "campaign_id" })
    campaign?: Campaign;

    @Column({ name: "contact_id", type: "uuid" })
    contactId!: string;

    @ManyToOne(() => Contact)
    @JoinColumn({ name: "contact_id" })
    contact?: Contact;

    @Column({ type: "varchar", length: 30 })
    phone!: string;

    @Column({ type: "varchar", length: 50, default: "pending" })
    status!: string;

    @Column({ name: "wa_message_id", type: "varchar", length: 100, nullable: true })
    waMessageId?: string | null;

    @Column({ name: "fail_reason", type: "text", nullable: true })
    failReason?: string | null;

    @Column({ name: "sent_at", type: "timestamptz", nullable: true })
    sentAt?: Date | null;

    @Column({ name: "delivered_at", type: "timestamptz", nullable: true })
    deliveredAt?: Date | null;

    @Column({ name: "read_at", type: "timestamptz", nullable: true })
    readAt?: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
