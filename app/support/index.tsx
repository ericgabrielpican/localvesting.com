// app/support/index.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import NavBar from "../../src/components/Navbar";
import Screen from "../../src/components/ui/Screen";
import Button from "../../src/components/ui/Button";
import { Theme } from "../../src/styles/Theme";

type TicketStatus = "open" | "closed";

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: "low" | "medium" | "high";
  createdBy: string;
  createdAt?: any; // Firestore Timestamp
  lastMessageAt?: any;
}

interface SupportMessage {
  id: string;
  body: string;
  senderId: string;
  senderRole: "user" | "admin";
  createdAt?: any;
}

export default function SupportPage() {
  const { user } = useAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Create-ticket modal state
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Close ticket reason (admin)
  const [closeReason, setCloseReason] = useState("");

  // 1) Load user profile and see if admin
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;
          setIsAdmin(data.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [user]);

  // 2) Subscribe to tickets (for user or admin)
 useEffect(() => {
  if (!user || loadingProfile) return;

  setTicketsLoading(true);

  let qRef;
  if (isAdmin) {
    // Admin sees all tickets
    qRef = collection(db, "supportTickets");
  } else {
    // Normal user sees only their tickets
    qRef = query(
      collection(db, "supportTickets"),
      where("createdBy", "==", user.uid)
    );
  }

  const unsub = onSnapshot(
    qRef,
    (snap) => {
      const list: SupportTicket[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      // Sort client-side: newest first
      list.sort((a, b) => {
        const ta = a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.seconds ?? 0;
        return tb - ta;
      });

      setTickets(list);
      setTicketsLoading(false);

      if (!selectedTicketId && list.length > 0) {
        setSelectedTicketId(list[0].id);
        setSelectedTicket(list[0]);
      }
    },
    (err) => {
      console.error("Tickets listener error", err);
      setTicketsLoading(false);
    }
  );

  return () => unsub();
}, [user, isAdmin, loadingProfile]);


  // Keep selectedTicket in sync when tickets list changes
  useEffect(() => {
    if (!selectedTicketId) return;
    const found = tickets.find((t) => t.id === selectedTicketId) || null;
    setSelectedTicket(found);
  }, [tickets, selectedTicketId]);

  // 3) Subscribe to messages for selected ticket
  useEffect(() => {
    if (!selectedTicketId) return;

    setMessagesLoading(true);
    const q = query(
      collection(db, "supportTickets", selectedTicketId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: SupportMessage[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setMessages(list);
        setMessagesLoading(false);
      },
      (err) => {
        console.error("Messages listener error", err);
        setMessagesLoading(false);
      }
    );

    return () => unsub();
  }, [selectedTicketId]);

  // 4) Create ticket
  const handleCreateTicket = useCallback(async () => {
    if (!user) {
      alert("You need to be logged in to create a ticket.");
      return;
    }
    if (!newSubject.trim() || !newDescription.trim()) {
      alert("Please fill in subject and description.");
      return;
    }

    try {
      const ticketRef = await addDoc(collection(db, "supportTickets"), {
        subject: newSubject.trim(),
        description: newDescription.trim(),
        status: "open",
        priority: "medium",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      await addDoc(
        collection(db, "supportTickets", ticketRef.id, "messages"),
        {
          body: newDescription.trim(),
          senderId: user.uid,
          senderRole: isAdmin ? "admin" : "user",
          createdAt: serverTimestamp(),
        }
      );

      setCreating(false);
      setNewSubject("");
      setNewDescription("");
      setSelectedTicketId(ticketRef.id);
    } catch (err) {
      console.error("Create ticket failed", err);
      alert("Could not create ticket. Please try again.");
    }
  }, [user, newSubject, newDescription, isAdmin]);

  // 5) Send message
const handleSendMessage = useCallback(async () => {
  if (!selectedTicketId || !user || !newMessage.trim()) return;

  const senderRole = isAdmin ? "admin" : "user";

  await addDoc(
    collection(db, "supportTickets", selectedTicketId, "messages"),
    {
      body: newMessage.trim(),        // 👈 use `body`, matches SupportMessage + UI
      senderId: user.uid,
      senderRole,
      createdAt: serverTimestamp(),
    }
  );

  // optional but nice: update "lastMessageAt" for sorting later
  await updateDoc(doc(db, "supportTickets", selectedTicketId), {
    lastMessageAt: serverTimestamp(),
  });

  setNewMessage(""); // 👈 clear the input
}, [selectedTicketId, user, newMessage, isAdmin]);




  // 6) Close ticket (admin only)
  const handleCloseTicket = useCallback(async () => {
    if (!isAdmin || !selectedTicketId) return;

    try {
      await updateDoc(doc(db, "supportTickets", selectedTicketId), {
        status: "closed",
      });

      if (closeReason.trim()) {
        await addDoc(
          collection(db, "supportTickets", selectedTicketId, "messages"),
          {
            body: `Ticket closed: ${closeReason.trim()}`,
            senderId: "system",
            senderRole: "admin",
            createdAt: serverTimestamp(),
          }
        );
        setCloseReason("");
      }
    } catch (err) {
      console.error("Close ticket failed", err);
    }
  }, [isAdmin, selectedTicketId, closeReason]);

  const openTickets = tickets.filter((t) => t.status === "open");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  if (!user) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.center}>
          <Text style={Theme.typography.title}>Support</Text>
          <Text style={styles.muted}>
            Please log in to view and create support tickets.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <NavBar />

      <View style={styles.page}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Support Management</Text>
            <Text style={styles.pageSubtitle}>
              Manage all support tickets
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Button label="+ Create Ticket" onPress={() => setCreating(true)} />
          </View>
        </View>

        {/* Main two-column layout */}
        <View style={styles.columns}>
          {/* Left: tickets list */}
          <View style={styles.leftColumn}>
            <Text style={styles.columnTitle}>Open Tickets</Text>

           <View style={styles.headerActions}>
  <Button
    label="+ Create Ticket"
    onPress={() => setCreating(true)}
    style={styles.largeButton}
    labelStyle={styles.largeButtonLabel}
  />
</View>


            <ScrollView
              style={styles.ticketList}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {ticketsLoading && (
                <View style={styles.centerSmall}>
                  <ActivityIndicator />
                </View>
              )}

              {!ticketsLoading && openTickets.length === 0 && (
                <Text style={styles.mutedSmall}>No open tickets.</Text>
              )}

              {openTickets.map((ticket) => (
                <TicketListItem
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={ticket.id === selectedTicketId}
                  onPress={() => setSelectedTicketId(ticket.id)}
                />
              ))}

              {closedTickets.length > 0 && (
                <>
                  <Text style={[styles.columnTitle, { marginTop: 24 }]}>
                    Closed Tickets
                  </Text>
                  {closedTickets.map((ticket) => (
                    <TicketListItem
                      key={ticket.id}
                      ticket={ticket}
                      isSelected={ticket.id === selectedTicketId}
                      onPress={() => setSelectedTicketId(ticket.id)}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </View>

          {/* Right: chat / details */}
          <View style={styles.rightColumn}>
            {!selectedTicket && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>Select a ticket</Text>
                <Text style={styles.emptyText}>
                  Choose a ticket from the list to view the conversation.
                </Text>
              </View>
            )}

            {selectedTicket && (
              <View style={styles.chatWrapper}>
                {/* Ticket header */}
                <View style={styles.ticketHeader}>
                  <View>
                    <Text style={styles.ticketTitle}>
                      {selectedTicket.subject}
                    </Text>
                    <Text style={styles.mutedSmall}>
                      {selectedTicket.status === "open"
                        ? "Open ticket"
                        : "Closed ticket"}
                    </Text>
                  </View>

                  <View style={styles.ticketHeaderRight}>
                    <StatusPill status={selectedTicket.status} />
                    {isAdmin && selectedTicket.status === "open" && (
                      <Pressable
                        style={styles.closeButton}
                        onPress={handleCloseTicket}
                      >
                        <Text style={styles.closeButtonLabel}>Close ticket</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Messages list */}
                <View style={styles.messagesContainer}>
                  {messagesLoading ? (
                    <View style={styles.centerSmall}>
                      <ActivityIndicator />
                    </View>
                  ) : (
                    <ScrollView
                      contentContainerStyle={styles.messagesScrollContent}
                    >
                      {messages.length === 0 && (
                        <Text style={styles.mutedSmall}>
                          No messages yet. Start the conversation below.
                        </Text>
                      )}

                      {messages.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isOwn={msg.senderId === user.uid}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Admin close reason */}
                {isAdmin && selectedTicket.status === "open" && (
                  <View style={styles.closeReasonBox}>
                    <Text style={styles.closeReasonLabel}>
                      Close reason (optional)
                    </Text>
                    <TextInput
                      style={styles.closeReasonInput}
                      value={closeReason}
                      onChangeText={setCloseReason}
                      placeholder="Add a short reason for closing this ticket..."
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                )}

                {/* Message composer */}
                {selectedTicket.status === "open" ? (
                  <View style={styles.composer}>
                    <TextInput
                      style={styles.composerInput}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      placeholder="Type your message..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                    />
                    <Button label="Send" onPress={handleSendMessage} />
                  </View>
                ) : (
                  <View style={styles.closedNotice}>
                    <Text style={styles.mutedSmall}>
                      This ticket is closed. You can create a new ticket if you
                      need more help.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Create-ticket panel */}
        {creating && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create Ticket</Text>

              <Text style={styles.modalLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={newSubject}
                onChangeText={setNewSubject}
                placeholder="Short summary of your issue"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Describe your problem in more detail..."
                placeholderTextColor="#9CA3AF"
                multiline
              />

            <View style={styles.modalActions}>
  <Button
    label="Cancel"
    variant="secondary"
    onPress={() => setCreating(false)}
    style={styles.modalButton}
    labelStyle={styles.modalButtonTextSecondary}
  />
  <Button
    label="Create Ticket"
    onPress={handleCreateTicket}
    style={styles.modalButton}
    labelStyle={styles.modalButtonTextPrimary}
  />
</View>

            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

/* ---------- Small components ---------- */

function TicketListItem({
  ticket,
  isSelected,
  onPress,
}: {
  ticket: SupportTicket;
  isSelected: boolean;
  onPress: () => void;
}) {
  const createdDate = ticket.createdAt?.toDate
    ? ticket.createdAt.toDate().toLocaleDateString()
    : "";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.ticketItem,
        isSelected && { borderColor: Theme.colors.primary },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.ticketItemTitle}>{ticket.subject}</Text>
        <PriorityPill priority={ticket.priority} />
      </View>
      <Text numberOfLines={1} style={styles.ticketItemDesc}>
        {ticket.description}
      </Text>
      <View style={styles.ticketItemFooter}>
        <StatusPill status={ticket.status} />
        <Text style={styles.ticketItemDate}>{createdDate}</Text>
      </View>
    </Pressable>
  );
}

function PriorityPill({ priority }: { priority: "low" | "medium" | "high" }) {
  let bg = "#DCFCE7";
  let color = "#15803D";
  if (priority === "medium") {
    bg = "#FEF9C3";
    color = "#92400E";
  }
  if (priority === "high") {
    bg = "#FEE2E2";
    color = "#B91C1C";
  }

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{priority}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const isOpen = status === "open";
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: isOpen ? "#DBEAFE" : "#E5E7EB" },
      ]}
    >
      <Text
        style={[
          styles.pillText,
          { color: isOpen ? Theme.colors.primary : "#4B5563" },
        ]}
      >
        {isOpen ? "open" : "closed"}
      </Text>
    </View>
  );
}

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: SupportMessage;
  isOwn: boolean;
}) {
  const createdTime = msg.createdAt?.toDate
    ? msg.createdAt.toDate().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isAdmin = msg.senderRole === "admin";

  return (
    <View
      style={[
        styles.messageRow,
        isOwn ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" },
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isOwn
            ? {
                backgroundColor: Theme.colors.primary,
                alignSelf: "flex-end",
              }
            : {
                backgroundColor: "#F3F4F6",
                alignSelf: "flex-start",
              },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwn ? { color: Theme.colors.primaryText } : {},
          ]}
        >
          {msg.body}
        </Text>
        <View style={styles.messageMeta}>
          <Text
            style={[
              styles.messageMetaText,
              isAdmin && !isOwn && { fontWeight: "600" },
            ]}
          >
            {isAdmin ? "Support" : "You"}
          </Text>
          <Text style={styles.messageMetaText}> · {createdTime}</Text>
        </View>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: {
    ...Theme.typography.title,
  },
  pageSubtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSubtle,
    marginTop: 4,
  },
    largeButton: {
    minWidth: 190,
    paddingVertical: 12,
  },
  largeButtonLabel: {
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  columns: {
    flex: 1,
    flexDirection: "row",
    gap: Theme.spacing.lg,
  },
  leftColumn: {
    flex: 0.35,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  rightColumn: {
    flex: 0.65,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  columnTitle: {
    ...Theme.typography.subtitle,
    fontWeight: "600",
    marginBottom: Theme.spacing.sm,
  },
  ticketList: {
    marginTop: Theme.spacing.md,
  },
  ticketItem: {
    padding: Theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    marginBottom: Theme.spacing.sm,
  },
  ticketItemTitle: {
    ...Theme.typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  ticketItemDesc: {
    ...Theme.typography.body,
    color: Theme.colors.textSubtle,
    marginBottom: 8,
  },
  ticketItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketItemDate: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  chatWrapper: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  ticketHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  ticketTitle: {
    ...Theme.typography.title,
  },
  messagesContainer: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: Theme.spacing.md,
    backgroundColor: "#F9FAFB",
  },
  messagesScrollContent: {
    gap: 8,
  },
  messageRow: {
    flexDirection: "row",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  messageText: {
    ...Theme.typography.body,
  },
  messageMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  messageMetaText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.md,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  closedNotice: {
    marginTop: Theme.spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Theme.spacing.md,
  },
  emptyTitle: {
    ...Theme.typography.title,
    marginBottom: 4,
  },
  emptyText: {
    ...Theme.typography.body,
    color: Theme.colors.textSubtle,
  },
  muted: {
    ...Theme.typography.body,
    color: Theme.colors.textMuted,
  },
  mutedSmall: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DC2626",
  },
  closeButtonLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
  },
  closeReasonBox: {
    marginTop: Theme.spacing.md,
  },
  closeReasonLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  closeReasonInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSmall: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "90%",
    maxWidth: 600,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Theme.spacing.lg,
  },
  modalTitle: {
    ...Theme.typography.title,
    marginBottom: Theme.spacing.md,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
   modalActions: {
    marginTop: Theme.spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  modalButton: {
    minWidth: 150,
    paddingVertical: 11,
  },
  modalButtonTextPrimary: {
    fontWeight: "600",
  },
  modalButtonTextSecondary: {
    fontWeight: "600",
  },

});
