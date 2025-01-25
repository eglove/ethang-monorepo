declare namespace Intl {
    class ListFormat {
        public format: (items: string[]) => string;

        constructor(locales?: string | string[], options?: Intl.ListFormatOptions);
    }
}