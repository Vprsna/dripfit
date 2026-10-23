"""Начальные данные: тестовый аккаунт и демо-пользователи с записями за 4 недели,
чтобы рейтинг и друзья работали сразу. Запускается автоматически, если база пустая."""
import random
import sqlite3
from datetime import date, datetime, timedelta

from werkzeug.security import generate_password_hash

DEMO = [  # login, имя, серия, «характер»: силовые / кардио / всё
    ("artem_pro", "Артём", 21, "gym"), ("liza_fit", "Лиза", 14, "cardio"), ("max_power", "Макс Power", 9, "gym"),
    ("sonya.run", "Соня", 33, "cardio"), ("dimon_iron", "Дима", 5, "gym"), ("katya_yoga", "Катюша", 40, "mix"),
    ("vlad_squat", "Влад", 2, "gym"), ("nastya.stretch", "Настя", 12, "mix"), ("egor_cardio", "Егор", 7, "cardio"),
    ("polina_abs", "Полина", 3, "mix"),
]
# id упражнений из data/exercises.json
GYM = [(2, 60), (1, 80), (3, 100), (18, 14), (52, 18), (24, 50)]   # жим, присед, становая, разводка, жим сидя, верхний блок
CARDIO = [98, 99, 100]                                               # бег, дорожка, велотренажёр
MIX = [(71, "hold"), (69, "bw"), (77, "bw")]               # планка, скручивания, отжимания


def seed_if_empty(db_path, vip_password=""):
    con = sqlite3.connect(db_path)
    if con.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
        con.close()
        return
    now = datetime.now().isoformat(timespec="seconds")
    generated = not vip_password
    if generated:  # пароль не задан в config.json — придумываем случайный и показываем один раз
        import secrets
        vip_password = secrets.token_urlsafe(8)
    rnd = random.Random(42)
    con.execute("INSERT INTO users(login,email,name,pass_hash,vip,fits,streak,created) VALUES(?,?,?,?,?,?,?,?)",
                ("pyaterka", "pyaterka@dripfit.local", "Пятерка", generate_password_hash(vip_password), 1, 0, 99, now))
    for login, name, streak, kind in DEMO:
        cur = con.execute("INSERT INTO users(login,email,name,pass_hash,fits,streak,last_train,created) VALUES(?,?,?,?,?,?,?,?)",
                          (login, f"{login}@dripfit.local", name, generate_password_hash("demo123"),
                           rnd.randint(500, 3500), streak, date.today().isoformat(), now))
        uid = cur.lastrowid
        for i in range(28, -1, -1):
            d = (date.today() - timedelta(days=i)).isoformat()
            if rnd.random() < 0.45:
                continue
            if kind in ("gym", "mix"):
                for ex, w in rnd.sample(GYM, 3):
                    con.execute("INSERT INTO logs(user_id,ex_id,d,s,r,w,created) VALUES(?,?,?,?,?,?,?)",
                                (uid, ex, d, 4, rnd.choice([6, 8, 10]), w + rnd.randint(-10, 15), now))
            if kind in ("cardio", "mix"):
                con.execute("INSERT INTO logs(user_id,ex_id,d,km,min,created) VALUES(?,?,?,?,?,?)",
                            (uid, rnd.choice(CARDIO), d, round(rnd.uniform(2, 8), 1), rnd.randint(15, 50), now))
            if kind == "mix":
                ex, t = rnd.choice(MIX)
                con.execute("INSERT INTO logs(user_id,ex_id,d,s,r,created) VALUES(?,?,?,?,?,?)",
                            (uid, ex, d, 3, 30 if t == "hold" else 15, now))
    ids = {r[0]: r[1] for r in con.execute("SELECT login,id FROM users")}
    # artem и liza дружат между собой, sonya.run зовёт всех новых — см. app.py
    con.execute("INSERT INTO friends VALUES(?,?,?,?)", (ids["artem_pro"], ids["liza_fit"], "accepted", now))
    con.commit()
    con.close()
    print("  База создана: 10 демо-пользователей (пароль demo123) и тестовый аккаунт pyaterka.")
    if generated:
        print(f"  Пароль pyaterka: {vip_password}  (свой можно задать в config.json → vip_password, затем удалить data/dripfit.db)")
    else:
        print("  Пароль pyaterka — из config.json (vip_password).")
