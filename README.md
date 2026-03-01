<!-- @format -->

# VL-Service API Documentation

## Overview

VL-Service is an Express.js API for KYC (Know Your Customer) verification using Supabase as the backend database. It provides endpoints for verifying NIK (Indonesian ID number), listing all KYC records, and retrieving verification results.

---

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
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
  - Example:
    ```json
    {
      "nik": "1234567890",
      "nama": "John Doe",
      ...
      "final_trust_score": 85,
      "decision": "Auto-Approved",
      "reason": ["NIK valid di database", ...]
    }
    ```
- **Errors:**
  - 400: NIK not provided
  - 404: NIK not found
  - 500: Server/Supabase error

### 2. List All KYC Records

- **GET** `/v1/kyc/all`
- **Response:**
  - `total`: Number of records
  - `data`: Array of KYC records
- **Errors:**
  - 500: Server/Supabase error

### 3. Verification Results

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
- Simulates identity, liveness, risk, and compliance scoring for demo purposes.

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
