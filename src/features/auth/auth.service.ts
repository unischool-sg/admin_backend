import { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users, invites } from "../../lib/schema";
import { passwordCompare, passwordHash } from "../../lib/utils/crypto";
import { sha256Hex } from "../../lib/utils/hash";

class AuthService {
    constructor() {}

    async verifyUser(db: DrizzleD1Database, email: string, password: string): Promise<null | typeof users.$inferSelect> {
        const usersResult = await db.select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            .execute();

        if (usersResult.length === 0) return null;
        const user = usersResult[0];
        
        const isValid = await passwordCompare(password, user.passwordHash);
        return isValid ? user : null;
    }

    async verifyInvite(db: DrizzleD1Database, token: string): Promise<null | typeof invites.$inferSelect> {
        const tokenHash = await sha256Hex(token); // トークンをハッシュ化して検索
        const invite = await db.select()
            .from(invites)
            .where(eq(invites.id, tokenHash))
            .limit(1)
            .execute();

        return invite.length > 0 ? invite[0] : null;
    }

    async registerUser(db: DrizzleD1Database, email: string, password: string) {
        const hashedPassword = await passwordHash(password);
        const now = new Date();
        return await db.insert(users).values({
            id: crypto.randomUUID(),
            email,
            passwordHash: hashedPassword,
            createdAt: now,
            updatedAt: now,
        }).execute();
    }

    async getUserInfo(db: DrizzleD1Database, userId: string): Promise<null | typeof users.$inferSelect> {
        const usersResult = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)
            .execute();

        return usersResult.length > 0 ? usersResult[0] : null;
    }

    async updateUserInfo(db: DrizzleD1Database, userId: string, data: Partial<typeof users.$inferInsert>) {
        const now = new Date();
        return await db.update(users).set({
            ...data,
            updatedAt: now,
        }).where(eq(users.id, userId)).execute();
    }
}

export { AuthService };