import { describe, expect, test } from "bun:test";
import { sonariaPlugins } from "../src/index";

const names = (plugins: ReturnType<typeof sonariaPlugins>): string[] =>
  plugins.map((plugin) => plugin.constructor.name);

describe("sonariaPlugins", () => {
  test("returns the suite in mirror priority order", () => {
    expect(names(sonariaPlugins())).toEqual([
      "DeezerPlugin",
      "YouTubePlugin",
      "SoundCloudPlugin",
      "SpotifyPlugin",
      "AppleMusicPlugin",
    ]);
  });

  test("allows skipping individual sources", () => {
    expect(names(sonariaPlugins({ soundcloud: false, spotify: false, applemusic: false }))).toEqual([
      "DeezerPlugin",
      "YouTubePlugin",
    ]);
  });

  test("passes options through to the factories", () => {
    const [deezer, youtube, soundcloud, spotifyPlugin, appleMusic] = sonariaPlugins({
      deezer: { searchLimit: 3 },
      youtube: { search: "innertube" },
      soundcloud: { searchLimit: 3 },
      spotify: { embedFallback: false },
      applemusic: { storefront: "id" },
    });
    expect(deezer).toBeDefined();
    expect(youtube).toBeDefined();
    expect(soundcloud).toBeDefined();
    expect(spotifyPlugin).toBeDefined();
    expect(appleMusic).toBeDefined();
  });
});
