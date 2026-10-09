// Route des formulaires du site (voir docs/formulaires-brevo.md). Version provisoire : toujours indisponible.
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = () =>
  Response.json({ ok: false }, { status: 503, headers: { 'cache-control': 'no-store' } });
