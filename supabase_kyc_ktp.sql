DROP TABLE kyc_ktp;
DROP TABLE kyc_verification_results;

-- Tabel identitas KTP
CREATE TABLE kyc_ktp (
    nik VARCHAR(16) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    tempat_lahir VARCHAR(50) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(20) NOT NULL,
    alamat TEXT NOT NULL,
    rt VARCHAR(3) NOT NULL,
    rw VARCHAR(3) NOT NULL,
    kelurahan VARCHAR(50) NOT NULL,
    kecamatan VARCHAR(50) NOT NULL,
    kota_kabupaten VARCHAR(50) NOT NULL,
    provinsi VARCHAR(50) NOT NULL,
    agama VARCHAR(30) NOT NULL,
    status_perkawinan VARCHAR(30) NOT NULL,
    pekerjaan VARCHAR(50) NOT NULL,
    kewarganegaraan VARCHAR(10) NOT NULL,
    masa_berlaku VARCHAR(20) NOT NULL
);

-- Seeding data contoh
INSERT INTO kyc_ktp VALUES
('3175090801010001', 'Budi Santoso', 'Jakarta', '1980-01-08', 'Laki-laki', 'Jl. Merdeka No. 1', '001', '002', 'Gambir', 'Gambir', 'Jakarta Pusat', 'DKI Jakarta', 'Islam', 'Kawin', 'Karyawan Swasta', 'WNI', 'Seumur Hidup'),
('3201011502920002', 'Siti Aminah', 'Bandung', '1992-02-15', 'Perempuan', 'Jl. Sudirman No. 10', '003', '004', 'Cicendo', 'Cicendo', 'Bandung', 'Jawa Barat', 'Islam', 'Belum Kawin', 'Mahasiswa', 'WNI', '2026-12-31'),
('3173010101900008','Rudi Hartono','Jakarta','1990-01-01','Laki-laki','Jl. Kenanga No. 1','001','001','Cempaka Putih','Cempaka Putih','Jakarta Pusat','DKI Jakarta','Islam','Belum Kawin','Karyawan Swasta','WNI','Seumur Hidup'),
('3173010202910009','Lina Marlina','Jakarta','1991-02-02','Perempuan','Jl. Melati No. 2','002','002','Rawasari','Cempaka Putih','Jakarta Pusat','DKI Jakarta','Islam','Kawin','Ibu Rumah Tangga','WNI','Seumur Hidup'),
('3275010303920010','Fajar Nugroho','Bekasi','1992-03-03','Laki-laki','Jl. Patriot No. 3','003','003','Kayuringin','Bekasi Selatan','Bekasi','Jawa Barat','Islam','Belum Kawin','Programmer','WNI','Seumur Hidup'),
('3275010404930011','Intan Permata','Bekasi','1993-04-04','Perempuan','Jl. Ahmad Yani No. 4','004','004','Margajaya','Bekasi Selatan','Bekasi','Jawa Barat','Kristen','Belum Kawin','Akuntan','WNI','Seumur Hidup'),
('3204010505940012','Agus Salim','Bogor','1994-05-05','Laki-laki','Jl. Pajajaran No. 5','005','005','Baranangsiang','Bogor Timur','Bogor','Jawa Barat','Islam','Kawin','Guru','WNI','Seumur Hidup'),
('3204010606950013','Sari Wulandari','Bogor','1995-06-06','Perempuan','Jl. Sholeh Iskandar No. 6','006','006','Cibadak','Tanah Sareal','Bogor','Jawa Barat','Islam','Belum Kawin','Perawat','WNI','Seumur Hidup'),
('3372010707960014','Bayu Saputra','Semarang','1996-07-07','Laki-laki','Jl. Gajahmada No. 7','007','007','Kembangsari','Semarang Tengah','Semarang','Jawa Tengah','Islam','Belum Kawin','Mahasiswa','WNI','2027-07-07'),
('3372010808970015','Nadia Putri','Semarang','1997-08-08','Perempuan','Jl. Pandanaran No. 8','008','008','Pekunden','Semarang Tengah','Semarang','Jawa Tengah','Katolik','Belum Kawin','Admin','WNI','Seumur Hidup'),
('3578010909980016','Yusuf Maulana','Surabaya','1998-09-09','Laki-laki','Jl. Darmo No. 9','009','009','Darmo','Wonokromo','Surabaya','Jawa Timur','Islam','Belum Kawin','Sales','WNI','Seumur Hidup'),
('3578011010990017','Clara Angel','Surabaya','1999-10-10','Perempuan','Jl. Raya Kupang No. 10','010','010','Putat Jaya','Sawahan','Surabaya','Jawa Timur','Kristen','Belum Kawin','Desainer','WNI','Seumur Hidup'),

('3671011101900018','Deni Prakoso','Tangerang','1990-11-11','Laki-laki','Jl. Daan Mogot No. 11','011','011','Sukajadi','Karawaci','Tangerang','Banten','Islam','Kawin','Wiraswasta','WNI','Seumur Hidup'),
('3671011202910019','Maya Sari','Tangerang','1991-12-12','Perempuan','Jl. MH Thamrin No. 12','012','012','Cimone','Karawaci','Tangerang','Banten','Islam','Belum Kawin','HRD','WNI','Seumur Hidup'),
('3276011303920020','Hendra Gunawan','Depok','1992-03-13','Laki-laki','Jl. Margonda No. 13','013','013','Kemiri Muka','Beji','Depok','Jawa Barat','Islam','Belum Kawin','Driver','WNI','Seumur Hidup'),
('3276011404930021','Vina Oktavia','Depok','1993-04-14','Perempuan','Jl. Juanda No. 14','014','014','Beji','Beji','Depok','Jawa Barat','Islam','Kawin','Dokter','WNI','Seumur Hidup'),
('3171021505940022','Taufik Hidayat','Jakarta','1994-05-15','Laki-laki','Jl. Tebet No. 15','015','015','Tebet Timur','Tebet','Jakarta Selatan','DKI Jakarta','Islam','Belum Kawin','Programmer','WNI','Seumur Hidup'),
('3171021606950023','Rina Lestari','Jakarta','1995-06-16','Perempuan','Jl. Pancoran No. 16','016','016','Pancoran','Pancoran','Jakarta Selatan','DKI Jakarta','Islam','Belum Kawin','Content Creator','WNI','Seumur Hidup'),
('3273011707960024','Arif Setiawan','Bogor','1996-07-17','Laki-laki','Jl. Raya Dramaga No. 17','017','017','Dramaga','Dramaga','Bogor','Jawa Barat','Islam','Belum Kawin','Petani','WNI','Seumur Hidup'),
('3273011808970025','Melisa Tan','Bogor','1997-08-18','Perempuan','Jl. Yasmin No. 18','018','018','Curug Mekar','Bogor Barat','Bogor','Jawa Barat','Buddha','Belum Kawin','Pengusaha','WNI','Seumur Hidup'),
('3374011909980026','Rangga Pradana','Solo','1998-09-19','Laki-laki','Jl. Slamet Riyadi No. 19','019','019','Laweyan','Laweyan','Surakarta','Jawa Tengah','Islam','Belum Kawin','Barista','WNI','Seumur Hidup'),
('3374012010990027','Siska Amelia','Solo','1999-10-20','Perempuan','Jl. Adi Sucipto No. 20','020','020','Manahan','Banjarsari','Surakarta','Jawa Tengah','Islam','Belum Kawin','Guru','WNI','Seumur Hidup'),

('3578022101900028','Bagas Mahendra','Surabaya','1990-01-21','Laki-laki','Jl. Ahmad Yani No. 21','021','021','Ketintang','Gayungan','Surabaya','Jawa Timur','Islam','Kawin','Teknisi','WNI','Seumur Hidup'),
('3578022202910029','Niken Ayu','Surabaya','1991-02-22','Perempuan','Jl. Rungkut No. 22','022','022','Rungkut Kidul','Rungkut','Surabaya','Jawa Timur','Hindu','Belum Kawin','Mahasiswa','WNI','2028-02-22'),
('3674012303920030','Robby Kurniawan','Serang','1992-03-23','Laki-laki','Jl. Veteran No. 23','023','023','Kotabaru','Serang','Serang','Banten','Islam','Belum Kawin','Security','WNI','Seumur Hidup'),
('3674012404930031','Aulia Rahma','Serang','1993-04-24','Perempuan','Jl. Raya Serang No. 24','024','024','Sumurpecung','Serang','Serang','Banten','Islam','Kawin','Bidan','WNI','Seumur Hidup'),
('6471012505940032','Ilham Akbar','Balikpapan','1994-05-25','Laki-laki','Jl. Sudirman No. 25','025','025','Gunung Bahagia','Balikpapan Selatan','Balikpapan','Kalimantan Timur','Islam','Belum Kawin','Operator','WNI','Seumur Hidup'),
('6471012606950033','Fitri Handayani','Balikpapan','1995-06-26','Perempuan','Jl. MT Haryono No. 26','026','026','Sepinggan','Balikpapan Selatan','Balikpapan','Kalimantan Timur','Islam','Belum Kawin','Kasir','WNI','Seumur Hidup'),
('5171012707960034','Kadek Wirawan','Denpasar','1996-07-27','Laki-laki','Jl. Teuku Umar No. 27','027','027','Pemecutan','Denpasar Barat','Denpasar','Bali','Hindu','Belum Kawin','Chef','WNI','Seumur Hidup'),
('5171012808970035','Ni Luh Puspita','Denpasar','1997-08-28','Perempuan','Jl. Gatot Subroto No. 28','028','028','Dangin Puri','Denpasar Timur','Denpasar','Bali','Hindu','Belum Kawin','Admin','WNI','Seumur Hidup'),
('1371012909980036','Reza Ananda','Padang','1998-09-29','Laki-laki','Jl. Khatib Sulaiman No. 29','029','029','Ulak Karang','Padang Utara','Padang','Sumatera Barat','Islam','Belum Kawin','Mahasiswa','WNI','2029-09-29'),
('1371013010990037','Putri Maharani','Padang','1999-10-30','Perempuan','Jl. Veteran No. 30','030','030','Andalas','Padang Timur','Padang','Sumatera Barat','Islam','Belum Kawin','Penulis','WNI','Seumur Hidup');

DROP TABLE IF EXISTS public.kyc_verification_results;

CREATE TABLE public.kyc_verification_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- KTP data
    nik VARCHAR(20) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    tempat_lahir VARCHAR(50),
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(20),
    alamat TEXT,
    rt VARCHAR(5),
    rw VARCHAR(5),
    kelurahan VARCHAR(50),
    kecamatan VARCHAR(50),
    kota_kabupaten VARCHAR(50),
    provinsi VARCHAR(50),
    agama VARCHAR(30),
    status_perkawinan VARCHAR(30),
    pekerjaan VARCHAR(50),
    kewarganegaraan VARCHAR(20),
    masa_berlaku VARCHAR(20),

    -- Skor verifikasi
    liveness_score INTEGER,
    identity_score INTEGER,
    risk_score INTEGER,
    compliance_score INTEGER,
    final_score INTEGER,

    -- Decision & trend
    status VARCHAR(30) NOT NULL CHECK (
        status IN ('Auto Approved', 'Manual Review', 'Rejected')
    ),
    grade VARCHAR(5),
    predikat VARCHAR(50),
    trend VARCHAR(10) DEFAULT 'stable' CHECK (
        trend IN ('up','down','stable')
    ),

    -- Penjelasan & alasan
    reason TEXT[], -- array of text

    -- Hasil SERP / pencarian
    serper_result JSONB, -- menyimpan seluruh object JSON hasil search

    -- Hasil identitas & compliance
    identity_compliance_result JSONB, -- menyimpan seluruh object JSON

    created_at TIMESTAMPTZ DEFAULT now()
);