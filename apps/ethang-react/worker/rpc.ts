import isNil from "lodash/isNil.js";

type RpcBinding = {
  addSubscription: (parameters: Record<string, unknown>) => Promise<unknown>;
  allArticles: (parameters: Record<string, unknown>) => Promise<unknown>;
  course: (parameters: Record<string, unknown>) => Promise<unknown>;
  courses: (parameters: Record<string, unknown>) => Promise<unknown>;
  courseTracking: (parameters: Record<string, unknown>) => Promise<unknown>;
  courseTrackings: (parameters: Record<string, unknown>) => Promise<unknown>;
  createCurriculum: (parameters: Record<string, unknown>) => Promise<unknown>;
  curriculum: (parameters: Record<string, unknown>) => Promise<unknown>;
  curriculums: (parameters: Record<string, unknown>) => Promise<unknown>;
  cycleCourseTrackingStatus: (
    parameters: Record<string, unknown>
  ) => Promise<unknown>;
  feedArticles: (parameters: Record<string, unknown>) => Promise<unknown>;
  learningPath: (parameters: Record<string, unknown>) => Promise<unknown>;
  learningPaths: (parameters: Record<string, unknown>) => Promise<unknown>;
  markArticleRead: (parameters: Record<string, unknown>) => Promise<unknown>;
  subscription: (parameters: Record<string, unknown>) => Promise<unknown>;
  subscriptions: (parameters: Record<string, unknown>) => Promise<unknown>;
};

type RpcDispatchHandler = (
  binding: RpcBinding,
  parameters: Record<string, unknown>
) => Promise<unknown>;

const buildDispatchMap = (
  methods: (keyof RpcBinding)[]
): Record<string, RpcDispatchHandler> => {
  const map: Record<string, RpcDispatchHandler> = {};
  for (const method of methods) {
    map[method] = async (binding, parameters) => {
      return binding[method](parameters);
    };
  }
  return map;
};

const coursesDispatchMap = buildDispatchMap([
  "course",
  "courses",
  "courseTracking",
  "courseTrackings",
  "createCurriculum",
  "curriculum",
  "curriculums",
  "cycleCourseTrackingStatus",
  "learningPath",
  "learningPaths"
]);

const rssDispatchMap = buildDispatchMap([
  "addSubscription",
  "allArticles",
  "feedArticles",
  "markArticleRead",
  "subscription",
  "subscriptions"
]);

const rpcServiceDispatch = async (
  environment: Env,
  service: string,
  method: string,
  parameters: Record<string, unknown>
): Promise<unknown> => {
  let dispatchMap: null | Record<string, RpcDispatchHandler>;

  if ("ethang_courses" === service) {
    dispatchMap = coursesDispatchMap;
  } else if ("ethang_rss" === service) {
    dispatchMap = rssDispatchMap;
  } else {
    dispatchMap = null;
  }

  if (null === dispatchMap) {
    throw new Error("Invalid service");
  }

  const handler = dispatchMap[method];

  if (isNil(handler)) {
    throw new Error("Invalid method");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const binding = environment as unknown as Record<string, RpcBinding>;
  const serviceBinding = binding[service];

  if (isNil(serviceBinding)) {
    throw new Error("Invalid service");
  }

  return handler(serviceBinding, parameters);
};

export { rpcServiceDispatch };
