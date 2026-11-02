# Photo candidates for the Skales rebuild (2026-11-02, run 2)

**Pexels is reachable from this environment.** Checks: `api.pexels.com/v1/search` without a key returned 401 (expected; reachable), `images.pexels.com` returned 404 on the root and 200 on a real photo URL, `videos.pexels.com` 301. The helper's `key-status` found the API key and authenticated searches returned results.

## What is here
- `<site>/<slot>/<pexelsId>.jpg`: top 6 Pexels photo results per slot, 1600px on the long side, JPEG q80.
- Video slots: `<site>/<slot>/<pexelsId>.mp4` (top 4 under 25s, H.264, max 1280 wide, no audio, CRF 28, all under 12MB) plus `<pexelsId>-poster.jpg`.
- `sheets/<site>--<slot>.jpg`: one 2x3 contact sheet per slot (600px tiles, Pexels ID in yellow top left).
- `credits.json`: one entry per file (site, slot, id, type, photographer, photographer_url, pexels_url, alt, width, height; videos also duration and MB). Videos have no alt text on Pexels, so `alt` is the slug from the video URL.

## Notes
- Filter: results whose alt text mentioned AI-generated/render/3D/illustration/watermark would have been skipped; none were triggered.
- Results are Pexels relevance order, unpicked. UK look was not enforced: some trade shots show non-UK kit (e.g. US breaker panels in kestrel-electrical/hero 32497160, hard-hat utility shots 17842832 and 7359566). Choose from the sheets.
- long-exposure/reel clips are short and small (0.7-1.3MB); overhead/video 11401302 is the largest at 6.8MB.

## Slot by slot
| site | slot | query | files | result |
|---|---|---|---|---|
| kestrel-electrical | hero | electrician installing consumer unit fuse box | 6 | OK |
| kestrel-electrical | ev | electric car charger on house wall | 6 | OK |
| kestrel-electrical | work | electrician testing socket with multimeter | 6 | OK |
| kestrel-electrical | van | electrician work van | 6 | OK |
| kerb-and-camber | workshop | mechanic car lift workshop | 6 | OK |
| kerb-and-camber | bay | mechanic checking car brakes garage | 6 | OK |
| fern-physio | hero | physiotherapist treating patient knee | 6 | OK |
| fern-physio | room | physiotherapy treatment room | 6 | OK |
| fern-physio | exercise | physiotherapy exercise session resistance band | 6 | OK |
| southpaw | hero | boxing gym ring | 6 | OK |
| southpaw | bag | boxer hitting heavy bag | 6 | OK |
| southpaw | kids | kids boxing class | 6 | OK |
| southpaw | pads | boxing coach holding pads | 6 | OK |
| hale-and-partners | office | modern accountant office desk | 6 | OK |
| hale-and-partners | desk | accountant paperwork calculator desk | 6 | OK |
| marrow-and-pin | hero | tattoo artist tattooing close up hands | 6 | OK |
| marrow-and-pin | studio | tattoo studio interior | 6 | OK |
| marrow-and-pin | piece1 | fine line tattoo arm | 6 | OK |
| marrow-and-pin | piece2 | blackwork tattoo | 6 | OK |
| overhead | hero | aerial view house roof drone | 6 | OK |
| overhead | site | construction site aerial view | 6 | OK |
| overhead | land | aerial view green hills fields england | 6 | OK |
| overhead | video | VIDEO drone aerial countryside fields | 4 | OK |
| long-exposure | reel | VIDEO film crew camera on set | 4 | OK |
| long-exposure | camera | cinema camera operator film set | 6 | OK |
| long-exposure | set | film set lighting crew | 6 | OK |
| long-exposure | edit | video editor editing suite screens | 6 | OK |
| atelier-voss | hero | modern concrete house architecture | 6 | OK |
| atelier-voss | p1 | minimalist concrete building exterior | 6 | OK |
| atelier-voss | p2 | timber house architecture | 6 | OK |
| atelier-voss | p3 | concrete interior natural light | 6 | OK |
| atelier-voss | p4 | modern building facade detail | 6 | OK |
| maree | hero | perfume bottle on dark stone | 6 | OK |
| maree | coast | dark rocky coast waves | 6 | OK |
| maree | notes | bergamot citrus dark background | 6 | OK |
| signal | hero | concert crowd stage lights | 6 | OK |
| signal | stage | festival stage lights night | 6 | OK |
| signal | venue | warehouse concert venue | 6 | OK |
| signal | hands | musician hands playing synthesizer | 6 | OK |
| cadence | depot | logistics warehouse worker tablet | 6 | OK |
| cadence | driver | delivery driver van | 6 | OK |