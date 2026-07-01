import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { WebhookPayload } from "@convorchestrate/meta-api";
import { CampaignMessage } from "../../entities/campaign-message.entity";

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        @InjectRepository(CampaignMessage)
        private readonly campaignMessageRepo: Repository<CampaignMessage>,
    ) { }

    async processDeliveryStatuses(payload: WebhookPayload): Promise<void> {
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                const statuses = change.value.statuses ?? [];
                for (const status of statuses) {
                    const wamid = status.id;
                    const statusStr = status.status;
                    if (!wamid || !statusStr) continue;

                    const msg = await this.campaignMessageRepo.findOne({
                        where: { waMessageId: wamid },
                    });
                    if (!msg) continue;

                    const now = new Date();
                    const updates: Partial<CampaignMessage> = { status: statusStr };

                    switch (statusStr) {
                        case "sent":
                            updates.sentAt = now;
                            break;
                        case "delivered":
                            updates.deliveredAt = now;
                            break;
                        case "read":
                            updates.readAt = now;
                            break;
                        case "failed":
                            if (status.errors?.length) {
                                updates.failReason = status.errors[0].title ?? status.errors[0].message;
                            }
                            break;
                    }

                    try {
                        await this.campaignMessageRepo.update(msg.id, updates);
                    } catch (error) {
                        this.logger.error("failed_to_update_campaign_message", {
                            wamid,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
            }
        }
    }
}
