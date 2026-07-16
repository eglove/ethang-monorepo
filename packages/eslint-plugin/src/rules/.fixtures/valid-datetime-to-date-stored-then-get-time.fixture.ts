import { DateTime } from 'effect'; const d = DateTime.toDate(DateTime.unsafeMake(0)); export const ms = d.getTime();
