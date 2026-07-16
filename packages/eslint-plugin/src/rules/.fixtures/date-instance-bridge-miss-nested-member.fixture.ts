declare const factory: { make: { date: () => Date } }; const d = factory.make.date(); export const s = d.toUTCString();
