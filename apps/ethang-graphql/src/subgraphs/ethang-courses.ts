import isNil from "lodash/isNil.js";

export const ethangCoursesFetcher = async (
  environment: Env,
  request: Request
) => {
  const serviceBinding = environment.ethang_courses;

  if (!isNil(serviceBinding)) {
    return serviceBinding.fetch(request);
  }

  return fetch(request);
};
