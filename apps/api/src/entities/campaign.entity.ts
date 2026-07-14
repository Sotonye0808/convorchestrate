import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { WATemplate } from "./wa-template.entity";
import { ContactGroup } from "./contact-group.entity";
import { CampaignMessage } from "./campaign-message.entity";
import { Workflow } from "./workflow.entity";

@Entity({ name: "campaigns" })
@Index(["tenantId"])
export class Campaign {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "tenant_id", type: "uuid" })
    tenantId!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ name: "template_id", type: "uuid" })
    templateId!: string;

    @ManyToOne(() => WATemplate)
    @JoinColumn({ name: "template_id" })
    template?: WATemplate;

    @Column({ name: "group_id", type: "uuid" })
    groupId!: string;

    @ManyToOne(() => ContactGroup)
    @JoinColumn({ name: "group_id" })
    group?: ContactGroup;

    @Column({ name: "image_url", type: "text", nullable: true })
    imageUrl?: string | null;

    @Column({ name: "workflow_id", type: "uuid", nullable: true })
    workflowId?: string | null;

    @ManyToOne(() => Workflow)
    @JoinColumn({ name: "workflow_id" })
    workflow?: Workflow;

    @Column({ name: "scheduled_at", type: "timestamptz", nullable: true })
    scheduledAt?: Date | null;

    @Column({ type: "varchar", length: 50, default: "draft" })
    status!: string;

    @Column({ name: "sent_count", type: "int", default: 0 })
    sentCount!: number;

    @Column({ name: "fail_count", type: "int", default: 0 })
    failCount!: number;

    @Column({ name: "started_at", type: "timestamptz", nullable: true })
    startedAt?: Date | null;

    @Column({ name: "completed_at", type: "timestamptz", nullable: true })
    completedAt?: Date | null;

    @OneToMany(() => CampaignMessage, (m) => m.campaign)
    messages?: CampaignMessage[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
