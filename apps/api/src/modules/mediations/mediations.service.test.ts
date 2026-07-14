import "reflect-metadata";
import { describe, it, beforeEach, mock } from "node:test";
import { strict as assert } from "node:assert";
import { MediationsService } from "./mediations.service";
import type { Repository } from "typeorm";
import { MediationSession } from "../../entities/mediation-session.entity";

function mockRepo<T extends Record<string, any>>() {
    const store = new Map<string, T>();
    return {
        findAndCount: mock.fn((opts?: any) => {
            const all = [...store.values()];
            let filtered = all;
            if (opts?.where?.tenantId) {
                filtered = all.filter((x: any) => x.tenantId === opts.where.tenantId);
            }
            return Promise.resolve([filtered.slice(opts?.skip ?? 0, (opts?.skip ?? 0) + (opts?.take ?? 20)), filtered.length]);
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
        save: mock.fn((entity: any) => {
            const id = entity.id ?? crypto.randomUUID();
            entity.id = id;
            store.set(id, entity);
            return Promise.resolve(entity);
        }),
    } as any as Repository<T>;
}

describe("MediationsService", () => {
    let mediationRepo: Repository<MediationSession>;
    let service: MediationsService;

    const activeSession = { id: "m1", tenantId: "t1", sessionId: "s1", workflowId: "w1", partyAContactId: "c1", partyARole: "buyer", partyBRole: "seller", context: {}, status: "active" } as any;

    beforeEach(() => {
        mediationRepo = mockRepo<MediationSession>();
        service = new MediationsService(mediationRepo as any);
    });

    describe("findAll", () => {
        it("returns mediation sessions paginated", async () => {
            (mediationRepo.findAndCount as any).mock.mockImplementation(() => Promise.resolve([[activeSession], 1]));
            const result = await service.findAll("t1");
            assert.equal(result.total, 1);
            assert.equal(result.data.length, 1);
        });
    });

    describe("findOne", () => {
        it("returns a mediation session by id", async () => {
            (mediationRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(activeSession));
            const result = await service.findOne("t1", "m1");
            assert.equal(result.id, "m1");
        });

        it("throws if not found", async () => {
            (mediationRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(null));
            await assert.rejects(() => service.findOne("t1", "missing"), /not found/);
        });
    });

    describe("close", () => {
        it("closes an active mediation session", async () => {
            (mediationRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(activeSession));
            const result = await service.close("t1", "m1");
            assert.equal(result.status, "closed");
            assert.ok(result.context.closedAt);
        });

        it("throws if session is not active", async () => {
            const closed = { ...activeSession, status: "closed" };
            (mediationRepo.findOne as any).mock.mockImplementation(() => Promise.resolve(closed));
            await assert.rejects(() => service.close("t1", "m1"), /not active/);
        });
    });
});
