import os
import sqlite3

db_path = os.path.join(os.getcwd(), 'skillsconnect.db')
print('DB_PATH', db_path)
print('EXISTS', os.path.exists(db_path))
if not os.path.exists(db_path):
    raise SystemExit(1)
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [row[0] for row in cur.fetchall()]
print('TABLES', tables)
for t in tables:
    try:
        cur.execute(f'SELECT COUNT(*) FROM {t}')
        count = cur.fetchone()[0]
        print(t, count)
    except Exception as e:
        print('ERR_COUNT', t, str(e))
conn.close()
