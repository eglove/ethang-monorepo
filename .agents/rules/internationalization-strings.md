---
description: internationalization, locales, user-facing text, and string isolation
trigger: model_decision
---

# Internationalization Strings

## 1. Domain Theory and Conceptual Foundations
Internationalization (i18n) and Localization (l10n) are software engineering methodologies used to make applications adaptable to various languages, regions, and cultural formats. As defined in the IEEE Software Engineering Body of Knowledge (SWEBOK v4) Chapter 2 (Software Design) and Chapter 6 (Software Construction), a system is fully internationalized only when its executable logic is completely separated from its linguistic and cultural resources.

### 1.1 Internationalization (i18n) vs. Localization (l10n)
- **Internationalization (i18n)**: The design and development of an application so that it can be adapted to various target audiences without engineering modifications. This involves writing logic that supports dynamic resource swapping, bidirectionality, character encoding compatibility, and variable formatting.
- **Localization (l10n)**: The process of adapting an internationalized application to a specific region or language by translating text resources, defining locale-specific formatting rules (dates, currencies, numbers), and verifying cultural context.

Hardcoding user-facing strings directly into frontend layouts or backend error messages violates the core separation of concerns, creating high maintenance costs and preventing localization.

### 1.2 ICU Message Format Standard
The **ICU Message Format** is the industry standard for defining dynamic translation strings. Unlike basic string interpolation (which merely replaces a placeholder with a variable, often breaking grammatical syntax in other languages), the ICU format supports:
- **Select Format**: Renders different phrases based on a categorical variable (e.g., gender, status, or role).
- **Plural Format**: Handles complex linguistic pluralization rules. While English only has "one" and "other" categories, languages like Russian or Arabic have up to six distinct plural categories (zero, one, two, few, many, other) that depend on numerical patterns.
- **Variable Placeholders**: Declares variables explicitly within brackets (e.g., `{count}` or `{date, date, medium}`) to allow translators to reorder words grammatically.

### 1.3 Locale Resource Isolation
Linguistic resources must be stored in structured, version-controlled locale resource files (such as JSON, YAML, or PO/MO files) organized by language tags (RFC 5646, e.g., `en-US`, `es-ES`, `fr-FR`). Key requirements include:
- **Hierarchical Namespace**: Structuring translation keys to reflect application routing or component hierarchies (e.g., `"billing.checkout.submit_button"`).
- **UTF-8 Encoding**: Ensuring all translation bundles are saved using UTF-8 encoding to support international characters, symbols, and diacritics.

### 1.4 Cultural Formatting and Bidirectionality
Localization goes beyond text translation:
- **Date/Time Formatting**: Different countries format dates differently (e.g., `MM/DD/YYYY` in the US vs. `DD/MM/YYYY` in Europe). Runtimes must use standard APIs (such as `Intl.DateTimeFormat`) that automatically format dates based on user locale.
- **Currency & Number Formatting**: Handling decimal separators (dots vs. commas) and currency symbol placements.
- **Bidirectionality (RTL/LTR)**: Supporting right-to-left layout orientations (e.g., Arabic, Hebrew). Layout containers must dynamically adjust text alignment and flex directions using CSS logical properties (e.g., `margin-inline-start` instead of `margin-left`).

### 1.5 Linguistic Variations and Localization Challenges
Designing for international audiences requires addressing structural differences between languages:
- **Grammatical Gender**: Many languages assign genders (masculine, feminine, neuter) to nouns and adjectives. In translation strings, this requires the select format to adapt surrounding adjectives dynamically based on the subject's gender (e.g., "selected" translates to "seleccionado" or "seleccionada" in Spanish).
- **Word Order Variation**: Subject-Verb-Object (SVO) structures common in English do not apply globally. Japanese often uses Subject-Object-Verb (SOV). Using string concatenation assumes a fixed SVO structure and breaks translation. ICU placeholders allow translators to position variables arbitrarily.
- **Character Sets and Typography**: High-density scripts (like Chinese, Japanese, or Korean characters) require different font sizes and line heights than Latin scripts to remain legible. Text boundaries and layout wraps must be designed defensively to prevent text overlap or truncation.

### 1.6 Automated Internationalization Auditing
To maintain internationalization integrity across a large monorepo, manual verification is insufficient. Teams must leverage automated tools and checks:
- **Static Analysis Rules**: Integrating linters (such as ESLint with `eslint-plugin-i18next`) to scan React and TypeScript code for un-wrapped string literals in JSX and templates, preventing raw strings from slipping into production.
- **Key Coverage Reports**: Automated build scripts that compare translation keys between the primary resource bundle and secondary bundles. If a key exists in English but is missing in Spanish, the script raises a warning or blocks the CI/CD pipeline.
- **ICU Pattern Validation**: Running parser scripts to compile and validate ICU strings prior to bundling. This detects syntax errors in bracket pairings, un-escaped symbols, or invalid plural selectors before they trigger runtime errors.

## 2. Standard Operating Procedures (SOP)
The agent must follow these step-by-step procedures to manage translation resources:

### Step 2.1: Extract and Isolate String Literals
Before committing any UI layout or server-side messaging code, the agent must extract all user-facing strings:
- Scan the source code for hardcoded string literals in JSX elements, error throw statements, and notification triggers.
- Remove hardcoded values and replace them with calls to a translation function (e.g., `t("keys.path")`).

### Step 2.2: Define the Key Structure in Locale Bundles
Write matching keys in the primary locale bundle (typically `en.json`) under `locales/` directories:
- Organize keys logically using JSON nesting to prevent naming collisions.
- Use explicit, descriptive keys that indicate context (e.g., `"settings.profile.delete_confirm_modal_title"`).
- Add a matching key to all secondary locale bundles with placeholder markers to highlight pending translations.

### Step 2.3: Implement ICU Message Patterns
For any translation string containing dynamic data:
- Do not use string concatenation (e.g., `t("hello") + user.name`).
- Format variables using ICU-compliant patterns in the resource file:
```json
{
  "cart.item_count": "{count, plural, =0 {Your cart is empty} =1 {You have 1 item in your cart} other {You have {count} items in your cart}}"
}
```
- Pass variables as options parameters to the translation function: `t("cart.item_count", { count: items.length })`.

### Step 2.4: Leverage standard Intl APIs for Formatting
For non-string formatting tasks, do not write custom mathematical formatting libraries:
- Use the standard global `Intl` namespace for numbers, dates, lists, and relative times.
- Wrap these calls in utility functions or hooks that read the active workspace locale:
```typescript
export const formatCurrency = (amount: number, locale: string, currency: string) => {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
};
```

### Step 2.5: Write Locale Verification Unit Tests
Implement unit tests to verify locale integrity:
- Assert that secondary locale bundles contain the exact same keys as the primary bundle (checking for missing translation keys).
- Assert that variables defined in translation strings match the variables passed in code.
- Test that pluralization cases (e.g., 0, 1, and many) execute and return the correct strings.

## 3. Agent Compliance Checklist
The agent must verify compliance with the following criteria regarding internationalization:

- [ ] **No Hardcoded User-Facing Strings**: Has the agent verified that zero text strings are hardcoded in UI templates?
- [ ] **Locale Resource Isolation**: Are all translation resources stored in structured JSON/YAML files under a dedicated `locales/` folder?
- [ ] **Namespaced Key Structure**: Do translation keys follow a logical, nested structure to prevent name collisions?
- [ ] **ICU Pluralization Patterns**: Are plural forms defined using ICU message formatting rather than javascript conditionals?
- [ ] **No Translation Concatenation**: Did the agent verify that no strings are concatenated together prior to display?
- [ ] **Intl API Usage**: Are dates, numbers, and currencies formatted using standard browser `Intl` namespace APIs?
- [ ] **RTL/LTR CSS Properties**: Have CSS logical properties (`margin-inline`, `padding-inline`) been used to support bidirectionality?
- [ ] **Missing Keys Audit**: Do unit tests compare language bundles to verify that all translation keys are present in all languages?
- [ ] **Fallback Locale Configuration**: Is there a default fallback locale configured when a translation key is missing in the user locale?
- [ ] **UTF-8 File Validation**: Are all locale bundle files saved with UTF-8 character encoding?
- [ ] **HTML lang Attribute**: Is the HTML `lang` attribute updated dynamically to reflect the user's active locale?
- [ ] **No Forbidden Terminology**: Has the content been scanned to ensure none of the forbidden workspace words are used?
- [ ] **Size Bounds Validation**: Has the agent verified that the modified rule file remains under the 12,000 character limit?
- [ ] **Escaped Backticks**: Are all backticks inside the rule content escaped to prevent string termination?
- [ ] **Interpolation Variable Match**: Do variables defined in locale resource files match the variables passed in the source code?
- [ ] **Error Message Localization**: Are backend API error messages translated or resolved using locale codes from client request headers?
- [ ] **Input Field Directionality**: Do text input fields support bidirectional layout direction properties (`dir="auto"`)?
- [ ] **Walkthrough Verification**: Does the `walkthrough.md` record the changes to the translation keys and bundles?
- [ ] **Locale Code RFC 5646 Compliance**: Are all language codes compliant with RFC 5646 standards?
- [ ] **Luxon Integration**: If dates are manipulated, is the banned Javascript `Date` object avoided in favor of the Luxon library?
- [ ] **Intl.DateTimeFormat Options**: Are explicit options objects used in date formatters to control formatting precision?
- [ ] **Explicit Accessibility**: Are all localization helper methods declared with explicit accessibility modifiers?
