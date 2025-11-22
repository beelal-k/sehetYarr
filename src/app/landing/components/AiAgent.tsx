"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Cpu,
  MessageSquare,
  Phone,
  PhoneOff,
  Mic2,
  MicOff,
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AiAgent() {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isCalling) {
      // start timer
      intervalRef.current = window.setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCallSeconds(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCalling]);

  function formatSeconds(s: number) {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  return (
    <section id="ai-agent" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left: content */}
          <div className="space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm text-sky-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI Assistant — feature highlight</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">AI-powered assistant for smarter care</h2>
            <p className="text-sm text-gray-600 md:text-base">
              Use our intelligent AI agent to triage symptoms, suggest specialists, create referrals, or draft notes — quick, secure and integrated.
            </p>

            <div className="space-y-3 sm:flex sm:items-center sm:gap-4 sm:space-y-0">
              <Link href="/dashboard/chat" className="rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700">Try AI now</Link>
              <Link href="#ai-agent" className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm hover:bg-sky-50 text-black">Learn more</Link>
              <button
                onClick={() => setIsCalling(true)}
                className="ml-2 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-sky-600 shadow hover:bg-sky-50"
              >
                <Phone className="h-4 w-4" />
                <span>Call patient</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                <Cpu className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Smart suggestions</p>
                  <p className="text-[11px] text-gray-500">Auto-suggest diagnoses, referrals, and follow-ups using clinical context.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                <MessageSquare className="h-5 w-5 text-sky-600" />
                <div>
                  <p className="text-xs font-semibold text-gray-900">Conversation driven</p>
                  <p className="text-[11px] text-gray-500">Interact over chat — ask questions, upload notes, or get summaries instantly.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: mock AI chat / assistant UI */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-lg bg-gradient-to-br from-sky-50 to-white">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sky-100/80 flex items-center justify-center">
                    <Image src={'/assets/images/doctor1.png'} alt={'Assistant'} width={28} height={28} className={'rounded-full object-cover'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">SehatAI Agent</p>
                    <p className="text-xs text-gray-500">Assistant</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {isCalling ? (
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-sky-100/50 px-2 py-1 text-xs font-medium text-sky-700">calling</span>
                      <span className="text-xs text-gray-500">John Doe</span>
                      <span className="text-xs text-gray-500">• {formatSeconds(callSeconds)}</span>
                    </div>
                  ) : (
                    'online'
                  )}
                </div>
              </div>

              {/* Chat area */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-full bg-gray-200/80" />
                    <div className="rounded-2xl bg-gray-50 p-3 text-sm text-gray-800">Hello! How can I help you with this patient?</div>
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-2xl bg-sky-600 p-3 text-sm text-white">Please summarize today's visit and list next steps.</div>
                    <div className="h-7 w-7 rounded-full bg-sky-600/80" />
                  </div>
                </div>
              </div>

                {/* Action row */}
                <div className="flex items-center gap-3 border-t border-gray-100 p-3">
                  <input
                    placeholder="Ask something to the agent"
                    className="flex-1 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm outline-none text-black"
                  />
                  <button className="rounded-full bg-sky-600 px-4 py-2 text-white text-sm font-semibold hover:bg-sky-700">Send</button>
                  {/* Voice call controls */}
                  <div className="ml-2 flex items-center gap-2">
                    {!isCalling ? (
                      <button
                        onClick={() => setIsCalling(true)}
                        title="Start voice call"
                        className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-3 py-2 text-white text-sm font-medium shadow hover:bg-sky-700"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Start Call</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2 text-sm text-sky-700">
                          <span className="font-semibold">Calling</span>
                          <span className="text-xs text-gray-500">{formatSeconds(callSeconds)}</span>
                        </div>
                        <button
                          onClick={() => setIsMuted((m) => !m)}
                          title={isMuted ? "Unmute" : "Mute"}
                          className="rounded-full border border-gray-200 bg-white p-2 text-sm hover:bg-sky-50"
                        >
                          {isMuted ? <MicOff className="h-4 w-4 text-gray-600" /> : <Mic2 className="h-4 w-4 text-sky-600" />}
                        </button>
                        <button
                          onClick={() => setIsCalling(false)}
                          title="End call"
                          className="rounded-full bg-red-600 px-3 py-2 text-white text-sm font-medium hover:bg-red-700"
                        >
                          <PhoneOff className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
