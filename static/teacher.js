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

    document.getElementById('saveBtn').addEventListener('click', () => {
        alert('Saving conversation...');
        // Add save functionality
    });

    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // Speak button functionality
    document.getElementById('speakBtn').addEventListener('click', function() {
        this.classList.toggle('active');
        // Add speak functionality
    });

    // Update room users initially and every 5 seconds
    updateRoomUsers();
    setInterval(updateRoomUsers, 5000);
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
