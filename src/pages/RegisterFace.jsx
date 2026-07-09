import { useRef, useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { loadModels, faceapi } from '../utils/faceApi';
import './RegisterFace.css';

export default function RegisterFace() {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);

  const { registeredFaces, registerFace, removeFace } = useAttendance();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading models...');
  const [captured, setCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [notification, setNotification] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadModels()
      .then((success) => {
        if (success) {
          setModelsReady(true);
          setStatus('Models loaded. Start camera to register faces.');
        } else {
          setStatus('Failed to load models. Check browser console (F12).');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Model load error:', err);
        setStatus('Failed to load models: ' + err.message);
        setLoading(false);
      });
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
      setCaptured(false);
      setCapturedImage(null);
      setFaceDetected(false);
      setStatus('Camera active. Position your face in the frame.');
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('Camera error: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setFaceDetected(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Live face detection on the camera preview
  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!video || !canvas) return;

    if (video.videoWidth === 0) {
      setTimeout(handleVideoPlay, 100);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let running = false;

    const detect = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      if (running) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }
      running = true;

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.6 }))
          .withFaceLandmarks();

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {
          setFaceDetected(true);
          for (const det of detections) {
            const box = det.detection.box;
            // Mirror x to match CSS scaleX(-1) on video
            const mx = canvas.width - box.x - box.width;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.strokeRect(mx, box.y, box.width, box.height);

            ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.fillRect(mx, box.y - 26, 80, 26);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px system-ui';
            ctx.fillText('Face ✓', mx + 6, box.y - 7);
          }
          setStatus('Face detected! Enter a name and click Capture.');
        } else {
          setFaceDetected(false);
          setStatus('No face found. Look directly at the camera.');
        }
      } catch (err) {
        console.error('Live detection error:', err);
      }

      running = false;
      animFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      showNotification('Camera not ready.', 'error');
      return;
    }

    // Draw the current video frame onto a temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    // Don't mirror - keep original orientation for detection
    ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    const imageData = tempCanvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    setCaptured(true);
    stopCamera();
    setStatus('Photo captured. Enter a name and click Register.');

    if (!faceDetected) {
      showNotification('Face is not detected clearly in this capture. Try again with better lighting.', 'error');
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      showNotification('Please enter a name.', 'error');
      return;
    }
    if (!rollNumber.trim()) {
      showNotification('Please enter a roll number.', 'error');
      return;
    }
    if (!captured || !capturedImage) {
      showNotification('Capture a photo first.', 'error');
      return;
    }

    const normalizedRoll = rollNumber.trim().toLowerCase();
    const hasDuplicateRoll = registeredFaces.some(
      (face) => (face.rollNumber || '').toLowerCase() === normalizedRoll
    );
    if (hasDuplicateRoll) {
      showNotification('This roll number is already registered.', 'error');
      return;
    }

    setRegistering(true);
    setStatus('Running face detection on captured photo...');

    try {
      const img = new Image();
      img.src = capturedImage;

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Image load timeout')), 5000);
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('Failed to load captured image'));
        };
      });

      console.log('Captured image loaded:', img.width, 'x', img.height);

      let descriptor = null;
      let detection = await faceapi
        .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) descriptor = detection.descriptor;

      if (!descriptor) {
        const retry = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (retry) descriptor = retry.descriptor;
      }

      if (!descriptor) {
        const all = await faceapi
          .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (all && all.length > 0) {
          // choose largest face box as focal user
          const best = all.reduce((bestSoFar, candidate) => {
            const area = candidate.detection.box.width * candidate.detection.box.height;
            const bestArea = bestSoFar.detection.box.width * bestSoFar.detection.box.height;
            return area > bestArea ? candidate : bestSoFar;
          }, all[0]);
          descriptor = best.descriptor;
        }
      }

      console.log('Final descriptor:', !!descriptor);

      if (!descriptor) {
        showNotification(
          'No face detected. Tips: face the camera directly, ensure good lighting, remove glasses/masks.',
          'error'
        );
        setStatus('Detection failed. Retake with better lighting/angle.');
        setRegistering(false);
        return;
      }

      await registerFace(name.trim(), rollNumber.trim(), descriptor);
      showNotification(`${name.trim()} (${rollNumber.trim()}) registered successfully!`, 'success');
      setName('');
      setRollNumber('');
      setCaptured(false);
      setCapturedImage(null);
      setStatus('Done! Register another person or mark attendance.');
    } catch (err) {
      console.error('Registration error:', err);
      showNotification('Error: ' + (err.message || 'Unknown error'), 'error');
      setStatus('Registration failed. Try again.');
    }

    setRegistering(false);
  };

  const retake = () => {
    setCaptured(false);
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="register-face">
      <div className="page-header">
        <h1>Register Face</h1>
        <p className="page-subtitle">Add a new person to the attendance system</p>
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
              <>
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            )}
          </svg>
          {notification.message}
        </div>
      )}

      <div className="register-container">
        <div className="register-camera-section">
          <div className="camera-wrapper">
            {captured && capturedImage ? (
              <img src={capturedImage} alt="Captured" className="captured-preview" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onPlay={handleVideoPlay}
                className={isStreaming ? 'visible' : 'hidden'}
              />
            )}
            {isStreaming && !captured && (
              <canvas ref={overlayCanvasRef} className="overlay-canvas" />
            )}
            {!isStreaming && !captured && (
              <div className="camera-placeholder">
                {loading ? (
                  <div className="apple-spinner"></div>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M6 17l2 3h8l2-3" />
                  </svg>
                )}
                <p>{loading ? 'Initializing camera...' : 'Camera is off'}</p>
              </div>
            )}
          </div>

          <div className="status-bar">
            {loading ? (
              <>
                <div className="apple-spinner"></div>
                <span>{status}</span>
              </>
            ) : (
              <>
                <div className={`status-dot ${isStreaming ? (faceDetected ? 'detected' : 'active') : ''}`} />
                <span>{status}</span>
              </>
            )}
          </div>

          <div className="register-form">
            <input
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="name-input"
              disabled={registering}
            />
            <input
              type="text"
              placeholder="Enter roll number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="name-input"
              disabled={registering}
            />

            <div className="register-controls">
              {!isStreaming && !captured && (
                <button
                  className="btn btn-primary"
                  onClick={startCamera}
                  disabled={!modelsReady || loading}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {loading ? 'Loading Models...' : 'Start Camera'}
                </button>
              )}

              {isStreaming && (
                <button className="btn btn-secondary" onClick={capturePhoto}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Capture Photo
                </button>
              )}

              {captured && (
                <>
                  <button className="btn btn-secondary" onClick={retake}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                    </svg>
                    Retake
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {registering ? 'Registering...' : 'Register Face'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="registered-list">
          <h3>Registered People ({registeredFaces.length})</h3>
          {registeredFaces.length === 0 ? (
            <div className="list-empty">
              <p>No one registered yet</p>
            </div>
          ) : (
            <div className="person-list">
              {registeredFaces.map((face) => (
                <div key={face.id} className="person-item">
                  <div className="person-avatar">
                    {face.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="person-info">
                    <span className="person-name">{face.name}</span>
                    <span className="person-roll">Roll No: {face.rollNumber || 'N/A'}</span>
                    <span className="person-date">
                      Registered {new Date(face.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => setConfirmDelete({ id: face.id, name: face.name })}
                    title="Remove"
                    aria-label={`Remove ${face.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Remove Person?</h3>
            <p>Are you sure you want to remove <strong>{confirmDelete.name}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  removeFace(confirmDelete.id);
                  showNotification(`${confirmDelete.name} removed.`, 'info');
                  setConfirmDelete(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
