import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UseGuards, BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { FastifyRequest } from "fastify";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("login")
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() body: { email: string; password: string },
    ) {
        if (!body.email || !body.password) {
            throw new BadRequestException("email and password are required");
        }
        const user = await this.authService.validateUser(body.email, body.password);
        return this.authService.login(user);
    }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    async me(@Req() req: FastifyRequest) {
        return (req as any).user;
    }
}
