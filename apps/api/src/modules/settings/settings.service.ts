import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "../../entities/tenant.entity";

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
    ) { }

    async getTenantConfig(tenantId: string): Promise<Tenant> {
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException("tenant_not_found");
        }
        return tenant;
    }

    async updateTenantConfig(tenantId: string, config: Record<string, unknown>): Promise<Tenant> {
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new NotFoundException("tenant_not_found");
        }
        tenant.config = config;
        return this.tenantRepo.save(tenant);
    }
}
