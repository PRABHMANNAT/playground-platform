# Owned fixtures

HireFlow is a fictional recruitment SaaS rendered at `/fixture/hireflow`.
`?build=A` has an intentional HTTP 500 Save error and unlabeled salary input.
`?build=B` returns a sample confirmation and includes the input label.
`?task=application` demonstrates a working application submission in both builds.
Neither fixture contacts external targets or sends recruiting messages.

Run `node tests/fixtures/capture.mjs` while the frontend is running. It performs
actual interactions/assertions on the owned fixture and captures 32 screenshots
under `.local/artifacts`. Runtime demo journeys replay these captures with an
explicit Demo banner; they are not claimed as fresh browser execution.

Fixture assertions establish only the controlled behavior, not real product
validity, audit certification, conversion, or participant realism.
