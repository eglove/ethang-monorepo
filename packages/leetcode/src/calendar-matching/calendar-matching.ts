import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import split from "lodash/split.js";

type CalendarList<T,> = CalendarPeriod<T>[];
type CalendarPeriod<T,> = [T, T];

const timeToMinutes = (time: string) => {
  const [hours, minutes] = map(split(time, ":"), Number);

  if (isNil(hours) || isNil(minutes)) {
    return 0;
  }

  const hoursToMinutes = hours * 60;
  return hoursToMinutes + minutes;
};

const updateCalendar = (
  calendar: CalendarList<string>,
  dailyBounds: CalendarPeriod<string>,
): CalendarList<number> => {
  const updatedCalendar: CalendarList<string> = [
    ["0:00", get(dailyBounds, [0])],
    ...calendar,
    [get(dailyBounds, [1]), "23:59"],
  ];

  return map(updatedCalendar, (meeting) => {
    return map(meeting, timeToMinutes);
  });
};

const mergeCalendars = (
  calendar1: CalendarList<number>,
  calendar2: CalendarList<number>,
): CalendarList<number> => {
  const merged = [];

  let index = 0;
  let _index = 0;

  while (index < calendar1.length && _index < calendar2.length) {
    const meeting1 = get(calendar1, [index]);
    const meeting2 = get(calendar2, [_index]);

    if (get(meeting1, [0]) < get(meeting2, [0])) {
      merged.push(meeting1);
      index += 1;
    } else {
      merged.push(meeting2);
      _index += 1;
    }
  }

  while (index < calendar1.length) {
    merged.push(get(calendar1, [index]));
    index += 1;
  }

  while (_index < calendar2.length) {
    merged.push(get(calendar2, [_index]));
    _index += 1;
  }

  return merged;
};

const flattenCalendar = (
  calendar: CalendarList<number>,
): CalendarList<number> => {
  const flattened: CalendarList<number> = [[...get(calendar, [0])]];

  for (let index = 1; index < calendar.length; index += 1) {
    const currentMeeting = get(calendar, [index]);
    const lastMeeting = get(calendar, [flattened.length - 1]);

    const [currentStart, currentEnd] = currentMeeting;
    const [previousStart, previousEnd] = lastMeeting;

    if (previousEnd >= currentStart) {
      flattened[flattened.length - 1] = [
        previousStart,
        Math.max(previousEnd, currentEnd),
      ];
    } else {
      flattened.push([...currentMeeting]);
    }
  }

  return flattened;
};

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const minutesLeft = minutes % 60;
  const hoursString = hours.toString();
  const minutesString = 10 > minutesLeft
    ? `0${minutesLeft.toString()}`
    : minutesLeft.toString();

  return `${hoursString}:${minutesString}`;
};

const getMatchingAvailabilities = (
  calendar: CalendarList<number>,
  meetingDuration: number,
) => {
  const matchingAvailabilities: CalendarList<number> = [];

  for (let index = 1; index < calendar.length; index += 1) {
    const [,start] = get(calendar, [index - 1]);
    const [end] = get(calendar, [index]);
    const availabilityDuration = end - start;
    if (availabilityDuration >= meetingDuration) {
      matchingAvailabilities.push([start, end]);
    }
  }

  return map(matchingAvailabilities, (meeting) => {
    return map(meeting, minutesToTime);
  });
};

export const calendarMatching = (
  calendar1: CalendarList<string>,
  dailyBounds1: CalendarPeriod<string>,
  calendar2: CalendarList<string>,
  dailyBounds2: CalendarPeriod<string>,
  meetingDuration: number,
) => {
  const updatedCalendar1 = updateCalendar(calendar1, dailyBounds1);
  const updatedCalendar2 = updateCalendar(calendar2, dailyBounds2);
  const mergedCalendar = mergeCalendars(updatedCalendar1, updatedCalendar2);
  const flattenedCalendar = flattenCalendar(mergedCalendar);

  return getMatchingAvailabilities(flattenedCalendar, meetingDuration);
};
