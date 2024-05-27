document.addEventListener('DOMContentLoaded', () => {
    const startTrackingButton = document.getElementById('startTracking');
    const toggleVideoButton = document.getElementById('toggleVideo');
    const videoStreamElement = document.getElementById('videoStream');
    const projectNameInput = document.getElementById('projectName');
    const ws = new WebSocket('ws://localhost:3000');
    let startTime;
    let timerInterval;
    let localStream;
    let peerConnection;
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    };

    ws.onopen = () => {
        console.log('WebSocket connection opened');
    };

    ws.onmessage = async event => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'videoStatus':
                toggleVideoButton.innerText = data.isVideoEnabled ? 'Disable Video' : 'Enable Video';
                break;
            case 'timeUpdate':
                updateTimeDisplay(data.elapsedTime);
                break;
            case 'offer':
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                ws.send(JSON.stringify({ type: 'answer', answer: answer }));
                break;
            case 'answer':
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                break;
            case 'candidate':
                if (data.candidate) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
                break;
        }
    };

    if (startTrackingButton) {
        startTrackingButton.addEventListener('click', () => {
            if (startTrackingButton.innerText === 'Start Tracking') {
                startTracking(ws, projectNameInput.value);
            } else {
                stopTracking(ws);
            }
        });
    }

    if (toggleVideoButton) {
        toggleVideoButton.addEventListener('click', () => toggleVideo(ws));
    }

    function startTracking(ws, projectName) {
        fetch('/time/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                startTime = new Date(data.timeEntry.startTime);
                timerInterval = setInterval(updateTime, 1000);
                ws.send(JSON.stringify({ type: 'startTracking', startTime: startTime }));
                startTrackingButton.innerText = 'Stop Tracking';
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
                startTrackingButton.innerText = 'Start Tracking';
                addTimeEntryToHistory(data.timeEntry);
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

    function addTimeEntryToHistory(timeEntry) {
        const historyElement = document.getElementById('timeHistory');
        const entryElement = document.createElement('div');
        const entryDate = new Date(timeEntry.startTime).toLocaleDateString();
        const entryStartTime = new Date(timeEntry.startTime).toLocaleTimeString();
        const entryEndTime = new Date(timeEntry.endTime).toLocaleTimeString();

        entryElement.innerText = `${entryDate} - ${timeEntry.projectName}: ${entryStartTime} - ${entryEndTime}`;
        historyElement.appendChild(entryElement);
    }
});
