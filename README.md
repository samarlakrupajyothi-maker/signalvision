# Signal Vision: ANPR Trajectory and Traffic Intelligence Platform
### Smart India Hackathon | Problem Statement 26127 (Bharat Electronics Limited)
**Theme:** Smart Automation | **Category:** Software

---

## 1. Problem Statement & Mission
Urban surveillance grids in Indian metropolises feature hundreds of municipal CCTV and ANPR cameras. However, each camera functions as an isolated island:
- Vehicles cannot be correlated or tracked across sectors.
- Signals operate on rigid time-of-day clocks instead of real-time PCU queue load.
- Emergency ambulances lose crucial minutes stuck in static signal queues.
- Municipalities lack city-wide origin-destination and bottleneck intelligence.

**Signal Vision** delivers an end-to-end, multi-tier traffic intelligence system tailored for Indian road conditions. It serves three distinct user groups:
1. **Public Citizen / Commuter:** Live junction status, congestion map, traffic composition graphs, and client-side video testing.
2. **Traffic Control Room Operator:** Cross-camera license plate search, chronological trajectory reconstruction, route anomaly detection, blacklist alerts, and automated Webster signal timing plans.
3. **Municipal Administrator:** Camera node registry, user management, DPDP Act 2023 data retention controls, and audit trails.

Every screen directly answers a single question in plain language:
- *"Which junction is most congested now?"*
- *"Where did this vehicle go across the city?"*
- *"What is the optimal cycle length for current lane demand?"*

---

## 2. Three Operational Modes (Zero-Cost Public Evaluation)

| Mode | Target Deployment | Architecture & Processing | Network Inflow |
| :--- | :--- | :--- | :--- |
| **Mode A: Live 4-Way Simulation** | Public Evaluation / Training | High-fidelity 60 FPS HTML5 Canvas simulation adhering strictly to **Indian Left-Hand Traffic (LHT / Keep Left)** rules. Features Indian vehicles (auto-rickshaws, lorries, buses, bikes, ambulances, fire engines, VIP convoys), pedestrian zebra walk phases, and stop-line queue physics. | 100% Client-side browser execution |
| **Mode B: Browser Video / Webcam** | Field Testing & Edge Verification | Client-side YOLOv8 inference running directly in browser memory via ONNX Runtime Web (WebGPU / WASM). Video is never uploaded to any server. Generates vehicle classifications and Webster cycle recommendations from video clips. | 0 KB upload (Privacy-first) |
| **Mode C: Server Pipeline** | Enterprise Municipal Grid | Production RTSP ingestion, ByteTrack tracking, PaddleOCR, Redis Streams event bus, PostGIS trajectory storage, and FastAPI REST/WebSocket endpoints. | Scalable Edge-to-Cloud Stream |

All three modes stream and parse an identical JSON event message specification.

---

## 3. Indian Traffic Rules Enforcement & Violation Alert Engine

Signal Vision integrates automated enforcement aligned with the **Motor Vehicles (Amendment) Act 2019**:

1. **Keep Left (Left-Hand Traffic - LHT):** All approaches require vehicles to travel strictly on the left half of the carriageway.
2. **Signal Jumping (Red Light Violation - MV Act Sec 119/177):** Automated stop line sensor detects vehicles crossing the line on red, flagging the license plate and generating a ₹1,000 automated e-Challan.
3. **Wrong Route / Counter-Flow Driving (MV Act Sec 177/184):** Identifies vehicles traveling on the right half or against the designated direction of flow.
4. **Over-Speeding (Speed Limit Crossing - MV Act Sec 112/183):** Tracks vehicle displacement across calibrated camera coordinates; vehicles exceeding the 40 km/h urban threshold trigger a ₹2,000 automated e-Challan.
5. **Government & Emergency Vehicle Priority:**
   - **Fire Fighter (Emergency Priority):** Dedicated red fire engine with dual flashing strobes triggers immediate signal preemption (finishing active yellow -> 2s all-red -> immediate green corridor).
   - **Ambulance (108 Emergency Medical Services):** High-priority green wave corridor clearance.
   - **VIP Government Convoy:** Protocol security convoy flagged for coordinated escort clearance without cutting off pedestrians.
   - **Blocked / Wanted Vehicles:** Real-time lookup against national VAHAN / CCTNS blacklist database for immediate PCR dispatch.

---

## 4. End-to-End Technical Workflow Architecture

```
Camera / Video Stream (RTSP Stream, Local MP4 File, or Browser Webcam)
  │
  ▼
[1] Adaptive Frame Sampler (5 to 15 FPS decimation based on camera velocity)
  │
  ▼
[2] Vehicle Detection (YOLOv8n / YOLOX-Nano Apache-2.0 alternative)
  │
  ▼
[3] Multi-Object Tracking (ByteTrack Kalman Filter -> Stable Vehicle IDs)
  │
  ▼
[4] License Plate Crop & OpenCV Enhancement (CLAHE, Deskew, Unsharp Mask)
  │
  ▼
[5] Plate OCR (PaddleOCR v4 / EasyOCR fallback) -> MoRTH Format Validation
  │
  ▼
[6] High-Throughput Event Bus (Redis Streams / In-process ZeroMQ)
  │
  ├───► Worker A: Trajectory Linker (Levenshtein Fuzzy Plate + OSNet Appearance Re-ID)
  ├───► Worker B: Analytics Aggregator (PCU Volume, Density, O-D Matrix, Bottlenecks)
  ├───► Worker C: Alert Engine (Blacklist Match, Route Anomaly, Emergency Preemption)
  └───► Worker D: Signal Planner (Webster Optimum Cycle C0 = (1.5L + 5)/(1 - Y))
  │
  ▼
[7] Spatial Storage Layer (PostgreSQL with PostGIS extension)
  │
  ▼
[8] API Server Layer (FastAPI REST for queries, WebSockets for sub-second live events)
  │
  ▼
[9] React Dashboard (Leaflet OpenStreetMap, Recharts, 60 FPS HTML5 Canvas Sim)
```

---

## 5. Models Registry & Open-Source Licensing Compliance

| Pipeline Task | Primary Model | Version | Licence | Input Size | Open-Source / Permissive Alternative |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vehicle Detection** | YOLOv8n / YOLOv8s | 8.2.0 | AGPL-3.0 (Ultralytics) | 640x640 px | YOLOX-Nano / RT-DETR (Apache-2.0) |
| **Indian Classes** | YOLOv8n-IDD | 1.1-custom | Apache-2.0 / Research | 640x640 px | MobileNetV4-TrafficIndia (Apache-2.0) |
| **Multi-Object Tracking** | ByteTrack | 0.22.0 | MIT Licence | Bounding Box Vectors | OC-SORT / BoT-SORT (MIT) |
| **Plate Detection (LPD)** | YOLOv8-Plate-Nano | 2.0.1 | AGPL-3.0 / Exportable to ONNX | 320x320 px | Haar Cascade / LPD-Net (Apache-2.0) |
| **Plate OCR** | PaddleOCR (PP-OCRv4) | 4.0.0 | Apache-2.0 | 100x32 px | EasyOCR / Tesseract (Apache-2.0) |
| **Image Pre-Processing** | OpenCV CLAHE & Deskew | 4.9.0 | Apache-2.0 | Raw Cropped ROI | Real-ESRGAN-Compact (BSD-3-Clause) |
| **Appearance Re-ID** | OSNet (Torchreid) | x0_5 | MIT Licence | 256x128 px | ResNet50-IBN / FastReID (Apache-2.0) |

*Note on Evaluation Integrity:* Until benchmark datasets are formally executed on the host hardware, the user interface strictly reports: `"OCR accuracy: not yet measured (target above 90%)"`.

---

## 6. Webster Adaptive Traffic Signal Optimization

Signal timing calculations follow Indian Road Congress (IRC-SP-41) standards:
- **Phase Sequence:** Lane A (North) -> Lane B (East) -> Lane C (South) -> Lane D (West).
- **Clearance Intervals:** 3 seconds amber yellow + 2 seconds all-red clearance.
- **Cycle Length Formula (Webster's Method):**
  $$C_0 = \frac{1.5 L + 5}{1 - Y}$$
  Where:
  - $L$ = Total lost time per cycle ($4 \times 3.5 = 14$ seconds).
  - $Y = \sum y_i = \sum (q_i / s_i)$ (sum of critical phase flow ratios).
  - $q_i$ = Arrival flow rate measured in Passenger Car Units (PCU/hr).
  - $s_i$ = Saturation flow rate ($1800$ PCU/hr default).
- **Proportional Green Split:** Green time is allocated according to each lane's critical flow ratio, clamped between $10$ s minimum and $60$ s maximum.
- **Pedestrian Safety Phase:** Dedicated 7 s WALK + 5 s flashing clearance while conflicting vehicle approaches are held at red. Vehicles never enter an occupied zebra crossing.
- **Emergency Vehicle Preemption:** Ambulances approaching the stop line immediately trigger yellow completion, 2 s all-red clearance, and hold green until the emergency vehicle clears the junction. VIP escorts reduce cycle wait times without compromising running yellows or pedestrian walk intervals.

---

## 7. Privacy & Legal Compliance (India's DPDP Act 2023)

In accordance with India's Digital Personal Data Protection (DPDP) Act 2023:
1. **Synthetic Public Data:** All registration plates in the live simulation are synthetic samples.
2. **Zero-Storage Client Ingestion (Mode B):** Uploaded traffic videos are processed solely in the browser's temporary memory and never transmitted over the network.
3. **Tamper-Evident Search Audit Log:** Every license plate query and export action records operator credentials, purpose/case reference, timestamp, and IP address.
4. **Automated Data Purging:** Unflagged vehicle trajectory points are permanently purged after a configurable retention window (default 30 days).

---

## 8. Local Development & Build Instructions

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Type check & lint
npm run lint

# 4. Production build
npm run build
```

---

## 8. Export Capabilities
- **CSV Export:** Instant export of lane-by-lane vehicle classifications, PCU loads, average delays, and queue lengths.
- **Single-Page PDF Report:** Generates an official, printable operational summary featuring Webster What-If comparisons, dominant vehicle statistics, and DPDP compliance declarations.
