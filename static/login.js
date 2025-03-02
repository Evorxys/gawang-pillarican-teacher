document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.textContent = '👁️‍🗨️';
    } else {
        passwordInput.type = 'password';
        this.textContent = '👁️';
    }
});

function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

document.getElementById('generateBtn').addEventListener('click', function() {
    document.getElementById('roomId').value = generateRoomId();
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        roomId: document.getElementById('roomId').value,
        password: document.getElementById('password').value,
        server: document.getElementById('serverSelect').value
    };

    // Log the data being sent
    console.log('Sending form data:', formData);

    fetch('/join-room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data);  // Log server response
        if (data.success) {
            localStorage.setItem('userData', JSON.stringify(data.user_data));
            window.location.href = data.redirect;
        } else {
            alert('Error: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to join room: ' + error.message);
    });
});
