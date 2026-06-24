import { courseTracking as COURSE_TRACKING_STATUS } from "@ethang/intl/en/course-tracking.ts";

export const getNextStatus = (status: string) => {
  if (COURSE_TRACKING_STATUS.COMPLETE === status) {
    return COURSE_TRACKING_STATUS.REVISIT;
  }

  if (COURSE_TRACKING_STATUS.REVISIT === status) {
    return COURSE_TRACKING_STATUS.INCOMPLETE;
  }

  return COURSE_TRACKING_STATUS.COMPLETE;
};
