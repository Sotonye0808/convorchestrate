import {
    Controller,
    Post,
    Param,
    Req,
    Logger,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FastifyRequest } from "fastify";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import * as path from "path";
import { writeFile, mkdir } from "fs/promises";
import { Media } from "../../entities/media.entity";
import { Session } from "../../entities/session.entity";

@Controller("media")
export class MediaController {
    private readonly logger = new Logger(MediaController.name);

    constructor(
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
    ) { }

    @Post(":sessionId/upload")
    async uploadMedia(
        @Param("sessionId") sessionId: string,
        @Req() request: FastifyRequest,
    ): Promise<Record<string, unknown>> {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new BadRequestException("session_not_found");
        }

        const file = await request.file();
        if (!file) {
            throw new BadRequestException("file_required");
        }

        const uploadPath = process.env.MEDIA_UPLOAD_PATH ?? "./uploads";
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const dir = path.join(uploadPath, session.tenantId, dateStr);
        const ext = file.filename ? path.extname(file.filename) : ".dat";
        const filename = `${randomUUID()}${ext}`;
        const filePath = path.join(dir, filename);

        await mkdir(dir, { recursive: true });

        const buffer = await file.toBuffer();
        await writeFile(filePath, buffer);

        const media = this.mediaRepo.create({
            tenantId: session.tenantId,
            contactId: session.contactId,
            sessionId: session.id,
            type: "image",
            originalFilename: file.filename ?? filename,
            storagePath: filePath,
            metadata: {},
        });
        const saved = await this.mediaRepo.save(media);

        return {
            id: saved.id,
            storagePath: saved.storagePath,
            type: saved.type,
        };
    }
}
