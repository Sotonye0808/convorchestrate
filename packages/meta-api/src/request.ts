export interface RequestResult {
  status: number
  body: string
  headers: Record<string, string>
}

export async function request(url: string, init?: {
  method?: string
  headers?: Record<string, string>
  body?: string
}): Promise<RequestResult> {
  const response = await fetch(url, init as RequestInit)
  const body = await response.text()
  const headers: Record<string, string> = {}
  response.headers.forEach((value: string, key: string) => {
    headers[key.toLowerCase()] = value
  })
  return { status: response.status, body, headers }
}

export async function requestBuffer(url: string, init?: {
  method?: string
  headers?: Record<string, string>
  body?: string | Buffer
}): Promise<{ status: number; data: Buffer; headers: Record<string, string> }> {
  const response = await fetch(url, {
    ...init,
    body: init?.body instanceof Buffer ? init.body : init?.body,
  } as RequestInit)
  const arrayBuffer = await response.arrayBuffer()
  const data = Buffer.from(arrayBuffer)
  const headers: Record<string, string> = {}
  response.headers.forEach((value: string, key: string) => {
    headers[key.toLowerCase()] = value
  })
  return { status: response.status, data, headers }
}
