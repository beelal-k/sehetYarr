"use client";

import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { Cookie } from "next/font/google";

let socketInstance: Socket | null = null;
let cachedToken: string | undefined = undefined; // Cache the token we used when creating the socket
let cachedSocketInstance: Socket | null = null; // Cache the socket instance to avoid repeated getSocket() calls

const createSocket = (): Socket => {
  const token = Cookies.get("serviceToken");
  const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL;

  if (!chatbotUrl) {
    throw new Error("NEXT_PUBLIC_CHATBOT_URL is not defined in environment variables");
  }

  // Always create a fresh socket instance with current token
  if (socketInstance) {
    console.log("Disconnecting existing socket before creating new one");
    console.trace("createSocket called from:");
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

  // Cache the token we used
  cachedToken = token;

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
    // Clear cached instance when disconnected so we get a fresh one next time
    cachedSocketInstance = null;
  });

  // Update cached instance
  cachedSocketInstance = socketInstance;

  return socketInstance;
};

// Function to get socket with fresh token
const getSocket = (): Socket => {
  // If no socket exists, create one
  if (!socketInstance) {
    console.log("No socket instance exists, creating new one");
    return createSocket();
  }
  
  // Check if token has actually changed by comparing with cached token
  const currentToken = Cookies.get("serviceToken");
  
  // If both are undefined/null, keep existing socket
  if (!cachedToken && !currentToken) {
    return socketInstance;
  }
  
  // Only recreate if token has actually changed
  // Use strict equality to avoid false positives
  if (cachedToken !== currentToken) {
    console.warn("Token changed! Cached:", cachedToken ? "present" : "absent", "Current:", currentToken ? "present" : "absent");
    console.warn("Cached token value:", cachedToken?.substring(0, 10) + "...", "Current token value:", currentToken?.substring(0, 10) + "...");
    console.log("Creating new socket due to token change");
    return createSocket();
  }

  return socketInstance;
};

export const socket = new Proxy({} as Socket, {
  get(target, prop) {
    // Only call getSocket() if we don't have a cached instance or if the underlying socket doesn't exist
    // This prevents unnecessary token checks on every property access
    if (!cachedSocketInstance || !socketInstance) {
      cachedSocketInstance = getSocket();
    }
    
    const instance = cachedSocketInstance;
    const value = (instance as any)[prop];

    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  },
  set(target, prop, value) {
    // Only call getSocket() if we don't have a cached instance or if the underlying socket doesn't exist
    if (!cachedSocketInstance || !socketInstance) {
      cachedSocketInstance = getSocket();
    }
    
    const instance = cachedSocketInstance;
    (instance as any)[prop] = value;
    return true;
  }
});
