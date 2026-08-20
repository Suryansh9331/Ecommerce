/**
 * Music Library — the catalogue merchants pick from when making a reel.
 *
 * This page exists so adding a song does not need a developer. The music library
 * is the kind of thing that changes constantly — a new track, a different
 * trending order, pulling something that turned out to be a problem — and routing
 * every one of those through an engineer would mean it simply never happens.
 *
 * Songs are added here and nowhere else. There is no merchant-facing upload, by
 * design: whoever adds a track is asserting the platform has the right to use it,
 * and that has to be a small, accountable group.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  Music, Pause, Play, Plus, Search, Star, Volume2, VolumeX, X,
} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Song {
  song_id: number;
  title: string;
  artist: string | null;
  artwork_url: string | null;
  duration_ms: number;
  preview_url: string | null;
  tags: string[];
  language: string | null;
  usage_count: number;
  provider: string;
  attribution_required: boolean;
  attribution_text: string | null;
}

const formatClock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const formatDuration = (ms: number) => {
  if (!ms) return "—";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  "Content-Type": "application/json",
});

const MusicLibrary: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Upload is the default because it is the realistic one: downloading a track
  // from Pixabay leaves a file on disk, not a link. The URL tab is for
  // catalogues that already host their audio.
  const [addMode, setAddMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  // Cover image. An admin who downloaded a track downloaded its cover too, so a
  // picker beats asking them to host it somewhere and paste a link.
  const [artwork, setArtwork] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);

  // One audio element for the whole page, so starting a track stops the last —
  // per-row players leave four songs going at once after a few clicks.
  const [audio] = useState(() =>
    typeof Audio !== "undefined" ? new Audio() : null
  );
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // The track the bar is showing. Kept as an object rather than looked up by id
  // each render, so the bar survives a search that filters the row away.
  const [nowPlaying, setNowPlaying] = useState<Song | null>(null);

  const [form, setForm] = useState({
    title: "",
    artist: "",
    audio_url: "",
    artwork_url: "",
    tags: "",
    licence_name: "Pixabay Content License",
    attribution_text: "",
  });

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: "all",
        per_page: "50",
      });
      if (search.trim()) params.set("q", search.trim());

      const resp = await fetch(`${API_BASE_URL}/api/music/songs?${params}`, {
        headers: authHeaders(),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.message || "Could not load songs");
      setSongs(body?.data?.songs || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load songs");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchSongs, 300); // debounce the search box
    return () => clearTimeout(t);
  }, [fetchSongs]);

  useEffect(() => {
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    // Duration arrives asynchronously; reading it before metadata loads gives NaN
    // and a seek bar that cannot be dragged.
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
    };
  }, [audio]);

  useEffect(() => {
    if (audio) audio.volume = muted ? 0 : volume;
  }, [audio, volume, muted]);

  const togglePreview = (song: Song) => {
    if (!audio || !song.preview_url) {
      toast.error("No preview available for this track.");
      return;
    }

    // Same track: just pause or resume, keeping the position. Reloading the src
    // would jump back to zero, which is maddening when auditing a long track.
    if (playingId === song.song_id) {
      if (audio.paused) audio.play().catch(() => toast.error("Could not play this track."));
      else audio.pause();
      return;
    }

    audio.src = song.preview_url;
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(song.duration_ms ? song.duration_ms / 1000 : 0);
    setPlayingId(song.song_id);
    setNowPlaying(song);
    audio.play().catch(() => toast.error("Could not play this track."));
  };

  const seek = (seconds: number) => {
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const stopPlayback = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingId(null);
    setNowPlaying(null);
    setCurrentTime(0);
  };

  const resetForm = () => {
    setForm({ ...form, title: "", artist: "", audio_url: "", artwork_url: "", tags: "" });
    setFile(null);
    if (artworkPreview) URL.revokeObjectURL(artworkPreview);
    setArtwork(null);
    setArtworkPreview(null);
  };

  const addSong = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (addMode === "file" && !file) {
      toast.error("Choose an audio file.");
      return;
    }
    if (addMode === "url" && !form.audio_url.trim()) {
      toast.error("Audio URL is required.");
      return;
    }

    setSaving(true);
    try {
      let resp: Response;

      if (addMode === "file") {
        const fd = new FormData();
        fd.append("file", file as File);
        if (artwork) fd.append("artwork", artwork);
        Object.entries(form).forEach(([k, v]) => {
          if (k !== "audio_url" && v) fd.append(k, v as string);
        });
        // No Content-Type header: the browser must set the multipart boundary
        // itself, and providing one breaks the upload.
        resp = await fetch(`${API_BASE_URL}/api/superadmin/music/songs/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
          body: fd,
        });
      } else {
        resp = await fetch(`${API_BASE_URL}/api/superadmin/music/songs`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            ...form,
            title: form.title.trim(),
            audio_url: form.audio_url.trim(),
          }),
        });
      }

      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.message || "Could not add the song");

      // Measuring the track and drawing its waveform takes a moment, so name
      // what happened rather than leaving an unexplained pause.
      toast.success("Song added — length and waveform generated.");
      setShowAdd(false);
      resetForm();
      await fetchSongs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add the song");
    } finally {
      setSaving(false);
    }
  };

  const patchSong = async (songId: number, changes: Record<string, unknown>, note: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/superadmin/music/songs/${songId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(changes),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.message || "Update failed");
      toast.success(note);
      await fetchSongs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const removeSong = (song: Song) => {
    // Deactivated, never deleted. Reels that already used the track keep their
    // reel_audio row, so "use this sound" and any rights audit still resolve.
    patchSong(song.song_id, { is_active: false },
              `"${song.title}" removed from the picker.`);
  };

  return (
    <div className={`min-h-screen bg-gray-50 p-4 sm:p-6 ${nowPlaying ? "pb-24" : ""}`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Music className="w-6 h-6" /> Music Library
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Tracks merchants can add to their reels. Only add music the platform
              has the right to use.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> Add Song
          </button>
        </div>

        <div className="mb-4 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, artist or tag…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500">Loading…</div>
        ) : songs.length === 0 ? (
          <div className="py-16 text-center">
            <Music className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No songs yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add a few tracks so merchants have something to choose from.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Track</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3 text-center">Length</th>
                  <th className="px-4 py-3 text-center">Used in</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {songs.map((song) => (
                  <tr key={song.song_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePreview(song)}
                          className="group relative w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden hover:bg-gray-200"
                          aria-label={
                            playingId === song.song_id && isPlaying ? "Pause" : "Play"
                          }
                        >
                          {song.artwork_url ? (
                            <img src={song.artwork_url} alt=""
                                 className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <Music className="w-4 h-4 text-gray-400" />
                          )}
                          {/* Overlaid so the control is obvious on artwork as well
                              as on the blank placeholder. */}
                          <span
                            className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
                              playingId === song.song_id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {playingId === song.song_id && isPlaying ? (
                              <Pause className="w-4 h-4 text-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white" />
                            )}
                          </span>
                        </button>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {song.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {song.artist || "Unknown artist"} · {song.provider}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {song.tags.slice(0, 3).map((t) => (
                          <span key={t}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {formatDuration(song.duration_ms)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {song.usage_count} {song.usage_count === 1 ? "reel" : "reels"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() =>
                            patchSong(song.song_id, { trending_rank: 1 },
                                      `"${song.title}" featured in Trending.`)
                          }
                          className="text-gray-500 hover:text-primary-600"
                          title="Feature in Trending"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeSong(song)}
                          className="text-gray-500 hover:text-red-600"
                          title="Remove from the picker"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky player. One bar rather than per-row controls: an admin auditing a
          catalogue scrolls while listening, and inline controls scroll away with
          the row they belong to. */}
      {nowPlaying && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            {nowPlaying.artwork_url ? (
              <img src={nowPlaying.artwork_url} alt=""
                   className="h-11 w-11 flex-shrink-0 rounded object-cover" />
            ) : (
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                <Music className="h-4 w-4 text-gray-400" />
              </div>
            )}

            <div className="hidden min-w-0 w-44 sm:block">
              <p className="truncate text-sm font-medium text-gray-900">
                {nowPlaying.title}
              </p>
              <p className="truncate text-xs text-gray-500">
                {nowPlaying.artist || "Unknown artist"}
              </p>
            </div>

            <button
              onClick={() => togglePreview(nowPlaying)}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
            </button>

            <div className="flex flex-1 items-center gap-2">
              <span className="w-10 flex-shrink-0 text-right text-xs tabular-nums text-gray-500">
                {formatClock(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Seek"
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary-600"
              />
              <span className="w-10 flex-shrink-0 text-xs tabular-nums text-gray-500">
                {formatClock(duration)}
              </span>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => setMuted((m) => !m)}
                className="text-gray-500 hover:text-gray-800"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0
                  ? <VolumeX className="h-4 w-4" />
                  : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  // Dragging the slider up is an unmute in every player anyone
                  // has used; leaving it muted would read as broken.
                  if (Number(e.target.value) > 0) setMuted(false);
                }}
                aria-label="Volume"
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary-600"
              />
            </div>

            <button
              onClick={stopPlayback}
              className="flex-shrink-0 text-gray-400 hover:text-gray-700"
              aria-label="Close player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900">Add a song</h2>
            <p className="mt-1 text-sm text-gray-500">
              The server reads the track's length and draws the waveform merchants
              trim against, so this takes a couple of seconds.
            </p>

            {/* Upload first: a track downloaded from Pixabay is a file on disk,
                not a link, so that is what an admin actually has to hand. */}
            <div className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1">
              {(["file", "url"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAddMode(mode)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    addMode === mode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {mode === "file" ? "Upload file" : "From URL"}
                </button>
              ))}
            </div>

            {addMode === "file" ? (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  Audio file *
                </label>
                <input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    setFile(picked);
                    // Save a step: the filename is almost always the track name.
                    if (picked && !form.title.trim()) {
                      setForm((f) => ({
                        ...f,
                        title: picked.name.replace(/\.[^.]+$/, ""),
                      }));
                    }
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
                />
                {file && (
                  <p className="mt-1 text-xs text-gray-500">
                    {file.name} · {(file.size / (1024 * 1024)).toFixed(1)}MB
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  mp3, m4a, wav, ogg, flac or aac · up to 30MB
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  Audio URL *
                </label>
                <input
                  type="text"
                  value={form.audio_url}
                  onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                  placeholder="https://cdn.example.com/track.mp3"
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Must point straight at the audio file, not a player page.
                </p>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                Cover image
              </label>
              <div className="mt-1 flex items-center gap-3">
                {artworkPreview ? (
                  <img src={artworkPreview} alt=""
                       className="w-14 h-14 rounded object-cover border border-gray-200" />
                ) : (
                  <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center">
                    <Music className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    if (artworkPreview) URL.revokeObjectURL(artworkPreview);
                    setArtwork(picked);
                    setArtworkPreview(picked ? URL.createObjectURL(picked) : null);
                  }}
                  className="flex-1 rounded-md border border-gray-300 p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                jpg, png or webp · up to 5MB · optional
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {([
                ["title", "Title *", "Happy Vibes"],
                ["artist", "Artist", "Music Unlimited"],
                ["tags", "Tags (comma separated)", "trending, happy, pop"],
                ["licence_name", "Licence", "Pixabay Content License"],
                ["attribution_text", "Attribution (if required)", ""],
              ] as const).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700">{label}</label>
                  <input
                    type="text"
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowAdd(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={addSong}
                disabled={
                  saving ||
                  !form.title.trim() ||
                  (addMode === "file" ? !file : !form.audio_url.trim())
                }
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Adding…" : "Add song"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicLibrary;
