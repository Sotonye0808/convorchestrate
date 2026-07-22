import { request, requestBuffer } from "./request"
import {
  MetaConfig, SendTemplatePayload, SendTextPayload, SendImagePayload,
  SubmitTemplatePayload, SendMessageResponse, UploadSessionResponse,
  UploadBinaryResponse, ListTemplatesResponse, TemplateFromMeta,
  MetaErrorResponse,
} from "./types"
import { MetaApiError, MetaApiConfigError, MetaApiHttpError } from "./errors"
import { loadMetaConfig } from "./meta-api.config"
import { verifyWebhookChallenge, verifyWebhookSignature } from "./meta-api.utils"

function parseMetaError(body: string, status: number): never {
  if (status < 300) throw new MetaApiHttpError(status, body)

  try {
    const parsed: MetaErrorResponse = JSON.parse(body)
    if (parsed.error?.code) {
      throw new MetaApiError(
        status,
        parsed.error.code,
        parsed.error.type,
        parsed.error.message,
        parsed.error.error_data?.details ?? "",
        parsed.error.fbtrace_id,
      )
    }
  } catch (err) {
    if (err instanceof MetaApiError) throw err
    throw new MetaApiHttpError(status, body)
  }

  throw new MetaApiHttpError(status, body)
}

function extractMessageId(body: string): string {
  try {
    const parsed: SendMessageResponse = JSON.parse(body)
    if (parsed.messages?.[0]?.id) {
      return parsed.messages[0].id
    }
  } catch {
    // not a valid response
  }
  return ""
}

export class MetaApiClient {
  private readonly baseUrl: string
  private readonly defaultConfig: MetaConfig

  constructor(config?: Partial<MetaConfig>) {
    this.defaultConfig = loadMetaConfig(config)
    this.baseUrl = `https://graph.facebook.com/${this.defaultConfig.apiVersion}`
  }

  private resolveCreds(tenantCreds?: { phoneNumberId?: string; accessToken?: string }) {
    return {
      phoneNumberId: tenantCreds?.phoneNumberId ?? this.defaultConfig.phoneNumberId,
      accessToken: tenantCreds?.accessToken ?? this.defaultConfig.accessToken,
    }
  }

  private authHeaders(token?: string): Record<string, string> {
    return {
      "Authorization": `Bearer ${token ?? this.defaultConfig.accessToken}`,
      "Content-Type": "application/json",
    }
  }

  // ── Send Messages ──────────────────────────────────────────

  async sendTemplate(
    phone: string,
    templateName: string,
    language: string,
    components?: SendTemplatePayload["template"]["components"],
    tenantCreds?: { phoneNumberId?: string; accessToken?: string },
  ): Promise<string> {
    const { phoneNumberId, accessToken } = this.resolveCreds(tenantCreds)
    const payload: SendTemplatePayload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: { name: templateName, language: { code: language }, components },
    }
    const { status, body } = await request(
      `${this.baseUrl}/${phoneNumberId}/messages`,
      { method: "POST", headers: this.authHeaders(accessToken), body: JSON.stringify(payload) },
    )
    if (status >= 300) return parseMetaError(body, status)
    return extractMessageId(body)
  }

  async sendText(
    phone: string,
    text: string,
    previewUrl = false,
    tenantCreds?: { phoneNumberId?: string; accessToken?: string },
  ): Promise<string> {
    const { phoneNumberId, accessToken } = this.resolveCreds(tenantCreds)
    const payload: SendTextPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: { body: text, preview_url: previewUrl },
    }
    const { status, body } = await request(
      `${this.baseUrl}/${phoneNumberId}/messages`,
      { method: "POST", headers: this.authHeaders(accessToken), body: JSON.stringify(payload) },
    )
    if (status >= 300) return parseMetaError(body, status)
    return extractMessageId(body)
  }

  async sendImage(
    phone: string,
    imageUrl: string,
    caption?: string,
    tenantCreds?: { phoneNumberId?: string; accessToken?: string },
  ): Promise<string> {
    const { phoneNumberId, accessToken } = this.resolveCreds(tenantCreds)
    const payload: SendImagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "image",
      image: { link: imageUrl, ...(caption ? { caption } : {}) },
    }
    const { status, body } = await request(
      `${this.baseUrl}/${phoneNumberId}/messages`,
      { method: "POST", headers: this.authHeaders(accessToken), body: JSON.stringify(payload) },
    )
    if (status >= 300) return parseMetaError(body, status)
    return extractMessageId(body)
  }

  // ── Media Upload ───────────────────────────────────────────

  async uploadMedia(
    imageUrl: string,
    tenantCreds?: { accessToken?: string },
  ): Promise<string> {
    const accessToken = tenantCreds?.accessToken ?? this.defaultConfig.accessToken
    if (!this.defaultConfig.appId) {
      throw new MetaApiConfigError("META_APP_ID is required for media upload")
    }

    const imgResp = await requestBuffer(imageUrl)
    if (imgResp.status >= 300) {
      throw new MetaApiHttpError(imgResp.status, "Failed to download image from URL")
    }
    const imgData = imgResp.data
    const contentType = imgResp.headers["content-type"] ?? "image/jpeg"

    // Step 1: Create upload session
    const sessionPayload = JSON.stringify({ file_length: imgData.length, file_type: contentType })
    const { status: sessStatus, body: sessBody } = await request(
      `${this.baseUrl}/${this.defaultConfig.appId}/uploads`,
      { method: "POST", headers: this.authHeaders(accessToken), body: sessionPayload },
    )
    if (sessStatus >= 300) return parseMetaError(sessBody, sessStatus)
    const sessionResult: UploadSessionResponse = JSON.parse(sessBody)
    if (!sessionResult.id) {
      throw new MetaApiHttpError(sessStatus, `No upload session ID: ${sessBody}`)
    }

    // Step 2: Upload binary data to session
    const { status: upStatus, data: upData } = await requestBuffer(
      `${this.baseUrl}/${sessionResult.id}`,
      {
        method: "POST",
        headers: {
          "Authorization": `OAuth ${accessToken}`,
          "file_offset": "0",
          "Content-Type": contentType,
        },
        body: imgData,
      },
    )
    const upBody = upData.toString("utf-8")
    if (upStatus >= 300) return parseMetaError(upBody, upStatus)
    const uploadResult: UploadBinaryResponse = JSON.parse(upBody)
    if (!uploadResult.h) {
      throw new MetaApiHttpError(upStatus, `No handle in upload response: ${upBody}`)
    }
    return uploadResult.h
  }

  // ── Template Management ────────────────────────────────────

  async submitTemplate(
    wabaId: string,
    name: string,
    language: string,
    category: SubmitTemplatePayload["category"],
    components: SubmitTemplatePayload["components"],
    tenantCreds?: { accessToken?: string },
  ): Promise<string> {
    const accessToken = tenantCreds?.accessToken ?? this.defaultConfig.accessToken
    const payload: SubmitTemplatePayload = { name, language, category, parameter_format: "NAMED", components }
    const { status, body } = await request(
      `${this.baseUrl}/${wabaId}/message_templates`,
      { method: "POST", headers: this.authHeaders(accessToken), body: JSON.stringify(payload) },
    )
    if (status >= 300) return parseMetaError(body, status)
    const result: { id?: string } = JSON.parse(body)
    return result.id ?? ""
  }

  async listTemplates(
    wabaId: string,
    tenantCreds?: { accessToken?: string },
  ): Promise<TemplateFromMeta[]> {
    const accessToken = tenantCreds?.accessToken ?? this.defaultConfig.accessToken
    const url = `${this.baseUrl}/${wabaId}/message_templates?fields=id,name,language,status,category,components,rejected_reason&limit=100`
    const { status, body } = await request(url, { headers: this.authHeaders(accessToken) })
    if (status >= 300) return parseMetaError(body, status)
    const result: ListTemplatesResponse = JSON.parse(body)
    return result.data ?? []
  }

  // ── Webhook verification ───────────────────────────────────

  verifyWebhookChallenge(
    mode: string | undefined,
    verifyToken: string | undefined,
    challenge: string | undefined,
  ): string | null {
    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? this.defaultConfig.appSecret
    return verifyWebhookChallenge(mode, verifyToken, challenge, expectedToken ?? "")
  }

  validateWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    return verifyWebhookSignature(rawBody, signatureHeader, this.defaultConfig.appSecret ?? "")
  }
}
