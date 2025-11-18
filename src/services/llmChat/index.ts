"use client";

import { socket } from "@/lib/socketClient";
import { events } from "@/data/socket/constants";

export interface ChatMessage {
  conversation_id: string;
  role: "user" | "assistant" | "PathAI";
  content: string;
  category?: "chat" | "quiz";
  type?: "thinking" | "quiz_artifact" | "video_artifact";
  attachments?: string[];
  [key: string]: any;
}

export interface JoinRoomParams {
  chat_id: string;
}

export interface UserMessageParams {
  conversation_id: string;
  content: string;
  role?: string;
  category?: string;
  attachments?: string[];
  [key: string]: any;
}

/**
 * LLM Chat Service
 * Handles socket connections and message flow for the chatbot
 */
class LLMChatService {
  /**
   * Connect to the socket server
   * Must be called before any other socket operations
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (socket.connected) {
        console.log("Socket already connected");
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout - server may be unavailable"));
      }, 15000);

      socket.once(events.CONNECT, () => {
        clearTimeout(timeout);
        console.log("Socket connected successfully");
        resolve();
      });

      socket.once(events.CONNECT_ERROR, (error: any) => {
        clearTimeout(timeout);
        console.error("Socket connection error:", error);
        reject(new Error(`Connection failed: ${error.message || 'Server unavailable'}`));
      });

      console.log("Attempting to connect to socket server...");
      socket.connect();
    });
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    if (socket.connected) {
      socket.disconnect();
      console.log("Socket disconnected");
    }
  }

  /**
   * Join a chat room
   * Must be called before sending messages to establish the conversation context
   * @param params - Object containing chat_id (no user_id needed)
   */
  async joinRoom(params: JoinRoomParams): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Join room timeout - server did not acknowledge room join"));
      }, 10000);

      // Emit join_room event with only chat_id
      socket.emit(events.JOIN_ROOM, { chat_id: params.chat_id }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          console.error(`Failed to join room ${params.chat_id}:`, response.error);
          reject(new Error(response.error));
        } else {
          console.log(`Successfully joined room: ${params.chat_id}`, response);
          resolve();
        }
      });
    });
  }

  /**
   * Send a user message to the chatbot
   * @param message - Message object containing conversation_id, content, and optional fields
   */
  async sendMessage(message: UserMessageParams): Promise<void> {
    return new Promise((resolve, reject) => {
      const userMessage = {
        role: message.role || "user",
        category: message.category || "chat",
        attachments: message.attachments || [],
        ...message,
        // Ensure core fields override defaults
        conversation_id: message.conversation_id,
        content: message.content,
      };

      socket.emit(events.USER_MESSAGE, userMessage, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          console.log("Message sent successfully");
          resolve();
        }
      });

      // Fallback resolve if no acknowledgment
      setTimeout(() => resolve(), 1000);
    });
  }

  /**
   * Listen for streaming text chunks from the AI
   * @param callback - Function to handle each chunk
   */
  onChunk(callback: (data: { chunk: string; [key: string]: any }) => void): void {
    socket.on(events.AI_CHUNK, callback);
  }

  /**
   * Listen for generation complete event
   * @param callback - Function to handle generation completion
   */
  onGenerationComplete(callback: (data?: any) => void): void {
    socket.on(events.GENERATION_COMPLETE, callback);
  }

  /**
   * Listen for thinking start event
   * @param callback - Function to handle thinking start
   */
  onThinkingStart(callback: (data?: any) => void): void {
    socket.on(events.THINKING_START, callback);
  }

  /**
   * Listen for thinking end event
   * @param callback - Function to handle thinking end
   */
  onThinkingEnd(callback: (data?: any) => void): void {
    socket.on(events.THINKING_END, callback);
  }

  /**
   * Listen for quiz artifact generation
   * @param callback - Function to handle quiz artifact
   */
  onQuizArtifact(callback: (data: any) => void): void {
    socket.on(events.QUIZ_ARTIFACT_GENERATED, callback);
  }

  /**
   * Listen for video artifact generation
   * @param callback - Function to handle video artifact
   */
  onVideoArtifact(callback: (data: any) => void): void {
    socket.on(events.VIDEO_ARTIFACT_GENERATED, callback);
  }

  /**
   * Listen for visualization status updates
   * @param callback - Function to handle status updates
   */
  onVisualizationUpdate(callback: (data: any) => void): void {
    socket.on(events.VISUALIZATION_STATUS_UPDATE, callback);
  }

  /**
   * Listen for errors from the server
   * @param callback - Function to handle errors
   */
  onError(callback: (error: any) => void): void {
    socket.on(events.ERROR, callback);
  }

  /**
   * Listen for reconnection events
   * @param callback - Function to handle reconnection
   */
  onReconnect(callback: () => void): void {
    socket.on(events.RECONNECT, callback);
  }

  /**
   * Stop AI generation
   */
  stopGeneration(): void {
    socket.emit(events.STOP_GENERATION);
    console.log("Stop generation requested");
  }

  /**
   * Submit quiz answers
   * @param quizData - Quiz submission data
   */
  submitQuiz(quizData: any): void {
    socket.emit(events.SUBMIT_QUIZ, quizData);
    console.log("Quiz submitted");
  }

  /**
   * Remove all event listeners
   * Call this when unmounting components to prevent memory leaks
   */
  removeAllListeners(): void {
    socket.off(events.AI_CHUNK);
    socket.off(events.GENERATION_COMPLETE);
    socket.off(events.THINKING_START);
    socket.off(events.THINKING_END);
    socket.off(events.QUIZ_ARTIFACT_GENERATED);
    socket.off(events.VIDEO_ARTIFACT_GENERATED);
    socket.off(events.VISUALIZATION_STATUS_UPDATE);
    socket.off(events.ERROR);
    socket.off(events.RECONNECT);
    console.log("All socket listeners removed");
  }

  /**
   * Remove specific event listener
   * @param event - Event name to remove listener from
   * @param callback - Specific callback to remove
   */
  removeListener(event: string, callback?: Function): void {
    if (callback) {
      socket.off(event, callback as any);
    } else {
      socket.off(event);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return socket.connected;
  }

  /**
   * Initialize a new chat session
   * This connects to the socket and joins the room
   * @param chatId - The chat/conversation ID
   */
  async initializeChat(chatId: string): Promise<void> {
    try {
      // Connect to socket if not already connected
      if (!this.isConnected()) {
        await this.connect();
      }

      // Join the chat room
      console.log("Joining room");
      await this.joinRoom({ chat_id: chatId });

      console.log(`Chat initialized for session: ${chatId}`);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const llmChatService = new LLMChatService();

// Export class for testing or custom instances
export default LLMChatService;
