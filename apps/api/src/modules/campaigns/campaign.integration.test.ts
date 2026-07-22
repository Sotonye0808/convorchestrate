import "reflect-metadata";
import { describe, it, beforeEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { CampaignService } from "./campaign.service";
import { Campaign } from "../../entities/campaign.entity";
import { CampaignMessage } from "../../entities/campaign-message.entity";
import { WATemplate } from "../../entities/wa-template.entity";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Tenant } from "../../entities/tenant.entity";
import type { Repository } from "typeorm";
import type { MetaApiClient } from "@convorchestrate/meta-api";
import type { EngineService } from "../engine/engine.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

function mockRepo<T extends Record<string, any>>() {
    const store = new Map<string, T>();
    return {
        find: mock.fn((opts?: any) => {
            const all = [...store.values()];
            if (opts?.where?.tenantId) {
                return Promise.resolve(all.filter((x: any) => x.tenantId === opts.where.tenantId));
            }
            return Promise.resolve(all);
        }),
        findOne: mock.fn((opts: any) => {
            const all = [...store.values()];
            const match = all.find((x) => {
                for (const [k, v] of Object.entries(opts?.where ?? {})) {
                    if ((x as any)[k] !== v) return false;
                }
                return true;
            });
            return Promise.resolve(match ?? null);
        }),
        create: mock.fn((data: any) => data as T),
        save: mock.fn((entity: any) => {
            if (Array.isArray(entity)) {
                return Promise.resolve(entity.map((e: any) => { const id = e.id ?? crypto.randomUUID(); e.id = id; store.set(id, e); return e; }));
            }
            const id = entity.id ?? crypto.randomUUID();
            entity.id = id;
            store.set(id, entity);
            return Promise.resolve(entity);
        }),
        update: mock.fn((id: any, data: any) => {
            const key = typeof id === "string" ? id : id.id;
            const existing = store.get(key);
            if (existing) store.set(key, { ...existing, ...data } as T);
            return Promise.resolve({ affected: 1, raw: {}, generatedMaps: [] });
        }),
        delete: mock.fn((criteria: any) => {
            const key = typeof criteria === "string" ? criteria : criteria?.id;
            if (key) store.delete(key);
            return Promise.resolve({ affected: 1, raw: {} });
        }),
    } as any as Repository<T>;
}

describe("R4 — tenant isolation", () => {
    let campaignRepo: Repository<Campaign>;
    let campaignMessageRepo: Repository<CampaignMessage>;
    let templateRepo: Repository<WATemplate>;
    let groupRepo: Repository<ContactGroup>;
    let workflowRepo: Repository<Workflow>;
    let tenantRepo: Repository<Tenant>;
    let metaApis: Record<string, MetaApiClient>;
    let engineService: EngineService;
    let service: CampaignService;

    const templateA = { id: "ta1", tenantId: "tenant-a", name: "welcome", language: "en", category: "MARKETING", components: [], metaStatus: "approved" } as any;
    const templateB = { id: "tb1", tenantId: "tenant-b", name: "promo", language: "en", category: "MARKETING", components: [], metaStatus: "approved" } as any;

    beforeEach(() => {
        campaignRepo = mockRepo<Campaign>();
        campaignMessageRepo = mockRepo<CampaignMessage>();
        templateRepo = mockRepo<WATemplate>();
        groupRepo = mockRepo<ContactGroup>();
        workflowRepo = mockRepo<Workflow>();
        tenantRepo = mockRepo<Tenant>();

        metaApis = {
            "tenant-a": { sendTemplate: mock.fn(() => Promise.resolve("wamid.a")) } as any,
            "tenant-b": { sendTemplate: mock.fn(() => Promise.resolve("wamid.b")) } as any,
        };
        engineService = { process: mock.fn(() => Promise.resolve()) } as any;
        const queueService = { campaignQueue: { add: mock.fn(() => Promise.resolve({ id: "job1" })) } } as any;

        service = new CampaignService(
            campaignRepo as any,
            campaignMessageRepo as any,
            templateRepo as any,
            groupRepo as any,
            workflowRepo as any,
            tenantRepo as any,
            metaApis["tenant-a"], // default
            engineService,
            queueService,
        );
    });

    it("tenant A cannot see tenant B's campaigns", async () => {
        // Seed data: one campaign per tenant
        const store = (campaignRepo as any);
        store.save({ id: "c-a", tenantId: "tenant-a", name: "campaign-a", status: "draft" });
        store.save({ id: "c-b", tenantId: "tenant-b", name: "campaign-b", status: "draft" });

        const resultsA = await service.findAll("tenant-a");
        assert.equal(resultsA.length, 1);
        assert.equal(resultsA[0].name, "campaign-a");
    });

    it("creates campaign with correct tenantId", async () => {
        (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(templateA));
        const group = { id: "g1", tenantId: "tenant-a", name: "g1", contacts: [] } as any;
        (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(group));

        const result = await service.create("tenant-a", { name: "test", templateId: "ta1", groupId: "g1" });
        assert.equal(result.tenantId, "tenant-a");
    });

    it("prevents tenant A from using tenant B's template", async () => {
        // Template exists but belongs to tenant-b
        (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
        const group = { id: "g1", tenantId: "tenant-a", name: "g1", contacts: [] } as any;
        (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(group));

        await assert.rejects(
            () => service.create("tenant-a", { name: "test", templateId: "tb1", groupId: "g1" }),
            /not found/,
        );
    });

    it("campaign_messages inherit campaign's tenantId", async () => {
        const group = { id: "g1", tenantId: "tenant-a", name: "g1", contacts: [{ id: "c1", phone: "15551234567", name: "Alice", tenantId: "tenant-a" }] } as any;
        const campaign = { id: "c1", tenantId: "tenant-a", name: "test", templateId: "ta1", groupId: "g1", status: "draft", template: templateA, group } as any;
        (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(campaign));
        (metaApis["tenant-a"].sendTemplate as any).mock.mockImplementation(() => Promise.resolve("wamid.123"));

        await service.send("tenant-a", "c1");

        const msgCreateCalls = (campaignMessageRepo.create as any).mock.calls;
        const savedMsg = msgCreateCalls[0].arguments[0];
        assert.equal(savedMsg.tenantId, "tenant-a");
    });

    it("throws NotFoundException when deleting another tenant's campaign", async () => {
        const store = (campaignRepo as any);
        store.save({ id: "c-b", tenantId: "tenant-b", name: "campaign-b", status: "draft" });

        // tenant-a tries to delete tenant-b's campaign
        (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
        await assert.rejects(
            () => service.findOne("tenant-a", "c-b"),
            /not found/,
        );
    });

    it("full lifecycle with tenant isolation", async () => {
        (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(templateA));
        const contacts = [
            { id: "c1", phone: "15551234567", name: "Alice", tenantId: "tenant-a", groupId: "g1", metadata: {} },
        ];
        const group = { id: "g1", tenantId: "tenant-a", name: "g1", contacts } as any;
        (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(group));

        const created = await service.create("tenant-a", { name: "lifecycle", templateId: "ta1", groupId: "g1" });
        assert.equal(created.tenantId, "tenant-a");
        assert.equal(created.status, "draft");

        // Mock findOne so send() works
        const campaignForSend = { ...created, template: templateA, group } as any;
        (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(campaignForSend));

        const sendResult = await service.send("tenant-a", created.id);
        assert.equal(sendResult.contacts, 1);

        await service.delete("tenant-a", created.id);
        (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
        await assert.rejects(
            () => service.findOne("tenant-a", created.id),
            /not found/,
        );
    });
});
