import { DateTime } from 'effect'; export const ms = DateTime.toDateUtc(DateTime.unsafeMake(0)).getTime();
