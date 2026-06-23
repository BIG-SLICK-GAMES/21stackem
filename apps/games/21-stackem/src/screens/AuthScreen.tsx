import { Href, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { HubNotice } from "../components/platform/HubNotice";
import { HubPanel } from "../components/platform/HubPanel";
import { HubTextField } from "../components/platform/HubTextField";
import { GameButton } from "../components/ui/GameButton";
import { OptionGroup } from "../components/ui/OptionGroup";
import { hubAuthApi } from "../platform/api/auth";
import { useHubSession } from "../platform/auth/session";
import { getErrorMessage } from "../platform/lib/format";
import { theme } from "../theme";

type AuthMode = "login" | "register" | "forgot" | "reset";

const PASSWORD_PATTERN =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,16}$/;

const authModeOptions = [
  { label: "Login", value: "login" },
  { label: "Register", value: "register" }
] as const;

function isValidEmail(value: string) {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
}

function isValidUsername(value: string) {
  return /^[a-zA-Z0-9_]+$/.test(value);
}

function isStrongPassword(value: string) {
  return PASSWORD_PATTERN.test(value);
}

export function AuthScreen() {
  const {
    consumeWebsiteHandoff,
    login,
    logout,
    profile,
    register,
    status
  } = useHubSession();
  const params = useLocalSearchParams<{
    forgotPasswordToken?: string | string[];
    handoffCode?: string | string[];
    mode?: string | string[];
    referralCode?: string | string[];
    ref?: string | string[];
    sUserName?: string | string[];
    verificationStatus?: string | string[];
  }>();
  const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const handoffCode = Array.isArray(params.handoffCode)
    ? params.handoffCode[0]
    : params.handoffCode;
  const verificationStatus = Array.isArray(params.verificationStatus)
    ? params.verificationStatus[0]
    : params.verificationStatus;
  const verifiedUserName = Array.isArray(params.sUserName)
    ? params.sUserName[0]
    : params.sUserName;
  const forgotPasswordToken = Array.isArray(params.forgotPasswordToken)
    ? params.forgotPasswordToken[0]
    : params.forgotPasswordToken;
  const referralCodeParam = Array.isArray(params.referralCode)
    ? params.referralCode[0]
    : params.referralCode;
  const shortReferralCodeParam = Array.isArray(params.ref)
    ? params.ref[0]
    : params.ref;
  const [mode, setMode] = useState<AuthMode>(
    forgotPasswordToken ? "reset" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState(
    referralCodeParam || shortReferralCodeParam || ""
  );
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consumedHandoffCode, setConsumedHandoffCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConsumingHandoff, setIsConsumingHandoff] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verificationNotice = useMemo(() => {
    if (verificationStatus === "success") {
      return {
        message: verifiedUserName
          ? `Email verified for ${decodeURIComponent(verifiedUserName)}. You can sign in now.`
          : "Email verified. You can sign in now.",
        tone: "success" as const
      };
    }

    if (verificationStatus === "already") {
      return {
        message: "This email is already verified. Sign in with your password.",
        tone: "info" as const
      };
    }

    if (verificationStatus === "expired") {
      return {
        message: "That verification link expired. Sign in again to request a fresh link.",
        tone: "error" as const
      };
    }

    return null;
  }, [verificationStatus, verifiedUserName]);

  useEffect(() => {
    if (forgotPasswordToken) {
      setMode("reset");
      return;
    }

    if (modeParam === "register") {
      setMode("register");
      return;
    }

    setMode("login");
  }, [forgotPasswordToken, modeParam]);

  useEffect(() => {
    const nextReferralCode = referralCodeParam || shortReferralCodeParam;
    if (nextReferralCode) {
      setReferralCode(nextReferralCode);
      setMode("register");
    }
  }, [referralCodeParam, shortReferralCodeParam]);

  useEffect(() => {
    const nextHandoffCode = handoffCode;

    if (
      typeof nextHandoffCode !== "string" ||
      nextHandoffCode.length === 0 ||
      nextHandoffCode === consumedHandoffCode
    ) {
      return;
    }

    let cancelled = false;
    setConsumedHandoffCode(nextHandoffCode);

    async function run() {
      setError(null);
      setSuccess(null);
      setIsConsumingHandoff(true);

      try {
        await consumeWebsiteHandoff(nextHandoffCode as string);
        if (cancelled) {
          return;
        }
        setSuccess("Shared website session loaded.");
        router.replace("/" as Href);
      } catch (nextError) {
        if (!cancelled) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setIsConsumingHandoff(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [consumeWebsiteHandoff, consumedHandoffCode, handoffCode]);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function validateForSubmit() {
    const identity = email.trim();

    if (mode === "login") {
      if (!identity) {
        return "Email or username is required.";
      }
      if (!isValidEmail(identity) && !isValidUsername(identity)) {
        return "Enter a valid email or username.";
      }
      if (!password) {
        return "Password is required.";
      }
      return null;
    }

    if (mode === "register") {
      if (!isValidEmail(identity)) {
        return "Enter a valid email address.";
      }
      if (!username.trim() || !isValidUsername(username.trim())) {
        return "Username can only use letters, numbers, and underscores.";
      }
      if (!isStrongPassword(password)) {
        return "Password must be 8-16 chars with upper, lower, number, and special.";
      }
      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }
      return null;
    }

    if (mode === "forgot") {
      if (!isValidEmail(identity)) {
        return "Enter the email used on the account.";
      }
      return null;
    }

    if (mode === "reset") {
      if (!forgotPasswordToken) {
        return "Missing password reset token.";
      }
      if (!isStrongPassword(password)) {
        return "Password must be 8-16 chars with upper, lower, number, and special.";
      }
      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }
      return null;
    }

    return null;
  }

  async function handleSubmit() {
    resetMessages();
    const validationError = validateForSubmit();

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          sEmail: email.trim(),
          sPassword: password
        });
        setSuccess("Signed in.");
        router.replace("/profile" as Href);
        return;
      }

      if (mode === "register") {
        const message = await register({
          referralCode: referralCode.trim() || undefined,
          sEmail: email.trim(),
          sPassword: password,
          sUserName: username.trim()
        });
        setSuccess(message || "Registration completed. You can sign in now.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      if (mode === "forgot") {
        const response = await hubAuthApi.forgotPassword({
          sEmail: email.trim()
        });
        const token = (response.body.data as { forgotPasswordToken?: string } | null | undefined)
          ?.forgotPasswordToken;
        setSuccess(
          token
            ? `Reset token prepared. Open /login?forgotPasswordToken=${encodeURIComponent(String(token))}`
            : response.body.message || "Reset link sent. Check your email."
        );
        return;
      }

      if (mode === "reset") {
        if (!forgotPasswordToken) {
          setError("Missing password reset token.");
          return;
        }

        const response = await hubAuthApi.resetPassword({
          sPassword: password,
          sToken: forgotPasswordToken
        });
        setSuccess(response.body.message || "Password reset. You can sign in now.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      setMode("login");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeMode = mode === "forgot" || mode === "reset" ? "login" : mode;
  const showEmail = mode !== "reset";
  const showUsername = mode === "register";
  const showReferralCode = mode === "register";
  const showPassword = mode !== "forgot";
  const showConfirmPassword = mode === "register" || mode === "reset";
  const isLoggedIn = status === "authenticated";

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <HubPanel
        subtitle="Use the same shared account across Stackem and the rest of Big Slick Games."
        title="Account"
      >
        <OptionGroup
          onChange={(value) => {
            setMode(value as AuthMode);
            resetMessages();
          }}
          options={authModeOptions.map((option) => ({
            label: option.label,
            value: option.value
          }))}
          selectedValue={activeMode}
        />

        {verificationNotice ? (
          <HubNotice
            message={verificationNotice.message}
            tone={verificationNotice.tone}
          />
        ) : null}

        {forgotPasswordToken ? (
          <HubNotice
            message="Reset token detected. Enter and confirm a new password."
            tone="info"
          />
        ) : null}

        {showEmail ? (
          <HubTextField
            autoCapitalize="none"
            keyboardType="email-address"
            label={mode === "login" ? "Email or username" : "Email"}
            onChangeText={setEmail}
            placeholder={
              mode === "login"
                ? "player@bigslick.games or username"
                : "player@bigslick.games"
            }
            value={email}
          />
        ) : null}

        {showUsername ? (
          <HubTextField
            autoCapitalize="none"
            label="Username"
            onChangeText={setUsername}
            placeholder="bigslick_player"
            value={username}
          />
        ) : null}

        {showReferralCode ? (
          <HubTextField
            autoCapitalize="characters"
            label="Referral code"
            onChangeText={setReferralCode}
            placeholder="Optional"
            value={referralCode}
          />
        ) : null}

        {showPassword ? (
          <HubTextField
            autoCapitalize="none"
            label={mode === "reset" ? "New password" : "Password"}
            onChangeText={setPassword}
            placeholder={
              mode === "reset"
                ? "Enter a new password"
                : "Enter password"
            }
            secureTextEntry
            value={password}
          />
        ) : null}

        {showConfirmPassword ? (
          <HubTextField
            autoCapitalize="none"
            label="Confirm password"
            onChangeText={setConfirmPassword}
            placeholder="Confirm password"
            secureTextEntry
            value={confirmPassword}
          />
        ) : null}

        {handoffCode ? (
          <HubNotice
            message={
              isConsumingHandoff
                ? "Completing the Big Slick Games website handoff..."
                : "A website handoff code was detected for this session."
            }
            tone={isConsumingHandoff ? "success" : "info"}
          />
        ) : null}

        {error ? <HubNotice message={error} tone="error" /> : null}
        {success ? <HubNotice message={success} tone="success" /> : null}

        <GameButton
          disabled={isSubmitting || isConsumingHandoff}
          label={
            isConsumingHandoff
              ? "Connecting..."
              : mode === "login"
                ? "Sign In"
                : mode === "register"
                  ? "Create Account"
                  : mode === "forgot"
                    ? "Send Reset Link"
                    : mode === "reset"
                      ? "Reset Password"
                      : "Sign In"
          }
          onPress={() => {
            void handleSubmit();
          }}
          subtitle={
            mode === "login"
              ? "Load your shared Big Slick profile"
              : mode === "register"
                ? "Create a new shared account in the common user database"
                : mode === "forgot"
                  ? "Request a password reset through the backend"
                  : mode === "reset"
                    ? "Save the new password for this account"
                    : "Load your shared Big Slick profile"
          }
          tone="primary"
        />

        <View style={styles.linkRow}>
          {mode === "login" ? (
            <InlineLink
              label="Forgot Password?"
              onPress={() => {
                setMode("forgot");
                resetMessages();
              }}
            />
          ) : null}
          {mode === "forgot" || mode === "reset" ? (
            <InlineLink
              label="Back to Login"
              onPress={() => {
                setMode("login");
                setPassword("");
                setConfirmPassword("");
                resetMessages();
              }}
            />
          ) : null}
        </View>

        {isSubmitting || isConsumingHandoff ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingText}>
              {isConsumingHandoff
                ? "Completing website handoff..."
                : "Submitting account request..."}
            </Text>
          </View>
        ) : null}
      </HubPanel>

      <HubPanel
        subtitle="This confirms what is currently loaded from the shared account session."
        title="Current Session"
      >
        <View style={styles.sessionGrid}>
          <SessionStat label="Status" value={status} />
          <SessionStat
            label="User"
            value={profile?.sUserName ?? "No active profile"}
          />
          <SessionStat
            label="Email"
            value={profile?.sEmail ?? "Anonymous"}
          />
          <SessionStat
            label="Type"
            value={profile?.eUserType ?? "anonymous"}
          />
        </View>
        <View style={styles.buttonRow}>
          <GameButton
            disabled={!isLoggedIn}
            label="Open Profile"
            onPress={() => {
              router.push("/profile" as Href);
            }}
            subtitle="Inspect the shared player profile"
            tone="primary"
          />
          <GameButton
            disabled={!isLoggedIn}
            label="Clear Session"
            onPress={() => {
              void logout();
            }}
            subtitle="Remove the saved auth token from this device"
          />
        </View>
      </HubPanel>
    </ScreenContainer>
  );
}

function InlineLink({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.inlineLinkPressed]}>
      <Text style={styles.inlineLink}>{label}</Text>
    </Pressable>
  );
}

function SessionStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sessionStat}>
      <Text style={styles.sessionLabel}>{label}</Text>
      <Text style={styles.sessionValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    gap: theme.spacing.md
  },
  content: {
    gap: theme.spacing.lg,
    marginHorizontal: "auto",
    maxWidth: 430,
    paddingBottom: theme.spacing.xxxl + 32,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl
  },
  inlineLink: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  inlineLinkPressed: {
    opacity: 0.7
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  loadingText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 14
  },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  sessionLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  sessionStat: {
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.lg,
    gap: 6,
    minWidth: 150,
    padding: theme.spacing.md
  },
  sessionValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  }
});

