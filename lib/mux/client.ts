import Mux from "@mux/mux-node";

let _client: Mux | null = null;

export function getMuxClient(): Mux {
  if (!_client) {
    _client = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
  }
  return _client;
}
