import * as faceapi from 'face-api.js';

const BASE_URL = import.meta.env.BASE_URL || '/';
const MODEL_URL = `${BASE_URL.replace(/\/$/, '')}/models`;

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return true;

  try {
    console.log('Loading face-api models from:', MODEL_URL);
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    console.log('All face-api models loaded successfully');
    console.log('ssdMobilenetv1 loaded:', faceapi.nets.ssdMobilenetv1.isLoaded);
    console.log('faceLandmark68Net loaded:', faceapi.nets.faceLandmark68Net.isLoaded);
    console.log('faceRecognitionNet loaded:', faceapi.nets.faceRecognitionNet.isLoaded);
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    return false;
  }
}

export async function detectFace(imageElement) {
  if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
    console.error('ssdMobilenetv1 model not loaded');
    return null;
  }

  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection;
}

export async function detectAllFaces(imageElement) {
  if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
    console.error('ssdMobilenetv1 model not loaded');
    return [];
  }

  const detections = await faceapi
    .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections;
}

export function createFaceMatcher(registeredFaces) {
  if (!registeredFaces || registeredFaces.length === 0) return null;

  const labeledDescriptors = registeredFaces
    .filter((face) => face.descriptor && face.descriptor.length > 0)
    .map((face) => {
      const descriptor = new Float32Array(face.descriptor);
      return new faceapi.LabeledFaceDescriptors(face.name, [descriptor]);
    });

  if (labeledDescriptors.length === 0) return null;

  return new faceapi.FaceMatcher(labeledDescriptors, 0.45);
}

export async function getFaceDescriptor(imageElement) {
  const detection = await detectFace(imageElement);
  if (!detection) return null;
  return detection.descriptor;
}

export { faceapi };
