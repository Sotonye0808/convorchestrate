export interface MetaConfig {
  apiVersion?: string
  phoneNumberId: string
  accessToken: string
  appSecret?: string
  appId?: string
  wabaId?: string
}

export interface MetaErrorResponse {
  error: {
    message: string
    code: number
    type: string
    error_data?: { details: string }
    fbtrace_id: string
  }
}

export interface SendMessageResponse {
  messaging_product: "whatsapp"
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS"
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT"
  text?: string
  buttons?: Array<{
    type: "URL" | "QUICK_REPLY" | "PHONE_NUMBER"
    text: string
    url?: string
    phone_number?: string
  }>
  example?: { header_text?: string[]; body_text?: string[][] }
}

export interface SendTemplatePayload {
  messaging_product: "whatsapp"
  to: string
  type: "template"
  template: {
    name: string
    language: { code: string }
    components?: Array<{
      type: "header" | "body" | "button"
      parameters?: Array<{
        type: "text" | "currency" | "date_time" | "image" | "video" | "document"
        text?: string
        image?: { link: string }
        video?: { link: string }
        document?: { link: string; filename?: string }
        currency?: { fallback_value: string; code: string; amount_1000: number }
        date_time?: { fallback_value: string }
      }>
      index?: number
      sub_type?: string
    }>
  }
}

export interface SendTextPayload {
  messaging_product: "whatsapp"
  recipient_type: "individual"
  to: string
  type: "text"
  text: { body: string; preview_url: boolean }
}

export interface SendImagePayload {
  messaging_product: "whatsapp"
  recipient_type: "individual"
  to: string
  type: "image"
  image: { link: string; caption?: string }
}

export interface UploadSessionResponse {
  id: string
}

export interface UploadBinaryResponse {
  h: string
}

export interface TemplateFromMeta {
  id: string
  name: string
  language: string
  status: string
  category: string
  components: TemplateComponent[]
  rejected_reason?: string
}

export interface ListTemplatesResponse {
  data: TemplateFromMeta[]
  paging?: { cursors: { before: string; after: string }; next?: string }
}

export interface SubmitTemplatePayload {
  name: string
  language: string
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION"
  parameter_format: "NAMED"
  components: TemplateComponent[]
}

export interface WebhookEntry {
  id: string
  changes: Array<{
    field: string
    value: {
      messaging_product: "whatsapp"
      metadata: {
        display_phone_number: string
        phone_number_id: string
      }
      contacts?: Array<{
        profile: { name: string }
        wa_id: string
      }>
      messages?: Array<{
        from: string
        id: string
        timestamp: string
        type: string
        text?: { body: string }
        image?: { id: string; mime_type: string; sha256: string }
        video?: { id: string; mime_type: string; sha256: string }
        document?: { id: string; mime_type: string; sha256: string; filename?: string }
        audio?: { id: string; mime_type: string; sha256: string }
        button?: { text: string; payload: string }
        context?: { from: string; id: string }  // For replies to sent messages
      }>
      statuses?: Array<{
        id: string          // wamid of the sent message
        recipient_id: string
        status: "sent" | "delivered" | "read" | "failed"
        timestamp: string
        type: "message" | "template" | "media"
        conversation?: {
          id: string
          expiration_timestamp: string
          origin: { type: string }
        }
        pricing?: {
          billable: boolean
          pricing_model: string
          category: string
        }
        errors?: Array<{
          code: number
          title: string
          message: string
          error_data?: { details: string }
        }>
      }>
    }
  }>
}

export interface WebhookPayload {
  object: "whatsapp_business_account"
  entry: WebhookEntry[]
}

export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed"
