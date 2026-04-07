import type { ContextWithEnv, ContextType } from "../..";
import { type SessionPayload, LoginAPIPayload, RegisterAPIPayload } from "./auth.model";
import { AuthService } from "./auth.service";
import { createToken } from "../../lib/utils/jwt";
import { ok, forbidden, internalServerError } from "../../lib/helpers/response";
import { timeUtils } from "../../lib/utils/time";

const SESSION_EXPIRATION = timeUtils.toSeconds(1, "day"); // 1日 (秒単位)


class AuthController {
    constructor (private authService: AuthService) {}

    async login<T = ContextWithEnv>(c: ContextType<T>) {
        const body = await c.req.json();
        let email: string | undefined, password: string | undefined;

        try {
            const data = LoginAPIPayload.parse(body); // 入力のバリデーション
            email = data.email;
            password = data.password;
        } catch (error) {
            console.error('Login payload validation failed:', error);
            return forbidden('Invalid email or password');
        }
        
        const db = c.get('db');

        try {
            const isValid = await this.authService.verifyUser(db, String(email), String(password));
            if (isValid === null) return forbidden('Invalid email or password');

            const payload: SessionPayload = {
                sub: isValid.id,
                exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRATION,
                type: 'session'
            }
            const jwtToken = await createToken(payload, c.env.JWT_SECRET);

            return ok({
                token: jwtToken,
            }, 'Login successful');
        } catch (error) {
            console.error('Login failed:', error);
            return internalServerError('Internal server error');
        }
    }

    async register<T = ContextWithEnv>(c: ContextType<T>) {
        // ユーザー登録処理の実装
        const token = c.req.query('token');
        if (!token) return forbidden('Invite token is required');

        // 招待トークンの検証とユーザー登録の処理をここに実装
        try {
            const isValidInvite = await this.authService.verifyInvite(c.get('db'), String(token));
            if (!isValidInvite) return forbidden('Invalid invite token');
        } catch (error) {
            console.error('Invite token verification failed:', error);
            return internalServerError('Internal server error');
        }
        
        const body = await c.req.json();
        let email: string | undefined, password: string | undefined;
        try {
            const data = RegisterAPIPayload.parse(body); // 入力のバリデーション
            email = data.email;
            password = data.password;
        } catch (error) {
            console.error('Registration payload validation failed:', error);
            return forbidden('Invalid email or password');
        }

        // ここでユーザー登録のロジックを実装（例: データベースへの保存など）
        try {
            await this.authService.registerUser(c.get('db'), String(email), String(password));
            return ok(null, 'Registration successful');
        } catch (error) {
            console.error('Registration failed:', error);
            return internalServerError('Internal server error');
        }
    }

    async me<T = ContextWithEnv>(c: ContextType<T>) {
        // 認証されたユーザーの情報を返す処理の実装
        const user = c.get('isAuthed');
        if (!user) return forbidden('Unauthorized');

        const userId = user.sub; // JWTのsubクレームから紐づけられたユーザーIDを取得
        const db = c.get('db');
        const userInfo = await this.authService.getUserInfo(db, String(userId));
        if (!userInfo) return forbidden('User not found');
        const { passwordHash, ...userData } = userInfo;

        return ok(userData, 'User info retrieved successfully');
    }
}

export { AuthController };