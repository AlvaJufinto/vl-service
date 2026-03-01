<!-- @format -->

# KYC Verification API

A backend API for identity verification (KYC) based on Indonesian ID card (KTP) photos, selfies, and NIK numbers. It leverages the Qwen Vision LLM for OCR and face comparison, Serper API for identity search, and geocoding for location-based address validation.

---

## Tech Stack

- **Node.js** + **Express**
- **Multer** – file/image upload handling
- **Qwen VL Plus** (`qwen-vl-plus`) – Vision Language Model for KTP OCR and face comparison
- **Serper API** – Google Search for identity validation
- **Geocoding** – validates the distance between the KTP address and the user's current location

---

## Installation

```bash
git clone <repo-url>
cd <project-folder>
npm install
```

Create a `.env` file:

```env
QWEN_API_KEY=your_qwen_api_key
SERPER_API_KEY=your_serper_api_key
```

Start the server:

```bash
npm run dev
# or
node index.js
```

---

## Endpoints

### Base URL: `/kyc`

---

### 1. `POST /kyc/verify-nik`

Verify a NIK number without file upload.

**Request Body** (`multipart/form-data` or `application/x-www-form-urlencoded`):

| Field | Type   | Description                |
| ----- | ------ | -------------------------- |
| `nik` | string | ID card number (16 digits) |

**Response:**

```json
{
  "message": "...",
  "data": { ... }
}
```

---

### 2. `GET /kyc/all`

Retrieve all stored KYC records.

**Response:**

```json
[
  { ... },
  { ... }
]
```

---

### 3. `GET /kyc/verification-results`

Retrieve all KYC verification results.

**Response:**

```json
[
  { ... }
]
```

---

### 4. `POST /kyc/extract-ktp`

Extract data from a KTP photo using AI-powered OCR.

**Request:** `multipart/form-data`

| Field  | Type | Description         |
| ------ | ---- | ------------------- |
| `file` | file | KTP photo (JPG/PNG) |

**Response:**

```json
{
	"message": "Ekstraksi berhasil",
	"data": {
		"nik": "3201xxxxxxxxxxxx",
		"nama": "JOHN DOE",
		"tempat_lahir": "BANDUNG",
		"tanggal_lahir": "01-01-1990",
		"jenis_kelamin": "LAKI-LAKI",
		"alamat": "JL. CONTOH NO. 1",
		"rt": "001",
		"rw": "002",
		"kelurahan": "KELURAHAN",
		"kecamatan": "KECAMATAN",
		"kota_kabupaten": "KOTA BANDUNG",
		"provinsi": "JAWA BARAT",
		"agama": "ISLAM",
		"status_perkawinan": "BELUM KAWIN",
		"pekerjaan": "KARYAWAN SWASTA",
		"kewarganegaraan": "WNI",
		"masa_berlaku": "SEUMUR HIDUP"
	}
}
```

---

### 5. `POST /kyc/verify-ktp`

Full KTP verification using a selfie and GPS coordinates.

**Request:** `multipart/form-data`

| Field         | Type   | Description                         |
| ------------- | ------ | ----------------------------------- |
| `file_ktp`    | file   | KTP photo                           |
| `file_selfie` | file   | User selfie photo                   |
| `lat`         | string | User's current latitude coordinate  |
| `lng`         | string | User's current longitude coordinate |

**Response:**

```json
{
  "ktp_data": {
    "nik": "3201xxxxxxxxxxxx",
    "nama": "JOHN DOE",
    "alamat": "JL. CONTOH NO. 1",
    "kelurahan": "KELURAHAN",
    "kecamatan": "KECAMATAN",
    "kota": "KOTA BANDUNG",
    "provinsi": "JAWA BARAT"
  },
  "liveness_score": 100,
  "identity_score": 85,
  "risk_score": 93,
  "compliance_score": 90,
  "final_score": 93,
  "decision": "Auto Approved",
  "reason": [
    "Face similarity: 0.91",
    "Geocode using: JL. CONTOH, BANDUNG",
    "Identity score mix: LLM(80) 70% + Distance(95.00) 30% = 84"
  ],
  "serper_result": { ... },
  "identity_compliance_result": {
    "identity_score": 80,
    "compliance_score": 90,
    "alasan": "Name found with good reputation"
  }
}
```

---

## Scoring System

### Liveness Score (Face Comparison)

| Similarity | Liveness Score |
| ---------- | -------------- |
| >= 0.85    | 100            |
| >= 0.75    | 80             |
| >= 0.65    | 60             |
| < 0.65     | 0              |

### Identity Score

A weighted combination of:

- **70%** Identity Score from LLM (based on Google search results via Serper)
- **30%** Distance Score (the closer the GPS location to the KTP address, the higher the score)

### Final Score and Decision

```
Final Score = (Liveness x 0.4) + (Identity x 0.3) + (Risk x 0.2) + (Compliance x 0.1)
```

| Final Score | Decision      |
| ----------- | ------------- |
| >= 90       | Auto Approved |
| 60 - 89     | Manual Review |
| < 60        | Auto Rejected |

---

## Project Structure

```
├── controllers/
│   ├── extractKtpController.js     # KTP OCR via Qwen VL
│   ├── verifyKtpController.js      # Full KTP + selfie verification
│   └── kycController.js            # NIK verify, get all, get results
├── routes/
│   └── kycRoutes.js                # All /kyc route definitions
├── utils/
│   ├── distance.js                 # GPS distance calculation (Haversine)
│   └── geocode.js                  # KTP address geocoding
├── .env                            # API Keys
└── index.js                        # Express entry point
```

---

## Error Responses

| Status | Error Message                  | Description                      |
| ------ | ------------------------------ | -------------------------------- |
| 400    | `File foto KTP wajib diupload` | KTP file not provided            |
| 400    | `lat dan lng wajib diisi`      | GPS coordinates missing          |
| 400    | `Alamat tidak ditemukan`       | Geocoding failed                 |
| 500    | `LLM error`                    | Qwen API response issue          |
| 500    | `Gagal parse JSON dari LLM`    | LLM output is not valid JSON     |
| 500    | `Server error`                 | Unexpected internal server error |

---

## Notes

- All images are sent as **base64** to the Qwen VL API.
- Geocoding uses a tiered fallback strategy (sub-district -> city -> province) if the full address cannot be resolved.
