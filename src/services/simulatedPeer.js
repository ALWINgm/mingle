// Simulated Peer Engine for Mingle
// Generates realistic canvas MediaStreams and dynamic conversation personas

const BOT_PERSONAS = [
  {
    name: "Alex",
    location: "London, UK",
    interests: ["Coding", "Music", "Gaming"],
    avatarColor: "#8b5cf6",
    messages: [
      "Hey there! How's it going?",
      "Nice to meet you! What are you working on today?",
      "I love music and game dev! What about you?",
      "Haha that's awesome! Have you tried the filters on here yet?",
      "Catch you later, happy coding!"
    ]
  },
  {
    name: "Elena",
    location: "Barcelona, Spain",
    interests: ["Art", "Travel", "Movies"],
    avatarColor: "#06b6d4",
    messages: [
      "Hola! Greetings from Barcelona!",
      "The connection here is so crisp!",
      "What kind of movies do you enjoy?",
      "That's super cool! I love creative design.",
      "Great chatting with you!"
    ]
  },
  {
    name: "Kai",
    location: "Tokyo, Japan",
    interests: ["Anime", "Technology", "General"],
    avatarColor: "#ec4899",
    messages: [
      "Konnichiwa! Hope you're having a great day!",
      "Are you also into tech and design?",
      "Awesome! I'm testing out Mingle app right now.",
      "The WebRTC connection feels instant!",
      "Have fun mingling!"
    ]
  },
  {
    name: "Maya",
    location: "Vancouver, Canada",
    interests: ["Photography", "Nature", "Coding"],
    avatarColor: "#10b981",
    messages: [
      "Hey! Cool camera setup you have!",
      "I'm just taking a quick coffee break.",
      "What's your favorite topic to talk about?",
      "Pretty neat app, isn't it?",
      "Talk soon!"
    ]
  }
];

export class SimulatedPeer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.animationId = null;
    this.persona = null;
    this.messageIndex = 0;
    this.chatCallback = null;
    this.isTalking = false;
  }

  createCanvasStream(width = 640, height = 480) {
    if (typeof window === 'undefined') return null;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    // Pick random persona
    this.persona = BOT_PERSONAS[Math.floor(Math.random() * BOT_PERSONAS.length)];
    this.messageIndex = 0;

    let particleAngle = 0;

    const renderFrame = () => {
      if (!this.ctx) return;
      const w = this.canvas.width;
      const h = this.canvas.height;

      // Dark background gradient
      const bgGrad = this.ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, w, h);

      // Ambient glowing background circles
      particleAngle += 0.02;
      const glowX = w / 2 + Math.cos(particleAngle) * 40;
      const glowY = h / 2 + Math.sin(particleAngle * 0.7) * 30;

      const radGrad = this.ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, 220);
      radGrad.addColorStop(0, this.persona.avatarColor + '40');
      radGrad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = radGrad;
      this.ctx.fillRect(0, 0, w, h);

      // Render Avatar Silhouette / Face representation
      const centerX = w / 2;
      const centerY = h / 2 - 10;

      // Head circle
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY - 25, 55, 0, Math.PI * 2);
      this.ctx.fillStyle = this.persona.avatarColor;
      this.ctx.shadowColor = this.persona.avatarColor;
      this.ctx.shadowBlur = 20;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Inner face highlights
      this.ctx.beginPath();
      this.ctx.arc(centerX - 18, centerY - 35, 8, 0, Math.PI * 2);
      this.ctx.arc(centerX + 18, centerY - 35, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();

      // Pupils
      this.ctx.beginPath();
      this.ctx.arc(centerX - 18 + Math.cos(particleAngle * 2) * 3, centerY - 35, 4, 0, Math.PI * 2);
      this.ctx.arc(centerX + 18 + Math.cos(particleAngle * 2) * 3, centerY - 35, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fill();

      // Mouth (animated when talking)
      this.ctx.beginPath();
      if (this.isTalking) {
        const mouthHeight = 10 + Math.abs(Math.sin(particleAngle * 8)) * 12;
        this.ctx.ellipse(centerX, centerY - 5, 14, mouthHeight, 0, 0, Math.PI * 2);
      } else {
        this.ctx.arc(centerX, centerY - 10, 15, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
      }
      if (this.isTalking) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
      }

      // Shoulders
      this.ctx.beginPath();
      this.ctx.ellipse(centerX, centerY + 110, 110, 60, 0, Math.PI, 0, true);
      this.ctx.fillStyle = this.persona.avatarColor + 'dd';
      this.ctx.fill();

      // Name & Location Tag
      this.ctx.font = 'bold 18px Outfit, sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`${this.persona.name} • ${this.persona.location}`, centerX, h - 35);

      this.ctx.font = '13px Inter, sans-serif';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillText(`Interests: ${this.persona.interests.join(', ')}`, centerX, h - 15);

      // Simulated Live Watermark
      this.ctx.font = '500 12px Inter, sans-serif';
      this.ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('● SIMULATED PEER STREAM', 20, 30);

      this.animationId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    this.stream = this.canvas.captureStream(30);
    return {
      stream: this.stream,
      persona: this.persona
    };
  }

  startChatSimulation(onMessageReceived) {
    this.chatCallback = onMessageReceived;
    
    // Initial greeting after 1.5s
    setTimeout(() => {
      this.sendNextMessage();
    }, 1500);

    // Subsequent messages every 8-12 seconds
    this.intervalId = setInterval(() => {
      this.sendNextMessage();
    }, 9000);
  }

  sendNextMessage() {
    if (!this.persona || !this.chatCallback) return;
    const msg = this.persona.messages[this.messageIndex % this.persona.messages.length];
    this.messageIndex++;

    // Trigger talking animation
    this.isTalking = true;
    setTimeout(() => {
      this.isTalking = false;
    }, 2500);

    this.chatCallback({
      sender: this.persona.name,
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPeer: true
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.canvas = null;
    this.ctx = null;
  }
}
