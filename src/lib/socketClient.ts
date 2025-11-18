"use client";

import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { Cookie } from "next/font/google";

let socketInstance: Socket | null = null;

const createSocket = (): Socket => {
  const token = Cookies.get("serviceToken");
  const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL;

  if (!chatbotUrl) {
    throw new Error("NEXT_PUBLIC_CHATBOT_URL is not defined in environment variables");
  }

  // Always create a fresh socket instance with current token
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  console.log("Creating socket connection to:", chatbotUrl);
  console.log("Auth token present:", !!token);

  socketInstance = io(chatbotUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    ackTimeout: 60000,
    multiplex: true,
    reconnectionDelay: 3000,
    reconnectionAttempts: 5,
    auth: { token: token },
    secure: true,
    autoConnect: false, // Prevent automatic connection
    withCredentials: true,
  });

  // Add connection event listeners for debugging
  socketInstance.on("connect", () => {
    console.log("Socket connected successfully, ID:", socketInstance?.id);
  });

  socketInstance.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
    console.error("Error details:", error);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("Socket disconnected, reason:", reason);
  });

  return socketInstance;
};

// Function to get socket with fresh token
const getSocket = (): Socket => {
  const currentToken = Cookies.get("serviceToken");

  // If no socket exists or token has changed, create a new one
  if (!socketInstance || (socketInstance as any).auth?.token !== currentToken) {
    return createSocket();
  }

  return socketInstance;
};

export const socket = new Proxy({} as Socket, {
  get(target, prop) {
    const socketInstance = getSocket();
    const value = (socketInstance as any)[prop];

    if (typeof value === 'function') {
      return value.bind(socketInstance);
    }

    return value;
  },
  set(target, prop, value) {
    const socketInstance = getSocket();
    (socketInstance as any)[prop] = value;
    return true;
  }
});
