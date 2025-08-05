from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from crypto_utils import encrypt_message, decrypt_message, generate_key
from face_recognition import verify_face
from typing import List
from jose import jwt
import datetime
import os

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI", "mongodb+srv://mongodbacc:mongodbacc@cluster0.ny1gw.mongodb.net/"))
db = client["secure_chat"]
messages_collection = db["messages"]
users_collection = db["users"]

SECRET_KEY = os.getenv("SECRET_KEY", "0018e5b4402fcfa54a243a253e9af809c20cdf547239888e8187617f68085bc5")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Message(BaseModel):
    sender: str
    content: str
    recipient: str
    timestamp: str

class User(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    face_encoding: str = Field(..., min_length=1)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/register")
async def register(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    users_collection.insert_one(user.dict())
    return {"message": "User registered successfully"}

@app.post("/login")
async def login(user: User):
    stored_user = users_collection.find_one({"username": user.username})
    if not stored_user or not verify_face(user.face_encoding, stored_user["face_encoding"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = jwt.encode({
        "sub": user.username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
