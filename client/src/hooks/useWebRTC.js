import { useState, useEffect, useRef, useCallback } from 'react';

// Free public STUN servers for WebRTC
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const useWebRTC = (socket, projectId, user) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: { stream, userName } }
  const [error, setError] = useState(null);
  const [isMediaActive, setIsMediaActive] = useState(false);
  
  // Track specific states
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }

  // 1. Initialize local media (camera & mic)
  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setIsMediaActive(true);
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera or microphone. Please ensure permissions are granted.');
      return null;
    }
  };

  const stopMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsMediaActive(false);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Helper to create a new peer connection
  const createPeerConnection = useCallback((peerSocketId, peerName, stream) => {
    const peerConnection = new RTCPeerConnection(iceServers);

    // Add our local stream tracks to the peer connection
    if (stream) {
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
    }

    // Handle receiving ICE candidates from the stun server
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', {
          to: peerSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle receiving tracks from the remote peer
    peerConnection.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [peerSocketId]: {
          stream: event.streams[0],
          userName: peerName
        }
      }));
    };

    // Handle disconnection
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'closed') {
        setRemoteStreams(prev => {
          const newState = { ...prev };
          delete newState[peerSocketId];
          return newState;
        });
        delete peersRef.current[peerSocketId];
      }
    };

    peersRef.current[peerSocketId] = peerConnection;
    return peerConnection;
  }, [socket]);

  useEffect(() => {
    if (!socket || !user) return;

    // 2. Someone joined the room, we should create an offer and send it to them
    socket.on('user-joined-collab', async ({ userId, userName, socketId }) => {
      console.log('User joined, initiating WebRTC connection:', userName);
      
      const pc = createPeerConnection(socketId, userName, localStream);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('webrtc-offer', {
          to: socketId,
          offer,
          userName: user.name
        });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    });

    // 3. We received an offer from someone who was already in the room when we joined
    socket.on('webrtc-offer', async ({ from, userName, offer }) => {
      console.log('Received WebRTC offer from:', userName);
      
      const pc = createPeerConnection(from, userName, localStream);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('webrtc-answer', {
          to: from,
          answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // 4. We received an answer to our offer
    socket.on('webrtc-answer', async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    // 5. We received an ICE candidate
    socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // 6. User left cleanly
    socket.on('user-left-collab', ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
        
        setRemoteStreams(prev => {
          const newState = { ...prev };
          delete newState[socketId];
          return newState;
        });
      }
    });

    return () => {
      socket.off('user-joined-collab');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-left-collab');
    };
  }, [socket, localStream, user, createPeerConnection]);

  // Cleanup all connections on unmount
  useEffect(() => {
    return () => {
      stopMedia();
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, []);

  return {
    localStream,
    remoteStreams,
    error,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
    isMediaActive
  };
};
