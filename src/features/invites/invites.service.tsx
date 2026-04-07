import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Resend } from "resend";
import { invites } from "../../lib/schema";
import { randomString } from "../../lib/utils/key";
import { Invite } from "../../components/invite";
import { sha256Hex } from "../../lib/utils/hash";


class InvitesService {
    constructor() {}

    async createToken(db: DrizzleD1Database, teamId: string, email: string, role: string, expiredAt: number): Promise<string> {
        const token = randomString(32);                 // 32文字のランダムなトークンを生成
        const tokenHash = await sha256Hex(token); // トークンをハッシュ化して保存
        const result = await db.insert(invites).values({
            id: tokenHash, // 招待IDもランダムに生成
            teamId,
            email,
            role: role ?? "student", // デフォルトの役割は "student"

            expiredAt: new Date(Date.now() + expiredAt), // トークンの有効期限を7日後に設定
            createdAt: new Date(),
            updatedAt: new Date()
        }).execute();

        if (result.rowCount === 0) {
            throw new Error('Failed to create invite token');
        }
        
        return token; // ハッシュ化されていないトークンを返す
    }

    async sendInviteEmail(resend: Resend, baseUrl: string, email: string, token: string) {
        // ここでメール送信のロジックを実装（例: SendGridやAmazon SESなどのメールサービスを使用）
        // メールの内容には、ユーザーが登録ページにアクセスできるようにするための招待URLを含めることができます。
        const inviteUrl = `${baseUrl}/register?token=${token}`;
        console.log(`Send invite email to ${email} with invite URL: ${inviteUrl}`);

        const result = await resend.emails.send({
            from: 'no-reply@unischool.jp',
            to: email,
            subject: "【UniSchool】UniSchoolチームへの招待",
            react: <Invite inviteUrl={inviteUrl} />
        });
        console.log(result);

        return result;
    }
}

export { InvitesService };