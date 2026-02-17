# Errors

All errors encountered during development, with root causes and resolutions.

## 2026-02-17: Multer middleware errors return 500 Internal Server Error

**Error:** Uploading >20 PDFs at once returns `500 Internal server error` instead of a descriptive 400 message.

**Cause:** `upload.array('files', 20)` was used as Express middleware in the route definition. When multer rejects files (too many, too large, wrong type), it calls `next(err)`, which skips the route handler's try/catch entirely and falls through to the global `errorHandler` middleware. Since multer errors have no `.status` property, the global handler defaults to 500.

**Resolution:** Wrapped multer in a promise-based helper (`handleUpload`) called manually inside the route handler's try/catch, so all multer errors are caught and mapped to proper 4xx status codes with descriptive messages.

**Files changed:** `backend/src/routes/ingest.js`

**Commit:** bd1699a
