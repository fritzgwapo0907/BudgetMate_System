from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
from contextlib import closing

app = Flask(__name__)

# CORS configuration - Allow only frontend to access this backend (adjust the frontend URL as needed)
CORS(app, origins="http://localhost:5173", supports_credentials=True)

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="BM",
        user="postgres",
        password="gwapo"
    )

# Helper to format query results as dicts
def dictfetchall(cursor):
    desc = cursor.description
    return [dict(zip([col[0] for col in desc], row)) for row in cursor.fetchall()]

# Error handler
def handle_error(e):
    return jsonify(success=False, message=str(e), data=None), 500


# ------------------ GET ALL DATA (Users and Transactions) ------------------
@app.route('/', methods=['GET'])
def get_all_data():
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, username, fname, lname FROM accounts ORDER BY id ASC")
                users = dictfetchall(cur)

                cur.execute('''SELECT budget.id, accounts.username, budget.category AS description, budget.amount, budget.type
                               FROM budget
                               JOIN accounts ON budget.user_id = accounts.id
                               ORDER BY budget.created_at DESC''')
                transactions = cur.fetchall()

        transactions_list = [{
            'transaction_id': transaction[0],
            'username': transaction[1],
            'description': transaction[2],
            'amount': transaction[3],
            'type': transaction[4]
        } for transaction in transactions]

        return jsonify({'users': users, 'transactions': transactions_list})
    except Exception as e:
        return handle_error(e)


# ------------------ GET ALL USERS ------------------
@app.route('/users', methods=['GET'])
def get_users():
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, username, fname, lname FROM accounts ORDER BY id ASC")
                users = dictfetchall(cur)

        return jsonify({'users': users})
    except Exception as e:
        return handle_error(e)


# Register user
@app.route('/add-user', methods=['POST'])
def add_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    fname = data.get('fname')
    lname = data.get('lname')

    if not all([username, password, fname, lname]):
        return jsonify(success=False, message='All fields are required', data=None), 400

    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM accounts WHERE username = %s", (username,))
                if cur.fetchone():
                    return jsonify(success=False, message='Username already exists', data=None), 400

                hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                cur.execute(
                    "INSERT INTO accounts (username, password, fname, lname) VALUES (%s, %s, %s, %s)",
                    (username, hashed_password.decode('utf-8'), fname, lname)
                )
                conn.commit()

        return jsonify(success=True, message='User registered successfully', data=None)
    except Exception as e:
        return handle_error(e)


# Login user
@app.route('/check-user', methods=['POST'])
def check_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password required'}), 400

    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, password FROM accounts WHERE username = %s", (username,))
                user = cur.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[1].encode('utf-8')):
            return jsonify({'id': user[0]})
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return handle_error(e)


# Add transaction
@app.route('/add-transaction', methods=['POST'])
def add_transaction():
    data = request.get_json()
    user_id = data.get('userId')
    description = data.get('description')
    amount = data.get('amount')
    trans_type = data.get('type')

    # Validate inputs
    if not description or amount is None or not trans_type:
        return jsonify(success=False, message='Description, amount, and type are required'), 400

    try:
        formatted_amount = round(float(amount), 2)

        insert_query = """
            INSERT INTO budget (user_id, category, amount, type)
            VALUES (%s, %s, %s, %s)
            RETURNING id, category AS description, amount, type
        """

        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                cur.execute(insert_query, (user_id, description, formatted_amount, trans_type))
                result = cur.fetchone()
                conn.commit()

        transaction = {
            "id": result[0],
            "description": result[1],
            "amount": result[2],
            "type": result[3]
        }

        return jsonify(success=True, transaction=transaction), 201

    except Exception as e:
        print('Error adding transaction:', e)
        return jsonify(success=False, message='Server error while adding transaction'), 500

@app.route('/transactions/<int:user_id>', methods=['GET'])
def get_transactions(user_id):
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                # Fetch transactions for the given user_id
                cur.execute("""
                    SELECT id, category, amount, type, created_at
                    FROM budget
                    WHERE user_id = %s
                    ORDER BY created_at DESC;
                """, (user_id,))
                rows = cur.fetchall()

        # Format the response
        transactions = [{
            'id': row[0],
            'category': row[1],
            'amount': float(row[2]),
            'type': row[3],
            'created_at': row[4].isoformat()
        } for row in rows]

        return jsonify({'transactions': transactions}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch transactions", "message": str(e)}), 500


# Update transaction
@app.route('/update-transaction/<int:id>', methods=['PUT'])
def update_transaction(id):
    data = request.get_json()
    amount = data.get('amount')
    category = data.get('category')

    if amount is None or category is None:
        return jsonify({'success': False, 'message': 'Amount and category are required'}), 400

    try:
        formatted_amount = round(float(amount), 2)

        conn = get_db_connection()
        cur = conn.cursor()

        # Update query with correct columns
        update_query = """
            UPDATE budget
            SET amount = %s, category = %s
            WHERE id = %s
            RETURNING id, category, amount, type
        """
        cur.execute(update_query, (formatted_amount, category, id))
        updated = cur.fetchone()
        conn.commit()

        if updated is None:
            return jsonify({'success': False, 'message': 'Transaction not found'}), 404

        # Convert result to dict for frontend
        transaction = {
            'id': updated[0],
            'category': updated[1],
            'amount': float(updated[2]),
            'type': updated[3]
        }

        cur.close()
        conn.close()

        return jsonify({'success': True, 'transaction': transaction})

    except Exception as e:
        print("Error updating transaction:", e)
        return jsonify({'success': False, 'message': 'Server error while updating transaction'}), 500

# Delete transaction
@app.route('/delete-transaction/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    try:
        with closing(get_db_connection()) as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM budget WHERE id = %s", (transaction_id,))
                conn.commit()

        return jsonify(success=True, message='Transaction deleted successfully', data=None)
    except Exception as e:
        return handle_error(e)


if __name__ == '__main__':
    app.run(debug=True)
