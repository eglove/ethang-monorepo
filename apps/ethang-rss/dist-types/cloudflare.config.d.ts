declare const _default: {
    readonly worker: {
        readonly cache: {
            readonly enabled: true;
        };
        readonly compatibilityDate: "2026-09-21";
        readonly compatibilityFlags: ["nodejs_compat"];
        readonly entrypoint: "src/index.ts";
        readonly env: {
            readonly ethang_rss: import("cf/config").D1Binding;
            readonly FETCH_FEEDS_WORKFLOW: import("cf/config").WorkflowBinding<string, "FetchFeedsWorkflow">;
        };
        readonly exports: {
            readonly FetchFeedsWorkflow: import("cf/config").WorkflowExport;
        };
        readonly name: "ethang-rss";
        readonly observability: {
            readonly enabled: true;
            readonly headSamplingRate: 1;
        };
        readonly placement: {
            readonly mode: "smart";
        };
        readonly triggers: [import("cf/config").ScheduledTrigger];
        readonly workersDev: false;
    };
};
export default _default;
