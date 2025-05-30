document.addEventListener('DOMContentLoaded', function() {
    // Performance monitoring
    const startTime = performance.now();
    
    // DOM Elements - Main UI
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const newChatBtn = document.getElementById('new-chat-btn');
    const chatHistory = document.getElementById('chat-history');
    const emptyHistory = document.getElementById('empty-history');
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const currentChatTitle = document.getElementById('current-chat-title');
    const conversationStatus = document.getElementById('conversation-status');
    const typingContainer = document.getElementById('typing-container');
    const charCounter = document.getElementById('char-counter');
    const charCount = document.getElementById('char-count');
    const loadingScreen = document.getElementById('loading-screen');
    const announcements = document.getElementById('announcements');
    
    // DOM Elements - Header Actions
    const downloadTranscriptBtn = document.getElementById('download-transcript-btn');
    const conversationInfoBtn = document.getElementById('conversation-info-btn');
    const moreOptionsBtn = document.getElementById('more-options-btn');
    const moreOptionsMenu = document.getElementById('more-options-menu');
    const resetConversationsBtn = document.getElementById('reset-conversations-btn');
    const privacyInfo = document.getElementById('privacy-info');
    
    // DOM Elements - Voice UI
    const voiceButton = document.getElementById('voice-button');
    const voiceModal = document.getElementById('voice-modal');
    const closeVoiceModal = document.getElementById('close-voice-modal');
    const startRecording = document.getElementById('start-recording');
    const pauseRecording = document.getElementById('pause-recording');
    const resumeRecording = document.getElementById('resume-recording');
    const resetRecording = document.getElementById('reset-recording');
    const sendVoice = document.getElementById('send-voice');
    const transcriptionResult = document.getElementById('transcription-result');
    const recordingIndicator = document.getElementById('recording-indicator');
    const waveformPath = document.getElementById('waveform-svg-path');
    const recordingStatus = document.getElementById('recording-status');
    
    // DOM Elements - Attachment UI
    const attachmentButton = document.getElementById('attachment-button');
    const fileInput = document.getElementById('file-input');
    const attachmentPreview = document.getElementById('attachment-preview');
    const attachmentName = document.getElementById('attachment-name');
    const attachmentSize = document.getElementById('attachment-size');
    const removeAttachment = document.getElementById('remove-attachment');
    
    // DOM Elements - Screenshot UI
    const screenshotButton = document.getElementById('screenshot-button');
    const screenshotPreview = document.getElementById('screenshot-preview');
    const screenshotThumbnail = document.getElementById('screenshot-thumbnail');
    const screenshotSize = document.getElementById('screenshot-size');
    const removeScreenshot = document.getElementById('remove-screenshot');
    const fullScreenshotModal = document.getElementById('full-screenshot-modal');
    const closeScreenshotModal = document.getElementById('close-screenshot-modal');
    const captureVisibleArea = document.getElementById('capture-visible-area');
    const captureFullPage = document.getElementById('capture-full-page');
    
    // DOM Elements - Screen Capture UI
    const screenCaptureButton = document.getElementById('screen-capture-button');
    const screenCaptureModal = document.getElementById('screen-capture-modal');
    const closeScreenCaptureModal = document.getElementById('close-screen-capture-modal');
    const startScreenCapture = document.getElementById('start-screen-capture');
    const captureScreenshot = document.getElementById('capture-screenshot');
    const stopScreenCapture = document.getElementById('stop-screen-capture');
    const sendScreenCapture = document.getElementById('send-screen-capture');
    const screenPreview = document.getElementById('screen-preview');
    const screenCanvas = document.getElementById('screen-canvas');
    const screenCapturePlaceholder = document.getElementById('screen-capture-placeholder');
    const screenCaptureStatus = document.getElementById('screen-capture-status');
    
    // DOM Elements - Modals
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmationIcon = document.getElementById('confirmation-icon');
    const confirmationCancel = document.getElementById('confirmation-cancel');
    const confirmationConfirm = document.getElementById('confirmation-confirm');
    const toastContainer = document.getElementById('toast-container');
    
    // State variables
    let conversations = [];
    let currentConversationId = generateId();
    let isRecording = false;
    let isPaused = false;
    let currentFile = null;
    let currentScreenshot = null;
    let screenStream = null;
    let isScreenSharing = false;
    let currentConfirmAction = null;
    let messageCount = 0;
    
    // Configuration
    const CONFIG = {
        MAX_MESSAGE_LENGTH: 4000,
        MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
        SUPPORTED_FILE_TYPES: {
            'image/': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'text/': ['txt', 'csv'],
            'application/pdf': ['pdf'],
            'application/vnd.': ['docx', 'xlsx', 'pptx'],
            'application/msword': ['doc'],
            'application/vnd.ms-excel': ['xls']
        },
        TOAST_DURATION: 3000,
        AUTO_SAVE_INTERVAL: 30000
    };
    
    // Speech Recognition Setup
    let recognition = null;
    
    // Initialize Speech Recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            transcriptionResult.innerHTML = `
                <span class="font-medium">${finalTranscript}</span>
                <span class="text-gray-400 italic">${interimTranscript}</span>
            `;
            
            if (finalTranscript.trim() !== '' || interimTranscript.trim() !== '') {
                sendVoice.disabled = false;
                recordingStatus.innerHTML = 'Speech detected! <span class="text-google-blue">✓</span>';
            } else {
                sendVoice.disabled = true;
            }
        };
        
        recognition.onend = function() {
            if (isRecording && !isPaused) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Error restarting recognition:', e);
                    handleRecordingError();
                }
            } else {
                isRecording = false;
                recordingIndicator.classList.add('hidden');
                startRecording.querySelector('i').className = 'fas fa-microphone';
                updateVoiceControls();
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            handleRecordingError();
            
            let errorMessage = 'Please try again.';
            switch (event.error) {
                case 'network':
                    errorMessage = 'Network error. Check your connection.';
                    break;
                case 'not-allowed':
                    errorMessage = 'Microphone access denied.';
                    break;
                case 'no-speech':
                    errorMessage = 'No speech detected.';
                    break;
            }
            
            transcriptionResult.innerHTML = `<span class="text-red-500">Error: ${errorMessage}</span>`;
        };
    }
    
    // Event Listeners Setup
    function setupEventListeners() {
        // Mobile sidebar toggle
        if (menuToggle) {
            menuToggle.addEventListener('click', toggleSidebar);
        }
        
        // Main navigation
        newChatBtn.addEventListener('click', startNewConversation);
        resetConversationsBtn.addEventListener('click', showResetConfirmation);
        
        // Header actions
        downloadTranscriptBtn.addEventListener('click', downloadTranscript);
        conversationInfoBtn.addEventListener('click', showConversationInfo);
        moreOptionsBtn.addEventListener('click', toggleMoreOptions);
        privacyInfo.addEventListener('click', showPrivacyInfo);
        
        // File handling
        attachmentButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        removeAttachment.addEventListener('click', removeFileAttachment);
        
        // Screenshot handling
        screenshotButton.addEventListener('click', () => fullScreenshotModal.classList.remove('hidden'));
        closeScreenshotModal.addEventListener('click', () => fullScreenshotModal.classList.add('hidden'));
        captureVisibleArea.addEventListener('click', handleVisibleAreaCapture);
        captureFullPage.addEventListener('click', handleFullPageCapture);
        removeScreenshot.addEventListener('click', removeScreenshotAttachment);
        
        // Screen capture handling
        screenCaptureButton.addEventListener('click', () => screenCaptureModal.classList.remove('hidden'));
        closeScreenCaptureModal.addEventListener('click', closeScreenCaptureModalFunc);
        startScreenCapture.addEventListener('click', startScreenSharingCapture);
        captureScreenshot.addEventListener('click', captureScreenshotFromStream);
        stopScreenCapture.addEventListener('click', stopScreenSharingCapture);
        sendScreenCapture.addEventListener('click', sendScreenCaptureImage);
        
        // Voice handling
        voiceButton.addEventListener('click', openVoiceModal);
        closeVoiceModal.addEventListener('click', closeVoiceModalFunc);
        startRecording.addEventListener('click', toggleRecording);
        pauseRecording.addEventListener('click', pauseVoiceRecording);
        resumeRecording.addEventListener('click', resumeVoiceRecording);
        resetRecording.addEventListener('click', resetVoiceUI);
        sendVoice.addEventListener('click', sendVoiceMessage);
        
        // Message input
        messageInput.addEventListener('input', handleInputChange);
        messageInput.addEventListener('keydown', handleKeyDown);
        sendButton.addEventListener('click', sendMessage);
        
        // Modal handling
        confirmationCancel.addEventListener('click', closeConfirmationModal);
        confirmationConfirm.addEventListener('click', executeConfirmAction);
        
        // Click outside to close modals
        document.addEventListener('click', handleOutsideClick);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleGlobalKeydown);
        
        // Window events
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('online', () => showToast('Connection restored', 'success'));
        window.addEventListener('offline', () => showToast('Connection lost', 'error'));
    }
    
    // Utility Functions
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function formatTimestamp(date) {
        const now = new Date();
        const messageDate = new Date(date);
        const diff = now - messageDate;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        
        return messageDate.toLocaleDateString();
    }
    
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    function announce(message) {
        announcements.textContent = message;
        setTimeout(() => announcements.textContent = '', 1000);
    }
    
    // Toast Notification System
    function showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast-notification transform transition-all duration-300 translate-x-full opacity-0 bg-white rounded-lg shadow-lg border-l-4 p-4 mb-2 max-w-sm`;
        
        const icons = {
            success: 'fas fa-check-circle text-google-green',
            error: 'fas fa-exclamation-circle text-google-red',
            warning: 'fas fa-exclamation-triangle text-google-yellow',
            info: 'fas fa-info-circle text-google-blue'
        };
        
        const colors = {
            success: 'border-google-green',
            error: 'border-google-red',
            warning: 'border-google-yellow',
            info: 'border-google-blue'
        };
        
        toast.classList.add(colors[type]);
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-3" aria-hidden="true"></i>
                <span class="text-google-dark-gray">${escapeHtml(message)}</span>
                <button class="ml-auto text-google-gray hover:text-google-dark-gray" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        announce(message);
    }
    
    // Confirmation Modal System
    function showConfirmation(title, message, action, iconClass = 'fas fa-exclamation-triangle text-google-yellow') {
        confirmationTitle.textContent = title;
        confirmationMessage.textContent = message;
        confirmationIcon.className = iconClass;
        currentConfirmAction = action;
        confirmationModal.classList.remove('hidden');
        confirmationCancel.focus();
    }
    
    function closeConfirmationModal() {
        confirmationModal.classList.add('hidden');
        currentConfirmAction = null;
    }
    
    function executeConfirmAction() {
        if (currentConfirmAction) {
            currentConfirmAction();
        }
        closeConfirmationModal();
    }
    
    // Message Input Handling
    function handleInputChange() {
        const length = messageInput.value.length;
        charCount.textContent = length;
        
        if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
            charCounter.classList.add('text-google-red');
        } else if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.8) {
            charCounter.classList.add('text-google-yellow');
        } else {
            charCounter.classList.remove('text-google-red', 'text-google-yellow');
        }
        
        // Auto-resize textarea
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
        
        updateSendButtonState();
    }
    
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    function updateSendButtonState() {
        const hasContent = messageInput.value.trim() !== '' || currentFile || currentScreenshot;
        const isValid = messageInput.value.length <= CONFIG.MAX_MESSAGE_LENGTH;
        
        sendButton.disabled = !hasContent || !isValid;
        
        if (hasContent && isValid) {
            sendButton.classList.remove('opacity-50');
        } else {
            sendButton.classList.add('opacity-50');
        }
    }
    
    // File Handling
    function handleFileSelect(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            if (!validateFile(file)) {
                return;
            }
            
            currentFile = file;
            attachmentName.textContent = file.name;
            attachmentSize.textContent = formatFileSize(file.size);
            attachmentPreview.classList.remove('hidden');
            updateSendButtonState();
            
            showToast('File attached successfully', 'success');
        }
    }
    
    function validateFile(file) {
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            showToast(`File too large. Maximum size is ${formatFileSize(CONFIG.MAX_FILE_SIZE)}`, 'error');
            return false;
        }
        
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        const isSupported = Object.entries(CONFIG.SUPPORTED_FILE_TYPES).some(([type, extensions]) => {
            if (fileType.startsWith(type)) return true;
            return extensions.some(ext => fileName.endsWith('.' + ext));
        });
        
        if (!isSupported) {
            showToast('File type not supported', 'error');
            return false;
        }
        
        return true;
    }
    
    function removeFileAttachment() {
        currentFile = null;
        fileInput.value = '';
        attachmentPreview.classList.add('hidden');
        updateSendButtonState();
        showToast('File removed', 'info');
    }
    
    // Screenshot Handling
    function handleVisibleAreaCapture() {
        fullScreenshotModal.classList.add('hidden');
        captureVisibleAreaScreenshot();
    }
    
    function handleFullPageCapture() {
        fullScreenshotModal.classList.add('hidden');
        captureFullPageScreenshot();
    }
    
    async function captureVisibleAreaScreenshot() {
        try {
            showToast('Capturing visible area...', 'info');
            
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(document.body, {
                    height: window.innerHeight,
                    width: window.innerWidth,
                    scrollX: 0,
                    scrollY: 0,
                    useCORS: true,
                    allowTaint: true,
                    scale: 1,
                    logging: false
                });
                
                canvas.toBlob(function(blob) {
                    handleScreenshotCapture(blob, 'visible-area-screenshot.png');
                }, 'image/png', 0.9);
            } else {
                await fallbackScreenCapture();
            }
        } catch (error) {
            console.error('Error capturing visible area:', error);
            showToast('Failed to capture visible area. Please try screen share option.', 'error');
        }
    }
    
    async function captureFullPageScreenshot() {
        try {
            showToast('Capturing full page...', 'info');
            
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(document.body, {
                    height: document.body.scrollHeight,
                    width: document.body.scrollWidth,
                    useCORS: true,
                    allowTaint: true,
                    scale: 0.8,
                    logging: false
                });
                
                canvas.toBlob(function(blob) {
                    handleScreenshotCapture(blob, 'full-page-screenshot.png');
                }, 'image/png', 0.8);
            } else {
                await fallbackScreenCapture();
            }
        } catch (error) {
            console.error('Error capturing full page:', error);
            showToast('Failed to capture full page. Please try screen share option.', 'error');
        }
    }
    
    async function fallbackScreenCapture() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' }
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                canvas.toBlob(function(blob) {
                    handleScreenshotCapture(blob, 'screen-capture.png');
                }, 'image/png', 0.9);
                
                stream.getTracks().forEach(track => track.stop());
            };
        } catch (error) {
            console.error('Fallback screen capture failed:', error);
            showToast('Screen capture is not supported in your browser.', 'error');
        }
    }
    
    function handleScreenshotCapture(blob, filename) {
        const file = new File([blob], filename, { type: 'image/png' });
        currentScreenshot = file;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            screenshotThumbnail.src = e.target.result;
            screenshotSize.textContent = formatFileSize(file.size);
            screenshotPreview.classList.remove('hidden');
            updateSendButtonState();
        };
        reader.readAsDataURL(file);
        
        showToast('Screenshot captured successfully', 'success');
    }
    
    function removeScreenshotAttachment() {
        currentScreenshot = null;
        screenshotPreview.classList.add('hidden');
        updateSendButtonState();
        showToast('Screenshot removed', 'info');
    }
    
    // Screen Sharing Functions
    async function startScreenSharingCapture() {
        try {
            screenCaptureStatus.textContent = 'Starting screen share...';
            
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            
            screenStream = stream;
            screenPreview.srcObject = stream;
            screenPreview.classList.remove('hidden');
            screenCapturePlaceholder.classList.add('hidden');
            
            startScreenCapture.classList.add('hidden');
            captureScreenshot.classList.remove('hidden');
            stopScreenCapture.classList.remove('hidden');
            isScreenSharing = true;
            
            screenCaptureStatus.innerHTML = '<span class="text-green-500">●</span> Screen sharing active - Click capture to take screenshot';
            showToast('Screen sharing started', 'success');
            
            stream.getVideoTracks()[0].onended = () => {
                stopScreenSharingCapture();
                showToast('Screen sharing stopped', 'info');
            };
            
        } catch (error) {
            console.error('Error starting screen capture:', error);
            screenCaptureStatus.textContent = 'Failed to start screen share. Please try again.';
            showToast('Failed to start screen sharing', 'error');
            resetScreenCaptureUI();
        }
    }
    
    function captureScreenshotFromStream() {
        if (!screenStream || !isScreenSharing) return;
        
        try {
            const video = screenPreview;
            const canvas = screenCanvas;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.classList.remove('hidden');
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            screenPreview.classList.add('hidden');
            
            canvas.toBlob(function(blob) {
                const file = new File([blob], 'screen-capture.png', { type: 'image/png' });
                currentScreenshot = file;
                
                sendScreenCapture.classList.remove('hidden');
                sendScreenCapture.disabled = false;
                captureScreenshot.disabled = true;
                
                screenCaptureStatus.innerHTML = '<span class="text-google-blue">✓</span> Screenshot captured! You can send it now.';
                showToast('Screenshot captured from screen share', 'success');
            }, 'image/png', 0.9);
            
        } catch (error) {
            console.error('Error capturing screenshot from stream:', error);
            screenCaptureStatus.textContent = 'Failed to capture screenshot. Please try again.';
            showToast('Failed to capture screenshot', 'error');
        }
    }
    
    function stopScreenSharingCapture() {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        
        isScreenSharing = false;
        resetScreenCaptureUI();
    }
    
    function sendScreenCaptureImage() {
        if (currentScreenshot) {
            screenCaptureModal.classList.add('hidden');
            addMessage('user', '', currentScreenshot);
            processMessage('', currentScreenshot);
            currentScreenshot = null;
            resetScreenCaptureUI();
            showToast('Screenshot sent', 'success');
        }
    }
    
    function resetScreenCaptureUI() {
        screenPreview.classList.add('hidden');
        screenCanvas.classList.add('hidden');
        screenCapturePlaceholder.classList.remove('hidden');
        
        startScreenCapture.classList.remove('hidden');
        captureScreenshot.classList.add('hidden');
        stopScreenCapture.classList.add('hidden');
        sendScreenCapture.classList.add('hidden');
        
        captureScreenshot.disabled = false;
        sendScreenCapture.disabled = true;
        
        screenCaptureStatus.textContent = 'Ready to capture screen';
        currentScreenshot = null;
    }
    
    function closeScreenCaptureModalFunc() {
        screenCaptureModal.classList.add('hidden');
        stopScreenSharingCapture();
    }
    
    // Voice Functions
    function openVoiceModal() {
        voiceModal.classList.remove('hidden');
        resetVoiceUI();
        recordingStatus.textContent = 'Click the microphone to start recording';
    }
    
    function closeVoiceModalFunc() {
        voiceModal.classList.add('hidden');
        stopRecording();
    }
    
    function toggleRecording() {
        if (!isRecording) {
            startVoiceRecording();
        } else {
            stopRecording();
        }
    }
    
    function startVoiceRecording() {
        if (recognition) {
            try {
                recognition.start();
                isRecording = true;
                isPaused = false;
                recordingIndicator.classList.remove('hidden');
                startRecording.querySelector('i').className = 'fas fa-stop';
                transcriptionResult.innerHTML = '';
                sendVoice.disabled = true;
                
                recordingStatus.innerHTML = '<span class="text-red-500 animate-pulse">●</span> Recording... speak now';
                animateWaveform(true);
                updateVoiceControls();
                showToast('Voice recording started', 'info');
            } catch (e) {
                console.error('Error starting recognition', e);
                handleRecordingError();
            }
        } else {
            showToast('Speech recognition is not supported in your browser.', 'error');
        }
    }
    
    function pauseVoiceRecording() {
        if (isRecording && !isPaused && recognition) {
            recognition.stop();
            isPaused = true;
            animateWaveform(false);
            updateVoiceControls();
            recordingStatus.innerHTML = '<span class="text-yellow-500">⏸</span> Recording paused';
        }
    }
    
    function resumeVoiceRecording() {
        if (isRecording && isPaused && recognition) {
            try {
                recognition.start();
                isPaused = false;
                animateWaveform(true);
                updateVoiceControls();
                recordingStatus.innerHTML = '<span class="text-red-500 animate-pulse">●</span> Recording resumed... speak now';
            } catch (e) {
                console.error('Error resuming recognition', e);
                handleRecordingError();
            }
        }
    }
    
    function stopRecording() {
        if (recognition && isRecording) {
            recognition.stop();
            isRecording = false;
            isPaused = false;
            recordingIndicator.classList.add('hidden');
            startRecording.querySelector('i').className = 'fas fa-microphone';
            animateWaveform(false);
            
            if (transcriptionResult.textContent.trim() !== '') {
                recordingStatus.innerHTML = '<span class="text-google-blue">✓</span> Recording complete. You can send or reset.';
            } else {
                recordingStatus.textContent = 'Recording stopped. Click microphone to try again.';
            }
            
            updateVoiceControls();
        }
    }
    
    function handleRecordingError() {
        isRecording = false;
        recordingIndicator.classList.add('hidden');
        startRecording.querySelector('i').className = 'fas fa-microphone';
        updateVoiceControls();
        animateWaveform(false);
    }
    
    function updateVoiceControls() {
        if (isRecording) {
            pauseRecording.disabled = isPaused;
            resumeRecording.disabled = !isPaused;
            resetRecording.disabled = false;
        } else {
            pauseRecording.disabled = true;
            resumeRecording.disabled = true;
            resetRecording.disabled = true;
            sendVoice.disabled = transcriptionResult.textContent.trim() === '';
        }
    }
    
    function resetVoiceUI() {
        stopRecording();
        transcriptionResult.innerHTML = '';
        sendVoice.disabled = true;
        pauseRecording.disabled = true;
        resumeRecording.disabled = true;
        resetRecording.disabled = true;
        startRecording.querySelector('i').className = 'fas fa-microphone';
        recordingStatus.textContent = 'Click the microphone to start recording';
        waveformPath.setAttribute('d', 'M0,30 Q25,30 50,30 T100,30 T150,30 T200,30 T250,30 T300,30');
    }
    
    function sendVoiceMessage() {
        const text = transcriptionResult.textContent.trim();
        if (text) {
            sendVoice.disabled = true;
            recordingStatus.innerHTML = '<span class="text-green-500 animate-pulse">↑</span> Sending message...';
            
            setTimeout(() => {
                addMessage('user', text);
                transcriptionResult.innerHTML = '';
                voiceModal.classList.add('hidden');
                stopRecording();
                resetVoiceUI();
                processMessage(text, null, true);
                showToast('Voice message sent', 'success');
            }, 500);
        }
    }
    
    function animateWaveform(active) {
        if (active) {
            let lastValues = Array(20).fill(30);
            
            function updateWaveform() {
                if (!isRecording || isPaused) return;
                
                const points = [];
                const totalPoints = 20;
                
                for (let i = 0; i <= totalPoints; i++) {
                    const x = (i / totalPoints) * 300;
                    
                    if (i === 0 || i === totalPoints) {
                        points.push([x, 30]);
                        continue;
                    }
                    
                    let prevVal = lastValues[i];
                    let amplitude = Math.random() * 18 + 2;
                    
                    if (Math.random() < 0.05) {
                        amplitude += 15;
                    }
                    
                    let targetY = 30 - amplitude + Math.random() * (amplitude/3);
                    let y = prevVal + (targetY - prevVal) * 0.3;
                    
                    lastValues[i] = y;
                    points.push([x, y]);
                }
                
                let pathData = `M${points[0][0]},${points[0][1]}`;
                
                for (let i = 1; i < points.length; i++) {
                    const [x, y] = points[i];
                    const [prevX, prevY] = points[i-1];
                    
                    const cp1x = prevX + (x - prevX) * 0.4;
                    const cp1y = prevY;
                    const cp2x = prevX + (x - prevX) * 0.6;
                    const cp2y = y;
                    
                    pathData += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y}`;
                }
                
                waveformPath.setAttribute('d', pathData);
                
                if (isRecording && !isPaused) {
                    requestAnimationFrame(updateWaveform);
                }
            }
            
            requestAnimationFrame(updateWaveform);
        } else {
            waveformPath.style.transition = 'd 0.5s ease-out';
            waveformPath.setAttribute('d', 'M0,30 Q25,30 50,30 T100,30 T150,30 T200,30 T250,30 T300,30');
            
            setTimeout(() => {
                waveformPath.style.transition = '';
            }, 500);
        }
    }
    
    // Download Transcript Functionality
    function downloadTranscript() {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (!conversation || conversation.messages.length === 0) {
            showToast('No conversation to download', 'warning');
            return;
        }
        
        try {
            let transcript = `Google AI Assistant Conversation Transcript\n`;
            transcript += `Generated: ${new Date().toLocaleString()}\n`;
            transcript += `Conversation: ${conversation.title}\n`;
            transcript += `Messages: ${conversation.messages.length}\n`;
            transcript += `\n${'='.repeat(50)}\n\n`;
            
            conversation.messages.forEach((message, index) => {
                const timestamp = formatTimestamp(message.timestamp);
                const sender = message.sender === 'user' ? 'You' : 'AI Assistant';
                transcript += `[${timestamp}] ${sender}: ${message.message || '(Media attachment)'}\n\n`;
            });
            
            transcript += `\n${'='.repeat(50)}\n`;
            transcript += `End of transcript - Generated by Google AI Assistant`;
            
            const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `conversation-${conversation.id}-${new Date().toISOString().split('T')[0]}.txt`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Transcript downloaded successfully', 'success');
            announce('Conversation transcript downloaded');
        } catch (error) {
            console.error('Error downloading transcript:', error);
            showToast('Failed to download transcript', 'error');
        }
    }
    
    // Reset Conversations Functionality
    function showResetConfirmation() {
        if (conversations.length === 0) {
            showToast('No conversations to reset', 'info');
            return;
        }
        
        showConfirmation(
            'Reset All Conversations',
            `Are you sure you want to delete all ${conversations.length} conversations? This action cannot be undone.`,
            resetAllConversations,
            'fas fa-trash-alt text-google-red'
        );
    }
    
    function resetAllConversations() {
        try {
            conversations = [];
            localStorage.removeItem('google-dialogflow-conversations');
            
            // Start fresh conversation
            currentConversationId = generateId();
            createNewConversation(currentConversationId, 'New Conversation');
            
            // Clear UI
            messagesContainer.innerHTML = '';
            addWelcomeMessage();
            updateChatHistory();
            updateConversationInfo();
            
            showToast('All conversations reset successfully', 'success');
            announce('All conversations have been reset');
        } catch (error) {
            console.error('Error resetting conversations:', error);
            showToast('Failed to reset conversations', 'error');
        }
    }
    
    // Conversation Management
    function createNewConversation(id, title) {
        const conversation = {
            id,
            title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        conversations.push(conversation);
        saveConversations();
        return conversation;
    }
    
    function saveMessageToConversation(conversationId, message) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.messages.push({
                ...message,
                timestamp: new Date().toISOString(),
                id: generateId()
            });
            conversation.updatedAt = new Date().toISOString();
            saveConversations();
            updateConversationInfo();
        }
    }
    
    function updateConversationTitle(conversationId, title) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.title = title;
            conversation.updatedAt = new Date().toISOString();
            saveConversations();
            currentChatTitle.textContent = title;
            updateChatHistory();
        }
    }
    
    function saveConversations() {
        try {
            localStorage.setItem('google-dialogflow-conversations', JSON.stringify(conversations));
        } catch (e) {
            console.error('Error saving conversations to localStorage', e);
            showToast('Failed to save conversation', 'error');
        }
    }
    
    function loadConversations() {
        try {
            const saved = localStorage.getItem('google-dialogflow-conversations');
            if (saved) {
                conversations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading conversations from localStorage', e);
            conversations = [];
            showToast('Failed to load conversation history', 'warning');
        }
    }
    
    function updateChatHistory() {
        chatHistory.innerHTML = '';
        
        if (conversations.length === 0) {
            emptyHistory.classList.remove('hidden');
            return;
        }
        
        emptyHistory.classList.add('hidden');
        
        conversations
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .forEach(conversation => {
                const chatItem = document.createElement('div');
                chatItem.className = `chat-item ${conversation.id === currentConversationId ? 'active' : ''}`;
                chatItem.dataset.id = conversation.id;
                
                const messageCount = conversation.messages.length;
                const lastUpdate = formatTimestamp(conversation.updatedAt);
                
                chatItem.innerHTML = `
                    <i class="fas fa-message mr-3" aria-hidden="true"></i>
                    <div class="flex-1 min-w-0">
                        <div class="truncate font-medium">${escapeHtml(conversation.title)}</div>
                        <div class="text-xs text-white/60">${messageCount} messages • ${lastUpdate}</div>
                    </div>
                `;
                
                chatItem.addEventListener('click', () => loadConversation(conversation.id));
                chatHistory.appendChild(chatItem);
            });
    }
    
    function updateConversationInfo() {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation && conversation.messages.length > 0) {
            downloadTranscriptBtn.disabled = false;
            conversationStatus.classList.remove('hidden');
        } else {
            downloadTranscriptBtn.disabled = true;
            conversationStatus.classList.add('hidden');
        }
    }
    
    // Message Handling
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '' && !currentFile && !currentScreenshot) return;
        
        if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
            showToast(`Message too long. Maximum ${CONFIG.MAX_MESSAGE_LENGTH} characters.`, 'error');
            return;
        }
        
        // Add user message
        addMessage('user', message, currentFile || currentScreenshot);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        charCount.textContent = '0';
        charCounter.classList.remove('text-google-red', 'text-google-yellow');
        updateSendButtonState();
        
        // Handle attachments
        let fileData = null;
        if (currentFile) {
            fileData = {
                name: currentFile.name,
                type: currentFile.type,
                size: currentFile.size,
                isScreenshot: false
            };
            
            currentFile = null;
            fileInput.value = '';
            attachmentPreview.classList.add('hidden');
        } else if (currentScreenshot) {
            fileData = {
                name: currentScreenshot.name,
                type: currentScreenshot.type,
                size: currentScreenshot.size,
                isScreenshot: true
            };
            
            currentScreenshot = null;
            screenshotPreview.classList.add('hidden');
        }
        
        processMessage(message, fileData);
    }
    
    function processMessage(message, fileData = null, isVoiceInput = false) {
        showTypingIndicator();
        
        const data = {
            message: message || ''
        };
        
        if (fileData) {
            data.attachment = fileData;
        }
        
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            removeTypingIndicator();
            
            setTimeout(() => {
                addMessage('bot', data.response);
                
                // Update conversation title for first exchange
                const conversation = conversations.find(c => c.id === currentConversationId);
                if (conversation && conversation.messages.length === 2 && currentChatTitle.textContent === 'New Conversation') {
                    const title = message.length > 20 
                        ? message.substring(0, 20) + '...' 
                        : message || 'New Chat';
                    
                    updateConversationTitle(currentConversationId, title);
                }
                
                // Voice response
                if (isVoiceInput && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(data.response);
                    utterance.lang = 'en-US';
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;
                    window.speechSynthesis.speak(utterance);
                }
                
                updateConversationInfo();
            }, 500);
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator();
            
            let errorMessage = 'Sorry, there was an error processing your request.';
            if (error.message.includes('404')) {
                errorMessage = 'Service temporarily unavailable. Please try again.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            addMessage('bot', errorMessage);
            showToast('Failed to send message', 'error');
        });
    }
    
    function addMessage(sender, message, attachment = null) {
        const messageDiv = document.createElement('div');
        const messageId = generateId();
        messageDiv.dataset.messageId = messageId;
        messageDiv.className = sender === 'user' ? 'user-message flex items-start gap-4 mb-8' : 'bot-message flex items-start gap-4';
        messageDiv.setAttribute('role', 'article');
        messageDiv.setAttribute('aria-label', `${sender === 'user' ? 'Your' : 'AI'} message`);
        
        const timestamp = new Date().toISOString();
        let avatar, messageContent;
        
        if (sender === 'user') {
            avatar = `
                <div class="user-avatar w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-white" aria-hidden="true"></i>
                </div>
            `;
            
            let attachmentHTML = '';
            if (attachment) {
                if (attachment.type && attachment.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const imgElement = messageDiv.querySelector('.attachment-image');
                        if (imgElement) {
                            imgElement.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(attachment);
                    
                    attachmentHTML = `
                        <div class="mt-2 bg-google-light-gray rounded-lg p-2 max-w-xs border border-google-border">
                            <div class="flex items-center text-google-gray text-sm mb-2">
                                <i class="fas fa-${attachment.name.includes('screenshot') ? 'camera' : 'image'} mr-2" aria-hidden="true"></i>
                                <span>${escapeHtml(attachment.name || 'Image')}</span>
                            </div>
                            <img class="attachment-image max-w-full h-auto rounded" alt="Attachment preview" loading="lazy">
                        </div>
                    `;
                } else {
                    attachmentHTML = `
                        <div class="mt-2 flex items-center text-google-gray text-sm">
                            <i class="fas fa-paperclip mr-2" aria-hidden="true"></i>
                            <span>${escapeHtml(attachment.name || 'Attachment')}</span>
                        </div>
                    `;
                }
            }
            
            messageContent = `
                <div class="flex-1">
                    <div class="prose max-w-none">
                        ${message ? `<p>${escapeHtml(message)}</p>` : ''}
                    </div>
                    ${attachmentHTML}
                    <div class="text-xs text-google-gray mt-2">
                        <time datetime="${timestamp}">${formatTimestamp(timestamp)}</time>
                    </div>
                </div>
            `;
        } else {
            avatar = `
                <div class="avatar-gradient w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fab fa-google text-white" aria-hidden="true"></i>
                </div>
            `;
            
            const formattedMessage = formatBotMessage(message);
            
            messageContent = `
                <div class="flex-1">
                    <div class="prose max-w-none">
                        ${formattedMessage}
                    </div>
                    <div class="text-xs text-google-gray mt-2">
                        <time datetime="${timestamp}">${formatTimestamp(timestamp)}</time>
                    </div>
                </div>
            `;
        }
        
        messageDiv.innerHTML = avatar + messageContent;
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        
        messageDiv.classList.add('animate-fade-in');
        messageCount++;
        
        // Save to conversation
        saveMessageToConversation(currentConversationId, {
            sender,
            message,
            timestamp
        });
    }
    
    function addWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'flex items-start gap-4 bot-message';
        welcomeDiv.setAttribute('role', 'article');
        welcomeDiv.setAttribute('aria-label', 'Welcome message');
        
        const timestamp = new Date().toISOString();
        welcomeDiv.innerHTML = `
            <div class="avatar-gradient w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fab fa-google text-white" aria-hidden="true"></i>
            </div>
            <div class="flex-1">
                <div class="prose max-w-none">
                    <p>Hello! I'm your Google AI assistant powered by Dialogflow. How can I help you today?</p>
                </div>
                <div class="text-xs text-google-gray mt-2">
                    <time datetime="${timestamp}" id="welcome-time">${formatTimestamp(timestamp)}</time>
                </div>
            </div>
        `;
        messagesContainer.appendChild(welcomeDiv);
    }
    
    function showTypingIndicator() {
        typingContainer.classList.remove('hidden');
        scrollToBottom();
    }
    
    function removeTypingIndicator() {
        typingContainer.classList.add('hidden');
    }
    
    function formatBotMessage(message) {
        if (!message) return '';
        
        let formattedMessage = escapeHtml(message);
        
        // Code blocks
        formattedMessage = formattedMessage.replace(/```([\s\S]*?)```/g, function(match, code) {
            return `<pre><code>${code.trim()}</code></pre>`;
        });
        
        // Inline code
        formattedMessage = formattedMessage.replace(/`([^`]+)`/g, function(match, code) {
            return `<code>${code}</code>`;
        });
        
        // Bold text
        formattedMessage = formattedMessage.replace(/\*\*([^*]+)\*\*/g, function(match, text) {
            return `<strong>${text}</strong>`;
        });
        
        // Links
        formattedMessage = formattedMessage.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        });
        
        // Lists
        formattedMessage = formattedMessage.replace(/^\s*-\s+(.*?)$/gm, function(match, item) {
            return `<li>${item}</li>`;
        });
        
        // Paragraphs
        formattedMessage = formattedMessage.replace(/^(?!<pre|<code|<strong|<a|<li)(.+)$/gm, function(match, text) {
            return `<p>${text}</p>`;
        });
        
        return formattedMessage;
    }
    
    // Navigation Functions
    function startNewConversation() {
        const newId = generateId();
        createNewConversation(newId, 'New Conversation');
        currentConversationId = newId;
        currentChatTitle.textContent = 'New Conversation';
        
        messagesContainer.innerHTML = '';
        addWelcomeMessage();
        updateChatHistory();
        updateConversationInfo();
        
        messageInput.focus();
        showToast('New conversation started', 'success');
        announce('Started new conversation');
    }
    
    function loadConversation(conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        
        currentConversationId = conversationId;
        currentChatTitle.textContent = conversation.title;
        
        messagesContainer.innerHTML = '';
        addWelcomeMessage();
        
        conversation.messages.forEach(msg => {
            if (!msg.message && msg.sender !== 'bot') return;
            addMessage(msg.sender, msg.message);
        });
        
        updateChatHistory();
        updateConversationInfo();
        
        if (sidebar.classList.contains('open')) {
            toggleSidebar();
        }
        
        announce(`Loaded conversation: ${conversation.title}`);
    }
    
    // UI Event Handlers
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        
        let overlay = document.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
        
        overlay.classList.toggle('active');
    }
    
    function toggleMoreOptions() {
        const isExpanded = moreOptionsBtn.getAttribute('aria-expanded') === 'true';
        moreOptionsBtn.setAttribute('aria-expanded', !isExpanded);
        moreOptionsMenu.classList.toggle('hidden');
    }
    
    function showConversationInfo() {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (!conversation) return;
        
        const info = `
            Title: ${conversation.title}
            Messages: ${conversation.messages.length}
            Created: ${formatTimestamp(conversation.createdAt)}
            Updated: ${formatTimestamp(conversation.updatedAt)}
        `;
        
        showToast(info, 'info', 5000);
    }
    
    function showPrivacyInfo() {
        showToast('Your conversations are stored locally in your browser. No data is sent to external servers except for AI processing.', 'info', 5000);
    }
    
    function handleOutsideClick(e) {
        if (!moreOptionsBtn.contains(e.target) && !moreOptionsMenu.contains(e.target)) {
            moreOptionsMenu.classList.add('hidden');
            moreOptionsBtn.setAttribute('aria-expanded', 'false');
        }
        
        // Close modals on outside click
        if (e.target === voiceModal) closeVoiceModalFunc();
        if (e.target === screenCaptureModal) closeScreenCaptureModalFunc();
        if (e.target === fullScreenshotModal) fullScreenshotModal.classList.add('hidden');
        if (e.target === confirmationModal) closeConfirmationModal();
    }
    
    function handleGlobalKeydown(e) {
        // Escape key
        if (e.key === 'Escape') {
            if (!voiceModal.classList.contains('hidden')) closeVoiceModalFunc();
            if (!screenCaptureModal.classList.contains('hidden')) closeScreenCaptureModalFunc();
            if (!fullScreenshotModal.classList.contains('hidden')) fullScreenshotModal.classList.add('hidden');
            if (!confirmationModal.classList.contains('hidden')) closeConfirmationModal();
            
            moreOptionsMenu.classList.add('hidden');
            moreOptionsBtn.setAttribute('aria-expanded', 'false');
        }
        
        // Ctrl/Cmd + Enter to send message
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
        
        // Ctrl/Cmd + N for new conversation
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            startNewConversation();
        }
    }
    
    function handleBeforeUnload(e) {
        if (messageInput.value.trim() !== '') {
            e.preventDefault();
            e.returnValue = '';
        }
    }
    
    // Utility Functions
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function loadHtml2Canvas() {
        if (typeof html2canvas === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.integrity = 'sha512-dK+9o8Vu0/Lm5PLkKF1oJhGMdFkDnCbEjlBe0TzaLF3+lmM9n8F2VT6dD6JmALr3G6r4T6lAGfPzI6wkXwgrHw==';
            script.crossOrigin = 'anonymous';
            script.onload = () => console.log('html2canvas loaded successfully');
            script.onerror = () => console.warn('Failed to load html2canvas, using fallback methods');
            document.head.appendChild(script);
        }
    }
    
    // Auto-save functionality
    setInterval(() => {
        if (conversations.length > 0) {
            saveConversations();
        }
    }, CONFIG.AUTO_SAVE_INTERVAL);
    
    // Initialization
    function init() {
        console.log('Initializing Google AI Assistant...');
        
        // Setup event listeners
        setupEventListeners();
        
        // Load conversations
        loadConversations();
        
        // Load external libraries
        loadHtml2Canvas();
        
        // Initialize first conversation if none exist
        if (conversations.length === 0) {
            createNewConversation(currentConversationId, 'New Conversation');
            addWelcomeMessage();
        } else {
            // Load most recent conversation
            const mostRecent = conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            loadConversation(mostRecent.id);
        }
        
        updateChatHistory();
        updateConversationInfo();
        
        // Hide loading screen
        setTimeout(() => {
            loadingScreen.classList.add('opacity-0');
            setTimeout(() => loadingScreen.remove(), 300);
        }, 1000);
        
        // Focus message input
        messageInput.focus();
        
        // Performance log
        const loadTime = performance.now() - startTime;
        console.log(`Google AI Assistant loaded in ${loadTime.toFixed(2)}ms`);
        
        // Welcome announcement
        announce('Google AI Assistant is ready');
    }
    
    // Start the application
    init();
});