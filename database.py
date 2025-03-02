import os
import psycopg2
from psycopg2 import sql
import uuid
from dotenv import load_dotenv

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
