import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from "@nestjs/common";
import { DemoService } from "./demo.service";

@Controller("demo")
export class DemoController {
    constructor(private readonly demoService: DemoService) { }

    @Post("message")
    @HttpCode(HttpStatus.ACCEPTED)
    async injectMessage(
        @Body() body: {
            tenantId: string;
            phone: string;
            text: string;
            type?: "text" | "image" | "video" | "document" | "audio";
        },
    ) {
        if (!body.tenantId || !body.phone || !body.text) {
            throw new BadRequestException("tenantId, phone, and text are required");
        }
        const result = await this.demoService.injectMessage(body);
        return { accepted: true, ...result };
    }

    @Post("seed")
    @HttpCode(HttpStatus.CREATED)
    async seed() {
        const result = await this.demoService.seed();
        return {
            message: "Demo data seeded successfully",
            ...result,
        };
    }
}
