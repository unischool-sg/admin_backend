/**
 * @file index.ts
 * @description Entry point for the backend application.
 * @author tanahiro2010(田中博悠)
 * @date 2026-03-01
 * 
 * Copyright (c) 2024 UniSchool, All Rights Reserved.
 * This software is licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 * 
 * @version 1.0.0
 * @since 1.0.0
 */

import { Hono, type Context } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { type DrizzleD1Database, drizzle } from 'drizzle-orm/d1';
import type { SessionPayload } from './features/auth/auth.model';
import { Resend } from 'resend';
import { apiRouter } from './routes/route';
import { middleware } from './features/middleware';

export type Env = {
  Variables: {
    name: string;
    db: DrizzleD1Database;               // Drizzle ORMを使用してD1データベースにアクセスするための型
    resend: Resend;
    isAuthed: SessionPayload | null;     // 認証状態を示すフラグ
  },
  Bindings: {
    D1_DATABASE: D1Database; // Cloudflare D1データベースのバインディング

    // 環境変数バインディング
    JWT_SECRET: string; // JWTのシークレットキー
    RESEND_API_KEY: string; // メール送信APIのエンドポイント
    FRONTEND_URL: string;
  }
}
export type ContextWithEnv = Context<Env>;
export type ContextType<T> = T extends ContextWithEnv ? T : never;

const app = new Hono<Env>();
app.use(async (c, next) => {
  const db = drizzle(c.env.D1_DATABASE);
  const resend = new Resend(c.env.RESEND_API_KEY);

  c.set('db', db);
  c.set('resend', resend);
  await next();
});
app.use('/', middleware);  // 認証ミドルウェアをAPIルートに適用
app.route('/', apiRouter); // APIルートをマウント

export default app;