# Client Photo Quality Checks

Phase 2 validates field evidence before creating an upload ticket or writing an
offline blob.

- Accepted content types are JPEG, PNG, GIF, and WebP.
- The browser must decode the image and report non-zero dimensions.
- Evidence must be at least 640×480 pixels, with neither edge below 320 pixels.
  The shorter-edge allowance supports portrait captures while rejecting
  thumbnails and accidental low-resolution selections.
- A file is considered a duplicate when its normalized name, MIME type, and byte
  size match evidence already attached to the selected job.
- Crew guidance describes how to correct the capture without exposing internal
  decoder or storage errors.

Job completion is blocked until at least one before and one after photo are
present. Persisted evidence and locally captured or durably queued evidence both
count, allowing a crew to finish capture during an API interruption while keeping
the lifecycle mutation in the existing offline queue.

These checks improve immediate field feedback; they do not replace backend
content validation, image processing, malware controls, or report-readiness
policy.
