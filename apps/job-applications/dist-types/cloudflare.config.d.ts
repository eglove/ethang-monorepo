declare const _default: {
    readonly worker: {
        readonly compatibilityDate: "2026-09-21";
        readonly compatibilityFlags: ["nodejs_compat"];
        readonly entrypoint: "src/index.ts";
        readonly env: {
            readonly jobApplications: import("cf/config").D1Binding;
            readonly jobResumes: import("cf/config").R2Binding;
        };
        readonly name: "job-applications";
        readonly observability: {
            readonly enabled: true;
            readonly headSamplingRate: 1;
        };
        readonly placement: {
            readonly mode: "smart";
        };
        readonly workersDev: false;
    };
};
export default _default;
