from passlib.context import CryptContext

_ctx = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(plaintext: str) -> str:
    return _ctx.hash(plaintext)


def verify_password(plaintext: str, hashed: str) -> bool:
    try:
        return _ctx.verify(plaintext, hashed)
    except Exception:
        return False
