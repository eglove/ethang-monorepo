import { WorkerEntrypoint } from "cloudflare:workers";

export class JobApplicationsService extends WorkerEntrypoint<Env> {
  public override fetch(_request: Request) {
    return new Response("OK", { status: 200 });
  }
}

export default JobApplicationsService;
