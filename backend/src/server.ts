import type * as Party from "partykit/server";

export default class SignalingServer implements Party.Server {
  offer: string | undefined;

  constructor(readonly party: Party.Party) { }

  onRequest(req: Party.Request) {
    return new Response(this.offer, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type"
      }
    })
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message)
    if (data.type === "offer") {
      this.offer = JSON.stringify(data.data)
      return
    }

    this.party.broadcast(
      message,
      [sender.id]
    );
  }
}

SignalingServer satisfies Party.Worker;
