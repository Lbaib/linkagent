#!/usr/bin/env bash
# List IPD/Jira issue attachments and download contents to a temp dir.
# Usage: fetch-attachments.sh <ISSUE-KEY> <USERNAME> <PASSWORD> [OUT_DIR]
# Prints JSON summary to stdout: key, attachments[{id,filename,mimeType,size,path}]
set -euo pipefail

KEY="${1:-}"
USERNAME="${2:-}"
PASSWORD="${3:-}"
OUT_DIR="${4:-}"

if [[ -z "${KEY}" || -z "${USERNAME}" || -z "${PASSWORD}" ]]; then
  echo "usage: fetch-attachments.sh <ISSUE-KEY> <USERNAME> <PASSWORD> [OUT_DIR]" >&2
  exit 2
fi

KEY="$(printf '%s' "${KEY}" | tr '[:lower:]' '[:upper:]')"
BASE_URL="${IPD_BASE_URL:-https://ipd.asiainfo-sec.com:8443}"
URL="${BASE_URL}/rest/api/2/issue/${KEY}?fields=attachment"

if [[ -z "${OUT_DIR}" ]]; then
  OUT_DIR="$(mktemp -d "/tmp/sdd-full-attach-${KEY}.XXXXXX")"
else
  mkdir -p "${OUT_DIR}"
fi

META_TMP="$(mktemp)"
trap 'rm -f "${META_TMP}"' EXIT

HTTP_CODE="$(
  curl -sS -o "${META_TMP}" -w "%{http_code}" \
    -A "zhima-toolkit" \
    -u "${USERNAME}:${PASSWORD}" \
    -H "Accept: application/json" \
    "${URL}"
)"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "error: HTTP ${HTTP_CODE} fetching attachments for ${KEY}" >&2
  head -c 2000 "${META_TMP}" >&2 || true
  echo >&2
  exit 1
fi

python3 - "${META_TMP}" "${KEY}" "${USERNAME}" "${PASSWORD}" "${BASE_URL}" "${OUT_DIR}" <<'PY'
import json, os, sys, urllib.request, ssl

meta_path, key, user, password, base_url, out_dir = sys.argv[1:7]
with open(meta_path, encoding="utf-8") as f:
    data = json.load(f)

attachments = (data.get("fields") or {}).get("attachment") or []
if not attachments:
    print(json.dumps({"key": key, "out_dir": out_dir, "attachments": [], "error": "no attachments"}, ensure_ascii=False, indent=2))
    sys.exit(1)

# Basic auth for content download
import base64
token = base64.b64encode(f"{user}:{password}".encode()).decode()
ctx = ssl.create_default_context()

results = []
for att in attachments:
    att_id = str(att.get("id") or "")
    filename = att.get("filename") or f"attachment-{att_id}"
    content_url = att.get("content") or f"{base_url}/secure/attachment/{att_id}/{filename}"
    mime = att.get("mimeType") or ""
    size = att.get("size")
    safe_name = filename.replace("/", "_")
    dest = os.path.join(out_dir, f"{att_id}_{safe_name}")
    req = urllib.request.Request(content_url, headers={
        "Authorization": f"Basic {token}",
        "Accept": "*/*",
    })
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
            body = resp.read()
        with open(dest, "wb") as out:
            out.write(body)
        results.append({
            "id": att_id,
            "filename": filename,
            "mimeType": mime,
            "size": size,
            "path": dest,
            "content_url": content_url,
            "ok": True,
        })
    except Exception as e:
        results.append({
            "id": att_id,
            "filename": filename,
            "mimeType": mime,
            "size": size,
            "path": None,
            "content_url": content_url,
            "ok": False,
            "error": str(e),
        })

ok_count = sum(1 for r in results if r.get("ok"))
if ok_count == 0:
    print(json.dumps({"key": key, "out_dir": out_dir, "attachments": results, "error": "all downloads failed"}, ensure_ascii=False, indent=2))
    sys.exit(1)

print(json.dumps({"key": key, "out_dir": out_dir, "attachments": results}, ensure_ascii=False, indent=2))
PY
