export class MetaApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly metaCode: number,
    public readonly metaType: string,
    message: string,
    public readonly details: string,
    public readonly fbTraceId: string,
  ) {
    super(`Meta ${metaCode} (${metaType}): ${message}${details ? ` — ${details}` : ""} [trace:${fbTraceId}]`)
    this.name = "MetaApiError"
  }
}

export class MetaApiConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MetaApiConfigError"
  }
}

export class MetaApiHttpError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly body: string,
  ) {
    super(`Meta HTTP ${httpStatus}: ${body}`)
    this.name = "MetaApiHttpError"
  }
}
