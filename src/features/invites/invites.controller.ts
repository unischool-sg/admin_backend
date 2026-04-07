import type { ContextWithEnv, ContextType } from "../..";
import type { InvitesService } from "./invites.service";
import { InviteTokenPayloadSchema } from "./invites.model";
import { ok, forbidden, internalServerError, created } from "../../lib/helpers/response";
import { timeUtils } from "../../lib/utils/time";

const TOKEN_EXPIRATION = timeUtils.toSeconds(7, 'day'); // 7日をミリ秒に変換

class InvitesController {
    constructor (private tokenService: InvitesService) {}

    async generateToken<T = ContextWithEnv>(c: ContextType<T>) {
        const body = await c.req.json();
        try {
            const { team_id, email, role } = InviteTokenPayloadSchema.parse(body); // 入力のバリデーション
            const result = await this.tokenService.createToken(c.get('db'), team_id, email, role ?? "student", TOKEN_EXPIRATION);
            this.tokenService.sendInviteEmail(
                c.get('resend'),
                c.env.FRONTEND_URL,
                email, 
                result
            );

            return created({ token: result }, 'Invite token generated successfully');
        } catch (error) {
            console.error('Token generation failed:', error);
            return internalServerError('Internal server error', error instanceof Error ? error.message : String(error));
        }
    }
}

export { InvitesController };