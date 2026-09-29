declare const _default: {
    readonly worker: {
        readonly cache: {
            readonly enabled: true;
        };
        readonly compatibilityDate: "2026-09-21";
        readonly compatibilityFlags: ["nodejs_compat"];
        readonly entrypoint: "src/index.ts";
        readonly env: {
            readonly ethang_courses: import("cf/config").D1Binding;
        };
        readonly name: "ethang-courses";
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
