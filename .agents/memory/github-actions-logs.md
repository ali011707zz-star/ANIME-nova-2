---
name: GitHub Actions log access
description: Safe retrieval pattern for build logs redirected by the GitHub Actions API.
---

The Actions job-log API redirects to a short-lived signed blob URL. Fetch that URL immediately without forwarding the GitHub authorization header, and do not print or persist the signed URL. The downloaded job log may be plain text rather than a ZIP archive.

**Why:** Redirecting with the GitHub credential can fail at the blob host, while signed URLs expire quickly.

**How to apply:** Authenticate only to GitHub's log endpoint, capture the redirect privately, fetch its target without authorization, and inspect the returned content type before parsing.
