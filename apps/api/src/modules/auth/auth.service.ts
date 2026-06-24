import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AdminUser } from "../../entities/admin-user.entity";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(AdminUser)
        private readonly adminUserRepo: Repository<AdminUser>,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string): Promise<AdminUser> {
        const user = await this.adminUserRepo.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedException("invalid_credentials");
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedException("invalid_credentials");
        }
        return user;
    }

    async login(user: AdminUser): Promise<{ access_token: string }> {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async validateUserById(id: string): Promise<AdminUser | null> {
        return this.adminUserRepo.findOne({ where: { id } });
    }
}
