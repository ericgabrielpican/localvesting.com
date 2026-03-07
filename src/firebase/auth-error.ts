export class AuthError extends Error {
    code?: string;
    where?: string;
    original?: unknown;
    message: string;

    constructor(where: string, e: any) {
        const code = e?.code  || String(e);
        alert(code)

        super(`[AUTH] ${where}: ${code}`);

        this.name = "AuthError";
        this.code = e?.code;
        this.where = where;
        this.message = e?.message;
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