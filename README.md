# BribeShield AI (v2.0 Enterprise)
> **Full-Stack Anonymous Anti-Bribery Complaint Platform with Multi-Factor NLP Risk Intelligence, Suspect Repository Registry, AES-256 Encryption & Tamper-Evident Hash Chains**

---

## 🏛️ Executive Summary

**BribeShield AI** is an enterprise-grade citizen vigilance and anti-corruption whistleblowing platform inspired by statutory anti-corruption guidelines and modern cybercrime intelligence portals (e.g. `cybercrime.gov.in`). It eliminates retaliation risks with zero-knowledge anonymity, mathematical cryptography, and automated AI risk prioritization.

---

## 🌟 Complete Feature Matrix

### 1. Prototype Features (Preserved & Enhanced)
- **Anonymous Bribery Complaint Submission**: Submit complaints with evidence files and instant tracking ID generation.
- **Explainable Rule-Based Risk Engine**: Multi-factor scoring with clear reasons (demanded bribe amount, sensitive department weighting, recurrence detection for department+city, coercion cues, and regional language keywords including Kannada and Hindi).
- **Suspect Identifier Repository (Inspired by `cybercrime.gov.in Suspect Search`)**: Search flagged phone numbers, UPI IDs, bank accounts, or corrupt officer names across reported cases. Citizens can flag new suspect handles.
- **Public Transparency Feed**: Real-time anonymized feed of grievances showing progress across departments and cities without exposing identifying personal data.
- **Learning Corner & Citizen Advisories**: Statutory guides on the Prevention of Corruption Act (Section 7), fake digital FIR scams, and official e-Challan receipt rights.
- **Citizen Feedback Subsystem**: Direct citizen feedback collection on transparency features.

### 2. Implemented Future Enhancements (11/11)
| # | Enhancement | Implementation Details |
|---|---|---|
| **1** | **PostgreSQL / Relational Database** | Prisma ORM with **PostgreSQL** schema (`prisma/schema.postgres.prisma`) + zero-config **SQLite** (`prisma/schema.sqlite.prisma` / `dev.db`) for immediate offline local execution. |
| **2** | **Role-Based Auth (RBAC)** | JWT Bearer authentication, salted bcrypt hashing, and 5 clearance roles (`SUPER_ADMIN`, `ADMIN`, `INVESTIGATOR`, `ANALYST`, `AUDITOR`). |
| **3** | **AES-256-GCM Encryption** | Client-certified symmetric encryption on sensitive fields (`iv:authTag:ciphertext`) and encrypted evidence binary buffers. |
| **4** | **Cloud Evidence Storage** | Pluggable local/S3/MinIO storage abstraction with SHA-256 integrity checksums and short-lived signed download tokens (`generateSignedAccessToken`). |
| **5** | **Trained Machine Learning Model** | Pre-trained **Multinomial Naive Bayes + TF-IDF Classifier** (`ml.classifier.js`) predicting corruption modus operandi (`COERCIVE_EXTORTION`, `PROCEDURAL_STALLING`, `PROCUREMENT_COLLUSION`), regex amount extractors, and 0–100 risk scoring. |
| **6** | **Multilingual Regional Support** | 6 languages supported with instant 1-click header switching: **English**, **हिन्दी (Hindi)**, **मराठी (Marathi)**, **বাংলা (Bengali)**, **தமிழ் (Tamil)**, and **తెలుగు (Telugu)**. |
| **7** | **Email / SMS / Push Notifications** | Nodemailer HTML status lifecycle templates, SMS telecom gateway logging, and real-time Server-Sent Events push broadcasts (`/api/v1/notifications/stream`). |
| **8** | **Tamper-Evident Hash Chains** | Cryptographic SHA-256 hash chaining where each action block links to `prevHash`. Includes `/api/v1/audit/verify` endpoint returning verified blockchain integrity status. |
| **9** | **Institutional Grievance Integration** | Standardized **CPGRAMS**, **State Lokayukta**, and **CVC** adapters with outbound HMAC-SHA256 signature verification headers. |
| **10** | **Advanced Analytics & Anomaly Detection** | Statistical z-score outlier surge detector for sudden bribery spikes / syndicates, department-wise corruption heatmaps, and 1-click CSV/JSON regulatory reporting export. |
| **11** | **Stronger Privacy & Retention Controls** | One-way salted IP hashing, statutory whistleblower consent modal, automated background data retention purger, and anti-abuse rate limiters. |

---

## 🚀 Running the Project

### 1. Active Web URLs
- **Frontend Web App**: **[http://localhost:5173/](http://localhost:5173/)**
- **Backend API Gateway**: **[http://localhost:5000/](http://localhost:5000/)**
- **Health Check Endpoint**: **[http://localhost:5000/health](http://localhost:5000/health)**

### 2. Available Routes
- `/` — Homepage with pillars, statistics, and quick actions
- `/submit` — File Protected Anonymous Grievance with encrypted evidence upload
- `/track` — Anonymous Case Tracking by Tracking ID (e.g. `BSAI-2026-XXXX-XXXX`)
- `/suspects` — Suspect Identifier Registry (Search & Flag UPI, Phone, Officer)
- `/feed` — Public Transparency Feed, Citizen Advisories, and Feedback
- `/login` — Staff & Vigilance Sign In (with 1-click demo role chips)
- `/dashboard` — Vigilance Operations Center (RBAC, Audit Verifier, CPGRAMS Sync, Anomaly Alerts)

### 3. Demo Login Credentials (Password: `BribeShield@2026!`)
- **Super Admin**: `superadmin@bribeshield.org`
- **Administrator**: `admin@bribeshield.org`
- **Investigator**: `investigator@bribeshield.org`
- **Analyst**: `analyst@bribeshield.org`
- **Auditor**: `auditor@bribeshield.org`
