import { COURSE_TRACKING_STATUS } from "../constants/course-tracking-status.ts";

export const getNextStatus = (status: string) => {
  if (COURSE_TRACKING_STATUS.COMPLETE === status) {
    return COURSE_TRACKING_STATUS.REVISIT;
  }

  if (COURSE_TRACKING_STATUS.REVISIT === status) {
    return COURSE_TRACKING_STATUS.INCOMPLETE;
  }

  return COURSE_TRACKING_STATUS.COMPLETE;
};
