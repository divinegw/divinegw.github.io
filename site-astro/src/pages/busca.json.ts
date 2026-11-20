// /busca.json: índice da busca (ver src/lib/busca.ts). Gerado na build, sem dependência.
import { indiceBusca } from '../lib/busca';

export async function GET() {
  return new Response(JSON.stringify(await indiceBusca()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
