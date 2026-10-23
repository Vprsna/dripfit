"""Drip Fit («Форма роста») — модуль Б: сервер и REST API.

Запуск:  python server/app.py      (или start.bat в корне проекта)
Сайт:    http://localhost:8000
API:     http://localhost:8000/api/...   (полный список — docs/API.md)

Хранение — SQLite (файл data/dripfit.db создаётся сам). Пароли хранятся хешем.
Внешние API: YouTube Data API v3 (нужен ключ в config.json) и iTunes Search API (без ключа).
"""
import json
import os
import secrets
import sqlite3
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta
from functools import wraps

from flask import Flask, g, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
DATA = os.path.join(ROOT, "data")
DB_PATH = os.path.join(DATA, "dripfit.db")


def load_config():
    cfg = {"port": 8000, "host": "127.0.0.1", "youtube_api_key": "", "vip_password": ""}
    path = os.path.join(ROOT, "config.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            cfg.update(json.load(f))
    cfg["youtube_api_key"] = os.environ.get("YOUTUBE_API_KEY", cfg.get("youtube_api_key", ""))
    return cfg


CFG = load_config()
app = Flask(__name__, static_folder=None)
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False

with open(os.path.join(DATA, "exercises.json"), encoding="utf-8") as f:
    EXERCISES = json.load(f)
EX_BY_ID = {e["id"]: e for e in EXERCISES}
with open(os.path.join(DATA, "videos.json"), encoding="utf-8") as f:
    VIDEOS = json.load(f)

# ---------------------------------------------------------------- база данных
SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  height REAL, weight REAL, goal TEXT,
  avatar TEXT,
  fits INTEGER NOT NULL DEFAULT 100,
  vip INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_train TEXT,
  created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ex_id INTEGER NOT NULL, d TEXT NOT NULL,
  s REAL, r REAL, w REAL, min REAL, km REAL, v REAL,
  demo INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS logs_user_d ON logs(user_id, d);
CREATE TABLE IF NOT EXISTS workouts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, done TEXT NOT NULL DEFAULT '{}', extra TEXT NOT NULL DEFAULT '{}', created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS workout_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  pos INTEGER NOT NULL, ex_id INTEGER NOT NULL,
  s REAL, r REAL, w REAL, min REAL, km REAL, v REAL);
CREATE TABLE IF NOT EXISTS friends(
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,              -- pending (user_id → friend_id) | accepted
  created TEXT NOT NULL, PRIMARY KEY(user_id, friend_id));
CREATE TABLE IF NOT EXISTS achievements(
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ach_id TEXT NOT NULL, claimed TEXT NOT NULL, reward INTEGER NOT NULL, PRIMARY KEY(user_id, ach_id));
CREATE TABLE IF NOT EXISTS kv(
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  k TEXT NOT NULL, v TEXT NOT NULL, PRIMARY KEY(user_id, k));
"""


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(_):
    con = g.pop("db", None)
    if con is not None:
        con.close()


def init_db():
    os.makedirs(DATA, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.executescript(SCHEMA)
    con.commit()
    con.close()


now = lambda: datetime.now().isoformat(timespec="seconds")
today = lambda: date.today().isoformat()
FIELDS = ("s", "r", "w", "min", "km", "v")


def err(msg, code=400):
    return jsonify({"error": msg}), code


def body():
    return request.get_json(silent=True) or {}


# ---------------------------------------------------------------- авторизация
def current_user():
    h = request.headers.get("Authorization", "")
    token = h[7:] if h.startswith("Bearer ") else request.args.get("token", "")
    if not token:
        return None
    return db().execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", (token,)
    ).fetchone()


def auth(fn):
    @wraps(fn)
    def wrap(*a, **kw):
        u = current_user()
        if not u:
            return err("Нужно войти в аккаунт", 401)
        g.user = u
        return fn(*a, **kw)

    return wrap


def public_user(u, full=False):
    d = {"login": u["login"], "name": u["name"], "fits": None if u["vip"] else u["fits"],
         "vip": bool(u["vip"]), "streak": u["streak"]}
    if full:
        d.update({"email": u["email"], "height": u["height"], "weight": u["weight"], "goal": u["goal"],
                  "avatar": u["avatar"], "created": u["created"]})
    return d


def new_session(user_id):
    token = secrets.token_urlsafe(32)
    db().execute("INSERT INTO sessions VALUES(?,?,?)", (token, user_id, now()))
    db().commit()
    return token


@app.post("/api/auth/register")
def register():
    b = body()
    login = str(b.get("login", "")).strip().lower()
    email = str(b.get("email", "")).strip().lower()
    pw = str(b.get("password", ""))
    name = str(b.get("name", "")).strip() or login
    import re
    if not re.fullmatch(r"[a-z0-9._-]{3,20}", login):
        return err("Никнейм: 3–20 символов, латиница, цифры, точка, _ или -")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return err("Проверь адрес почты")
    if len(pw) < 6:
        return err("Пароль — минимум 6 символов")
    if len(name) > 32:
        return err("Имя — не длиннее 32 символов")
    if db().execute("SELECT 1 FROM users WHERE login=?", (login,)).fetchone():
        return err("Этот никнейм уже занят", 409)
    if db().execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
        return err("Эта почта уже зарегистрирована", 409)
    cur = db().execute(
        "INSERT INTO users(login,email,name,pass_hash,created) VALUES(?,?,?,?,?)",
        (login, email, name, generate_password_hash(pw), now()))
    db().commit()
    u = db().execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify({"token": new_session(u["id"]), "user": public_user(u, True)}), 201


@app.post("/api/auth/login")
def login():
    b = body()
    key = str(b.get("login", "")).strip().lower()
    key = {"пятерка": "pyaterka", "пятёрка": "pyaterka"}.get(key, key)  # тестовый аккаунт можно ввести и по-русски
    pw = str(b.get("password", ""))
    u = db().execute("SELECT * FROM users WHERE login=? OR email=?", (key, key)).fetchone()
    if not u or not check_password_hash(u["pass_hash"], pw):
        return err("Неверный никнейм, почта или пароль", 401)
    return jsonify({"token": new_session(u["id"]), "user": public_user(u, True)})


@app.post("/api/auth/logout")
@auth
def logout():
    h = request.headers.get("Authorization", "")[7:]
    db().execute("DELETE FROM sessions WHERE token=?", (h,))
    db().commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- пользователи (CRUD)
@app.get("/api/me")
@auth
def me():
    return jsonify(public_user(g.user, True))


@app.put("/api/me")
@auth
def update_me():
    b, sets, vals = body(), [], []
    if "name" in b:
        n = str(b["name"]).strip()
        if not n or len(n) > 32:
            return err("Имя: от 1 до 32 символов")
        sets.append("name=?"); vals.append(n)
    for k in ("height", "weight"):
        if k in b:
            sets.append(f"{k}=?"); vals.append(b[k] if b[k] not in ("", None) else None)
    for k in ("goal", "avatar"):
        if k in b:
            sets.append(f"{k}=?"); vals.append(b[k])
    if "fits" in b and not g.user["vip"]:  # баланс считает сайт (покупки в магазине и т. п.)
        sets.append("fits=?"); vals.append(max(0, int(b["fits"])))
    if "password" in b:
        if len(str(b["password"])) < 6:
            return err("Пароль — минимум 6 символов")
        sets.append("pass_hash=?"); vals.append(generate_password_hash(str(b["password"])))
    if sets:
        db().execute(f"UPDATE users SET {','.join(sets)} WHERE id=?", (*vals, g.user["id"]))
        db().commit()
    u = db().execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()
    return jsonify(public_user(u, True))


@app.delete("/api/me")
@auth
def delete_me():
    db().execute("DELETE FROM users WHERE id=?", (g.user["id"],))
    db().commit()
    return jsonify({"ok": True})


@app.get("/api/users")
def users():
    q = request.args.get("q", "").strip().lower()
    rows = db().execute("SELECT * FROM users WHERE login LIKE ? ORDER BY login LIMIT 20", (f"%{q}%",)).fetchall()
    return jsonify([public_user(u) for u in rows])


@app.get("/api/users/<login>")
def user_profile(login):
    u = db().execute("SELECT * FROM users WHERE login=?", (login.lower(),)).fetchone()
    if not u:
        return err("Пользователь не найден", 404)
    d = public_user(u)
    d["stats"] = user_stats(u["id"], 7)
    return jsonify(d)


# ---------------------------------------------------------------- упражнения
@app.get("/api/exercises")
def exercises():
    q = request.args.get("q", "").strip().lower()
    group = request.args.get("group", "").strip().lower()
    out = [e for e in EXERCISES
           if (not q or q in e["name"].lower() or q in e["muscles"].lower() or q in e["branch"].lower())
           and (not group or group in e["branch"].lower() or group in e["muscles"].lower())]
    return jsonify(out[: int(request.args.get("limit", 200))])


@app.get("/api/exercises/<int:ex_id>")
def exercise(ex_id):
    e = EX_BY_ID.get(ex_id)
    return jsonify(e) if e else err("Упражнение не найдено", 404)


# ---------------------------------------------------------------- результаты (logs)
def log_dict(r):
    d = {"id": r["id"], "d": r["d"], "ex": r["ex_id"]}
    for k in FIELDS:
        if r[k] is not None:
            d[k] = r[k]
    if r["demo"]:
        d["demo"] = 1
    return d


def clean_log(b):
    ex_id = int(b.get("ex", 0))
    if ex_id not in EX_BY_ID:
        raise ValueError("Неизвестное упражнение")
    d = str(b.get("d") or today())
    datetime.strptime(d, "%Y-%m-%d")
    vals = {}
    for k in FIELDS:
        if b.get(k) not in (None, ""):
            v = float(b[k])
            if v < 0 or v > 10000:
                raise ValueError(f"Странное значение поля {k}")
            vals[k] = v
    return ex_id, d, vals


@app.get("/api/logs")
@auth
def get_logs():
    f, t = request.args.get("from", "0000-00-00"), request.args.get("to", "9999-99-99")
    rows = db().execute("SELECT * FROM logs WHERE user_id=? AND d BETWEEN ? AND ? ORDER BY d,id",
                        (g.user["id"], f, t)).fetchall()
    return jsonify([log_dict(r) for r in rows])


@app.post("/api/logs")
@auth
def add_log():
    try:
        ex_id, d, vals = clean_log(body())
    except (ValueError, TypeError) as e:
        return err(str(e))
    cur = db().execute(
        "INSERT INTO logs(user_id,ex_id,d,s,r,w,min,km,v,created) VALUES(?,?,?,?,?,?,?,?,?,?)",
        (g.user["id"], ex_id, d, *[vals.get(k) for k in FIELDS], now()))
    db().commit()
    return jsonify(log_dict(db().execute("SELECT * FROM logs WHERE id=?", (cur.lastrowid,)).fetchone())), 201


@app.put("/api/logs/<int:log_id>")
@auth
def edit_log(log_id):
    r = db().execute("SELECT * FROM logs WHERE id=? AND user_id=?", (log_id, g.user["id"])).fetchone()
    if not r:
        return err("Запись не найдена", 404)
    try:
        ex_id, d, vals = clean_log({**log_dict(r), **body()})
    except (ValueError, TypeError) as e:
        return err(str(e))
    db().execute("UPDATE logs SET ex_id=?,d=?,s=?,r=?,w=?,min=?,km=?,v=? WHERE id=?",
                 (ex_id, d, *[vals.get(k) for k in FIELDS], log_id))
    db().commit()
    return jsonify(log_dict(db().execute("SELECT * FROM logs WHERE id=?", (log_id,)).fetchone()))


@app.delete("/api/logs/<int:log_id>")
@auth
def del_log(log_id):
    n = db().execute("DELETE FROM logs WHERE id=? AND user_id=?", (log_id, g.user["id"])).rowcount
    db().commit()
    return jsonify({"ok": True}) if n else err("Запись не найдена", 404)


# ---------------------------------------------------------------- тренировки (CRUD)
def workout_dict(w):
    items = db().execute("SELECT * FROM workout_items WHERE workout_id=? ORDER BY pos", (w["id"],)).fetchall()
    out = {"id": w["id"], "name": w["name"], "done": json.loads(w["done"]), "created": w["created"],
           "items": [{"item_id": i["id"], "ex": i["ex_id"],
                      "name": EX_BY_ID.get(i["ex_id"], {}).get("name", "?"),
                      **{k: i[k] for k in FIELDS if i[k] is not None}} for i in items]}
    out.update(json.loads(w["extra"] or "{}"))
    return out


def own_workout(wid):
    return db().execute("SELECT * FROM workouts WHERE id=? AND user_id=?", (wid, g.user["id"])).fetchone()


def put_items(wid, items):
    db().execute("DELETE FROM workout_items WHERE workout_id=?", (wid,))
    for pos, it in enumerate(items):
        ex_id = int(it.get("ex", 0))
        if ex_id not in EX_BY_ID:
            continue
        db().execute("INSERT INTO workout_items(workout_id,pos,ex_id,s,r,w,min,km,v) VALUES(?,?,?,?,?,?,?,?,?)",
                     (wid, pos, ex_id, *[it.get(k) for k in FIELDS]))


def default_item(ex_id):
    t = EX_BY_ID[ex_id]["type"]
    return {"ex": ex_id, **{"wr": {"s": 4, "r": 10, "w": 40}, "bw": {"s": 3, "r": 10, "w": 0}, "hold": {"s": 3, "r": 30},
                            "time": {"min": 20}, "cardio": {"km": 3, "min": 20}}.get(t, {"v": 0})}


@app.get("/api/workouts")
@auth
def list_workouts():
    rows = db().execute("SELECT * FROM workouts WHERE user_id=? ORDER BY id DESC", (g.user["id"],)).fetchall()
    return jsonify([workout_dict(w) for w in rows])


@app.post("/api/workouts")
@auth
def create_workout():
    b = body()
    name = str(b.get("name", "")).strip()[:40] or "Новая тренировка"
    cur = db().execute("INSERT INTO workouts(user_id,name,created) VALUES(?,?,?)", (g.user["id"], name, now()))
    put_items(cur.lastrowid, b.get("items", []))
    db().commit()
    return jsonify(workout_dict(own_workout(cur.lastrowid))), 201


@app.get("/api/workouts/<int:wid>")
@auth
def get_workout(wid):
    w = own_workout(wid)
    return jsonify(workout_dict(w)) if w else err("Тренировка не найдена", 404)


@app.put("/api/workouts/<int:wid>")
@auth
def edit_workout(wid):
    w = own_workout(wid)
    if not w:
        return err("Тренировка не найдена", 404)
    b = body()
    if "name" in b:
        db().execute("UPDATE workouts SET name=? WHERE id=?", (str(b["name"]).strip()[:40] or "Без названия", wid))
    if "items" in b:
        put_items(wid, b["items"])
    db().commit()
    return jsonify(workout_dict(own_workout(wid)))


@app.delete("/api/workouts/<int:wid>")
@auth
def del_workout(wid):
    n = db().execute("DELETE FROM workouts WHERE id=? AND user_id=?", (wid, g.user["id"])).rowcount
    db().commit()
    return jsonify({"ok": True}) if n else err("Тренировка не найдена", 404)


@app.post("/api/workouts/<int:wid>/items")
@auth
def add_item(wid):
    if not own_workout(wid):
        return err("Тренировка не найдена", 404)
    b = body()
    ex_id = int(b.get("ex", 0))
    if ex_id not in EX_BY_ID:
        return err("Неизвестное упражнение")
    it = {**default_item(ex_id), **{k: b[k] for k in FIELDS if k in b}}
    pos = db().execute("SELECT COALESCE(MAX(pos)+1,0) FROM workout_items WHERE workout_id=?", (wid,)).fetchone()[0]
    db().execute("INSERT INTO workout_items(workout_id,pos,ex_id,s,r,w,min,km,v) VALUES(?,?,?,?,?,?,?,?,?)",
                 (wid, pos, ex_id, *[it.get(k) for k in FIELDS]))
    db().commit()
    return jsonify(workout_dict(own_workout(wid))), 201


@app.delete("/api/workouts/<int:wid>/items/<int:item_id>")
@auth
def del_item(wid, item_id):
    if not own_workout(wid):
        return err("Тренировка не найдена", 404)
    db().execute("DELETE FROM workout_items WHERE id=? AND workout_id=?", (item_id, wid))
    db().commit()
    return jsonify(workout_dict(own_workout(wid)))


def pay_training(user_row):
    """Фиты за тренировку: +50 один раз в день, плюс серия дней подряд."""
    t = today()
    if user_row["last_train"] == t:
        return False
    y = (date.today() - timedelta(days=1)).isoformat()
    streak = user_row["streak"] + 1 if user_row["last_train"] == y else 1
    db().execute("UPDATE users SET fits=fits+?, last_train=?, streak=? WHERE id=?",
                 (0 if user_row["vip"] else 50, t, streak, user_row["id"]))
    return True


@app.post("/api/workouts/<int:wid>/complete")
@auth
def complete_workout(wid):
    w = own_workout(wid)
    if not w:
        return err("Тренировка не найдена", 404)
    d = workout_dict(w)
    for it in d["items"]:
        db().execute("INSERT INTO logs(user_id,ex_id,d,s,r,w,min,km,v,created) VALUES(?,?,?,?,?,?,?,?,?,?)",
                     (g.user["id"], it["ex"], today(), *[it.get(k) for k in FIELDS], now()))
    done = json.loads(w["done"]); done[today()] = 1
    db().execute("UPDATE workouts SET done=? WHERE id=?", (json.dumps(done), wid))
    paid = pay_training(g.user)
    db().commit()
    return jsonify({"logged": len(d["items"]), "fits_awarded": 50 if paid and not g.user["vip"] else 0})


@app.post("/api/fits/daily")
@auth
def daily():
    paid = pay_training(g.user)
    db().commit()
    u = db().execute("SELECT * FROM users WHERE id=?", (g.user["id"],)).fetchone()
    return jsonify({"paid": paid, "user": public_user(u, True)})


# ---------------------------------------------------------------- статистика и рейтинг
def user_stats(uid, days=7):
    since = (date.today() - timedelta(days=days - 1)).isoformat()
    rows = db().execute("SELECT * FROM logs WHERE user_id=? AND d>=?", (uid, since)).fetchall()
    ton = km = minutes = 0.0
    train_days, per_day = set(), {}
    for r in rows:
        e = EX_BY_ID.get(r["ex_id"])
        if not e or e["type"] in ("cm", "kg", "pct"):
            continue
        train_days.add(r["d"])
        t = (r["s"] or 0) * (r["r"] or 0) * (r["w"] or 0) if e["type"] == "wr" else 0
        ton += t
        km += r["km"] or 0
        minutes += r["min"] or 0
        p = per_day.setdefault(r["d"], {"ton": 0, "km": 0, "records": 0})
        p["ton"] += t; p["km"] += r["km"] or 0; p["records"] += 1
    return {"days": days, "train_days": len(train_days), "tonnage": round(ton), "km": round(km, 1),
            "minutes": round(minutes), "records": len(rows), "per_day": dict(sorted(per_day.items()))}


@app.get("/api/stats")
@auth
def stats():
    days = max(1, min(365, int(request.args.get("days", 7))))
    s = user_stats(g.user["id"], days)
    # личные рекорды: максимальный вес по силовым упражнениям
    rec = db().execute("""SELECT ex_id, MAX(w) w, MAX(r) r FROM logs WHERE user_id=? GROUP BY ex_id""",
                       (g.user["id"],)).fetchall()
    s["records_best"] = [{"ex": r["ex_id"], "name": EX_BY_ID.get(r["ex_id"], {}).get("name"), "max_w": r["w"], "max_r": r["r"]}
                         for r in rec if r["w"] or r["r"]]
    return jsonify(s)


METRICS = {"fits": "фиты", "ton": "тоннаж, кг", "days": "дней с тренировками", "km": "кардио, км", "streak": "серия, дней"}


@app.get("/api/rating")
def rating():
    metric = request.args.get("metric", "fits")
    if metric == "cnt":
        metric = "days"
    if metric not in METRICS:
        return err("metric: " + ", ".join(METRICS))
    days = max(1, min(365, int(request.args.get("days", 7 if metric != "days" else 30))))
    out = []
    for u in db().execute("SELECT * FROM users").fetchall():
        s = user_stats(u["id"], days)
        val = {"fits": 10 ** 9 if u["vip"] else u["fits"], "ton": s["tonnage"], "days": s["train_days"],
               "km": s["km"], "streak": u["streak"]}[metric]
        out.append({"login": u["login"], "name": u["name"], "value": val})
    out.sort(key=lambda x: -x["value"])
    for i, x in enumerate(out, 1):
        x["place"] = i
    me_ = current_user()
    return jsonify({"metric": metric, "title": METRICS[metric], "days": days, "top": out[:50],
                    "me": next((x for x in out if me_ and x["login"] == me_["login"]), None)})


# ---------------------------------------------------------------- друзья
def uid_by_login(login):
    r = db().execute("SELECT id FROM users WHERE login=?", (str(login).strip().lstrip("@").lower(),)).fetchone()
    return r["id"] if r else None


@app.get("/api/friends")
@auth
def friends():
    uid = g.user["id"]
    q = lambda sql: [dict(r) for r in db().execute(sql, (uid,)).fetchall()]
    sql_u = "SELECT u.login, u.name, u.streak, u.fits, u.vip FROM friends f JOIN users u ON u.id=f.{other} WHERE f.{me}=? AND f.status='{st}'"
    acc = q(sql_u.format(other="friend_id", me="user_id", st="accepted")) + q(sql_u.format(other="user_id", me="friend_id", st="accepted"))
    for a in acc:
        a["week"] = user_stats(uid_by_login(a["login"]), 7)
    return jsonify({"friends": acc,
                    "incoming": q(sql_u.format(other="user_id", me="friend_id", st="pending")),
                    "outgoing": q(sql_u.format(other="friend_id", me="user_id", st="pending"))})


@app.post("/api/friends")
@auth
def add_friend():
    fid = uid_by_login(body().get("login", ""))
    uid = g.user["id"]
    if not fid:
        return err("Пользователь не найден", 404)
    if fid == uid:
        return err("Это твой собственный ник")
    back = db().execute("SELECT status FROM friends WHERE user_id=? AND friend_id=?", (fid, uid)).fetchone()
    if back:  # он уже звал нас — принимаем
        db().execute("UPDATE friends SET status='accepted' WHERE user_id=? AND friend_id=?", (fid, uid))
        db().commit()
        return jsonify({"status": "accepted"})
    if db().execute("SELECT 1 FROM friends WHERE user_id=? AND friend_id=?", (uid, fid)).fetchone():
        return err("Заявка уже отправлена", 409)
    db().execute("INSERT INTO friends VALUES(?,?,?,?)", (uid, fid, "pending", now()))
    db().commit()
    return jsonify({"status": "pending"}), 201


@app.post("/api/friends/<login>/accept")
@auth
def accept_friend(login):
    fid = uid_by_login(login)
    n = db().execute("UPDATE friends SET status='accepted' WHERE user_id=? AND friend_id=? AND status='pending'",
                     (fid, g.user["id"])).rowcount
    db().commit()
    return jsonify({"status": "accepted"}) if n else err("Заявки нет", 404)


@app.delete("/api/friends/<login>")
@auth
def del_friend(login):
    fid, uid = uid_by_login(login), g.user["id"]
    db().execute("DELETE FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)", (uid, fid, fid, uid))
    db().commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- достижения
ACH = {  # id: (название, показатель, цель, награда) — те же, что на странице «Достижения»
    "first": ("Первый шаг", "train_days_all", 1, 10), "days10": ("Втянулся", "train_days_all", 10, 100),
    "days30": ("Железный", "train_days_all", 30, 300), "uniq10": ("Разнообразие", "uniq", 10, 40),
    "log50": ("Летописец", "logs", 50, 80), "ton1": ("Тонна", "max_ton_day", 1000, 50),
    "km42": ("Марафонец", "km_all", 42, 200), "st7": ("Огонёк", "streak", 7, 30), "st14": ("Привычка", "streak", 14, 120),
}


def ach_progress(uid, u):
    rows = db().execute("SELECT * FROM logs WHERE user_id=?", (uid,)).fetchall()
    days, uniq, ton_day, km = set(), set(), {}, 0.0
    for r in rows:
        e = EX_BY_ID.get(r["ex_id"])
        if not e or e["type"] in ("cm", "kg", "pct"):
            continue
        days.add(r["d"]); uniq.add(r["ex_id"]); km += r["km"] or 0
        if e["type"] == "wr":
            ton_day[r["d"]] = ton_day.get(r["d"], 0) + (r["s"] or 0) * (r["r"] or 0) * (r["w"] or 0)
    return {"train_days_all": len(days), "uniq": len(uniq), "logs": len(rows),
            "max_ton_day": max(ton_day.values(), default=0), "km_all": km, "streak": u["streak"]}


@app.get("/api/achievements")
@auth
def achievements():
    p = ach_progress(g.user["id"], g.user)
    got = {r["ach_id"] for r in db().execute("SELECT ach_id FROM achievements WHERE user_id=?", (g.user["id"],))}
    return jsonify([{"id": k, "name": n, "progress": min(p[m], goal), "goal": goal, "reward": rw,
                     "done": p[m] >= goal, "claimed": k in got} for k, (n, m, goal, rw) in ACH.items()])


@app.post("/api/achievements/<ach_id>/claim")
@auth
def claim(ach_id):
    if ach_id not in ACH:
        return err("Нет такого достижения", 404)
    n, m, goal, rw = ACH[ach_id]
    if ach_progress(g.user["id"], g.user)[m] < goal:
        return err("Достижение ещё не выполнено")
    try:
        db().execute("INSERT INTO achievements VALUES(?,?,?,?)", (g.user["id"], ach_id, now(), rw))
    except sqlite3.IntegrityError:
        return err("Уже получено", 409)
    db().execute("UPDATE users SET fits=fits+? WHERE id=? AND vip=0", (rw, g.user["id"]))
    db().commit()
    return jsonify({"ok": True, "reward": rw})


# ---------------------------------------------------------------- синхронизация с сайтом
# Сайт хранит своё состояние в ключах df-*. Журнал и тренировки раскладываются по таблицам,
# остальное (планы, питание, вода, настройки графиков) — в таблице kv.
SYNC_KEYS = {"df-log", "df-workouts", "df-plans", "df-plan-done", "df-food", "df-water", "df-water-bonus",
             "df-ach", "df-ach-seen", "df-charts", "df-charts-per", "df-charts-mode", "df-vfav", "df-level",
             "df-gen", "df-train-paid", "df-rank", "df-dyn", "df-dyn-per", "df-int"}


def sync_get_all(uid):
    out = {r["k"]: json.loads(r["v"]) for r in db().execute("SELECT k,v FROM kv WHERE user_id=?", (uid,))}
    logs = db().execute("SELECT * FROM logs WHERE user_id=? ORDER BY d,id", (uid,)).fetchall()
    if logs or "df-log" in out:
        out["df-log"] = [log_dict(r) for r in logs]
    ws = db().execute("SELECT * FROM workouts WHERE user_id=? ORDER BY id DESC", (uid,)).fetchall()
    if ws or "df-workouts" in out:
        out["df-workouts"] = []
        for w in ws:
            d = workout_dict(w)
            d["items"] = [{k: v for k, v in it.items() if k not in ("item_id", "name")} for it in d["items"]]
            out["df-workouts"].append(d)
    return out


@app.get("/api/sync")
@auth
def sync_get():
    return jsonify(sync_get_all(g.user["id"]))


@app.put("/api/sync/<key>")
@auth
def sync_put(key):
    if key not in SYNC_KEYS and not key.startswith("df-xp-"):
        return err("Этот ключ не синхронизируется", 400)
    val = request.get_json(silent=True)
    uid = g.user["id"]
    if key == "df-log" and isinstance(val, list):
        db().execute("DELETE FROM logs WHERE user_id=?", (uid,))
        for x in val:
            try:
                ex_id, d, vals = clean_log(x)
            except (ValueError, TypeError):
                continue
            db().execute("INSERT INTO logs(user_id,ex_id,d,s,r,w,min,km,v,demo,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                         (uid, ex_id, d, *[vals.get(k) for k in FIELDS], 1 if x.get("demo") else 0, now()))
        db().execute("INSERT OR REPLACE INTO kv VALUES(?,?,?)", (uid, "df-log", "[]"))  # отметка «журнал есть»
    elif key == "df-workouts" and isinstance(val, list):
        db().execute("DELETE FROM workouts WHERE user_id=?", (uid,))
        for w in reversed(val):
            extra = {k: w[k] for k in ("logs",) if k in w}
            cur = db().execute("INSERT INTO workouts(user_id,name,done,extra,created) VALUES(?,?,?,?,?)",
                               (uid, str(w.get("name", "Тренировка"))[:40], json.dumps(w.get("done", {})), json.dumps(extra), now()))
            put_items(cur.lastrowid, w.get("items", []))
        db().execute("INSERT OR REPLACE INTO kv VALUES(?,?,?)", (uid, "df-workouts", "[]"))
    else:
        db().execute("INSERT OR REPLACE INTO kv VALUES(?,?,?)", (uid, key, json.dumps(val, ensure_ascii=False)))
    db().commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- внешние API
def http_json(url, timeout=8):
    req = urllib.request.Request(url, headers={"User-Agent": "DripFit/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


_cache = {}


def cached(key, fn, ttl=3600):
    hit = _cache.get(key)
    if hit and (datetime.now() - hit[0]).seconds < ttl:
        return hit[1]
    val = fn()
    _cache[key] = (datetime.now(), val)
    return val


@app.get("/api/youtube/search")
def youtube_search():
    q = request.args.get("q", "").strip()
    if not q:
        return err("Пустой запрос")
    local = [{"title": v["title"], "url": "https://www.youtube.com/" + ("shorts/" if v["short"] else "watch?v=") + v["yt"],
              "thumb": f"https://i.ytimg.com/vi/{v['yt']}/mqdefault.jpg", "channel": "", "source": "library"}
             for v in VIDEOS if q.lower() in v["title"].lower() or q.lower() in v["ex"].lower()][:6]
    key = CFG.get("youtube_api_key")
    if not key:
        return jsonify({"source": "library", "note": "Ключ YouTube не задан — показаны видео из библиотеки сайта.",
                        "search_url": "https://www.youtube.com/results?search_query=" + urllib.parse.quote(q), "items": local})
    try:
        params = urllib.parse.urlencode({"part": "snippet", "type": "video", "maxResults": 12, "q": q,
                                         "relevanceLanguage": "ru", "regionCode": "RU", "safeSearch": "strict", "key": key})
        data = cached("yt:" + q.lower(), lambda: http_json("https://www.googleapis.com/youtube/v3/search?" + params))
        items = [{"title": it["snippet"]["title"], "channel": it["snippet"]["channelTitle"],
                  "url": "https://www.youtube.com/watch?v=" + it["id"]["videoId"], "video_id": it["id"]["videoId"],
                  "thumb": it["snippet"]["thumbnails"]["medium"]["url"], "source": "youtube"} for it in data.get("items", [])]
        return jsonify({"source": "youtube", "items": items})
    except Exception as e:  # нет интернета, неверный ключ, кончилась квота
        return jsonify({"source": "library", "note": f"YouTube недоступен ({type(e).__name__}) — показаны видео из библиотеки.",
                        "search_url": "https://www.youtube.com/results?search_query=" + urllib.parse.quote(q), "items": local})


@app.get("/api/music/search")
def music_search():
    q = request.args.get("q", "").strip()
    if not q:
        return err("Пустой запрос")
    ya = "https://music.yandex.ru/search?text=" + urllib.parse.quote(q)
    try:
        params = urllib.parse.urlencode({"term": q, "media": "music", "entity": "song", "limit": 15, "country": "RU"})
        data = cached("it:" + q.lower(), lambda: http_json("https://itunes.apple.com/search?" + params))
        items = [{"title": r.get("trackName"), "artist": r.get("artistName"), "album": r.get("collectionName"),
                  "cover": (r.get("artworkUrl100") or "").replace("100x100", "200x200"), "preview": r.get("previewUrl"),
                  "duration": round((r.get("trackTimeMillis") or 0) / 1000),
                  "yandex": "https://music.yandex.ru/search?text=" + urllib.parse.quote(f"{r.get('artistName','')} {r.get('trackName','')}")}
                 for r in data.get("results", []) if r.get("previewUrl")]
        return jsonify({"source": "itunes", "yandex_search": ya, "items": items})
    except Exception as e:
        return jsonify({"source": "none", "note": f"Поиск музыки недоступен ({type(e).__name__}).", "yandex_search": ya, "items": []})


# ---------------------------------------------------------------- служебное и сайт
@app.get("/api/health")
def health():
    return jsonify({"ok": True, "app": "Drip Fit", "time": now(), "youtube": bool(CFG.get("youtube_api_key"))})


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return err("Нет такого адреса API", 404)
    return send_from_directory(SITE, "index.html")


@app.get("/")
def index():
    return send_from_directory(SITE, "index.html")


@app.get("/<path:path>")
def static_files(path):
    return send_from_directory(SITE, path)


@app.after_request
def no_cache_api(resp):
    if request.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


if __name__ == "__main__":
    init_db()
    from seed import seed_if_empty
    seed_if_empty(DB_PATH, CFG.get("vip_password", ""))
    print(f"\n  Drip Fit запущен:  http://localhost:{CFG['port']}\n  Остановить — Ctrl+C\n")
    app.run(host=CFG.get("host", "127.0.0.1"), port=int(CFG["port"]), debug=False)
