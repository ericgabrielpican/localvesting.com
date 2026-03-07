export class AuthError extends Error {
    code?: string;
    where?: string;
    original?: unknown;

    constructor(where: string, e: any) {
        const code = e?.code || e?.message || String(e);

        super(`[AUTH] ${where}: ${code}`);

        this.name = "AuthError";
        this.code = e?.code;
        this.where = where;
        this.original = e;

        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

export function isAuthErr(e: unknown): boolean {
    return (
        e instanceof AuthError ||
        (e instanceof Error && e.name === "AuthError") ||
        (typeof e === "object" && e !== null && (e as any).isAuthError === true)
    );
}