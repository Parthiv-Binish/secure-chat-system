from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import hashlib
import base64

def generate_key(sender: str, recipient: str) -> bytes:
    combined = f"{sender}:{recipient}".encode()
    return hashlib.sha256(combined).digest()

def encrypt_message(message: str, key: bytes) -> str:
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()
    padded_message = message.encode() + b"\0" * (16 - len(message) % 16)
    ciphertext = encryptor.update(padded_message) + encryptor.finalize()
    return base64.b64encode(iv + ciphertext).decode()

def decrypt_message(encrypted: str, key: bytes) -> str:
    raw = base64.b64decode(encrypted)
    iv, ciphertext = raw[:16], raw[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_message = decryptor.update(ciphertext) + decryptor.finalize()
    return padded_message.rstrip(b"\0").decode()