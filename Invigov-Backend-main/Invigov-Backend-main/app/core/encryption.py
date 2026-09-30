import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings


def _get_key() -> bytes:
    key = base64.b64decode(settings.ENCRYPTION_KEY)
    assert len(key) == 32, "ENCRYPTION_KEY must be 32 bytes (AES-256)"
    return key


def encrypt(plaintext: str) -> bytes:
    """Encrypt a string value. Returns nonce+ciphertext as bytes."""
    aesgcm = AESGCM(_get_key())
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return nonce + ciphertext


def decrypt(data: bytes) -> str:
    """Decrypt bytes produced by encrypt(). Returns original plaintext."""
    aesgcm = AESGCM(_get_key())
    nonce, ciphertext = data[:12], data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
