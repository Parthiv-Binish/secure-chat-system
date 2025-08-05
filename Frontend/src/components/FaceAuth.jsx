import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';

const FaceAuth = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef();
  const loginTimeoutRef = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('Loading tinyFaceDetector from /models...');
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        console.log('tinyFaceDetector loaded successfully');
        console.log('Loading faceLandmark68Net from /models...');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        console.log('faceLandmark68Net loaded successfully');
        console.log('Loading faceRecognitionNet from /models...');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        console.log('faceRecognitionNet loaded successfully');
      } catch (err) {
        console.error('Model loading error:', err);
        console.error('Failed URL:', err.request?.responseURL || 'Unknown');
        setError(`Failed to load face-api.js models: ${err.message}`);
      }
    };
    loadModels();
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        console.log('Webcam stream initialized');
      })
      .catch(err => {
        console.error('Webcam error:', err);
        setError('Camera access denied: ' + err.message);
      });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFace = async () => {
    if (!videoRef.current) {
      setError('Video feed not available');
      return null;
    }
    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detections) {
        setError('No face detected');
        return null;
      }
      return btoa(JSON.stringify(detections.descriptor));
    } catch (err) {
      console.error('Face detection error:', err);
      setError('Face detection failed: ' + err.message);
      return null;
    }
  };

  const handleRegister = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    const faceEncoding = await captureFace();
    if (!faceEncoding) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Sending registration request:', { username, face_encoding: faceEncoding });
      const response = await axios.post('/api/register', { username, face_encoding: faceEncoding });
      setError('');
      alert(response.data.message);
      setIsRegisterMode(false);
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);
      setError('Registration failed: ' + JSON.stringify(err.response?.data?.detail || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }
    if (isLoading) return;
    if (loginTimeoutRef.current) clearTimeout(loginTimeoutRef.current);

    setIsLoading(true);
    const faceEncoding = await captureFace();
    if (!faceEncoding) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Sending login request:', { username, face_encoding: faceEncoding });
      const response = await axios.post('/api/login', { username, face_encoding: faceEncoding });
      onLogin(response.data.access_token, username);
      setError('');
    } catch (err) {
      console.error('Login error:', err.response?.data || err);
      setError('Authentication failed: ' + JSON.stringify(err.response?.data?.detail || err.message));
    } finally {
      loginTimeoutRef.current = setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isRegisterMode ? 'Register Face' : 'Facial Authentication'}</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        className="auth-input"
        disabled={isLoading}
      />
      <video ref={videoRef} autoPlay className="auth-video"></video>
      {error && <p className="error">{error}</p>}
      <div className="auth-buttons">
        {isRegisterMode ? (
          <>
            <button onClick={handleRegister} className="auth-button" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            <button
              onClick={() => setIsRegisterMode(false)}
              className="auth-button secondary"
              disabled={isLoading}
            >
              Switch to Login
            </button>
          </>
        ) : (
          <>
            <button onClick={handleLogin} className="auth-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
              onClick={() => setIsRegisterMode(true)}
              className="auth-button secondary"
              disabled={isLoading}
            >
              Switch to Register
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FaceAuth;