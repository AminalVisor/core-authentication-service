# Company suspension
- [ ] Fix temporary connection failures during verified-session rechecks; test denial enforcement and regenerate distribution output.
- [x] Add fail-closed company checks and suspended-company sign-in feedback to the library.
- [x] Add simulator scenarios and authorization regression tests (10 tests pass; harness sign-in verified).
- [x] Prepare shared-backend SQL using the actual CoreCTRL schema snapshot.
- [ ] Apply/review SQL and restrictive data policies in the shared backend, then verify real accounts and direct data requests. Blocked: this library project has no authorized connection to CoreCTRL's backend; cross-project access is read-only.
- [x] Update integration instructions and regenerate verified distribution output.