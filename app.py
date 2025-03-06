from flask import Flask, render_template, request, jsonify, session
from database import (create_server_table, add_user_to_server, 
                     delete_room_users, get_student_messages,
                     add_message_to_server, get_unique_room_count)  # Add this import
import uuid  # Add this import at the top

app = Flask(__name__, 
    static_url_path='',
    static_folder='static',
    template_folder='templates')

app.secret_key = 'your_secret_key'  # Add this for session management

@app.route('/teacher/<room_id>')
def teacher(room_id):
    return render_template('teacher.html')

@app.route('/join-room', methods=['POST'])
def join_room():
    try:
        data = request.get_json()
        name = data.get('name')
        room_id = data.get('roomId')
        password = data.get('password')
        server = data.get('server')
        position = 'teacher'  # Default position
        
        # Generate a user ID for the session
        user_id = str(uuid.uuid4())
        
        # Detailed validation with logging
        print(f"Received data: {data}") # Debug log
        
        if not all([name, room_id, password, server]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            })
        
        # Add entry message with uid and name
        entry_message = f"{name} entered the room"
        add_message_to_server(
            server, 
            room_id, 
            password, 
            entry_message, 
            position,
            user_id,  # Add user_id
            name      # Add name
        )
        
        # Store in session
        session['user_data'] = {
            'name': name,
            'room_id': room_id,
            'server': f"Server {server}",
            'user_id': user_id,
            'position': position
        }
        
        return jsonify({
            'success': True,
            'redirect': f'/teacher/{room_id}',
            'user_data': {
                'name': name,
                'room_id': room_id,
                'server': f"Server {server}",
                'user_id': user_id,
                'position': position,
                'password': password,  # Add password to userData
                'connected_users': ['Teacher']
            }
        })
            
    except Exception as e:
        print(f"Server error: {str(e)}")  # Server-side logging
        return jsonify({
            'success': False,
            'message': f'Database error: {str(e)}'
        })

@app.route('/exit-room', methods=['POST'])
def exit_room():
    try:
        data = request.get_json()
        room_id = data.get('roomId')
        server = data.get('server')
        password = data.get('password')
        
        if not all([room_id, server, password]):
            return jsonify({
                'success': False,
                'message': 'Missing required data'
            })
            
        # Extract server number from "Server X" format
        server_num = server.split()[-1]
        
        # Delete all users from the room
        deleted_users = delete_room_users(server_num, room_id, password)
        
        return jsonify({
            'success': True,
            'message': f'Successfully removed {len(deleted_users)} users from room',
            'deleted_users': deleted_users
        })
            
    except Exception as e:
        print(f"Exit room error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error during room exit: {str(e)}'
        })

@app.route('/get-student-messages', methods=['POST'])
def get_student_messages_route():
    try:
        data = request.get_json()
        room_id = data.get('roomId')
        server = data.get('server')
        password = data.get('password')
        
        if not all([room_id, server, password]):
            return jsonify({
                'success': False,
                'message': 'Missing required data'
            })
            
        # Extract server number from "Server X" format if needed
        server_num = server.split()[-1] if isinstance(server, str) else server
        
        # Get messages from database
        messages = get_student_messages(server_num, room_id, password)
        
        return jsonify({
            'success': True,
            'messages': messages
        })
            
    except Exception as e:
        print(f"Error fetching student messages: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error fetching messages: {str(e)}'
        })

@app.route('/send-message', methods=['POST'])
def send_message():
    try:
        data = request.get_json()
        room_id = data.get('roomId')
        server = data.get('server')
        password = data.get('password')
        message = data.get('message')
        name = data.get('name')
        position = data.get('position')
        user_id = data.get('userId')
        
        if not all([room_id, server, password, message, name, position, user_id]):
            return jsonify({
                'success': False,
                'message': 'Missing required data'
            })
            
        # Extract server number from "Server X" format
        server_num = server.split()[-1]
        
        # Add message to database
        add_message_to_server(
            server_num,
            room_id,
            password,
            message,
            position,
            user_id,
            name
        )
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully'
        })
            
    except Exception as e:
        print(f"Error sending message: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error sending message: {str(e)}'
        })

@app.route('/get-server-counts')
def get_server_counts():
    try:
        counts = {
            'server1': get_unique_room_count(1),
            'server2': get_unique_room_count(2),
            'server3': get_unique_room_count(3)
        }
        return jsonify({'success': True, 'counts': counts})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/')
def index():
    return render_template('login.html')

if __name__ == '__main__':
    app.run(debug=True)
