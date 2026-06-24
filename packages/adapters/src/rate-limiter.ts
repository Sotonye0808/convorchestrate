export interface RateLimiterOptions {
    minGapMs: number;
    maxJitterMs: number;
}

export class RateLimiter {
    private readonly lastSend = new Map<string, number>();
    private readonly minGapMs: number;
    private readonly maxJitterMs: number;

    constructor(options: RateLimiterOptions) {
        this.minGapMs = options.minGapMs;
        this.maxJitterMs = options.maxJitterMs;
    }

    async waitForSlot(phoneNumber: string): Promise<void> {
        const last = this.lastSend.get(phoneNumber) ?? 0;
        const elapsed = Date.now() - last;
        const jitter = Math.floor(Math.random() * this.maxJitterMs);
        const requiredGap = this.minGapMs + jitter;

        if (elapsed < requiredGap) {
            await new Promise((resolve) => setTimeout(resolve, requiredGap - elapsed));
        }

        this.lastSend.set(phoneNumber, Date.now());
    }

    reset(phoneNumber: string): void {
        this.lastSend.delete(phoneNumber);
    }
}
