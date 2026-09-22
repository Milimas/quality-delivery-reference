# Service-test evidence

`make service-tests` writes `service-tests.json` here. Generated JSON is ignored; CI may upload it as an artifact.

The document records the environment classification, UTC start and finish timestamps, total duration, overall result, and `retryCount`. Each entry in `suites` records the suite name, result, exit code, and duration. Unit and component suites each run exactly once, and the wrapper returns the first non-zero exit code.
