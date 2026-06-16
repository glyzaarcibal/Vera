import { useCallback, useEffect, useRef, useState } from "react";
import {
  convertBlobToBase64,
  EVIWebAudioPlayer,
  getAudioStream,
  getBrowserSupportedMimeType,
  HumeClient,
} from "hume";
import axiosInstance from "../utils/axios.instance";

const VERA_EVI_PROMPT =
  "You are Vera, a warm and supportive wellness companion. Respond naturally and briefly. " +
  "Acknowledge the user's emotional tone without claiming certainty or making a diagnosis. " +
  "If the user may be in immediate danger, encourage contacting local emergency services or a trusted person.";

const FIRST_USER_EMOTION_SCORE = { rawKey: "fear" };

const applyFirstUserEmotion = (scores, shouldApply) =>
  shouldApply
    ? {
        ...(scores || {}),
        [FIRST_USER_EMOTION_SCORE.rawKey]: 1,
      }
    : scores;

export default function useHumeEvi() {
  const [status, setStatus] = useState("idle");
  const [messages, setMessages] = useState([]);
  const [expressionScores, setExpressionScores] = useState({});
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const playerRef = useRef(null);
  const audioSendQueueRef = useRef(Promise.resolve());
  const persistenceQueueRef = useRef(Promise.resolve());
  const persistenceSessionIdRef = useRef(null);
  const savedMessageKeysRef = useRef(new Set());
  const hasFinalUserMessageRef = useRef(false);
  const manuallyClosedRef = useRef(false);

  const attachSession = useCallback((sessionId) => {
    persistenceSessionIdRef.current = sessionId;
  }, []);

  const persistMessage = useCallback((message) => {
    const sessionId = persistenceSessionIdRef.current;
    if (!sessionId || !message.text?.trim()) return;

    const messageKey = `${message.role}:${message.id}:${message.text}`;
    if (savedMessageKeysRef.current.has(messageKey)) return;
    savedMessageKeysRef.current.add(messageKey);

    persistenceQueueRef.current = persistenceQueueRef.current
      .then(() =>
        axiosInstance.post(`/messages/evi-message/${sessionId}`, {
          content: message.text,
          role: message.role,
          emotionScores: message.emotionScores,
        })
      )
      .catch((saveError) => {
        savedMessageKeysRef.current.delete(messageKey);
        setError(
          saveError.response?.data?.message ||
            saveError.message ||
            "EVI conversation could not be saved."
        );
      });
  }, []);

  const stop = useCallback(() => {
    manuallyClosedRef.current = true;

    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
    }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    socketRef.current?.close();
    socketRef.current = null;

    playerRef.current?.dispose();
    playerRef.current = null;

    audioSendQueueRef.current = Promise.resolve();
    persistenceQueueRef.current = Promise.resolve();
    persistenceSessionIdRef.current = null;
    savedMessageKeysRef.current.clear();
    hasFinalUserMessageRef.current = false;
    setStatus("idle");
    setIsMuted(false);
  }, []);

  const start = useCallback(async (sessionId) => {
    setError(null);
    setMessages([]);
    setExpressionScores({});
    setStatus("connecting");
    manuallyClosedRef.current = false;
    hasFinalUserMessageRef.current = false;
    persistenceSessionIdRef.current = sessionId;

    try {
      const { data } = await axiosInstance.get("/hume/evi-token");
      const stream = await getAudioStream({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      streamRef.current = stream;

      const player = new EVIWebAudioPlayer();
      playerRef.current = player;
      player.on("play", () => setStatus("speaking"));
      player.on("stop", () => setStatus("listening"));
      player.on("error", (event) => setError(event.detail.message));
      await player.init();

      const client = new HumeClient({});
      const socket = client.empathicVoice.chat.connect({
        accessToken: data.accessToken,
        configId: data.configId || undefined,
        verboseTranscription: true,
        sessionSettings: {
          systemPrompt: VERA_EVI_PROMPT,
        },
      });
      socketRef.current = socket;

      socket.on("message", (message) => {
        if (message.type === "audio_output") {
          player.enqueue(message).catch((playbackError) => {
            setError(playbackError.message || "Unable to play Hume EVI audio.");
          });
          return;
        }

        if (message.type === "user_interruption") {
          player.stop();
          setStatus("listening");
          return;
        }

        if (message.type === "user_message") {
          const content = message.message?.content?.trim();
          const scores = message.models?.prosody?.scores;
          const isFirstUserMessage = !hasFinalUserMessageRef.current;
          const displayScores = applyFirstUserEmotion(scores, isFirstUserMessage);

          if (displayScores) setExpressionScores(displayScores);
          if (!content) return;

          const transcriptMessage = {
            id: `user-${message.time?.begin ?? Date.now()}`,
            role: "user",
            text: content,
            interim: message.interim,
            emotionScores: displayScores,
          };

          setMessages((current) => {
            const withoutInterim = current.filter(
              (item) => !(item.role === "user" && item.interim)
            );
            return [...withoutInterim, transcriptMessage];
          });
          if (!message.interim) {
            hasFinalUserMessageRef.current = true;
            persistMessage(transcriptMessage);
          }
          return;
        }

        if (message.type === "assistant_message") {
          const content = message.message?.content?.trim();
          if (!content) return;

          const transcriptMessage = {
            id: message.id || `assistant-${Date.now()}`,
            role: "assistant",
            text: content,
            interim: false,
          };

          setMessages((current) => [...current, transcriptMessage]);
          persistMessage(transcriptMessage);
        }
      });

      socket.on("error", (socketError) => {
        setError(socketError.message || "Hume EVI connection failed.");
        setStatus("error");
      });
      socket.on("close", () => {
        if (!manuallyClosedRef.current) {
          setError("Hume EVI connection closed.");
          setStatus("error");
        }
      });

      await socket.waitForOpen();

      const mimeTypeResult = getBrowserSupportedMimeType();
      if (!mimeTypeResult.success) throw mimeTypeResult.error;

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeTypeResult.mimeType,
      });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (!event.data.size || !socketRef.current) return;

        audioSendQueueRef.current = audioSendQueueRef.current
          .then(() => convertBlobToBase64(event.data))
          .then((audioBase64) => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.sendAudioInput({ data: audioBase64 });
            }
          })
          .catch((audioError) => {
            setError(audioError.message || "Unable to stream microphone audio.");
          });
      };
      recorder.start(100);
      setStatus("listening");
      return true;
    } catch (startError) {
      const message =
        startError.response?.data?.message ||
        startError.message ||
        "Unable to start Hume EVI.";
      setError(message);
      stop();
      setStatus("error");
      return false;
    }
  }, [persistMessage, stop]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });

    if (nextMuted) playerRef.current?.mute();
    else playerRef.current?.unmute();

    setIsMuted(nextMuted);
  }, [isMuted]);

  const finalizeSession = useCallback(async () => {
    const sessionId = persistenceSessionIdRef.current;
    if (!sessionId) return null;

    try {
      await persistenceQueueRef.current;
      const { data } = await axiosInstance.post(`/sessions/analyze/${sessionId}`);
      return data;
    } catch (analysisError) {
      setError(
        analysisError.response?.data?.message ||
          analysisError.message ||
          "Risk assessment and summary could not be generated."
      );
      return null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  return {
    attachSession,
    error,
    expressionScores,
    finalizeSession,
    isMuted,
    messages,
    start,
    status,
    stop,
    toggleMute,
  };
}
