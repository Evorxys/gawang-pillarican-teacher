document.addEventListener('DOMContentLoaded', function() {
    // Load and display user data
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        document.getElementById('teacherName').textContent = userData.name;
        document.getElementById('roomId').textContent = userData.room_id;
        document.getElementById('userId').textContent = userData.user_id;
        document.getElementById('userPosition').textContent = userData.position;
        document.getElementById('userCount').textContent = userData.connected_users.length;
        
        // Update user list
        const userList = document.getElementById('userList');
        userList.innerHTML = userData.connected_users
            .map(user => `<div class="user-item">${user}</div>`)
            .join('');
    }

    // Message sending functionality
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const teacherChatbox = document.getElementById('teacherChatbox');
    const studentChatbox = document.getElementById('studentChatbox');

    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // Add message to teacher's chatbox
            const messageElement = document.createElement('div');
            messageElement.className = 'message teacher-message';
            messageElement.textContent = `${userData.name}: ${message}`;
            teacherChatbox.appendChild(messageElement);
            
            // Clear input and scroll
            messageInput.value = '';
            teacherChatbox.scrollTop = teacherChatbox.scrollHeight;
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
});

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
