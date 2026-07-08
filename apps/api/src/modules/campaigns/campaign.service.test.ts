import "reflect-metadata";
import { describe, it, beforeEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { CampaignService } from "./campaign.service";
import type { Repository } from "typeorm";
import type { MetaApiClient } from "@convorchestrate/meta-api";
import type { EngineService } from "../engine/engine.service";
import { Campaign } from "../../entities/campaign.entity";
import { CampaignMessage } from "../../entities/campaign-message.entity";
import { WATemplate } from "../../entities/wa-template.entity";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Workflow } from "../../entities/workflow.entity";

function mockRepo<T extends Record<string, any>>() {
    const store = new Map<string, T>();
    return {
        find: mock.fn((opts?: any) => {
            const all = [...store.values()];
            if (opts?.where?.id) return Promise.resolve(all.filter((x: any) => x.id === opts.where.id));
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
                const saved = entity.map((e: any) => {
                    const id = e.id ?? crypto.randomUUID();
                    e.id = id;
                    store.set(id, e);
                    return e;
                });
                return Promise.resolve(saved);
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
        delete: mock.fn(() => Promise.resolve({ affected: 1, raw: {} })),
    } as any as Repository<T>;
}

describe("CampaignService", () => {
    let campaignRepo: Repository<Campaign>;
    let campaignMessageRepo: Repository<CampaignMessage>;
    let templateRepo: Repository<WATemplate>;
    let groupRepo: Repository<ContactGroup>;
    let workflowRepo: Repository<Workflow>;
    let metaApiClient: MetaApiClient;
    let engineService: EngineService;
    let service: CampaignService;

    const templateData = { id: "t1", name: "welcome", language: "en", category: "MARKETING", components: [], metaStatus: "approved", metaId: "mt1" } as any;
    const groupData = { id: "g1", name: "test-group", contacts: [{ id: "c1", phone: "15551234567", name: "Alice", groupId: "g1", metadata: {} }, { id: "c2", phone: "15559876543", name: "Bob", groupId: "g1", metadata: {} }] } as any;
    const workflowData = { id: "w1", name: "test-workflow", type: "reactive", config: { workflow_id: "w1", name: "test-workflow", type: "reactive", handlers: [{ event: "campaign_start", actions: [{ type: "send_template_message", template: "welcome" }] }] }, version: 1, isActive: true } as any;

    beforeEach(() => {
        campaignRepo = mockRepo<Campaign>();
        campaignMessageRepo = mockRepo<CampaignMessage>();
        templateRepo = mockRepo<WATemplate>();
        groupRepo = mockRepo<ContactGroup>();
        workflowRepo = mockRepo<Workflow>();
        metaApiClient = {
            sendTemplate: mock.fn(() => Promise.resolve("wamid.test.123")),
            sendText: mock.fn(),
            sendImage: mock.fn(),
            uploadMedia: mock.fn(),
            submitTemplate: mock.fn(),
            listTemplates: mock.fn(),
        } as any;
        engineService = { process: mock.fn(() => Promise.resolve()) } as any;

        service = new CampaignService(
            campaignRepo as any,
            campaignMessageRepo as any,
            templateRepo as any,
            groupRepo as any,
            workflowRepo as any,
            metaApiClient,
            engineService,
        );
    });

    describe("create", () => {
        it("creates a draft campaign with template and group", async () => {
            (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(templateData));
            (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(groupData));

            const result = await service.create("t1", { name: "test", templateId: "t1", groupId: "g1" });

            assert.equal(result.name, "test");
            assert.equal(result.templateId, "t1");
            assert.equal(result.groupId, "g1");
            assert.equal(result.status, "draft");
        });

        it("throws if template not found", async () => {
            (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
            (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(groupData));
            await assert.rejects(() => service.create("t1", { name: "test", templateId: "t1", groupId: "g1" }), /not found/);
        });

        it("throws if group not found", async () => {
            (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(templateData));
            (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
            await assert.rejects(() => service.create("t1", { name: "test", templateId: "t1", groupId: "g1" }), /not found/);
        });

        it("creates a campaign with workflowId", async () => {
            (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(templateData));
            (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(groupData));
            (workflowRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(workflowData));

            const result = await service.create("t1", { name: "test", templateId: "t1", groupId: "g1", workflowId: "w1" });

            assert.equal(result.workflowId, "w1");
            assert.equal(result.status, "draft");
        });

        it("throws if workflow not found", async () => {
            (templateRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(templateData));
            (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(groupData));
            (workflowRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));

            await assert.rejects(() => service.create("t1", { name: "test", templateId: "t1", groupId: "g1", workflowId: "w1" }), /not found/);
        });
    });

    describe("findAll", () => {
        it("returns campaigns ordered by createdAt desc", async () => {
            (campaignRepo.find as any).mock.mockImplementation(() => Promise.resolve([{ id: "c1", name: "a" }, { id: "c2", name: "b" }] as Campaign[]));
            const result = await service.findAll("t1");
            assert.equal(result.length, 2);
        });
    });

    describe("findOne", () => {
        it("returns campaign with relations", async () => {
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve({ id: "c1", name: "test" } as Campaign));
            const result = await service.findOne("t1", "c1");
            assert.equal(result.id, "c1");
        });

        it("throws if campaign not found", async () => {
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
            await assert.rejects(() => service.findOne("t1", "missing"), /not found/);
        });
    });

    describe("send", () => {
        it("sends template to all group contacts and returns count", async () => {
            const campaign = { id: "c1", name: "test", templateId: "t1", groupId: "g1", status: "draft", template: templateData, group: groupData } as any;
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(campaign));

            const result = await service.send("t1", "c1");

            assert.equal(result.contacts, 2);
            assert.equal((metaApiClient.sendTemplate as any).mock.calls.length, 2);
        });

        it("completes immediately if group has no contacts", async () => {
            const emptyGroup = { id: "g1", name: "empty", contacts: [] } as any;
            const campaign = { id: "c1", name: "test", templateId: "t1", groupId: "g1", status: "draft", template: templateData, group: emptyGroup } as any;
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(campaign));

            const result = await service.send("t1", "c1");

            assert.equal(result.contacts, 0);
            assert.equal(result.message, "no contacts in group");
        });

        it("throws if campaign is already sending", async () => {
            const campaign = { id: "c1", name: "test", templateId: "t1", groupId: "g1", status: "sending" } as any;
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(campaign));

            await assert.rejects(() => service.send("t1", "c1"), /already sending/);
        });

        it("throws if campaign not found", async () => {
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
            await assert.rejects(() => service.send("t1", "missing"), /not found/);
        });

        it("marks campaign as failed when all sends throw", async () => {
            const campaign = { id: "c1", name: "test", templateId: "t1", groupId: "g1", status: "draft", template: templateData, group: groupData } as any;
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(campaign));
            (metaApiClient.sendTemplate as any).mock.mockImplementation(() => Promise.reject(new Error("API error")));

            const result = await service.send("t1", "c1");

            assert.equal(result.message, "campaign completed");
        });

        it("sends via workflow engine when campaign has workflowId", async () => {
            const workflowCampaign = {
                id: "c2", name: "wf-test", templateId: "t1", groupId: "g1", workflowId: "w1",
                status: "draft", template: templateData, group: groupData, workflow: workflowData,
            } as any;
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(workflowCampaign));
            (groupRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(groupData));

            const result = await service.send("t1", "c2");

            assert.equal(result.contacts, 2);
            assert.equal(result.message, "campaign completed");
            assert.equal((engineService.process as any).mock.calls.length, 2);
        });

        it("marks workflow messages as failed when engine throws", async () => {
            const workflowCampaign = {
                id: "c2", name: "wf-test", templateId: "t1", groupId: "g1", workflowId: "w1",
                status: "draft", template: templateData, group: groupData, workflow: workflowData,
            } as any;
            (campaignRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(workflowCampaign));
            (engineService.process as any).mock.mockImplementation(() => Promise.reject(new Error("engine error")));

            const result = await service.send("t1", "c2");

            assert.equal(result.message, "campaign completed");
        });
    });

    describe("getMessages", () => {
        it("returns messages for a campaign", async () => {
            (campaignMessageRepo.find as any).mock.mockImplementation(() => Promise.resolve([{ id: "m1" }, { id: "m2" }] as CampaignMessage[]));
            const result = await service.getMessages("t1", "c1");
            assert.equal(result.length, 2);
        });
    });

    describe("delete", () => {
        it("deletes messages then campaign", async () => {
            await service.delete("t1", "c1");
            assert.equal((campaignMessageRepo.delete as any).mock.calls.length, 1);
            assert.equal((campaignRepo.delete as any).mock.calls.length, 1);
        });
    });
});
