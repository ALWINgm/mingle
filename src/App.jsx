import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header.jsx';
import VideoGrid from './components/VideoGrid.jsx';
import ControlBar from './components/ControlBar.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import FilterModal from './components/FilterModal.jsx';
import WelcomeModal from './components/WelcomeModal.jsx';
import { WebRTCEngine } from './services/webrtcEngine.js';
import { soundFx } from './services/soundEffects.js';

export default function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerInfo, setPeerInfo] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');

  const [selectedTag, setSelectedTag] = useState('Fun');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [selectedSticker, setSelectedSticker] = useState('none');

  const [messages, setMessages] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true);

  const engineRef = useRef(null);
  const durationTimerRef = useRef(null);

  // Acquire camera + mic
  const initMediaDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setLocalStream(stream);
      engineRef.current?.setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('[Mingle] Camera/Mic unavailable, using fallback:', err.message);
      // Canvas fallback when no real camera is available
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d');
      let t = 0;
      const draw = () => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = `hsl(${t++ % 360}, 70%, 60%)`;
        ctx.font = 'bold 26px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📷 No Camera', 320, 220);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('Camera permission denied', 320, 260);
        requestAnimationFrame(draw);
      };
      draw();
      const fallback = canvas.captureStream(15);
      setLocalStream(fallback);
      engineRef.current?.setLocalStream(fallback);
      return fallback;
    }
  };

  // Timer helpers
  const startCallTimer = () => {
    stopCallTimer();
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
  };
  const stopCallTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  // Initialise WebRTC engine once
  useEffect(() => {
    const engine = new WebRTCEngine({
      onRemoteStream: (stream, info) => {
        setRemoteStream(stream);
        setPeerInfo(info);
      },
      onConnectionState: (state) => {
        setConnectionState(state);

        if (state === 'connected') {
          soundFx.playMatchFound();
          confetti({ particleCount: 50, spread: 65, origin: { y: 0.8 } });
          startCallTimer();
          setMessages([{ isSystem: true, text: '🎉 You are now connected with a stranger!' }]);
        }

        if (state === 'peer_left') {
          soundFx.playDisconnect();
          stopCallTimer();
          setRemoteStream(null);
          setPeerInfo(null);
          setMessages(prev => [...prev, { isSystem: true, text: '⚡ Stranger has left the call.' }]);
        }

        if (state === 'idle') {
          stopCallTimer();
          setRemoteStream(null);
          setPeerInfo(null);
        }
      },
      onChatMessage: (msg) => {
        soundFx.playMessageReceived();
        setMessages(prev => [...prev, msg]);
      },
      onOnlineCount: (count) => setOnlineCount(count)
    });

    engineRef.current = engine;
    initMediaDevices();

    return () => {
      engine.destroy();
      stopCallTimer();
    };
  }, []);

  // Handlers
  const handleStartSearch = () => {
    setMessages([]);
    setRemoteStream(null);
    setPeerInfo(null);
    engineRef.current?.findPeer(selectedTag);
  };

  const handleSkipPeer = () => {
    soundFx.playDisconnect();
    stopCallTimer();
    setMessages([]);
    setRemoteStream(null);
    setPeerInfo(null);
    engineRef.current?.findPeer(selectedTag);
  };

  const handleStop = () => {
    soundFx.playDisconnect();
    stopCallTimer();
    setRemoteStream(null);
    setPeerInfo(null);
    setMessages([]);
    engineRef.current?.stop();
  };

  const handleToggleMute = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  };

  const handleToggleVideo = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoOff(!track.enabled); }
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setLocalStream(screen);
        engineRef.current?.setLocalStream(screen);
        setIsScreenSharing(true);
        screen.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          initMediaDevices();
        };
      } catch { /* cancelled */ }
    } else {
      setIsScreenSharing(false);
      initMediaDevices();
    }
  };

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    soundFx.playMessageSent();
    const msg = {
      sender: 'You', text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPeer: false
    };
    setMessages(prev => [...prev, msg]);
    engineRef.current?.sendChatMessage(text);
  };

  const handleSendReaction = (emoji) => {
    // Send the emoji as a chat message so the stranger sees it too
    handleSendMessage(emoji);
  };

  const handleTakeSnapshot = () => {
    alert('📸 Snapshot saved!');
  };

  const handleReportUser = () => {
    alert('🚩 User reported. Finding you a new match...');
    handleSkipPeer();
  };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--bg-dark)', overflow: 'hidden'
    }}>
      <Header
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(soundFx.toggleSound())}
        onlineCount={onlineCount}
        onOpenRules={() => setIsWelcomeModalOpen(true)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video + Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <VideoGrid
            localStream={localStream}
            remoteStream={remoteStream}
            peerInfo={peerInfo}
            connectionState={connectionState}
            activeFilter={activeFilter}
            selectedSticker={selectedSticker}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            callDuration={callDuration}
            onStartSearch={handleStartSearch}
            onSendReaction={handleSendReaction}
          />
          <ControlBar
            connectionState={connectionState}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            onToggleMute={handleToggleMute}
            onToggleVideo={handleToggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onStartSearch={handleStartSearch}
            onSkipPeer={handleSkipPeer}
            onStop={handleStop}
            onOpenFilters={() => setIsFilterModalOpen(true)}
            onTakeSnapshot={handleTakeSnapshot}
            onReportUser={handleReportUser}
          />
        </div>

        {/* Chat Sidebar */}
        <ChatPanel
          messages={messages}
          isConnected={connectionState === 'connected'}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
        />
      </div>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        selectedSticker={selectedSticker}
        onSelectSticker={setSelectedSticker}
      />

      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onAccept={() => setIsWelcomeModalOpen(false)}
      />
    </div>
  );
}
