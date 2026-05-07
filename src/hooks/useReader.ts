import { useState, useEffect, useRef, useCallback } from 'react';
import { Logger } from '@/lib/logger';

export interface UseReaderProps {
  text: string;
  lang?: string;
  autoPlay?: boolean;
}

export interface UseReaderReturn {
  speak: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  currentSentence: string;
  progress: number; // 0-100
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  setVoice: (voice: SpeechSynthesisVoice) => void;
  selectedVoice: SpeechSynthesisVoice | null;
}

export function useReader({
  text,
  lang = 'en-US',
  autoPlay: _autoPlay = false,
}: UseReaderProps): UseReaderReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentencesRef = useRef<string[]>([]);
  const sentenceIndexRef = useRef(0);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'Intl' in window &&
      'Segmenter' in (Intl as unknown as { Segmenter: unknown })
    ) {
      setSupported(true);
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);
        // Heuristic: Prefer "Google" or "Microsoft" voices for better quality
        const preferredVoice =
          availableVoices.find(
            (v) => v.lang === lang && (v.name.includes('Google') || v.name.includes('Microsoft')),
          ) || availableVoices.find((v) => v.lang === lang);
        if (preferredVoice) {
          setSelectedVoice(preferredVoice);
        }
      };

      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [lang]);

  // Segment text into sentences using Intl.Segmenter
  useEffect(() => {
    if (supported && text) {
      try {
        interface IntlSegmenter {
          new (
            locale: string,
            options: { granularity: 'sentence' | 'word' },
          ): {
            segment(input: string): Iterable<{ segment: string }>;
          };
        }
        const Segmenter = (Intl as unknown as { Segmenter: IntlSegmenter }).Segmenter;
        const segmenter = new Segmenter(lang, { granularity: 'sentence' });
        const segments = segmenter.segment(text);
        const sentences: string[] = [];
        for (const { segment } of segments) {
          if (segment.trim().length > 0) {
            sentences.push(segment.trim());
          }
        }
        sentencesRef.current = sentences;
      } catch (e) {
        Logger.warn('Intl.Segmenter failed, falling back to split', e);
        sentencesRef.current = text.match(/[^.!?]+[.!?]+/g) || [text];
      }
    }
  }, [text, lang, supported]);

  const isPlayingRef = useRef(false);

  const stop = useCallback(() => {
    if (!supported) return;
    synthRef.current?.cancel();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsPaused(false);
    setCurrentSentence('');
    sentenceIndexRef.current = 0;
  }, [supported]);

  const pause = useCallback(() => {
    if (!supported) return;
    synthRef.current?.pause();
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    synthRef.current?.resume();
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsPaused(false);
  }, [supported]);

  const speakSentence = useCallback(
    (index: number) => {
      if (!synthRef.current || index >= sentencesRef.current.length) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setCurrentSentence('');
        setProgress(100);
        return;
      }

      const sentence = sentencesRef.current[index];
      setCurrentSentence(sentence || '');
      setProgress((index / sentencesRef.current.length) * 100);
      sentenceIndexRef.current = index;

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = lang;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          // Use ref to avoid stale closure
          speakSentence(index + 1);
        }
      };

      utterance.onerror = (e) => {
        Logger.error('TTS Error', e);
        setIsPlaying(false);
        isPlayingRef.current = false;
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [lang, selectedVoice],
  ); // removed isPlaying from dependencies

  const speak = useCallback(() => {
    if (!supported) return;
    if (isPaused) {
      resume();
      return;
    }
    synthRef.current?.cancel();
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsPaused(false);
    speakSentence(0);
  }, [supported, isPaused, speakSentence, resume]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    currentSentence,
    progress,
    supported,
    voices,
    setVoice,
    selectedVoice,
  };
}
