import { MetaConfig } from "./types"
import { MetaApiConfigError } from "./errors"

export function loadMetaConfig(overrides?: Partial<MetaConfig>): MetaConfig {
  const phoneNumberId = overrides?.phoneNumberId ?? process.env.META_PHONE_NUMBER_ID ?? ""
  const accessToken = overrides?.accessToken ?? process.env.META_ACCESS_TOKEN ?? ""
  const appSecret = overrides?.appSecret ?? process.env.META_APP_SECRET ?? ""
  const appId = overrides?.appId ?? process.env.META_APP_ID ?? ""
  const wabaId = overrides?.wabaId ?? process.env.META_WABA_ID ?? ""

  if (!phoneNumberId && !overrides?.phoneNumberId) {
    throw new MetaApiConfigError("META_PHONE_NUMBER_ID is required")
  }
  if (!accessToken && !overrides?.accessToken) {
    throw new MetaApiConfigError("META_ACCESS_TOKEN is required")
  }

  return {
    apiVersion: overrides?.apiVersion ?? process.env.META_API_VERSION ?? "v22.0",
    phoneNumberId,
    accessToken,
    appSecret,
    appId,
    wabaId,
  }
}
