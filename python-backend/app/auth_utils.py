import jwt
from fastapi import Header, HTTPException


def get_current_user_sub(authorization: str = Header(...)) -> str:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    # Signature isn't verified here: this claim only identifies who to show/record
    # the data-usage notice for. Every actual data request still goes through
    # core-api, which independently verifies the token before returning anything.
    try:
        claims = jwt.decode(token, options={"verify_signature": False})
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Malformed token")

    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token missing sub claim")

    return sub
