#!/usr/bin/env bash
# Fetch an IPD/Jira issue by key. Prints compact JSON to stdout.
# Usage: fetch-issue.sh <ISSUE-KEY> <USERNAME> <PASSWORD>
set -euo pipefail

KEY="${1:-}"
USERNAME="${2:-}"
PASSWORD="${3:-}"

if [[ -z "${KEY}" || -z "${USERNAME}" || -z "${PASSWORD}" ]]; then
  echo "usage: fetch-issue.sh <ISSUE-KEY> <USERNAME> <PASSWORD>" >&2
  exit 2
fi

KEY="$(printf '%s' "${KEY}" | tr '[:lower:]' '[:upper:]')"

BASE_URL="${IPD_BASE_URL:-https://ipd.asiainfo-sec.com:8443}"
FIELDS="summary,description,issuelinks"
URL="${BASE_URL}/rest/api/2/issue/${KEY}?fields=${FIELDS}"

TMP="$(mktemp)"
trap 'rm -f "${TMP}"' EXIT

HTTP_CODE="$(
  curl -sS -o "${TMP}" -w "%{http_code}" \
    -A "zhima-toolkit" \
    -u "${USERNAME}:${PASSWORD}" \
    -H "Accept: application/json" \
    "${URL}"
)"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "error: HTTP ${HTTP_CODE} fetching ${KEY}" >&2
  head -c 2000 "${TMP}" >&2 || true
  echo >&2
  exit 1
fi

python3 - "${TMP}" "${KEY}" <<'PY'
import json, sys

path, key = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    data = json.load(f)

fields = data.get("fields") or {}


def adf_to_text(node):
    if node is None:
        return ""
    if isinstance(node, str):
        return node
    if isinstance(node, list):
        return "".join(adf_to_text(n) for n in node)
    if not isinstance(node, dict):
        return str(node)
    t = node.get("type")
    if t == "text":
        return node.get("text") or ""
    if t == "hardBreak":
        return "\n"
    if t == "mention":
        return node.get("attrs", {}).get("text") or ""
    parts = [adf_to_text(c) for c in node.get("content") or []]
    text = "".join(parts)
    if t in ("paragraph", "heading", "blockquote", "bulletList", "orderedList", "listItem", "table", "tableRow"):
        return text.rstrip() + "\n"
    return text


def field_text(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        if value.get("type") == "doc" or "content" in value:
            return adf_to_text(value).strip()
        if "value" in value:
            return field_text(value["value"])
    return str(value).strip()


def linked_keys_from_issuelinks(issuelinks):
    keys = []
    seen = set()
    for link in issuelinks or []:
        if not isinstance(link, dict):
            continue
        for side in ("outwardIssue", "inwardIssue"):
            issue = link.get(side) or {}
            k = issue.get("key")
            if k and k not in seen:
                seen.add(k)
                keys.append(k)
    return keys


linked_keys = linked_keys_from_issuelinks(fields.get("issuelinks"))
change = linked_keys[0].lower() if linked_keys else None

if not change:
    print("error: issuelinks empty; cannot derive OpenSpec change", file=sys.stderr)
    sys.exit(1)

out = {
    "key": data.get("key") or key,
    "summary": field_text(fields.get("summary")),
    "description": field_text(fields.get("description")),
    "linked_keys": linked_keys,
    "change": change,
}
print(json.dumps(out, ensure_ascii=False, indent=2))
PY
