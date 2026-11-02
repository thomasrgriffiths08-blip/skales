# Photo candidates for the Skales rebuild: run of 2026-11-02

**Result: no photos or videos were downloaded. Pexels is blocked from this session's network as well.**

## What was checked (2026-11-02, ~21:20 UTC)

| URL | Result |
|---|---|
| `https://api.pexels.com/v1/search?query=test&per_page=1` | `curl: (56) CONNECT tunnel failed, response 403` (HTTP 000 to curl) |
| `https://images.pexels.com/` | `CONNECT tunnel failed, response 403` (HTTP 000) |
| `https://videos.pexels.com/` | `CONNECT tunnel failed, response 403` (HTTP 000) |

The 403 comes from the session's outbound proxy refusing the CONNECT tunnel (a network-policy denial), not from Pexels. Many other non-allowlisted hosts were refused the same way in this session (e.g. mcp.canva.com, mcp.amplitude.com), so this routine ran in an environment whose network access does not include Pexels.

Other checks:
- Pexels helper script found (`pexels-media/scripts/pexels.py`), `key-status`: **API key found**. The key is fine; only the network is blocking.
- ffmpeg, ImageMagick and Pillow are installed, so the rest of the pipeline would run once the network allows it.

## Slot by slot

All 41 slots (kestrel-electrical x4, kerb-and-camber x2, fern-physio x3, southpaw x4, hale-and-partners x2, marrow-and-pin x4, overhead x4 incl. 1 video, long-exposure x4 incl. 1 video, atelier-voss x5, maree x3, signal x4, cadence x2): **not fetched**, same reason for every slot (API search unreachable, 403 at the proxy).

No `credits.json` and no contact sheets, because there are no files.

## What fixes it

Run the routine in a cloud environment whose network access allows `api.pexels.com`, `images.pexels.com` and `videos.pexels.com` (Network access "Full", or a custom allowlist with those three hosts). Only sessions started after the environment change pick it up, and the routine must be set to use that environment.
