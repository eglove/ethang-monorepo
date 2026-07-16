import { DateTime } from 'effect'; export const s = DateTime.toDateUtc(DateTime.unsafeMake(0)).toUTCString();
