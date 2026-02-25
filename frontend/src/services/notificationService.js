// Notification Service with Browser Notifications and Sound

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.sound = null;
    this.enabled = true; // User preference for notifications (can be toggled)
    this.init();
    // Load user preference from localStorage
    const savedPreference = localStorage.getItem('notificationsEnabled');
    if (savedPreference !== null) {
      this.enabled = savedPreference === 'true';
    }
  }

  init() {
    // Check if browser supports notifications
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
    
    // Use a simple web audio API beep sound
    this.createBeepSound();
  }

  // Create a simple beep sound using Web Audio API
  createBeepSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.playSound = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };
    } catch (error) {
      console.error('Error creating audio:', error);
      this.playSound = () => {}; // Fallback to no sound
    }
  }

  // Toggle notifications on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('notificationsEnabled', this.enabled.toString());
    return this.enabled;
  }

  // Check if notifications are enabled
  isEnabled() {
    return this.enabled && this.permission === 'granted';
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Play notification sound (will be replaced by createBeepSound)
  // playSound() method is created in createBeepSound()

  // Show desktop notification
  show(title, options = {}) {
    // Check if notifications are enabled by user
    if (!this.enabled) {
      console.log('Notifications are disabled by user');
      return;
    }

    // Play sound
    this.playSound();

    // Show browser notification if permitted
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        requireInteraction: false,
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };

      return notification;
    }
  }

  // Notification for new request (for team leads)
  notifyNewRequest(request) {
    this.show('New Query Request', {
      body: `${request.developerName} requested to run a query on ${request.dbInstanceName}`,
      tag: `request-${request._id}`,
    });
  }

  // Notification for request approved/executed
  notifyRequestApproved(request) {
    this.show('Request Approved ✓', {
      body: `Your query request for ${request.dbInstanceName} has been approved and executed`,
      tag: `request-${request._id}`,
    });
  }

  // Notification for request rejected
  notifyRequestRejected(request) {
    this.show('Request Rejected ✗', {
      body: `Your query request for ${request.dbInstanceName} was rejected${request.reviewComment ? `: ${request.reviewComment}` : ''}`,
      tag: `request-${request._id}`,
    });
  }

  // Notification for request failed
  notifyRequestFailed(request) {
    this.show('Request Failed ⚠', {
      body: `Your query execution on ${request.dbInstanceName} failed. Please review and resubmit.`,
      tag: `request-${request._id}`,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
