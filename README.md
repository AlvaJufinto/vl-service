<!-- @format -->

# KYC Verification API

API backend untuk verifikasi identitas (KYC) berbasis foto KTP Indonesia, selfie, dan NIK. Menggunakan Qwen Vision LLM untuk OCR & face comparison, Serper API untuk pencarian identitas, serta geocoding untuk validasi lokasi.

---

## Tech Stack

- **Node.js** + **Express**
- **Multer** – upload file/image
- **Qwen VL Plus** (`qwen-vl-plus`) – Vision Language Model untuk OCR KTP & perbandingan wajah
- **Serper API** – Google Search untuk validasi identitas
- **Geocoding** – validasi jarak alamat KTP vs lokasi pengguna

---

## Instalasi

```bash
git clone <repo-url>
cd <project-folder>
npm install
```

Buat file `.env`:

```env
QWEN_API_KEY=your_qwen_api_key
SERPER_API_KEY=your_serper_api_key
```

Jalankan server:

```bash
npm run dev
# atau
node index.js
```

---

## Endpoints

### Base URL: `/kyc`

---

### 1. `POST /kyc/verify-nik`

Verifikasi NIK tanpa file upload.

**Request Body** (`multipart/form-data` atau `application/x-www-form-urlencoded`):

| Field | Type   | Keterangan           |
| ----- | ------ | -------------------- |
| `nik` | string | Nomor KTP (16 digit) |

**Response:**

```json
{
  "message": "...",
  "data": { ... }
}
```

---

### 2. `GET /kyc/all`

Mendapatkan semua data KYC yang tersimpan.

**Response:**

```json
[
  { ... },
  { ... }
]
```

---

### 3. `GET /kyc/verification-results`

Mendapatkan semua hasil verifikasi KYC.

**Response:**

```json
[
  { ... }
]
```

---

### 4. `POST /kyc/extract-ktp`

Ekstrak data dari foto KTP menggunakan AI (OCR).

**Request:** `multipart/form-data`

| Field  | Type | Keterangan         |
| ------ | ---- | ------------------ |
| `file` | file | Foto KTP (JPG/PNG) |

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

Verifikasi lengkap KTP dengan selfie dan lokasi GPS.

**Request:** `multipart/form-data`

| Field         | Type   | Keterangan                         |
| ------------- | ------ | ---------------------------------- |
| `file_ktp`    | file   | Foto KTP                           |
| `file_selfie` | file   | Foto selfie pengguna               |
| `lat`         | string | Latitude lokasi pengguna saat ini  |
| `lng`         | string | Longitude lokasi pengguna saat ini |

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
    "Geocode menggunakan: JL. CONTOH, BANDUNG",
    "Identity score mix: LLM(80) 70% + Distance(95.00) 30% = 84"
  ],
  "serper_result": { ... },
  "identity_compliance_result": {
    "identity_score": 80,
    "compliance_score": 90,
    "alasan": "Nama ditemukan dengan reputasi baik"
  }
}
```

---

## Scoring System

### Liveness Score (Face Comparison)

| Similarity | Liveness Score |
| ---------- | -------------- |
| ≥ 0.85     | 100            |
| ≥ 0.75     | 80             |
| ≥ 0.65     | 60             |
| < 0.65     | 0              |

### Identity Score

Gabungan dari:

- **70%** Identity Score dari LLM (berdasarkan pencarian Google via Serper)
- **30%** Distance Score (semakin dekat lokasi GPS dengan alamat KTP, semakin tinggi)

### Final Score & Decision

```
Final Score = (Liveness × 0.4) + (Identity × 0.3) + (Risk × 0.2) + (Compliance × 0.1)
```

| Final Score | Decision      |
| ----------- | ------------- |
| ≥ 90        | Auto Approved |
| 60 – 89     | Manual Review |
| < 60        | Auto Rejected |

---

## Struktur Proyek

```
├── controllers/
│   ├── extractKtpController.js     # OCR KTP via Qwen VL
│   ├── verifyKtpController.js      # Verifikasi lengkap KTP + selfie
│   └── kycController.js            # NIK verify, get all, get results
├── routes/
│   └── kycRoutes.js                # Definisi semua route /kyc
├── utils/
│   ├── distance.js                 # Hitung jarak GPS (Haversine)
│   └── geocode.js                  # Geocoding alamat KTP
├── .env                            # API Keys
└── index.js                        # Entry point Express
```

---

## Error Responses

| Status | Error Message                  | Keterangan                   |
| ------ | ------------------------------ | ---------------------------- |
| 400    | `File foto KTP wajib diupload` | File tidak dikirim           |
| 400    | `lat dan lng wajib diisi`      | Koordinat GPS tidak ada      |
| 400    | `Alamat tidak ditemukan`       | Geocoding gagal              |
| 500    | `LLM error`                    | Respons API Qwen bermasalah  |
| 500    | `Gagal parse JSON dari LLM`    | Output LLM tidak valid JSON  |
| 500    | `Server error`                 | Error internal tidak terduga |

---

## Catatan

- Semua foto dikirim sebagai **base64** ke Qwen VL API
- Geocoding menggunakan fallback bertingkat (kecamatan → kota → provinsi) jika alamat lengkap tidak ditemukan
- Serper API key sudah tersedia sebagai fallback hardcoded (disarankan ganti dengan env variable di produksi)
