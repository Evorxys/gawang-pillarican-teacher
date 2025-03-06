function updateServerCounts() {
    fetch('/get-server-counts')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const serverSelect = document.getElementById('serverSelect');
                const options = serverSelect.options;
                
                for (let i = 1; i <= 3; i++) {
                    const count = data.counts[`server${i}`];
                    options[i].textContent = `Server ${i} (${count} rooms)`;
                }
            }
        })
        .catch(error => console.error('Error fetching server counts:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    updateServerCounts();
    // Refresh counts every 30 seconds
    setInterval(updateServerCounts, 30000);
    
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

    document.getElementById('generateBtn').addEventListener('click', function() {
        document.getElementById('roomId').value = generateRoomId();
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Disable the button and change text
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'CONNECTING...';
        
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
                // Re-enable button on error
                submitButton.disabled = false;
                submitButton.textContent = 'ENTER ROOM';
                alert('Error: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            // Re-enable button on error
            submitButton.disabled = false;
            submitButton.textContent = 'ENTER ROOM';
            console.error('Error:', error);
            alert('Failed to join room: ' + error.message);
        });
    });
});

function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) { // Changed from 6 to 10 characters
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
