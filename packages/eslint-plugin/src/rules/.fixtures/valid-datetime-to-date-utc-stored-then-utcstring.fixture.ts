import { DateTime } from 'effect'; const d = DateTime.toDateUtc(DateTime.unsafeMake(0)); export const s = d.toUTCString();
