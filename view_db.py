"""Database Viewer CLI for Memorai SQLite DB.
Run with:
    python view_db.py
"""

import os
import sqlite3
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DB_PATHS = [
    os.path.abspath("backend/app/data/memorai.db"),
    os.path.abspath("app/data/memorai.db"),
    os.path.abspath("data/memorai.db"),
    os.path.abspath("backend/data/memorai.db"),
]

db_path = None
for p in DB_PATHS:
    if os.path.exists(p):
        db_path = p
        break

if not db_path:
    print("❌ No SQLite database file found. Launch the backend first to auto-create it.")
    sys.exit(0)

print("=" * 80)
print(f"📦 MEMORAI DATABASE VIEWER: {db_path}")
print("=" * 80)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Users Table
print("\n👤 USERS (Registered Accounts):")
print("-" * 80)
try:
    cursor.execute("SELECT rowid, id, name, email, created_at FROM users ORDER BY rowid ASC;")
    users = cursor.fetchall()
    if not users:
        print("  (No registered users found)")
    else:
        print(f"  {'#':<4} {'Name':<18} {'Email':<30} {'User ID':<36}")
        print("  " + "-" * 76)
        for u in users:
            row_no, uid, name, email, created = u
            display_name = (name or "N/A")[:17]
            display_email = (email or "N/A")[:29]
            print(f"  {row_no:<4} {display_name:<18} {display_email:<30} {uid:<36}")
except Exception as e:
    print("  Error reading users:", e)

# 2. Conversations Table
print("\n💬 CHAT CONVERSATIONS:")
print("-" * 80)
try:
    cursor.execute("""
        SELECT c.rowid, c.id, u.name, c.title, c.updated_at 
        FROM chat_conversations c 
        LEFT JOIN users u ON c.user_id = u.id 
        ORDER BY c.rowid ASC;
    """)
    convos = cursor.fetchall()
    if not convos:
        print("  (No conversations found)")
    else:
        print(f"  {'#':<4} {'User':<16} {'Title':<40} {'Conversation ID'}")
        print("  " + "-" * 76)
        for c in convos:
            row_no, cid, uname, title, updated = c
            user_lbl = (uname or "Unknown")[:15]
            title_lbl = (title or "Untitled")[:38]
            print(f"  {row_no:<4} {user_lbl:<16} {title_lbl:<40} {cid}")
except Exception as e:
    print("  Error reading conversations:", e)

# 3. Memories Table
print("\n🧠 STORED KNOWLEDGE MEMORIES (Vectors & Graphs):")
print("-" * 80)
try:
    cursor.execute("SELECT rowid, id, payload_json, created_at FROM memory_vectors ORDER BY rowid ASC;")
    mems = cursor.fetchall()
    if not mems:
        print("  (No memory vectors found)")
    else:
        print(f"  {'#':<4} {'Memory ID':<20} {'Extracted Fact / Memory Payload'}")
        print("  " + "-" * 76)
        for m in mems:
            row_no, mid, payload, created = m
            snippet = payload[:70] + "..." if len(payload) > 70 else payload
            print(f"  {row_no:<4} {mid[:18]:<20} {snippet}")
except Exception as e:
    print("  Error reading memories:", e)

print("\n" + "=" * 80)
conn.close()
