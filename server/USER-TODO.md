## Implementation

- [x] Build the service using Node.js
- [x] Implement an API to create a job
- [x] Implement an API to retrieve job status
- [x] Define what a job does
- [x] Process jobs asynchronously, outside the API request cycle
- [x] Implement a clear job lifecycle, such as:
  - pending
  - processing
  - completed
  - failed

## Reliability

- [x] Handle failures during job processing
- [x] Implement retry mechanisms
- [x] Handle duplicate job submissions / idempotency
- [ ] Support safe recovery after crashes or restarts

## Observability

- [x] Add logging
- [ ] Prefer structured logging
- [ ] Add a health-check endpoint
- [ ] Optionally add other useful observability such as metrics or tracing

## Scale considerations

- [ ] Design for thousands of job submissions per minute
- [ ] Design for tens of thousands of jobs in different states
- [ ] Account for jobs taking milliseconds to seconds
- [ ] Account for bursty traffic
- [ ] Explain how the design handles this scale

## README

- [ ] Add setup instructions
- [ ] Explain the architecture
- [ ] Explain key tradeoffs and decisions
- [ ] Explain scaling considerations
- [ ] Document where AI was used
- [ ] Document what AI suggestions were accepted vs. modified
- [ ] Document issues or incorrect AI suggestions
- [ ] Explain how correctness was validated
- [ ] Explain what you would improve with more time
