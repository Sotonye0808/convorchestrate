import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "../../entities/tenant.entity";

@Injectable()
export class TenantsService {
    private readonly logger = new Logger(TenantsService.name);

    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    async findAll(): Promise<Tenant[]> {
        return this.tenantRepo.find({ order: { createdAt: "DESC" } });
    }

    async findOne(id: string): Promise<Tenant> {
        const t = await this.tenantRepo.findOne({ where: { id } });
        if (!t) throw new NotFoundException("tenant not found");
        return t;
    }

    async findBySlug(slug: string): Promise<Tenant | null> {
        return this.tenantRepo.findOne({ where: { slug, isActive: true } });
    }

    async create(data: {
        name: string;
        slug: string;
        phoneNumberId?: string;
        accessToken?: string;
        appSecret?: string;
        appId?: string;
        wabaId?: string;
        config?: Record<string, unknown>;
    }): Promise<Tenant> {
        const t = this.tenantRepo.create({
            name: data.name,
            slug: data.slug,
            phoneNumberId: data.phoneNumberId ?? null,
            accessToken: data.accessToken ?? null,
            appSecret: data.appSecret ?? null,
            appId: data.appId ?? null,
            wabaId: data.wabaId ?? null,
            config: data.config ?? {},
        });
        return this.tenantRepo.save(t);
    }

    async update(id: string, data: Partial<{
        name: string;
        slug: string;
        phoneNumberId: string;
        accessToken: string;
        appSecret: string;
        appId: string;
        wabaId: string;
        config: Record<string, unknown>;
        isActive: boolean;
    }>): Promise<Tenant> {
        const t = await this.findOne(id);
        Object.assign(t, data);
        return this.tenantRepo.save(t);
    }

    async delete(id: string): Promise<void> {
        await this.tenantRepo.delete(id);
    }
}
