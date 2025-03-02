from flask import Flask, render_template, request, jsonify, session
from database import create_server_table, add_user_to_server, delete_room_users, get_student_messages

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
        
        # Detailed validation with logging
        print(f"Received data: {data}") # Debug log
        
        if not name:
            return jsonify({'success': False, 'message': 'Name is required'})
        if not room_id:
            return jsonify({'success': False, 'message': 'Room ID is required'})
        if not password:
            return jsonify({'success': False, 'message': 'Password is required'})
        if not server:
            return jsonify({'success': False, 'message': 'Server selection is required'})
        
        # Create table if not exists
        create_server_table(server)
        
        # Add user to database with position
        user_id = add_user_to_server(server, room_id, password, name, position)
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Failed to generate user ID'
            })
        
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

@app.route('/')
def index():
    return render_template('login.html')

if __name__ == '__main__':
    app.run(debug=True)
