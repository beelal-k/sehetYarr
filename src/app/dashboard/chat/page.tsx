"use client";

import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from "@/components/ai-elements/branch";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputProvider,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import type { ToolUIPart } from "ai";
import { MicIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { llmChatService } from "@/services/llmChat";
import { useUser } from "@clerk/nextjs";
import { ProgressNotification } from "@/components/chat/progress-notification";

import { FileIcon, ImageIcon } from "lucide-react";
import Image from "next/image";

type MessageType = {
  key: string;
  from: "user" | "assistant";
  sources?: { href: string; title: string }[];
  versions: {
    id: string;
    content: string;
  }[];
  reasoning?: {
    content: string;
    duration: number;
  };
  tools?: {
    name: string;
    description: string;
    status: ToolUIPart["state"];
    parameters: Record<string, unknown>;
    result: string | undefined;
    error: string | undefined;
  }[];
  attachments?: { name: string; size: number; type: string; url: string }[]; // Attachment metadata
  avatar: string;
  name: string;
  type?: "thinking" | "quiz_artifact" | "video_artifact";
};

import { uploadFiles } from "@/services/upload";

const initialMessages: MessageType[] = [];

const ChatContent = () => {
  const { user } = useUser();
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [chatId, setChatId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [showProgress, setShowProgress] = useState<boolean>(false);
  
  const { textInput, attachments } = usePromptInputController();
  
  // Helper to access text input value safely
  const text = textInput.value;
  const setText = textInput.setInput;

  // Initialize chat session on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const newChatId = nanoid();
        setChatId(newChatId);

        // Initialize the chat with socket connection
        await llmChatService.initializeChat(newChatId);
        setIsInitialized(true);

        toast.success("Chat initialized", {
          description: "Connected to chatbot service",
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Could not connect to chatbot service";
        toast.error("Connection failed", {
          description: errorMessage,
          duration: 10000,
        });
        setStatus("error");
        setIsInitialized(false);
      }
    };

    initChat();

    // Cleanup on unmount
    return () => {
      llmChatService.removeAllListeners();
      llmChatService.disconnect();
    };
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    if (!isInitialized || !chatId) return;

    let isStreamingActive = false; // Flag to track if we're still receiving chunks

    // Handle incoming chunks from AI
    const handleChunk = (data: { chunk: string }) => {
      console.log("Received chunk:", data);
      
      // Only process chunks if streaming is active (not completed)
      if (!isStreamingActive) {
        isStreamingActive = true;
      }

      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        const lastMessage = prev[lastIndex];

        // Check if the last message is a finalized assistant message (has '-finalized-' in key)
        // If so, we should start a new message instead of appending
        const isFinalized = lastMessage?.key?.includes('-finalized-');
        
        // If the last message is from assistant and NOT finalized, append to it
        if (
          lastMessage?.from === "assistant" &&
          lastMessage.type !== "thinking" &&
          !isFinalized
        ) {
          const currentContent = lastMessage.versions[0]?.content || "";
          const updatedMessage = {
            ...lastMessage,
            versions: [
              {
                ...lastMessage.versions[0],
                content: currentContent + (data.chunk || ""),
              },
            ],
          };
          return [...prev.slice(0, lastIndex), updatedMessage];
        }

        // If no assistant message yet, or last message is finalized, create a new one
        const newAssistantMessage: MessageType = {
          key: `assistant-${Date.now()}`,
          from: "assistant",
          versions: [
            {
              id: `assistant-${Date.now()}`,
              content: data.chunk || "",
            },
          ],
          avatar: "/logo.jpeg",
          name: "Assistant",
        };

        return [...prev, newAssistantMessage];
      });

      // Set status to streaming while receiving chunks
      setStatus("streaming");

      // Clear any existing timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };

    // Handle generation complete - finalize current message and prepare for new one
    const handleGenerationComplete = () => {
      console.log("Generation complete - finalizing current message");
      
      // Mark streaming as complete
      isStreamingActive = false;
      
      // Clear any pending timeouts
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }

      // Hide progress notification
      setShowProgress(false);
      setProgressMessage("");

      // Set status to ready
      setStatus("ready");
      
      // Finalize the current assistant message - this ensures the next generation starts a new bubble
      setMessages((prev) => {
        const lastIndex = prev.length - 1;
        const lastMessage = prev[lastIndex];

        if (lastMessage?.from === "assistant") {
          // Mark this message as complete by creating a finalized copy
          // This ensures any future chunks will create a new assistant message
          const finalizedMessage = {
            ...lastMessage,
            key: `${lastMessage.key}-finalized-${Date.now()}`, // New key to mark as finalized
          };
          return [...prev.slice(0, lastIndex), finalizedMessage];
        }

        return prev;
      });
    };

    // Handle progress updates
    const handleProgressUpdate = (data: { message: string }) => {
      console.log("Progress update:", data);
      setProgressMessage(data.message);
      setShowProgress(true);
    };

    // Handle errors
    const handleError = (error: any) => {
      console.error("Socket error:", error);
      toast.error("Chat error", {
        description: error.message || "An error occurred",
      });
      setStatus("error");
      isStreamingActive = false;
    };

    // Handle reconnection
    const handleReconnect = async () => {
      console.log("Socket reconnected, rejoining room");
      try {
        await llmChatService.joinRoom({ chat_id: chatId });
        toast.info("Reconnected", {
          description: "Chat session restored",
        });
      } catch (error) {
        console.error("Reconnection failed:", error);
      }
    };

    // Handle disconnection
    const handleDisconnect = (reason: string) => {
      console.error("Socket disconnected in chat page handler:", reason);
      console.trace("Disconnect stack trace:");
      
      if (reason === "io client disconnect") {
        console.error("Client-initiated disconnect detected! This should not happen during normal message sending.");
      } else if (reason === "io server disconnect") {
        console.error("Server disconnected the socket");
      } else if (reason === "ping timeout") {
        console.error("Socket ping timeout");
      } else if (reason === "transport close") {
        console.error("Transport closed");
      }
    };

    // Register listeners
    llmChatService.onChunk(handleChunk);
    llmChatService.onGenerationComplete(handleGenerationComplete);
    llmChatService.onProgressUpdate(handleProgressUpdate);
    llmChatService.onError(handleError);
    llmChatService.onReconnect(handleReconnect);
    llmChatService.onDisconnect(handleDisconnect);

    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      llmChatService.removeAllListeners();
    };
  }, [isInitialized, chatId]);

  const sendMessage = useCallback(
    async (content: string, attachments?: { name: string; size: number; type: string; url: string }[]) => {
      if (!isInitialized || !chatId) {
        console.warn("Chat not ready:", { isInitialized, chatId });
        toast.error("Chat not ready", {
          description: "Please wait for chat to initialize",
        });
        return;
      }

      try {
        // Add user message to UI
        const userMessage: MessageType = {
          key: `user-${Date.now()}`,
          from: "user",
          versions: [
            {
              id: `user-${Date.now()}`,
              content,
            },
          ],
          attachments,
          avatar: user?.imageUrl || "",
          name: user?.username || "User",
        };

        setMessages((prev) => [...prev, userMessage]);
        setStatus("submitted");

        console.log("Sending message via socket:", {
          conversation_id: chatId,
          content,
        });

        // Send message via socket - the AI response will come through ai_chunk events
        await llmChatService.sendMessage({
          conversation_id: chatId,
          content,
          attachments: attachments || [],
          role: "hospital",
        });

        console.log("Message sent successfully, waiting for ai_chunk events");
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Send failed", {
          description: "Could not send message",
        });
        setStatus("error");
      }
    },
    [isInitialized, chatId, user]
  );

  // Map to store uploaded file metadata: id -> { name, size, type, url }
  const uploadedFilesMap = useRef<Map<string, { name: string; size: number; type: string; url: string }>>(new Map());

  const onFilesAdded = async (files: any[]) => {
      setIsUploading(true);
      
      // Mark newly added files as uploading in UI
      files.forEach(f => {
        attachments.update(f.id, { isUploading: true });
      });

      try {
          const filesToUpload = files.map((f: any) => ({ file: f.file || f, id: f.id }));
          const validFiles = filesToUpload.filter((f: any) => f.file instanceof File);
          
          if (validFiles.length === 0) {
            setIsUploading(false);
            return;
          }

          // Upload sequentially or parallel, but we need to match results back to IDs
          const uploadPromises = validFiles.map(async (f: any) => {
            try {
               const url = await uploadFiles([f.file]);
               const fileMetadata = {
                 name: f.file.name,
                 size: f.file.size,
                 type: f.file.type || 'application/octet-stream',
                 url: url[0]
               };
               uploadedFilesMap.current.set(f.id || f.file.name, fileMetadata);
               // Update UI to show upload finished
               attachments.update(f.id, { isUploading: false });
               return fileMetadata;
            } catch (e) {
               console.error(`Failed to upload ${f.file.name}`, e);
               // Could mark as error in UI if we had an error state
               attachments.update(f.id, { isUploading: false });
               return null;
            }
          });

          await Promise.all(uploadPromises);
          
      } catch (e) {
          console.error(e);
          toast.error("Upload failed");
          // Reset uploading state for all
          files.forEach(f => {
            attachments.update(f.id, { isUploading: false });
          });
      } finally {
          setIsUploading(false);
      }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    setStatus("submitted");

    // Handle file attachments - build array of attachment objects
    let attachmentObjects: { name: string; size: number; type: string; url: string }[] = [];
    if (message.files?.length) {
        console.log("Processing attachments:", message.files.length);
        // Check if we already have uploaded metadata for these files
        const pendingUploads: any[] = [];
        const currentAttachments: { name: string; size: number; type: string; url: string }[] = [];

        message.files.forEach((f: any) => {
            const id = f.id || f.file?.name;
            if (uploadedFilesMap.current.has(id)) {
                console.log("Found uploaded file in map:", id);
                currentAttachments.push(uploadedFilesMap.current.get(id)!);
            } else if (f.file instanceof File) {
                console.log("File needs upload:", f.file.name);
                pendingUploads.push(f);
            }
        });

        if (pendingUploads.length > 0) {
             console.log("Uploading pending files:", pendingUploads.length);
             setIsUploading(true);
             // Mark pending as uploading
             pendingUploads.forEach(f => attachments.update(f.id, { isUploading: true }));
             
             try {
                 const newUrls = await uploadFiles(pendingUploads.map(f => f.file));
                 console.log("Upload successful, urls:", newUrls);
                 
                 // Create attachment objects for newly uploaded files
                 const newAttachments = pendingUploads.map((f, index) => ({
                   name: f.file.name,
                   size: f.file.size,
                   type: f.file.type || 'application/octet-stream',
                   url: newUrls[index]
                 }));
                 
                 // Store in map for future reference
                 pendingUploads.forEach((f, index) => {
                   const id = f.id || f.file.name;
                   uploadedFilesMap.current.set(id, newAttachments[index]);
                 });
                 
                 currentAttachments.push(...newAttachments);
                 pendingUploads.forEach(f => attachments.update(f.id, { isUploading: false }));
             } catch (e) {
                 console.error("Failed to upload pending files", e);
                 toast.error("Some files failed to upload");
                 pendingUploads.forEach(f => attachments.update(f.id, { isUploading: false }));
             } finally {
                 setIsUploading(false);
             }
        }
        
        attachmentObjects = currentAttachments;
        
        // Clean up map for sent files
        message.files.forEach((f: any) => {
             const id = f.id || f.file?.name;
             uploadedFilesMap.current.delete(id);
        });
    }

    console.log("Submitting message with attachments:", attachmentObjects);
    await sendMessage(message.text || "Sent with attachments", attachmentObjects);
    setText("");
  };

  const isSubmitDisabled = !isInitialized || !text.trim() || status === "streaming" || isUploading;

  return (
    <div className='relative flex size-full h-[91vh] flex-col divide-y overflow-hidden'>
      {/* Progress notification bubble */}
      <ProgressNotification message={progressMessage} isVisible={showProgress} />
      
      <Conversation>
        <ConversationContent>
          {messages.map(({ versions, ...message }) => (
            <Branch defaultBranch={0} key={message.key}>
              <BranchMessages>
                {versions.map((version) => (
                  <Message
                    from={message.from}
                    key={`${message.key}-${version.id}`}
                  >
                    <div>
                      {message.sources?.length && (
                        <Sources>
                          <SourcesTrigger count={message.sources.length} />
                          <SourcesContent>
                            {message.sources.map((source) => (
                              <Source
                                href={source.href}
                                key={source.href}
                                title={source.title}
                              />
                            ))}
                          </SourcesContent>
                        </Sources>
                      )}
                      {message.reasoning && (
                        <Reasoning duration={message.reasoning.duration}>
                          <ReasoningTrigger />
                          <ReasoningContent>
                            {message.reasoning.content}
                          </ReasoningContent>
                        </Reasoning>
                      )}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.attachments.map((attachment, index) => {
                            const isImage = attachment.type?.startsWith('image/') || attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                            const fileName = attachment.name || attachment.url.split('/').pop() || 'Attachment';
                            
                            if (isImage) {
                              return (
                                <div key={index} className="relative max-w-[300px] max-h-[300px] rounded-md overflow-hidden">
                                  <img 
                                    src={attachment.url} 
                                    alt={fileName} 
                                    className="max-w-full max-h-full object-contain rounded-md"
                                  />
                                </div>
                              );
                            }
                            
                            return (
                              <a 
                                key={index} 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 bg-muted rounded-md border hover:bg-muted/80 transition-colors max-w-xs"
                              >
                                <div className="p-2 bg-background rounded border">
                                  <FileIcon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-medium truncate">{fileName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Click to view'}
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <MessageContent>
                        <Response>{version.content}</Response>
                      </MessageContent>
                    </div>
                    <MessageAvatar name={message.name} src={message.avatar} />
                  </Message>
                ))}
              </BranchMessages>
              {versions.length > 1 && (
                <BranchSelector from={message.from}>
                  <BranchPrevious />
                  <BranchPage />
                  <BranchNext />
                </BranchSelector>
              )}
            </Branch>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className='grid shrink-0 gap-4 pt-4'>
        <div className='w-full px-4 pb-4'>
          <PromptInput globalDrop multiple onSubmit={handleSubmit} onFilesAdded={onFilesAdded}>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(event) => setText(event.target.value)}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter className='py-1'>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  onClick={() => setUseMicrophone(!useMicrophone)}
                  variant={useMicrophone ? "default" : "ghost"}
                >
                  <MicIcon size={16} />
                  <span className='sr-only'>Microphone</span>
                </PromptInputButton>
                {/* <PromptInputButton
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  variant={useWebSearch ? 'default' : 'ghost'}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton> */}
              </PromptInputTools>
              <PromptInputSubmit
                disabled={isSubmitDisabled}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

const Example = () => {
  return (
    <PromptInputProvider>
      <ChatContent />
    </PromptInputProvider>
  );
};

export default Example;
