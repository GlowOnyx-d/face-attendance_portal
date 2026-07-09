import { useEffect, useRef, useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { loadModels, createFaceMatcher, faceapi } from '../utils/faceApi';
import './UploadAttendance.css';

export default function UploadAttendance() {
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const { registeredFaces, markAttendance, getTodayAttendance } = useAttendance();

  const [loading, setLoading] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('Loading face recognition models...');
  const [notification, setNotification] = useState(null);
  const [imageSrc, setImageSrc] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadModels()
      .then((success) => {
        if (success) {
          setModelsReady(true);
          setStatus('Models loaded. Upload a clear group photo to mark attendance.');
        } else {
          setStatus('Failed to load models. Check console for errors.');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Model loading error:', err);
        setStatus('Failed to load models. Check console for errors.');
        setLoading(false);
      });
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const prepareCanvas = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return null;

    const width = img.clientWidth;
    const height = img.clientHeight;

    if (!width || !height) return null;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  };

  const drawResults = (detections, matchedLabels = []) => {
    const img = imageRef.current;
    const canvasData = prepareCanvas();
    if (!img || !canvasData || !img.naturalWidth || !img.naturalHeight) return;

    const { ctx, width, height } = canvasData;
    const scaleX = width / img.naturalWidth;
    const scaleY = height / img.naturalHeight;

    detections.forEach((detection, index) => {
      const box = detection.detection.box;
      const x = box.x * scaleX;
      const y = box.y * scaleY;
      const w = box.width * scaleX;
      const h = box.height * scaleY;

      const label = matchedLabels[index] || 'Unknown';
      const known = label !== 'Unknown';
      const bgColor = known ? '#059669' : '#dc2626';

      ctx.strokeStyle = bgColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.font = 'bold 13px system-ui, sans-serif';
      const text = label;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = bgColor;
      ctx.fillRect(x - 1, y - 28, textWidth + 14, 26);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x + 6, y - 10);
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setResult(null);
      setStatus('Image ready. Click Process Image to mark attendance.');
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!modelsReady) return;

    const img = imageRef.current;
    if (!img) {
      showNotification('Upload an image first.', 'error');
      return;
    }

    if (!registeredFaces.length) {
      showNotification('No registered faces found. Register people first.', 'error');
      return;
    }

    setProcessing(true);
    setStatus('Processing image and recognizing faces...');

    try {
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections.length) {
        drawResults([]);
        setResult({ detected: 0, marked: 0, alreadyMarked: 0, unknown: 0, recognizedNames: [] });
        setStatus('No faces detected in the uploaded image.');
        showNotification('No face detected. Use a clearer image.', 'error');
        setProcessing(false);
        return;
      }

      const matcher = createFaceMatcher(registeredFaces);
      const labels = [];
      const seenIdsInThisImage = new Set();
      const recognizedNames = [];

      let marked = 0;
      let alreadyMarked = 0;
      let unknown = 0;

      for (const detection of detections) {
        if (!matcher) {
          labels.push('Unknown');
          unknown += 1;
          continue;
        }

        const bestMatch = matcher.findBestMatch(detection.descriptor);
        if (bestMatch.label === 'unknown' || bestMatch.distance >= 0.45) {
          labels.push('Unknown');
          unknown += 1;
          continue;
        }

        const matchedFace = registeredFaces.find((face) => face.name === bestMatch.label);
        if (!matchedFace) {
          labels.push('Unknown');
          unknown += 1;
          continue;
        }

        labels.push(`${matchedFace.name}`);
        if (!recognizedNames.includes(matchedFace.name)) {
          recognizedNames.push(matchedFace.name);
        }

        // Avoid repeated attendance writes for same person within one uploaded image.
        if (seenIdsInThisImage.has(matchedFace.id)) {
          continue;
        }
        seenIdsInThisImage.add(matchedFace.id);

        const attendance = await markAttendance(matchedFace.id, matchedFace.name);
        if (attendance) {
          marked += 1;
        } else {
          alreadyMarked += 1;
        }
      }

      drawResults(detections, labels);

      setResult({
        detected: detections.length,
        marked,
        alreadyMarked,
        unknown,
        recognizedNames,
      });

      if (marked > 0) {
        showNotification(`Marked attendance for ${marked} person(s).`, 'success');
      } else if (alreadyMarked > 0) {
        showNotification('All recognized people are already marked today.', 'info');
      } else {
        showNotification('No registered person matched from this image.', 'error');
      }

      setStatus('Processing complete. Upload another image or process again.');
    } catch (err) {
      console.error('Upload processing error:', err);
      setStatus('Failed to process image.');
      showNotification('Error while processing image. Try another photo.', 'error');
    }

    setProcessing(false);
  };

  const todayRecords = getTodayAttendance();

  return (
    <div className="upload-attendance">
      <div className="page-header">
        <h1>Upload Attendance</h1>
        <p className="page-subtitle">Upload a photo and auto-mark attendance for recognized faces</p>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {notification.type === 'success' ? (
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            ) : (
              <circle cx="12" cy="12" r="10" />
            )}
            {notification.type === 'success' ? (
              <polyline points="22 4 12 14.01 9 11.01" />
            ) : (
              <line x1="12" y1="8" x2="12" y2="12" />
            )}
          </svg>
          {notification.message}
        </div>
      )}

      <div className="upload-layout">
        <section className="upload-panel card">
          <div className="status-bar">
            {loading ? (
              <>
                <div className="apple-spinner"></div>
                <span>Loading face recognition models...</span>
              </>
            ) : (
              <>
                <div className={`status-dot ${modelsReady ? 'active' : ''}`} />
                <span>{status}</span>
              </>
            )}
          </div>

          <div className="upload-controls">
            <label className="file-input-wrap">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading || !modelsReady || processing}
              />
              <span>Select Image</span>
            </label>

            <button
              className="btn btn-primary"
              onClick={processImage}
              disabled={!imageSrc || processing || loading || !modelsReady}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {processing ? 'Processing...' : 'Process Image'}
            </button>
          </div>

          <div className="upload-preview">
            {imageSrc ? (
              <div className="preview-frame">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Uploaded for attendance"
                  onLoad={prepareCanvas}
                />
                <canvas ref={canvasRef} className="upload-overlay" />
              </div>
            ) : (
              <div className="preview-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M6 17l2 3h8l2-3" />
                </svg>
                <p>Upload a photo to begin</p>
              </div>
            )}
          </div>
        </section>

        <aside className="upload-sidebar card">
          <h3>Detection Result</h3>
          {!result ? (
            <p className="muted">No result yet. Upload and process an image.</p>
          ) : (
            <div className="result-grid">
              <div className="result-item">
                <span className="result-number">{result.detected}</span>
                <span className="result-label">Faces Detected</span>
              </div>
              <div className="result-item marked">
                <span className="result-number">{result.marked}</span>
                <span className="result-label">Marked</span>
              </div>
              <div className="result-item info">
                <span className="result-number">{result.alreadyMarked}</span>
                <span className="result-label">Already Present</span>
              </div>
              <div className="result-item unknown">
                <span className="result-number">{result.unknown}</span>
                <span className="result-label">Unknown</span>
              </div>
            </div>
          )}

          <h3>Today's Check-ins</h3>
          {todayRecords.length === 0 ? (
            <p className="muted">No check-ins yet today.</p>
          ) : (
            <div className="today-list">
              {todayRecords.map((record) => (
                <div key={record.id} className="today-item">
                  <strong>{record.personName}</strong>
                  <span>{record.time}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
