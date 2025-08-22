# TODO: Main.py Updates for File Upload Integration

## Steps to Complete:

1. [x] Modify `scraper/main.py` to accept `--input-file` command line parameter
2. [x] Update the script to process either single file or directory based on input
3. [x] Add proper error handling for file not found scenarios
4. [x] Test the integration with the existing server endpoint
5. [x] Verify file upload functionality works end-to-end

## Additional User Requests:
- [x] Update success message button in file-upload component
- [x] Ensure extracted JSONs are pushed to HFCL API

## Current Status:
- Main.py modifications completed successfully
- Server is running and accepting requests
- Python processing endpoint is functional
- Ready for frontend testing

## Files Modified:
- scraper/main.py - Updated to handle `--input-file` parameter
- server/index.js - Modified to handle MongoDB connection failures gracefully

## Expected Behavior:
- When `--input-file` is provided: Process only that specific file
- When no arguments: Process all files in scraper/data directory (current behavior)
- Return proper exit codes and error messages
