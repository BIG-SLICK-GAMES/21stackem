import type { ImageSourcePropType } from "react-native";

export type BuiltInAvatar = {
  id: string;
  label: string;
  sPath: ImageSourcePropType;
  sUri: string;
};

const AVATAR_MODULES = [
  require("../../../assets/images/player-profile/profile_images/profile-1.png"),
  require("../../../assets/images/player-profile/profile_images/profile-2.png"),
  require("../../../assets/images/player-profile/profile_images/profile-3.png"),
  require("../../../assets/images/player-profile/profile_images/profile-4.png"),
  require("../../../assets/images/player-profile/profile_images/profile-5.png"),
  require("../../../assets/images/player-profile/profile_images/profile-6.png")
] as const;

function hashSeed(seed = "") {
  return String(seed || "guest")
    .split("")
    .reduce((hash, char) => ((hash * 31 + char.charCodeAt(0)) % 2147483647), 7);
}

function resolveAssetUri(source: ImageSourcePropType) {
  if (typeof source === "number") {
    return String(source);
  }

  if (source && typeof source === "object" && "uri" in source && typeof source.uri === "string") {
    return source.uri;
  }

  return "";
}

export const BUILT_IN_AVATARS: BuiltInAvatar[] = AVATAR_MODULES.map((source, index) => ({
  id: `profile-image-${index + 1}`,
  label: `Profile ${index + 1}`,
  sPath: source,
  sUri: resolveAssetUri(source)
}));

export function getBuiltInAvatar(seed = "") {
  if (!BUILT_IN_AVATARS.length) {
    return null;
  }

  return BUILT_IN_AVATARS[Math.abs(hashSeed(seed)) % BUILT_IN_AVATARS.length];
}

export function getAvatarUri(src?: string, seed = "") {
  if (src && src.trim()) {
    return src.trim();
  }

  return getBuiltInAvatar(seed)?.sUri ?? "";
}

export function getAvatarImageSource(src?: string, seed = ""): ImageSourcePropType | undefined {
  if (src && src.trim()) {
    return { uri: src.trim() };
  }

  return getBuiltInAvatar(seed)?.sPath;
}

export function buildAvatarOptions(aAvatarList: string[] = [], sAvatar = "") {
  const normalizedSelectedAvatar = getAvatarUri(sAvatar);
  const avatars: Array<BuiltInAvatar & { selected: boolean }> = [];
  const seen = new Set<string>();

  const addAvatar = (avatar: BuiltInAvatar) => {
    if (!avatar.sUri || seen.has(avatar.sUri)) {
      return;
    }

    seen.add(avatar.sUri);
    avatars.push({
      ...avatar,
      selected: avatar.sUri === normalizedSelectedAvatar
    });
  };

  BUILT_IN_AVATARS.forEach(addAvatar);

  aAvatarList.forEach((uri, index) => {
    const cleanUri = String(uri || "").trim();

    if (!cleanUri || seen.has(cleanUri)) {
      return;
    }

    addAvatar({
      id: `remote-avatar-${index + 1}`,
      label: `Avatar ${index + 1}`,
      sPath: { uri: cleanUri },
      sUri: cleanUri
    });
  });

  if (normalizedSelectedAvatar && !seen.has(normalizedSelectedAvatar)) {
    addAvatar({
      id: "current-avatar",
      label: "Current Avatar",
      sPath: { uri: normalizedSelectedAvatar },
      sUri: normalizedSelectedAvatar
    });
  }

  if (!avatars.some((avatar) => avatar.selected) && avatars.length) {
    avatars[0].selected = true;
  }

  return avatars;
}
