"""
Whoop API v2 client — OAuth2 + history backfill + mapping to our daily frame.

Credentials come from env (never hard-code): register an app at
https://developer-dashboard.whoop.com to get WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET
and set WHOOP_REDIRECT_URI to a URL you also register there.

The functions that build URLs and map records are pure and unit-testable without
live credentials; the network calls (exchange/refresh/backfill) need a real app.
Once you have a Whoop data export or a live token, `to_daily_frame()` turns raw
v2 JSON into the exact columns train.py / score.py expect, so your own body's
data flows through the identical pipeline as the public training set.
"""
from __future__ import annotations

import os
from urllib.parse import urlencode

import pandas as pd

AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
API_BASE = "https://api.prod.whoop.com/developer"
SCOPES = ["read:recovery", "read:sleep", "read:cycles", "read:profile", "offline"]


def authorize_url(state: str) -> str:
    """Step 1: send the user here to grant access."""
    params = {
        "response_type": "code",
        "client_id": os.environ["WHOOP_CLIENT_ID"],
        "redirect_uri": os.environ["WHOOP_REDIRECT_URI"],
        "scope": " ".join(SCOPES),
        "state": state,  # store + verify to prevent CSRF
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def _token_request(data: dict) -> dict:
    import requests  # imported lazily so pure helpers don't require it
    data = {
        **data,
        "client_id": os.environ["WHOOP_CLIENT_ID"],
        "client_secret": os.environ["WHOOP_CLIENT_SECRET"],
    }
    r = requests.post(TOKEN_URL, data=data, timeout=30)
    r.raise_for_status()
    return r.json()


def exchange_code(code: str) -> dict:
    """Step 2: swap the auth code for access + refresh tokens."""
    return _token_request({
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": os.environ["WHOOP_REDIRECT_URI"],
    })


def refresh(refresh_token: str) -> dict:
    """Refresh an expired access token (rotate: store the newest refresh_token)."""
    return _token_request({
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "scope": "offline",
    })


def _get_all(path: str, access_token: str, start: str, end: str) -> list[dict]:
    """Paginate a v2 collection endpoint via nextToken until exhausted."""
    import requests
    out, token = [], None
    while True:
        params = {"start": start, "end": end, "limit": 25}
        if token:
            params["nextToken"] = token
        r = requests.get(f"{API_BASE}{path}", params=params,
                         headers={"Authorization": f"Bearer {access_token}"}, timeout=30)
        r.raise_for_status()
        body = r.json()
        out.extend(body.get("records", []))
        token = body.get("next_token")
        if not token:
            return out


def backfill(access_token: str, start: str, end: str) -> dict[str, list[dict]]:
    """Pull recovery + sleep + cycle history for the window (ISO 8601 strings)."""
    return {
        "recovery": _get_all("/v2/recovery", access_token, start, end),
        "sleep": _get_all("/v2/activity/sleep", access_token, start, end),
        "cycle": _get_all("/v2/cycle", access_token, start, end),
    }


def to_daily_frame(recovery: list[dict], sleep: list[dict],
                   cycle: list[dict]) -> pd.DataFrame:
    """
    Map raw Whoop v2 records onto one row per calendar day with our column names.
    Recovery carries RHR/HRV/SpO2/skin-temp; sleep carries respiratory rate.
    """
    def _date(rec: dict) -> str | None:
        ts = rec.get("created_at") or rec.get("start") or rec.get("end")
        return ts[:10] if ts else None

    rows: dict[str, dict] = {}
    for rec in recovery:
        s = (rec.get("score") or {})
        d = _date(rec)
        if not d:
            continue
        rows.setdefault(d, {"date": d})
        rows[d].update({
            "resting_heart_rate": s.get("resting_heart_rate"),
            "hrv_rmssd_milli": s.get("hrv_rmssd_milli"),
            "spo2_percentage": s.get("spo2_percentage"),
            "skin_temp_celsius": s.get("skin_temp_celsius"),
            "user_calibrating": s.get("user_calibrating"),
        })
    for rec in sleep:
        if rec.get("nap"):
            continue
        s = (rec.get("score") or {})
        d = _date(rec)
        if not d:
            continue
        rows.setdefault(d, {"date": d})
        rows[d]["respiratory_rate"] = s.get("respiratory_rate")

    df = pd.DataFrame(sorted(rows.values(), key=lambda r: r["date"]))
    if df.empty:
        return df
    df["subject_id"] = "whoop_user"
    df["day_index"] = range(len(df))
    return df


if __name__ == "__main__":
    # pure-function smoke test (no network / no credentials needed)
    rec = [{"created_at": "2026-03-01T12:00:00Z",
            "score": {"resting_heart_rate": 58, "hrv_rmssd_milli": 71,
                      "skin_temp_celsius": 33.1, "user_calibrating": False}}]
    slp = [{"start": "2026-03-01T05:00:00Z", "nap": False,
            "score": {"respiratory_rate": 14.2}}]
    frame = to_daily_frame(rec, slp, [])
    print(frame.to_dict(orient="records"))
