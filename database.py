import os
import psycopg2
from psycopg2 import sql
import uuid
from dotenv import load_dotenv
import sqlite3

load_dotenv()

def get_db_connection():
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        raise Exception("DATABASE_URL not found in environment variables")
    print(f"Connecting to database...") # Debug log
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Database connection successful!")
        return conn
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise e

def create_server_table(server_num):
    table_name = f'server{server_num}'
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Check if table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table_name,))
        
        table_exists = cur.fetchone()[0]
        print(f"Table {table_name} exists: {table_exists}") # Debug log
        
        if not table_exists:
            print(f"Creating table {table_name}...")
            cur.execute(sql.SQL("""
                CREATE TABLE {} (
                    rid VARCHAR(10) NOT NULL,
                    uid VARCHAR(36) PRIMARY KEY,
                    pass VARCHAR(100) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    position VARCHAR(50) NOT NULL
                )
            """).format(sql.Identifier(table_name)))
            conn.commit()
            print(f"Table {table_name} created successfully!")
        
    except Exception as e:
        print(f"Error creating table: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()

def add_user_to_server(server_num, room_id, password, name, position='teacher'):
    table_name = f'server{server_num}'
    user_id = str(uuid.uuid4())
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print(f"Adding user to {table_name}...") # Debug log
        print(f"Data: room_id={room_id}, user_id={user_id}, name={name}, position={position}") # Debug log
        
        cur.execute(sql.SQL("""
            INSERT INTO {} (rid, uid, pass, name, position)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING uid
        """).format(sql.Identifier(table_name)), 
        (room_id, user_id, password, name, position))
        
        inserted_id = cur.fetchone()[0]
        conn.commit()
        print(f"User added successfully with ID: {inserted_id}") # Debug log
        return inserted_id
        
    except Exception as e:
        conn.rollback()
        print(f"Error adding user: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()

def delete_room_users(server_num, room_id, password):
    table_name = f'server{server_num}'
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print(f"Deleting users from room {room_id} in {table_name}...")
        
        # Delete all users with matching room ID and password
        cur.execute(sql.SQL("""
            DELETE FROM {} 
            WHERE rid = %s AND pass = %s
            RETURNING uid
        """).format(sql.Identifier(table_name)), 
        (room_id, password))
        
        deleted_ids = cur.fetchall()
        conn.commit()
        print(f"Deleted {len(deleted_ids)} users from room")
        return [uid[0] for uid in deleted_ids]
        
    except Exception as e:
        conn.rollback()
        print(f"Error deleting room users: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()

def get_student_messages(server, room_id, password):
    table_name = f'server{server}'
    conn = get_db_connection()  # Use PostgreSQL connection
    cur = conn.cursor()
    
    try:
        print(f"Fetching student messages from {table_name}")  # Debug log
        print(f"Parameters: room_id={room_id}, password={password}")  # Debug log
        
        # Use proper PostgreSQL query with table name interpolation
        cur.execute(sql.SQL("""
            SELECT name, message 
            FROM {} 
            WHERE rid = %s AND pass = %s AND position = 'student'
            ORDER BY ctid DESC  /* Changed to DESC order and using ctid for PostgreSQL row identifier */
        """).format(sql.Identifier(table_name)),
        (room_id, password))
        
        messages = cur.fetchall()
        print(f"Found {len(messages)} student messages")  # Debug log
        
        # Reverse the messages to maintain chronological order
        messages.reverse()
        
        # Convert to list of dictionaries
        return [{
            'name': msg[0],    # Now we can use the actual name from the table
            'message': msg[1],
            'timestamp': ''    # Add timestamp if needed later
        } for msg in messages]
        
    except Exception as e:
        print(f"Database error in get_student_messages: {str(e)}")
        return []
        
    finally:
        cur.close()
        conn.close()

def add_message_to_server(server_num, room_id, password, message, position, uid, name):
    table_name = f'server{server_num}'
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print(f"Adding message to {table_name}...")
        
        cur.execute(sql.SQL("""
            CREATE TABLE IF NOT EXISTS messages (
                rid VARCHAR(10) NOT NULL,
                pass VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                position VARCHAR(50) NOT NULL,
                uid VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL
            )
        """))
        
        cur.execute(sql.SQL("""
            INSERT INTO {} (rid, pass, message, position, uid, name)
            VALUES (%s, %s, %s, %s, %s, %s)
        """).format(sql.Identifier(table_name)), 
        (room_id, password, message, position, uid, name))
        
        conn.commit()
        print(f"Message added successfully to {table_name}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error adding message: {str(e)}")
        raise e
    finally:
        cur.close()
        conn.close()
