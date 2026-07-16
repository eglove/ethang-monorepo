import { DateTime } from 'effect'; export const s = DateTime.toDate(DateTime.unsafeMake(0)).toUTCString();
