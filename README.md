<!-- @format -->

# VL-Service API Documentation

## Overview

VeriLabs-Service is an Express.js API for KYC (Know Your Customer) verification using Supabase as the backend database. It provides endpoints for verifying NIK (Indonesian ID number), extracting KTP data from images, verifying KTP with selfie and geolocation, listing all KYC records, and retrieving verification results.

---

## Project Structure (Refactored)

- `index.js` — Main entry point, sets up Express and routes
- `routes/kyc.js` — All KYC-related API routes
- `controllers/` — Contains logic for each endpoint:
  - `kycController.js` (NIK verification, list, results)
  - `extractKtpController.js` (KTP image extraction)
  - `verifyKtpController.js` (KTP + selfie + geo verification)
- `utils/` — Utility functions (Supabase client, distance, geocode)

---

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- `QWEN_API_KEY`: API key for Qwen LLM (for image/face/OCR)
- `PORT`: (Optional) Port for the server (default: 3000)

---

## Endpoints

### 1. Verify NIK

- **POST** `/v1/kyc/verify-nik`
- **Body (form-data):**
  - `nik` (string, required): NIK to verify
- **Response:**
  - Returns KTP data, trust score, decision, and reasons
  - Possible decisions: `Auto-Approved`, `Manual Review`, `Auto-Rejected`
- **Errors:**
  - 400: NIK not provided
  - 404: NIK not found
  - 500: Server/Supabase error

### 2. Extract KTP Data from Image

- **POST** `/v1/kyc/extract-ktp`
- **Body (form-data):**
  - `file` (image, required): KTP photo
- **Response:**
  - Extracted KTP fields as JSON
- **Errors:**
  - 400: No file uploaded
  - 500: LLM/server error

### 3. Verify KTP + Selfie + Geolocation

- **POST** `/v1/kyc/verify-ktp`
- **Body (form-data):**
  - `file_ktp` (image, required): KTP photo
  - `file_selfie` (image, required): Selfie photo
  - `lat` (string/number, required): Latitude
  - `lng` (string/number, required): Longitude
- **Response:**
  - KTP data, liveness, identity, risk, compliance, final score, decision, reasons
- **Errors:**
  - 400: Missing files or coordinates
  - 500: API/server error

### 4. List All KYC Records

- **GET** `/v1/kyc/all`
- **Response:**
  - `total`: Number of records
  - `data`: Array of KYC records
- **Errors:**
  - 500: Server/Supabase error

### 5. Verification Results

- **GET** `/v1/kyc/verification-results`
- **Query Params:**
  - `search` (optional): Search by NIK or name
  - `status` (optional): Filter by status (`Auto Approved`, `Manual Review`, `Rejected`, `all`)
- **Response:**
  - `summary`: Object with total, approved, manual, rejected counts
  - `data`: Array of verification results
- **Errors:**
  - 500: Server error

---

## Notes

- CORS is enabled for `http://localhost:8080`.
- Uses `multer` for form-data parsing.
- Uses Qwen LLM for OCR and face matching.
- Simulates identity, liveness, risk, and compliance scoring for demo purposes.
- Project is modularized for maintainability.

---

## Running the Server

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables in a `.env` file.
3. Start the server:
   ```bash
   npm start
   ```

---

## License

MIT
