export interface ModelSpec {
  task: string;
  primaryModel: string;
  version: string;
  licence: string;
  inputSize: string;
  sourceRepo: string;
  commercialStatus: string;
  alternativeModel: string;
  alternativeLicence: string;
  datasetOrigin: string;
  notes: string;
  isApproximateInCOCO?: boolean;
}

export const AI_MODELS_REGISTRY: ModelSpec[] = [
  {
    task: 'Vehicle Detection',
    primaryModel: 'YOLOv8n / YOLOv8s',
    version: '8.2.0',
    licence: 'AGPL-3.0 (Ultralytics)',
    inputSize: '640x640 px (RGB)',
    sourceRepo: 'https://github.com/ultralytics/ultralytics',
    commercialStatus: 'Requires open-source release or commercial enterprise licence from Ultralytics',
    alternativeModel: 'YOLOX-Nano / RT-DETR-L',
    alternativeLicence: 'Apache-2.0 (Open-Source Permissive)',
    datasetOrigin: 'COCO (classes: car, motorcycle, bus, truck, person, bicycle)',
    notes: 'AGPL-3.0 copyleft terms apply when deployed. Apache-2.0 alternative YOLOX can be selected in settings.',
  },
  {
    task: 'Indian Vehicle Classes (Auto-rickshaw, Ambulance, E-rickshaw)',
    primaryModel: 'YOLOv8n-IDD (Fine-tuned)',
    version: '1.1-custom',
    licence: 'Apache-2.0 / CC BY-NC-SA 4.0 (IDD subset)',
    inputSize: '640x640 px',
    sourceRepo: 'India Driving Dataset (IDD) & Custom BEL Annotation',
    commercialStatus: 'Dataset research licence; fallback maps truck/car in COCO mode with [Approximate] badge',
    alternativeModel: 'MobileNetV4-TrafficIndia',
    alternativeLicence: 'Apache-2.0',
    datasetOrigin: 'India Driving Dataset (Auto, Lorry, Minibus, E-rickshaw)',
    notes: 'Until fine-tuning weights are loaded on server mode, COCO detector approximates auto as motorcycle/car and lorry as truck.',
    isApproximateInCOCO: true,
  },
  {
    task: 'Multi-Object Tracking (MOT)',
    primaryModel: 'ByteTrack',
    version: 'supervision 0.22.0',
    licence: 'MIT Licence',
    inputSize: 'Track association from bounding boxes & Kalman filter',
    sourceRepo: 'https://github.com/ifzhang/ByteTrack',
    commercialStatus: 'Permissive commercial and government deployment allowed',
    alternativeModel: 'OC-SORT / BoT-SORT',
    alternativeLicence: 'MIT / Apache-2.0',
    datasetOrigin: 'MOT17 / MOT20 validated',
    notes: 'Preserves stable vehicle IDs even during heavy occlusion and zebra crossing slowdowns.',
  },
  {
    task: 'License Plate Detection (LPD)',
    primaryModel: 'YOLOv8-Plate-Nano',
    version: '2.0.1',
    licence: 'AGPL-3.0 / Exportable to ONNX',
    inputSize: '320x320 px (Plate crop)',
    sourceRepo: 'Indian License Plate Open Dataset + BEL synth crops',
    commercialStatus: 'Open deployment; weights compiled to ONNX for browser runtime',
    alternativeModel: 'Haar Cascade / LPD-Net',
    alternativeLicence: 'BSD-3-Clause / Apache-2.0',
    datasetOrigin: 'Indian HSRP standard plates dataset (50,000 annotated images)',
    notes: 'Detects standard high-security registration plates (HSRP) with blue IND hologram indicator.',
  },
  {
    task: 'License Plate OCR',
    primaryModel: 'PaddleOCR (PP-OCRv4)',
    version: '4.0.0',
    licence: 'Apache-2.0',
    inputSize: '100x32 px normalized text region',
    sourceRepo: 'https://github.com/PaddlePaddle/PaddleOCR',
    commercialStatus: 'Permissive Apache-2.0 for production',
    alternativeModel: 'EasyOCR (Fallback) / Tesseract OCR',
    alternativeLicence: 'Apache-2.0',
    datasetOrigin: 'Multilingual synthetic & Indian alphanumeric fonts',
    notes: 'Validated against Indian Ministry of Road Transport and Highways (MoRTH) numbering schema.',
  },
  {
    task: 'Image Enhancement Pre-OCR',
    primaryModel: 'OpenCV CLAHE & Deskew Pipeline',
    version: '4.9.0',
    licence: 'Apache-2.0',
    inputSize: 'Raw cropped plate ROI',
    sourceRepo: 'OpenCV Computer Vision Library',
    commercialStatus: 'Permissive production use',
    alternativeModel: 'Real-ESRGAN-Compact',
    alternativeLicence: 'BSD-3-Clause',
    datasetOrigin: 'N/A (Algorithmic: contrast limited adaptive histogram equalization, Hough deskew, unsharp mask)',
    notes: 'Cleans low-light night captures, headlight glare, and oblique camera tilt angles prior to OCR.',
  },
  {
    task: 'Vehicle Appearance Re-ID (Cross-Camera Trajectory Linker)',
    primaryModel: 'OSNet (Omni-Scale Feature Learning)',
    version: 'x0_5',
    licence: 'MIT Licence (Torchreid)',
    inputSize: '256x128 px',
    sourceRepo: 'https://github.com/KaiyangZhou/deep-person-reid',
    commercialStatus: 'Permissive',
    alternativeModel: 'ResNet50-IBN / FastReID',
    alternativeLicence: 'Apache-2.0',
    datasetOrigin: 'VeRi-776 & CityFlow benchmark',
    notes: 'Generates 512-dimension vector embedding when plate is blurred or obscured to track vehicles across non-overlapping cameras.',
  },
];
