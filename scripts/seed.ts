import "reflect-metadata";
import { AppDataSource } from "../apps/api/src/db/data-source";
import { Tenant, Workflow } from "../apps/api/src/entities";
import contactVerification from "../configs/workflows/contact_verification.json";
import defaultTenant from "../configs/tenants/default.tenant.json";

async function seed(): Promise<void> {
    await AppDataSource.initialize();

    const tenantRepository = AppDataSource.getRepository(Tenant);
    const workflowRepository = AppDataSource.getRepository(Workflow);

    let tenant = await tenantRepository.findOne({
        where: { slug: defaultTenant.slug },
    });

    if (!tenant) {
        tenant = tenantRepository.create({
            name: defaultTenant.name,
            slug: defaultTenant.slug,
            config: defaultTenant.config,
            isActive: true,
        });
        tenant = await tenantRepository.save(tenant);
    }

    const existingWorkflow = await workflowRepository.findOne({
        where: {
            tenantId: tenant.id,
            workflowId: contactVerification.workflow_id,
            version: 1,
        },
    });

    if (!existingWorkflow) {
        const workflow = workflowRepository.create({
            tenantId: tenant.id,
            workflowId: contactVerification.workflow_id,
            name: contactVerification.name,
            type: contactVerification.type,
            config: contactVerification as unknown as Record<string, unknown>,
            version: 1,
            isActive: true,
        });
        await workflowRepository.save(workflow);
    }

    await AppDataSource.destroy();
}

seed().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed", error);
    process.exit(1);
});
