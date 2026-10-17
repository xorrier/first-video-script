"""Hindi narration via edge-tts (free Microsoft Edge neural voices, no API key).

Usage: python scripts/tts.py jobs.json
jobs.json = {"voice": "...", "rate": "+0%", "pitch": "+0Hz",
             "jobs": [{"id": "h1", "text": "...", "audio": "path.mp3", "words": "path.json"}]}
Writes the MP3 plus a JSON list of word boundaries [{"t": sec, "d": sec, "w": "word"}].
"""
import asyncio
import json
import sys

try:
    import edge_tts
except ImportError:
    print("ERROR: python package 'edge-tts' is missing. Install it with: python -m pip install --user edge-tts", file=sys.stderr)
    sys.exit(3)


async def synth(job, voice, rate, pitch, sem):
    async with sem:
        for attempt in range(4):
            try:
                comm = edge_tts.Communicate(job["text"], voice, rate=rate, pitch=pitch, boundary="WordBoundary")
                audio = bytearray()
                words = []
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        words.append({
                            "t": chunk["offset"] / 1e7,
                            "d": chunk["duration"] / 1e7,
                            "w": chunk["text"],
                        })
                if not audio:
                    raise RuntimeError("empty audio")
                with open(job["audio"], "wb") as f:
                    f.write(audio)
                with open(job["words"], "w", encoding="utf-8") as f:
                    json.dump(words, f, ensure_ascii=False)
                print(f"  tts ok  {job['id']}  ({len(words)} words)")
                return
            except Exception as e:  # network hiccups are common; retry
                print(f"  tts retry {job['id']} ({attempt + 1}): {e}", file=sys.stderr)
                await asyncio.sleep(1.5 * (attempt + 1))
        raise RuntimeError(f"TTS failed for {job['id']}")


async def main():
    with open(sys.argv[1], encoding="utf-8") as f:
        cfg = json.load(f)
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*[
        synth(j, cfg["voice"], cfg["rate"], cfg["pitch"], sem) for j in cfg["jobs"]
    ])


if __name__ == "__main__":
    asyncio.run(main())
