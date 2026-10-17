import type { SonariaPlugin } from "sonaria";
import { applemusic, type AppleMusicPluginOptions } from "sonaria-plugin-applemusic";
import { deezer, type DeezerPluginOptions } from "sonaria-plugin-deezer";
import { soundcloud, type SoundCloudPluginOptions } from "sonaria-plugin-soundcloud";
import { spotify, type SpotifyPluginOptions } from "sonaria-plugin-spotify";
import { youtube, type YouTubePluginOptions } from "sonaria-plugin-youtube";

export * from "sonaria-plugin-core";
export * from "sonaria-plugin-deezer";
export * from "sonaria-plugin-soundcloud";
export * from "sonaria-plugin-youtube";
export * from "sonaria-plugin-spotify";
export * from "sonaria-plugin-applemusic";

export interface SonariaPluginsOptions {
  /** Deezer extractor options, or `false` to leave it out. */
  deezer?: DeezerPluginOptions | false;
  /** YouTube extractor options, or `false` to leave it out. */
  youtube?: YouTubePluginOptions | false;
  /** SoundCloud extractor options, or `false` to leave it out. */
  soundcloud?: SoundCloudPluginOptions | false;
  /** Spotify info plugin options, or `false` to leave it out. */
  spotify?: SpotifyPluginOptions | false;
  /** Apple Music info plugin options, or `false` to leave it out. */
  applemusic?: AppleMusicPluginOptions | false;
}

/**
 * Create the full plugin list in the recommended registration order.
 *
 * Extractor plugins come first (Deezer → YouTube → SoundCloud), which is also
 * the **mirror priority** used when Spotify/Apple Music songs are resolved
 * through `createSearchQuery()`. Info plugins are registered last.
 *
 * ```ts
 * const sonaria = new Sonaria(client, { plugins: sonariaPlugins() });
 * ```
 */
export function sonariaPlugins(options: SonariaPluginsOptions = {}): SonariaPlugin[] {
  const plugins: SonariaPlugin[] = [];
  if (options.deezer !== false) plugins.push(deezer(options.deezer ?? {}));
  if (options.youtube !== false) plugins.push(youtube(options.youtube ?? {}));
  if (options.soundcloud !== false) plugins.push(soundcloud(options.soundcloud ?? {}));
  if (options.spotify !== false) plugins.push(spotify(options.spotify ?? {}));
  if (options.applemusic !== false) plugins.push(applemusic(options.applemusic ?? {}));
  return plugins;
}

export default sonariaPlugins;
