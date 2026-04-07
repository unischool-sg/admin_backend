import { Hono } from "hono";
import { Env } from "../";
import { AuthController } from "../features/auth/auth.controller";
import { AuthService } from "../features/auth/auth.service";
import { InvitesController } from "../features/invites/invites.controller";
import { InvitesService } from "../features/invites/invites.service";

const apiRouter = new Hono<Env>();

// 認証関連のルート
const authClient = new Hono<Env>();
const authController = new AuthController(new AuthService());
authClient.post('/login', (c) => authController.login<typeof c>(c));
authClient.post('/register', (c) => authController.register<typeof c>(c));
authClient.get('/me', (c) => authController.me<typeof c>(c));

// 招待関連のルート
const invitesClient = new Hono<Env>();
const invitesController = new InvitesController(new InvitesService());
invitesClient.post('/', (c) => invitesController.generateToken<typeof c>(c));

// APIルートにクライアントをマウント
apiRouter.route('/invites', invitesClient);
apiRouter.route('/auth', authClient);
apiRouter.get('/', (c) => c.json({ message: 'Hello world from API!' })); // テスト用のルート
apiRouter.get('/ping', (c) => c.json({ message: 'pong' })); // テスト用のルート

export { apiRouter };