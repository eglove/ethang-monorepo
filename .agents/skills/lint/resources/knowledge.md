
### Rule: unicorn/no-top-level-assignment-in-function (and similar)

**Problem:** Assigning to a top-level variable from inside a function is often flagged to prevent side effects and improve testability.

**Solution:** Wrap the state in a store object at the top level and mutate the object property instead of the variable itself.

### Rule: unicorn/default-export-style

**Problem:** Preferring inline default exports (e.g., export default () => {}) over named variable assignment and then exporting.

**Solution:** Export the function or configuration directly. If eslint --fix keeps reverting it due to other rules or formatting, ensure the inline version is correctly typed and formatted to satisfy all rules simultaneously.

### Rule: unicorn/no-top-level-assignment-in-function (and similar)

**Problem:** Assigning to a top-level variable from inside a function is often flagged to prevent side effects and improve testability.

**Solution:** Wrap the state in a store object at the top level and mutate the object property instead of the variable itself.

### Rule: unicorn/default-export-style

**Problem:** Preferring inline default exports (e.g., export default () => {}) over named variable assignment and then exporting.

**Solution:** Export the function or configuration directly. If eslint --fix keeps reverting it due to other rules or formatting, ensure the inline version is correctly typed and formatted to satisfy all rules simultaneously.
