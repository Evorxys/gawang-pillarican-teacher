document.addEventListener('DOMContentLoaded', function() {
    // Load and display user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        // Update user details
        document.getElementById('teacherName').textContent = userData.name;
        document.getElementById('userId').textContent = userData.user_id;
        document.getElementById('userPosition').textContent = userData.position;
        document.getElementById('userCount').textContent = userData.connected_users.length;
        
        // Update room details
        document.getElementById('roomId').textContent = userData.room_id;
        document.getElementById('serverName').textContent = userData.server;
        
        // Initialize password toggle functionality
        const togglePasswordBtn = document.getElementById('togglePasswordDisplay');
        const passwordValue = document.getElementById('passwordValue');
        let isPasswordVisible = false;

        togglePasswordBtn.addEventListener('click', function() {
            isPasswordVisible = !isPasswordVisible;
            if (isPasswordVisible) {
                passwordValue.textContent = userData.password;
                passwordValue.classList.remove('password-hidden');
                this.textContent = '👁️‍🗨️';
            } else {
                passwordValue.textContent = '••••••';
                passwordValue.classList.add('password-hidden');
                this.textContent = '👁️';
            }
        });

        // Update user list
        const userList = document.getElementById('userList');
        userList.innerHTML = userData.connected_users
            .map(user => `<div class="user-item">${user}</div>`)
            .join('');
    }

    // Add this after userData is loaded
    const togglePasswordBtn = document.getElementById('togglePasswordDisplay');
    const passwordValue = document.getElementById('passwordValue');
    let isPasswordVisible = false;

    togglePasswordBtn.addEventListener('click', function() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.password) return;

        isPasswordVisible = !isPasswordVisible;
        if (isPasswordVisible) {
            passwordValue.textContent = userData.password;
            passwordValue.classList.remove('password-hidden');
            this.textContent = '👁️‍🗨️';
        } else {
            passwordValue.textContent = '••••••';
            passwordValue.classList.add('password-hidden');
            this.textContent = '👁️';
        }
    });

    // Message sending functionality
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const teacherChatbox = document.getElementById('teacherChatbox');
    const studentChatbox = document.getElementById('studentChatbox');

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    let canSendMessage = true; // Add this flag at the top level

    function sendMessage() {
        const message = messageInput.value.trim();
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (message && userData && canSendMessage) {
            // Disable sending for 1 second
            canSendMessage = false;
            const sendButton = document.getElementById('sendButton');
            sendButton.disabled = true;
            sendButton.style.opacity = '0.5';

            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: userData.room_id,
                    server: userData.server,
                    password: userData.password,
                    message: message,
                    name: userData.name,
                    position: userData.position,
                    userId: userData.user_id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message teacher-message';
                    messageElement.textContent = `${userData.name}: ${message}`;
                    teacherChatbox.appendChild(messageElement);
                    
                    messageInput.value = '';
                    teacherChatbox.scrollTop = teacherChatbox.scrollHeight;
                }
            })
            .catch(error => {
                console.error('Error sending message:', error);
            })
            .finally(() => {
                // Re-enable sending after 1 second
                setTimeout(() => {
                    canSendMessage = true;
                    sendButton.disabled = false;
                    sendButton.style.opacity = '1';
                }, 1000); // 1 second cooldown
            });
        }
    }

    // Example function for receiving student messages
    function receiveStudentMessage(studentName, message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message student-message';
        messageElement.textContent = `${studentName}: ${message}`;
        studentChatbox.appendChild(messageElement);
        studentChatbox.scrollTop = studentChatbox.scrollHeight;
    }

    // Add this after existing message handling code
    function loadStudentMessages() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) return;

        fetch('/get-student-messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomId: userData.room_id,
                server: userData.server,
                password: userData.password
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Student messages response:', data); // Debug log
            if (data.success && Array.isArray(data.messages)) {
                const studentChatbox = document.getElementById('studentChatbox');
                if (!studentChatbox) {
                    console.error('Student chatbox element not found');
                    return;
                }

                // Clear existing messages
                studentChatbox.innerHTML = '';
                
                // Add messages in chronological order
                data.messages.forEach(msg => {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message student-message';
                    messageElement.textContent = `${msg.name}: ${msg.message}`;
                    studentChatbox.appendChild(messageElement);
                });
                
                // Always scroll to bottom to show latest messages
                studentChatbox.scrollTop = studentChatbox.scrollHeight;
            } else {
                console.error('Invalid message data received:', data);
            }
        })
        .catch(error => {
            console.error('Error loading student messages:', error);
        });
    }

    function loadTeacherMessages() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) return;

        fetch('/get-teacher-messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                roomId: userData.room_id,
                server: userData.server,
                password: userData.password
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && Array.isArray(data.messages)) {
                const teacherChatbox = document.getElementById('teacherChatbox');
                if (!teacherChatbox) return;

                teacherChatbox.innerHTML = '';
                
                data.messages.forEach(msg => {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message teacher-message';
                    messageElement.textContent = `${msg.name}: ${msg.message}`;
                    teacherChatbox.appendChild(messageElement);
                });
                
                teacherChatbox.scrollTop = teacherChatbox.scrollHeight;
            }
        })
        .catch(error => console.error('Error loading teacher messages:', error));
    }

    // Load both types of messages and set up refresh intervals with longer delays
    loadTeacherMessages();
    loadStudentMessages();

    // Change intervals to 3 seconds for teacher messages and 2 seconds for student messages
    setInterval(loadTeacherMessages, 3000);
    setInterval(loadStudentMessages, 2000);

    // Update room users with a 4-second delay
    setInterval(updateRoomUsers, 4000);

    // Control buttons functionality
    document.getElementById('exitBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to exit? This will remove all users from the room.')) {
            try {
                const userData = JSON.parse(localStorage.getItem('userData'));
                const response = await fetch('/exit-room', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roomId: userData.room_id,
                        server: userData.server,
                        password: userData.password // You'll need to store this in userData during login
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    localStorage.removeItem('userData');
                    window.location.href = '/';
                } else {
                    alert('Error exiting room: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to exit room properly');
            }
        }
    });

    document.getElementById('saveBtn').addEventListener('click', async () => {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) return;
    
        // Convert logo to base64
        try {
            const logoResponse = await fetch('/uploads/olpcc.png');
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(logoBlob);
            });
    
            const teacherChatbox = document.getElementById('teacherChatbox');
            const messages = teacherChatbox.innerHTML;
            const modifiedMessages = messages.replace(
                /<div class="message teacher-message">(.*?):(.*?)<\/div>/g, 
                '$1: $2\n'
            );
    
            // Create document content with embedded base64 logo
            const docContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
                <head>
                <meta charset="utf-8">
                <title>Room Chat Log</title>
                <style>
                    body { font-family: 'Times New Roman', serif; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .school-name { font-size: 18pt; font-weight: bold; margin-bottom: 10px; }
                    .details { margin: 20px 0; padding-left: 20px; }
                    .messages { margin-top: 20px; }
                    .message { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { border: 1px solid #000; padding: 8px; }
                    @page { size: A4; margin: 2cm; }
                    .logo { width: 100px; height: auto; }
                    /* Add watermark styles */
                    .watermark-header {
                        position: fixed;
                        top: 0;
                        width: 100%;
                        text-align: center;
                        font-size: 14pt;
                        color: rgba(128, 128, 128, 0.3);
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        pointer-events: none;
                        padding: 10px 0;
                    }
                    
                    .watermark-footer {
                        position: fixed;
                        bottom: 0;
                        width: 100%;
                        text-align: center;
                        font-size: 14pt;
                        color: rgba(128, 128, 128, 0.3);
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        pointer-events: none;
                        padding: 10px 0;
                    }
                </style>
                </head>
                <body>
                    <div class="watermark-header">GAWANG-PILLARICAN-STUDENT</div>
                    <div class="header">
                        <img src="${logoBase64}" alt="Logo" class="logo" style="width:100px; height:auto;"><br>
                        <div class="school-name">OUR LADY OF THE PILLAR COLLEGE - CAUAYAN</div>
                        <div>Room Chat Log</div>
                    </div>
        
                    <div class="details">
                        <table>
                            <tr>
                                <th colspan="2">Room Information</th>
                            </tr>
                            <tr>
                                <td><strong>Room ID:</strong></td>
                                <td>${userData.room_id}</td>
                            </tr>
                            <tr>
                                <td><strong>Server:</strong></td>
                                <td>${userData.server}</td>
                            </tr>
                            <tr>
                                <td><strong>Teacher:</strong></td>
                                <td>${userData.name}</td>
                            </tr>
                            <tr>
                                <td><strong>Date:</strong></td>
                                <td>${new Date().toLocaleString()}</td>
                            </tr>
                        </table>
                    </div>
        
                    <div class="messages">
                        <h3>Messages:</h3>
                        ${modifiedMessages.replace(/<[^>]+>/g, '').split('\n').filter(msg => msg.trim())
                            .map(msg => `<div class="message">• ${msg.trim()}</div>`).join('')}
                    </div>
                    <div class="watermark-footer">GAWANG-PILLARICAN-STUDENT</div>
                </body>
                </html>
            `;
    
            // Create mimeType for Word document
            const blob = new Blob([docContent], { 
                type: 'application/msword;charset=utf-8'
            });
            const url = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            
            const date = new Date();
            const filename = `room-${userData.room_id}-${date.toISOString().split('T')[0]}.doc`;
            
            downloadLink.href = url;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            window.URL.revokeObjectURL(url);
    
        } catch (error) {
            console.error('Error creating document:', error);
            alert('Error creating document. Please try again.');
        }
    });

    document.getElementById('printBtn').addEventListener('click', () => {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) return;

        const printWindow = window.open('', '_blank');
        const teacherChatbox = document.getElementById('teacherChatbox');
        
        const messages = teacherChatbox.innerHTML;
        const modifiedMessages = messages.replace(
            /<div class="message teacher-message">(.*?):(.*?)<\/div>/g, 
            '<div class="message">• $2</div>'
        );
        
        const printContent = `
            <html>
            <head>
                <title>Teacher Messages - Room ${userData.room_id}</title>
                <style>
                    @page {
                        margin: 2cm;
                    }
                    body { 
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                        line-height: 1.5;
                    }
                    .header { 
                        margin-bottom: 30px;
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #000080;
                    }
                    .logo {
                        width: 120px;
                        height: auto;
                    }
                    .header-text {
                        flex: 1;
                    }
                    .school-name {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        color: #000080;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .header-info {
                        margin: 5px 0;
                        font-size: 14px;
                        color: #333;
                    }
                    .messages {
                        padding-left: 20px;
                    }
                    .message { 
                        margin: 4px 0;
                        padding: 4px 8px;
                        text-align: left;
                        font-size: 14px;
                        page-break-inside: avoid;
                    }
                    hr {
                        border: none;
                        border-top: 1px solid #ccc;
                        margin: 20px 0;
                    }
                    @media print {
                        body {
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                        .message {
                            break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/uploads/olpcc.png" alt="Logo" class="logo">
                    <div class="header-text">
                        <div class="school-name">OUR LADY OF THE PILLAR COLLEGE - CAUAYAN</div>
                        <div class="header-info"><strong>Room ID:</strong> ${userData.room_id}</div>
                        <div class="header-info"><strong>Server:</strong> ${userData.server}</div>
                        <div class="header-info"><strong>Teacher:</strong> ${userData.name}</div>
                    </div>
                </div>
                <div class="messages">
                    ${modifiedMessages}
                </div>
            </body>
            </html>
        `;

        // Write and print
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();
            };
        };
    });

    // Speak button functionality
    let recognition = null;
    let tempMessageElement = null;

    document.getElementById('speakBtn').addEventListener('click', function() {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) return;

        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser');
            return;
        }

        const speakBtn = this;
        const teacherChatbox = document.getElementById('teacherChatbox');

        // If recognition is already active, stop it
        if (recognition) {
            recognition.stop();
            recognition = null;
            speakBtn.classList.remove('active');
            speakBtn.innerHTML = '<i class="mic-icon"></i>Speak';
            
            // Send final message if there's content
            if (tempMessageElement && tempMessageElement.textContent.trim()) {
                const finalMessage = tempMessageElement.textContent.replace(`${userData.name}: `, '');
                sendVoiceMessage(finalMessage);
            }
            tempMessageElement = null;
            return;
        }

        // Create new recognition instance
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Create temporary message element
        tempMessageElement = document.createElement('div');
        tempMessageElement.className = 'message teacher-message temp-message';
        tempMessageElement.textContent = `${userData.name}: `;
        teacherChatbox.appendChild(tempMessageElement);
        teacherChatbox.scrollTop = teacherChatbox.scrollHeight;

        // Start recording
        recognition.start();
        speakBtn.classList.add('active');
        speakBtn.innerHTML = '<i class="mic-icon"></i>Listening...';

        recognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            tempMessageElement.textContent = `${userData.name}: ${transcript}`;
            teacherChatbox.scrollTop = teacherChatbox.scrollHeight;
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            stopRecording();
        };

        recognition.onend = function() {
            stopRecording();
        };

        function stopRecording() {
            recognition = null;
            speakBtn.classList.remove('active');
            speakBtn.innerHTML = '<i class="mic-icon"></i>Speak';
            tempMessageElement = null;
        }

        function sendVoiceMessage(message) {
            if (!message.trim()) return;
            
            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: userData.room_id,
                    server: userData.server,
                    password: userData.password,
                    message: message,
                    name: userData.name,
                    position: userData.position,
                    userId: userData.user_id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error sending voice message');
                }
            })
            .catch(error => console.error('Error:', error));
        }
    });

    // Update room users initially and every 5 seconds
    updateRoomUsers();
    setInterval(updateRoomUsers, 5000);

    // Restore expanded state on page load
    const expandedSections = JSON.parse(localStorage.getItem('expandedSections') || '{}');
    Object.entries(expandedSections).forEach(([sectionId, isExpanded]) => {
        if (isExpanded) {
            const content = document.getElementById(sectionId);
            const header = content.previousElementSibling;
            content.classList.add('expanded');
            header.classList.add('expanded');
        }
    });
});

function updateRoomUsers() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;

    fetch('/get-room-users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roomId: userData.room_id,
            server: userData.server,
            password: userData.password
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('userCount').textContent = data.count;
            
            // Update user list
            const userList = document.getElementById('userList');
            userList.innerHTML = data.users
                .map(user => `<div class="user-item">${user}</div>`)
                .join('');
        }
    })
    .catch(error => console.error('Error updating room users:', error));
}

// Add styles for user items
const style = document.createElement('style');
style.textContent = `
    .user-item {
        padding: 8px;
        border-bottom: 1px solid #eee;
        color: #333;
    }
    .user-item:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);

function toggleSection(sectionId) {
    const content = document.getElementById(sectionId);
    const header = content.previousElementSibling;
    
    // Toggle expanded class
    content.classList.toggle('expanded');
    header.classList.toggle('expanded');
    
    // Store state in localStorage
    const expandedSections = JSON.parse(localStorage.getItem('expandedSections') || '{}');
    expandedSections[sectionId] = content.classList.contains('expanded');
    localStorage.setItem('expandedSections', JSON.stringify(expandedSections));
}
