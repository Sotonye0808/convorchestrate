import { describe, it, mock, afterEach, before, after } from "node:test"
import assert from "node:assert/strict"
import { MetaApiClient } from "./meta-api.client"
import { loadMetaConfig } from "./meta-api.config"
import { verifyWebhookSignature, verifyWebhookChallenge } from "./meta-api.utils"
import { MetaApiConfigError, MetaApiError, MetaApiHttpError } from "./errors"
import * as requestModule from "./request"

function mockFetch(status: number, body: string, headers?: Record<string, string>) {
  mock.method(requestModule, "request", async () => ({ status, body, headers: headers ?? {} }))
}

describe("meta-api config", () => {
  const OLD_ENV = { ...process.env }

  afterEach(() => {
    Object.assign(process.env, OLD_ENV)
  })

  it("loads from env vars", () => {
    process.env.META_PHONE_NUMBER_ID = "123"
    process.env.META_ACCESS_TOKEN = "tok"
    const cfg = loadMetaConfig()
    assert.equal(cfg.phoneNumberId, "123")
    assert.equal(cfg.accessToken, "tok")
    assert.equal(cfg.apiVersion, "v22.0")
  })

  it("overrides env vars with explicit config", () => {
    process.env.META_PHONE_NUMBER_ID = "env_id"
    process.env.META_ACCESS_TOKEN = "env_tok"
    const cfg = loadMetaConfig({ phoneNumberId: "override_id", accessToken: "override_tok" })
    assert.equal(cfg.phoneNumberId, "override_id")
    assert.equal(cfg.accessToken, "override_tok")
  })

  it("throws MetaApiConfigError when phoneNumberId is missing", () => {
    delete process.env.META_PHONE_NUMBER_ID
    delete process.env.META_ACCESS_TOKEN
    assert.throws(() => loadMetaConfig(), MetaApiConfigError)
  })
})

describe("MetaApiClient", () => {
  const OLD_ENV = { ...process.env }

  before(() => {
    process.env.META_PHONE_NUMBER_ID = "test_phone_id"
    process.env.META_ACCESS_TOKEN = "test_token"
    process.env.META_APP_SECRET = "test_secret"
    process.env.META_APP_ID = "test_app_id"
    process.env.META_WABA_ID = "test_waba_id"
  })

  after(() => {
    Object.assign(process.env, OLD_ENV)
  })

  afterEach(() => {
    mock.reset()
  })

  describe("sendText", () => {
    it("sends text message and returns wamid", async () => {
      mockFetch(200, JSON.stringify({
        messaging_product: "whatsapp",
        contacts: [{ input: "5511111111", wa_id: "5511111111" }],
        messages: [{ id: "wamid.test" }],
      }))

      const client = new MetaApiClient()
      const result = await client.sendText("5511111111", "Hello")

      assert.equal(result, "wamid.test")
    })

    it("throws MetaApiHttpError on non-2xx", async () => {
      mockFetch(400, '{"error":{"code":100,"type":"OAuthException","message":"Invalid token","fbtrace_id":"abc"}}')

      const client = new MetaApiClient()
      await assert.rejects(
        () => client.sendText("5511111111", "Hello"),
        { name: "MetaApiError" },
      )
    })
  })

  describe("sendTemplate", () => {
    it("sends template message and returns wamid", async () => {
      mockFetch(200, JSON.stringify({
        messaging_product: "whatsapp",
        contacts: [{ input: "5511111111", wa_id: "5511111111" }],
        messages: [{ id: "wamid.template" }],
      }))

      const client = new MetaApiClient()
      const result = await client.sendTemplate("5511111111", "welcome", "en_US")

      assert.equal(result, "wamid.template")
    })
  })

  describe("sendImage", () => {
    it("sends image message", async () => {
      mockFetch(200, JSON.stringify({
        messaging_product: "whatsapp",
        contacts: [{ input: "5511111111", wa_id: "5511111111" }],
        messages: [{ id: "wamid.image" }],
      }))

      const client = new MetaApiClient()
      const result = await client.sendImage("5511111111", "https://example.com/img.jpg", "A photo")

      assert.equal(result, "wamid.image")
    })
  })

  describe("submitTemplate", () => {
    it("submits template and returns template id", async () => {
      mockFetch(200, JSON.stringify({ id: "template_123" }))

      const client = new MetaApiClient()
      const result = await client.submitTemplate("waba_1", "hello", "en_US", "UTILITY", [
        { type: "BODY", text: "Hello {{1}}" },
      ])

      assert.equal(result, "template_123")
    })
  })

  describe("listTemplates", () => {
    it("returns template list", async () => {
      const templates = {
        data: [
          { id: "t1", name: "welcome", language: "en_US", status: "APPROVED", category: "MARKETING", components: [] },
        ],
      }
      mockFetch(200, JSON.stringify(templates))

      const client = new MetaApiClient()
      const result = await client.listTemplates("waba_1")

      assert.equal(result.length, 1)
      assert.equal(result[0].name, "welcome")
    })
  })

  describe("uploadMedia", () => {
    it("throws ConfigError when appId missing", async () => {
      delete process.env.META_APP_ID
      const client = new MetaApiClient()
      await assert.rejects(
        () => client.uploadMedia("https://example.com/img.jpg"),
        MetaApiConfigError,
      )
    })
  })
})

describe("webhook utilities", () => {
  describe("verifyWebhookChallenge", () => {
    it("returns challenge when mode and token match", () => {
      const result = verifyWebhookChallenge("subscribe", "my_token", "ch123", "my_token")
      assert.equal(result, "ch123")
    })

    it("returns null when mode is not subscribe", () => {
      const result = verifyWebhookChallenge("unsubscribe", "my_token", "ch123", "my_token")
      assert.equal(result, null)
    })

    it("returns null when token does not match", () => {
      const result = verifyWebhookChallenge("subscribe", "wrong_token", "ch123", "my_token")
      assert.equal(result, null)
    })
  })

  describe("verifyWebhookSignature", () => {
    it("validates correct HMAC-SHA256 signature", () => {
      const appSecret = "my_secret"
      const body = '{"test":"data"}'
      const { createHmac } = require("crypto")
      const expected = "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex")

      const result = verifyWebhookSignature(body, expected, appSecret)
      assert.equal(result, true)
    })

    it("rejects invalid signature", () => {
      const result = verifyWebhookSignature('{"test":"data"}', "sha256:invalid", "secret")
      assert.equal(result, false)
    })

    it("rejects missing signature header", () => {
      const result = verifyWebhookSignature('{"test":"data"}', undefined, "secret")
      assert.equal(result, false)
    })

    it("rejects missing app secret", () => {
      const result = verifyWebhookSignature('{"test":"data"}', "sha256=abc", "")
      assert.equal(result, false)
    })
  })
})

describe("MetaApi errors", () => {
  it("MetaApiError includes all fields", () => {
    const err = new MetaApiError(401, 190, "OAuthException", "Invalid token", "Details", "trace123")
    assert.equal(err.httpStatus, 401)
    assert.equal(err.metaCode, 190)
    assert.ok(err.message.includes("Invalid token"))
    assert.ok(err.message.includes("trace123"))
  })

  it("MetaApiHttpError includes status and body", () => {
    const err = new MetaApiHttpError(500, '{"error":"internal"}')
    assert.equal(err.httpStatus, 500)
    assert.ok(err.message.includes('{"error":"internal"}'))
  })
})
