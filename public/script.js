document.addEventListener('DOMContentLoaded', () => {
    const startTrackingButton = document.getElementById('startTracking');
    const stopTrackingButton = document.getElementById('stopTracking');
    const toggleVideoButton = document.getElementById('toggleVideo');
    const videoStreamElement = document.getElementById('videoStream');
    const projectNameInput = document.getElementById('projectName');
    const historyList = document.getElementById('historyList');
    let ws;
    let peerConnection;
    let iceCandidatesQueue = [];
  
    function createWebSocket() {
      ws = new WebSocket('ws://localhost:3000');
  
      ws.onopen = () => console.log('WebSocket connection opened');
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setTimeout(createWebSocket, 1000); // Reconnect after 1 second
      };
      ws.onerror = error => console.error('WebSocket error:', error);
      ws.onmessage = async event => {
        const data = JSON.parse(event.data);
        if (data.type === 'videoStatus') {
          toggleVideoButton.innerText = data.isVideoEnabled ? 'Disable Video' : 'Enable Video';
        }
        if (data.type === 'timeUpdate') {
          updateTimeDisplay(data.elapsedTime);
        }
        if (data.type === 'offer') {
          await handleOffer(data.offer);
        } else if (data.type === 'answer') {
          await handleAnswer(data.answer);
        } else if (data.type === 'candidate') {
          await handleCandidate(data.candidate);
        }
      };
    }
  
    async function handleOffer(offer) {
      if (peerConnection.signalingState !== 'stable') {
        console.error('PeerConnection is not in stable state:', peerConnection.signalingState);
        return;
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: 'answer', answer: peerConnection.localDescription }));
      processIceCandidatesQueue();
    }
  
    async function handleAnswer(answer) {
      if (peerConnection.signalingState !== 'have-local-offer') {
        console.error('PeerConnection is not in have-local-offer state:', peerConnection.signalingState);
        return;
      }
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      processIceCandidatesQueue();
    }
  
    async function handleCandidate(candidate) {
      if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        iceCandidatesQueue.push(candidate);
      }
    }
  
    function processIceCandidatesQueue() {
      while (iceCandidatesQueue.length) {
        const candidate = iceCandidatesQueue.shift();
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    }
  
    function ensureWebSocketOpen(callback) {
      if (ws.readyState === WebSocket.OPEN) {
        callback();
      } else {
        ws.addEventListener('open', () => callback(), { once: true });
      }
    }
  
    createWebSocket();
  
    startTrackingButton.addEventListener('click', () => {
      ensureWebSocketOpen(() => {
        if (startTrackingButton.innerText === 'Start Tracking') {
          startTracking(projectNameInput.value);
        } else {
          stopTracking();
        }
      });
    });
  
    toggleVideoButton.addEventListener('click', () => {
      ensureWebSocketOpen(toggleVideo);
    });
  
    let startTime;
    let timerInterval;
    let localStream;
    let mediaRecorder;
    let recordedChunks = [];
  
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
  
    function startTracking(projectName) {
      fetch('/api/time/dev/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          startTime = new Date(data.timeEntry.startTime);
          timerInterval = setInterval(updateTime, 1000);
          ws.send(JSON.stringify({ type: 'startTracking', startTime }));
          startTrackingButton.innerText = 'Stop Tracking';
          stopTrackingButton.disabled = false;
          console.log('Tracking started:', startTime);
        } else {
          console.error('Error starting time tracking:', data.error);
        }
      })
      .catch(error => console.error('Error starting time tracking:', error));
    }
  
    function stopTracking() {
      fetch('/api/time/dev/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          clearInterval(timerInterval);
          updateTime();
          ws.send(JSON.stringify({ type: 'stopTracking', endTime: new Date() }));
          startTrackingButton.innerText = 'Start Tracking';
          stopTrackingButton.disabled = true;
          addTimeEntryToHistory(data.timeEntry);
          console.log('Tracking stopped');
        } else {
          console.error('Error stopping time tracking:', data.error);
        }
      })
      .catch(error => console.error('Error stopping time tracking:', error));
    }
  
    async function toggleVideo() {
      console.log('Toggling video');
      try {
        const response = await fetch('/api/videos/toggle-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVideoEnabled: toggleVideoButton.innerText === 'Enable Video' })
        });
        const data = await response.json();
        if (data.success) {
          const buttonLabel = data.isVideoEnabled ? 'Disable Video' : 'Enable Video';
          toggleVideoButton.innerText = buttonLabel;
          ws.send(JSON.stringify({ type: 'videoStatus', isVideoEnabled: data.isVideoEnabled }));
          if (data.isVideoEnabled) {
            startVideoStream();
          } else {
            stopVideoStream();
          }
          console.log('Video toggled:', data.isVideoEnabled);
        } else {
          console.error('Error toggling video:', data.error);
        }
      } catch (error) {
        console.error('Error toggling video:', error);
      }
    }
  
    function updateTime() {
      const currentTime = new Date();
      const elapsedTime = new Date(currentTime - startTime);
      const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');
      const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0');
      document.getElementById('timeDisplay').innerText = `Time: ${hours}:${minutes}:${seconds}`;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'timeUpdate', elapsedTime: `${hours}:${minutes}:${seconds}` }));
      } else {
        console.error('WebSocket is not open');
      }
    }
  
    async function startVideoStream() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoStreamElement.srcObject = localStream;
  
        mediaRecorder = new MediaRecorder(localStream);
        mediaRecorder.ondataavailable = event => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
          saveVideo(videoBlob);
          recordedChunks = [];
        };
        mediaRecorder.start();
  
        peerConnection = new RTCPeerConnection(config);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
          }
        };
        peerConnection.ontrack = event => {
          videoStreamElement.srcObject = event.streams[0];
        };
  
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: 'offer', offer: peerConnection.localDescription }));
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    }
  
    function stopVideoStream() {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        videoStreamElement.srcObject = null;
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }
      if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
      }
    }
  
    function saveVideo(videoBlob) {
        const formData = new FormData();
        formData.append('video', videoBlob, 'recording.webm');
        fetch('/api/videos/save-video', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Video saved successfully');
          } else {
            console.error('Error saving video:', data.error);
          }
        })
        .catch(error => console.error('Error saving video:', error));
      }
    
      function updateTimeDisplay(elapsedTime) {
        document.getElementById('timeDisplay').innerText = `Time: ${elapsedTime}`;
      }
    
      function addTimeEntryToHistory(timeEntry) {
        const historyElement = document.createElement('div');
        historyElement.classList.add('history-item');
    
        const entryDate = new Date(timeEntry.startTime).toLocaleDateString();
        const entryStartTime = new Date(timeEntry.startTime).toLocaleTimeString();
        const entryEndTime = new Date(timeEntry.endTime).toLocaleTimeString();
    
        historyElement.innerHTML = `
          <div><strong>Project:</strong> ${timeEntry.projectName}</div>
          <div><strong>Date:</strong> ${entryDate}</div>
          <div><strong>Start Time:</strong> ${entryStartTime}</div>
          <div><strong>End Time:</strong> ${entryEndTime}</div>
          <div><strong>Duration:</strong> ${calculateDuration(timeEntry.startTime, timeEntry.endTime)}</div>
        `;
        historyList.appendChild(historyElement);
      }
    
      function calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = new Date(end - start);
    
        const hours = String(duration.getUTCHours()).padStart(2, '0');
        const minutes = String(duration.getUTCMinutes()).padStart(2, '0');
        const seconds = String(duration.getUTCSeconds()).padStart(2, '0');
    
        return `${hours}:${minutes}:${seconds}`;
      }
    });
    