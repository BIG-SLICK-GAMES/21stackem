import { Href, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { AppNav } from "../components/layout/AppNav";
import { ScreenContainer } from "../components/layout/ScreenContainer";
import { HubAccessGate } from "../components/platform/HubAccessGate";
import { HubNotice } from "../components/platform/HubNotice";
import { HubPanel } from "../components/platform/HubPanel";
import { GameButton } from "../components/ui/GameButton";
import { hubSocialApi } from "../platform/api/social";
import { useHubSession } from "../platform/auth/session";
import { formatChipCount, getErrorMessage } from "../platform/lib/format";
import type { HubSocialStatus } from "../platform/types";
import { theme } from "../theme";

const PLATFORMS = [
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "X", value: "x" },
  { label: "YouTube", value: "youtube" },
  { label: "Other", value: "other" }
];

type RecordingState = "idle" | "recording" | "saved" | "unsupported";

export function SocialScreen() {
  const { profile, refreshProfile, status, token } = useHubSession();
  const [socialStatus, setSocialStatus] = useState<HubSocialStatus | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("tiktok");
  const [tagText, setTagText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasShared, setHasShared] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const referralCode = socialStatus?.referralCode || profile?.sPrivateCode || "";
  const tags = useMemo(
    () =>
      tagText
        .split(/[,\s]+/)
        .map((tag) => tag.trim().replace(/^@+/, ""))
        .filter(Boolean),
    [tagText]
  );
  const referralLink = useMemo(() => {
    if (!referralCode) {
      return "";
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      return `${window.location.origin}/auth?mode=register&referralCode=${encodeURIComponent(referralCode)}`;
    }

    return `https://bigslickgames.netlify.app/auth?mode=register&referralCode=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);
  const postText = useMemo(() => {
    const tagSuffix = tags.length ? `\n\nTagged: ${tags.map((tag) => `@${tag}`).join(" ")}` : "";
    const linkSuffix = referralLink ? `\n\nJoin me: ${referralLink}` : "";

    return `I just played 21 Stack'em. Beat my run and stack chips with me.${tagSuffix}${linkSuffix}`;
  }, [referralLink, tags]);

  const hydrate = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await hubSocialApi.getStatus(token);
      setSocialStatus(response.body.data);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }, [token]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    setMessage(null);

    if (Platform.OS !== "web" || typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setRecordingState("unsupported");
      setError("Screen recording is only available on web until a native recorder module is added.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true
      });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = saveRecordingToDevice;
      recorder.start();
      setRecordingState("recording");
      setMessage("Recording started. Stop it when your run is ready to post.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function saveRecordingToDevice() {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `21-stackem-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setRecordingState("saved");
    setMessage("Recording saved to this device.");
  }

  async function sharePost() {
    setError(null);
    setMessage(null);

    try {
      await Share.share({
        message: postText,
        title: "21 Stack'em run"
      });
      setHasShared(true);
      setMessage("Share sheet opened. Claim your reward after posting.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }

  async function claimReward() {
    if (!token || !hasShared) {
      return;
    }

    setIsClaiming(true);
    setError(null);
    setMessage(null);

    try {
      const response = await hubSocialApi.claimPostShare(token, {
        platform: selectedPlatform,
        postText,
        tags
      });
      setMessage(`Credited ${formatChipCount(response.body.data.amount)} chips.`);
      setHasShared(false);
      await refreshProfile();
      await hydrate();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsClaiming(false);
    }
  }

  async function copyReferralLink() {
    if (!referralLink) {
      return;
    }

    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(referralLink);
      setMessage("Referral link copied.");
      return;
    }

    await Share.share({ message: referralLink, title: "21 Stack'em referral" });
  }

  if (status !== "authenticated" || !token) {
    return (
      <ScreenContainer scroll contentContainerStyle={styles.content}>
        <AppNav />
        <HubAccessGate message="Sign in to earn social share chips and referral rewards." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <AppNav />
      <HubPanel
        subtitle="Record a run, post it, tag friends, and claim social chips."
        title="Social"
      >
        <View style={styles.statGrid}>
          <SocialStat label="Chips" value={formatChipCount(profile?.nChips)} />
          <SocialStat label="Post" value="+100" />
          <SocialStat label="Per Tag" value="+50" />
          <SocialStat label="Signup" value="+100" />
        </View>

        {message ? <HubNotice message={message} tone="success" /> : null}
        {error ? <HubNotice message={error} tone="error" /> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Screen Recording</Text>
          <Text style={styles.body}>
            Web recording asks for browser screen permission and downloads the video when stopped.
          </Text>
          <View style={styles.buttonRow}>
            <GameButton
              disabled={recordingState === "recording"}
              label="Start Recording"
              onPress={() => {
                void startRecording();
              }}
              subtitle="Opt in and grant screen permission"
              tone="primary"
            />
            <GameButton
              disabled={recordingState !== "recording"}
              label="Stop + Save"
              onPress={stopRecording}
              subtitle="Downloads the clip to this device"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Post Setup</Text>
          <View style={styles.platformGrid}>
            {PLATFORMS.map((platform) => {
              const selected = selectedPlatform === platform.value;

              return (
                <Pressable
                  key={platform.value}
                  onPress={() => setSelectedPlatform(platform.value)}
                  style={({ pressed }) => [
                    styles.platformButton,
                    selected && styles.platformButtonSelected,
                    pressed && styles.platformButtonPressed
                  ]}
                >
                  <Text style={[styles.platformText, selected && styles.platformTextSelected]}>
                    {platform.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            autoCapitalize="none"
            onChangeText={setTagText}
            placeholder="Tag usernames, separated by commas"
            placeholderTextColor={theme.colors.subtleText}
            style={styles.input}
            value={tagText}
          />
          <View style={styles.preview}>
            <Text style={styles.previewText}>{postText}</Text>
          </View>
          <View style={styles.buttonRow}>
            <GameButton
              label="Open Share"
              onPress={() => {
                void sharePost();
              }}
              subtitle="Choose your social app"
              tone="primary"
            />
            <GameButton
              disabled={!hasShared || isClaiming}
              label={isClaiming ? "Claiming..." : "I Posted It"}
              onPress={() => {
                void claimReward();
              }}
              subtitle={`Credits ${formatChipCount(100 + tags.length * 50)}`}
            />
          </View>
        </View>
      </HubPanel>

      <HubPanel
        subtitle="Share this link. When someone creates an account from your code, you get 100 chips."
        title="Referral"
      >
        <View style={styles.referralBox}>
          <Text style={styles.referralCode}>{referralCode || "Loading..."}</Text>
          <Text style={styles.body}>{referralLink || "Referral link unavailable."}</Text>
        </View>
        <View style={styles.buttonRow}>
          <GameButton
            disabled={!referralLink}
            label="Copy Link"
            onPress={() => {
              void copyReferralLink();
            }}
            subtitle="Send it to a friend"
            tone="primary"
          />
          <GameButton
            label="Create Account"
            onPress={() => {
              router.push({ pathname: "/auth", params: { mode: "register" } } as Href);
            }}
            subtitle="Test referral registration"
          />
        </View>
      </HubPanel>
    </ScreenContainer>
  );
}

function SocialStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    gap: theme.spacing.md
  },
  content: {
    gap: theme.spacing.lg,
    marginHorizontal: "auto",
    maxWidth: 430,
    paddingBottom: theme.spacing.xxxl + 96,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    width: "100%"
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md
  },
  platformButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 42,
    minWidth: 112,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md
  },
  platformButtonPressed: {
    opacity: 0.78
  },
  platformButtonSelected: {
    backgroundColor: "rgba(110, 255, 186, 0.14)",
    borderColor: "rgba(110, 255, 186, 0.38)"
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  platformText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  platformTextSelected: {
    color: theme.colors.text
  },
  preview: {
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md
  },
  previewText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  referralBox: {
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  referralCode: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 28
  },
  section: {
    gap: theme.spacing.md
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18
  },
  statCard: {
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.lg,
    flexGrow: 1,
    gap: 4,
    minWidth: 120,
    padding: theme.spacing.md
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  statLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 18
  }
});
