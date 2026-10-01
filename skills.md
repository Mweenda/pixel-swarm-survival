# Feature delivery workflow

Whenever a feature is implemented in this repository:

1. Run the project's complete test suite, type check, and production build; fix any failures before proceeding.
2. Once all checks pass, commit the feature and push the commit to GitHub.
3. Deploy the verified production build to the live Firebase Hosting site.

Do not push or deploy a feature while its tests are failing. Report test, push, or deployment failures clearly and continue with any safe recovery steps available.
