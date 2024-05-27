document.addEventListener('DOMContentLoaded', () => {
    const startTrackingButton = document.getElementById('startTracking');
    const stopTrackingButton = document.getElementById('stopTracking');
    const toggleVideoButton = document.getElementById('toggleVideo');
    const videoStreamElement = document.getElementById('videoStream');
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket connection opened');
    };

    ws.onmessage = async event => {
        const data = JSON.parse(event.data);
        if (data.type === 'videoStatus') {
            toggleVideoButton.innerText = data.isVideoEnabled ? 'Disable Video' : 'Enable Video';
        }
        if (data.type === 'timeUpdate') {
            updateTimeDisplay(data.elapsedTime);
        }
        if (data.type === 'offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer: answer }));
        } else if (data.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        } else if (data.type === 'candidate') {
            if (data.candidate) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        }
    };

    if (startTrackingButton) {
        startTrackingButton.addEventListener('click', () => startTracking(ws));
    }
    if (stopTrackingButton) {
        stopTrackingButton.addEventListener('click', () => stopTracking(ws));
    }
    if (toggleVideoButton) {
        toggleVideoButton.addEventListener('click', () => toggleVideo(ws));
    }

    let startTime;
    let timerInterval;
    let localStream;
    let peerConnection;
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    };

    function startTracking(ws) {
        fetch('/time/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                startTime = new Date(data.timeEntry.startTime);
                timerInterval = setInterval(updateTime, 1000);
                ws.send(JSON.stringify({ type: 'startTracking', startTime: startTime }));
                console.log('Tracking started:', startTime);
            } else {
                console.error('Error starting time tracking:', data.error);
            }
        })
        .catch(error => {
            console.error('Error starting time tracking:', error);
        });
    }

    function stopTracking(ws) {
        fetch('/time/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                clearInterval(timerInterval);
                updateTime();
                ws.send(JSON.stringify({ type: 'stopTracking', endTime: new Date() }));
                console.log('Tracking stopped');
            } else {
                console.error('Error stopping time tracking:', data.error);
            }
        })
        .catch(error => {
            console.error('Error stopping time tracking:', error);
        });
    }

    async function toggleVideo(ws) {
        fetch('/toggle-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const buttonLabel = data.isVideoEnabled ? 'Disable Video' : 'Enable Video';
                toggleVideoButton.innerText = buttonLabel;
                ws.send(JSON.stringify({ type: 'videoStatus', isVideoEnabled: data.isVideoEnabled }));
                if (data.isVideoEnabled) {
                    startVideoStream(ws);
                } else {
                    stopVideoStream();
                }
                console.log('Video toggled:', data.isVideoEnabled);
            } else {
                console.error('Error toggling video:', data.error);
            }
        })
        .catch(error => {
            console.error('Error toggling video:', error);
        });
    }

    function updateTime() {
        const currentTime = new Date();
        const elapsedTime = new Date(currentTime - startTime);

        const hours = String(elapsedTime.getUTCHours()).padStart(2, '0');
        const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, '0');

        document.getElementById('timeDisplay').innerText = `Time: ${hours}:${minutes}:${seconds}`;
        ws.send(JSON.stringify({ type: 'timeUpdate', elapsedTime: `${hours}:${minutes}:${seconds}` }));
    }

    async function startVideoStream(ws) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStreamElement.srcObject = localStream;

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
            ws.send(JSON.stringify({ type: 'offer', offer: offer }));

        } catch (error) {
            console.error('Error accessing webcam:', error);
        }
    }

    function stopVideoStream() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            videoStreamElement.srcObject = null;
        }
        if (peerConnection) {
            peerConnection.close();
            peerConnection = null;
        }
    }

    function updateTimeDisplay(elapsedTime) {
        document.getElementById('timeDisplay').innerText = `Time: ${elapsedTime}`;
    }
});
