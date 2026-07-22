import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker, Job } from "bullmq";
import type { WorkflowConfig } from "@convorchestrate/schemas";
import type { EngineContext } from "@convorchestrate/core";

export interface WorkflowExecutionJob {
    config: WorkflowConfig;
    ctx: EngineContext;
}

export interface DelayedMessageJob {
    tenantId: string;
    contactId: string;
    template: string;
    delayMs: number;
}

export interface WebhookTriggerJob {
    url: string;
    method: "GET" | "POST" | "PUT";
    payload: Record<string, unknown>;
    traceId: string;
}

export interface CampaignLaunchJob {
    campaignId: string;
    tenantId: string;
}

export type QueueJobType = WorkflowExecutionJob | DelayedMessageJob | WebhookTriggerJob | CampaignLaunchJob;

export type JobHandler<T extends QueueJobType> = (job: T) => Promise<void>;

@Injectable()
export class QueueService implements OnModuleDestroy {
    private readonly logger = new Logger(QueueService.name);
    private readonly connection: { host: string; port: number };

    readonly workflowQueue: Queue<WorkflowExecutionJob>;
    readonly delayedQueue: Queue<DelayedMessageJob>;
    readonly webhookQueue: Queue<WebhookTriggerJob>;
    readonly campaignQueue: Queue<CampaignLaunchJob>;

    private workflowWorker: Worker<WorkflowExecutionJob> | null = null;
    private delayedWorker: Worker<DelayedMessageJob> | null = null;
    private webhookWorker: Worker<WebhookTriggerJob> | null = null;
    private campaignWorker: Worker<CampaignLaunchJob> | null = null;

    private workflowHandler: JobHandler<WorkflowExecutionJob> | null = null;
    private delayedHandler: JobHandler<DelayedMessageJob> | null = null;
    private webhookHandler: JobHandler<WebhookTriggerJob> | null = null;
    private campaignHandler: JobHandler<CampaignLaunchJob> | null = null;

    constructor(
        private readonly configService: ConfigService,
    ) {
        const redisUrl = this.configService.getOrThrow<string>("REDIS_URL");
        const parsed = new URL(redisUrl);
        this.connection = {
            host: parsed.hostname,
            port: Number(parsed.port) || 6379,
        };

        this.workflowQueue = new Queue<WorkflowExecutionJob>("workflow-execution", {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
                removeOnComplete: 100,
                removeOnFail: 50,
            },
        });

        this.delayedQueue = new Queue<DelayedMessageJob>("delayed-message", {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "fixed", delay: 5000 },
                removeOnComplete: 100,
            },
        });

        this.webhookQueue = new Queue<WebhookTriggerJob>("webhook-trigger", {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 },
                removeOnComplete: 100,
                removeOnFail: 50,
            },
        });

        this.campaignQueue = new Queue<CampaignLaunchJob>("campaign-launch", {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "fixed", delay: 10000 },
                removeOnComplete: 100,
            },
        });
    }

    onWorkflow(job: Job<WorkflowExecutionJob>): Promise<void> {
        return this.processJob(job, this.workflowHandler, "workflow");
    }

    onDelayed(job: Job<DelayedMessageJob>): Promise<void> {
        return this.processJob(job, this.delayedHandler, "delayed");
    }

    onWebhook(job: Job<WebhookTriggerJob>): Promise<void> {
        return this.processJob(job, this.webhookHandler, "webhook");
    }

    onCampaign(job: Job<CampaignLaunchJob>): Promise<void> {
        return this.processJob(job, this.campaignHandler, "campaign");
    }

    private async processJob<T extends QueueJobType>(
        job: Job<T>,
        handler: JobHandler<T> | null,
        label: string,
    ): Promise<void> {
        if (!handler) {
            this.logger.warn(`no_handler_for_${label}_queue`, { jobId: job.id });
            return;
        }
        try {
            await handler(job.data);
        } catch (error) {
            this.logger.error(`${label}_job_failed`, {
                jobId: job.id,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    setWorkflowHandler(handler: JobHandler<WorkflowExecutionJob>): void {
        this.workflowHandler = handler;
        this.startWorkers();
    }

    setDelayedHandler(handler: JobHandler<DelayedMessageJob>): void {
        this.delayedHandler = handler;
        this.startWorkers();
    }

    setWebhookHandler(handler: JobHandler<WebhookTriggerJob>): void {
        this.webhookHandler = handler;
        this.startWorkers();
    }

    setCampaignHandler(handler: JobHandler<CampaignLaunchJob>): void {
        this.campaignHandler = handler;
        this.startWorkers();
    }

    private startWorkers(): void {
        if (!this.workflowWorker && this.workflowHandler) {
            this.workflowWorker = new Worker<WorkflowExecutionJob>(
                "workflow-execution",
                (job) => this.onWorkflow(job),
                { connection: this.connection },
            );
            this.workflowWorker.on("failed", (job, err) => {
                this.logger.error("workflow_worker_failed", {
                    jobId: job?.id,
                    error: err.message,
                });
            });
        }

        if (!this.delayedWorker && this.delayedHandler) {
            this.delayedWorker = new Worker<DelayedMessageJob>(
                "delayed-message",
                (job) => this.onDelayed(job),
                { connection: this.connection },
            );
            this.delayedWorker.on("failed", (job, err) => {
                this.logger.error("delayed_worker_failed", {
                    jobId: job?.id,
                    error: err.message,
                });
            });
        }

        if (!this.webhookWorker && this.webhookHandler) {
            this.webhookWorker = new Worker<WebhookTriggerJob>(
                "webhook-trigger",
                (job) => this.onWebhook(job),
                { connection: this.connection },
            );
            this.webhookWorker.on("failed", (job, err) => {
                this.logger.error("webhook_worker_failed", {
                    jobId: job?.id,
                    error: err.message,
                });
            });
        }

        if (!this.campaignWorker && this.campaignHandler) {
            this.campaignWorker = new Worker<CampaignLaunchJob>(
                "campaign-launch",
                (job) => this.onCampaign(job),
                { connection: this.connection },
            );
            this.campaignWorker.on("failed", (job, err) => {
                this.logger.error("campaign_worker_failed", {
                    jobId: job?.id,
                    error: err.message,
                });
            });
        }
    }

    async onModuleDestroy(): Promise<void> {
        await Promise.all([
            this.workflowWorker?.close(),
            this.delayedWorker?.close(),
            this.webhookWorker?.close(),
            this.campaignWorker?.close(),
            this.workflowQueue.close(),
            this.delayedQueue.close(),
            this.webhookQueue.close(),
            this.campaignQueue.close(),
        ]);
    }
}
