import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../src/firebase/config";
import { useAuth } from "../../../src/context/AuthContext";
import Screen from "../../../src/components/ui/Screen";
import { Theme } from "../../../src/styles/Theme";

type CampaignStatus = "draft" | "pending" | "active" | "paused" | "archived";
type RiskLevel = "Low" | "Medium" | "High" | string;

type Campaign = {
  id: string;

  title?: string;
  description?: string;
  address?: string;
  category?: string;

  businessId?: string;
  businessName?: string;
  ownerId?: string;

  status?: CampaignStatus | string;

  goal?: number;
  raised?: number;
  minInvestment?: number;
  apr?: number;

  termMonths?: number;
  deadline?: string;
  riskLevel?: RiskLevel;

  imageUrl?: string | null;

  createdAt?: any;
  updatedAt?: any;

  lastStatusChange?: any;
  lastEdit?: any;
};

// ✅ Unified history entry (status + edits) in campaigns/{id}/history
type HistoryEntry = {
  id: string;
  type: "status" | "edit";

  // status
  fromStatus?: CampaignStatus | "unknown";
  toStatus?: CampaignStatus;

  // edit
  changes?: Record<
    string,
    {
      from: any;
      to: any;
    }
  >;

  reason: string;

  actorEmail?: string | null;
  actorUid?: string;
  actorDisplayName?: string | null;

  createdAt?: any; // Firestore timestamp
};

const STATUS_OPTIONS: CampaignStatus[] = [
  "draft",
  "pending",
  "active",
  "paused",
  "archived",
];
const RISK_OPTIONS: RiskLevel[] = ["Low", "Medium", "High"];

// ✅ Fields we track in edit history
const TRACKED_FIELDS: Array<keyof Campaign> = [
  "title",
  "description",
  "address",
  "category",
  "goal",
  "minInvestment",
  "deadline",
  "apr",
  "riskLevel",
  "termMonths",
  "status",
];

export default function AdminCampaignsPage() {
  const router = useRouter();
  const { user, role, roleLoading } = useAuth() as any;
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  // ✅ Admin gate
  useEffect(() => {
    if (!user) router.replace("/login" as any);
  }, [user, router]);

  const isAdmin = (role ?? "").toString().toLowerCase() === "admin";

  useEffect(() => {
    if (!roleLoading && user && !isAdmin) router.replace("/browse" as any);
  }, [roleLoading, user, isAdmin, router]);

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">(
    "all"
  );

  // ----- Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  // ✅ Edit reason modal state (required)
  const [editReasonOpen, setEditReasonOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [pendingEditPayload, setPendingEditPayload] = useState<{
    id: string;
    update: any;
    changes: Record<string, { from: any; to: any }>;
  } | null>(null);

  // ----- Status change reason modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    campaign: Campaign;
    nextStatus: CampaignStatus;
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  // ----- History modal state (unified)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCampaign, setHistoryCampaign] = useState<Campaign | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Editable fields (match your schema)
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fGoal, setFGoal] = useState("");
  const [fMinInv, setFMinInv] = useState("");
  const [fDeadline, setFDeadline] = useState("");
  const [fApr, setFApr] = useState("");
  const [fRisk, setFRisk] = useState<RiskLevel>("Medium");
  const [fTermMonths, setFTermMonths] = useState("");
  const [fStatus, setFStatus] = useState<CampaignStatus>("pending");

  useEffect(() => {
    if (!user) return;

    const qy = query(
      collection(db, "campaigns"),
      orderBy("updatedAt", "desc"),
      limit(200)
    );

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: Campaign[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCampaigns(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Campaigns subscription error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const normalizedStatus = (s: any): CampaignStatus | "unknown" => {
    const v = (s ?? "").toString().toLowerCase().trim();
    if (v === "active") return "active";
    if (v === "paused") return "paused";
    if (v === "pending") return "pending";
    if (v === "draft") return "draft";
    if (v === "archived") return "archived";
    return "unknown";
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return campaigns.filter((c) => {
      const st = normalizedStatus(c.status);
      const statusOk = statusFilter === "all" ? true : st === statusFilter;

      if (!s) return statusOk;

      const hay = [
        c.title ?? "",
        c.businessName ?? "",
        c.address ?? "",
        c.category ?? "",
        c.status ?? "",
        c.riskLevel ?? "",
        c.businessId ?? "",
        c.ownerId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return statusOk && hay.includes(s);
    });
  }, [campaigns, search, statusFilter]);

  const openEdit = (c: Campaign) => {
    setEditCampaign(c);

    setFTitle(c.title ?? "");
    setFDesc(c.description ?? "");
    setFAddress(c.address ?? "");
    setFCategory(c.category ?? "");

    setFGoal((c.goal ?? "").toString());
    setFMinInv((c.minInvestment ?? "").toString());
    setFDeadline(c.deadline ?? "");
    setFApr((c.apr ?? "").toString());
    setFRisk((c.riskLevel ?? "Medium") as RiskLevel);
    setFTermMonths((c.termMonths ?? "").toString());

    const ns = normalizedStatus(c.status);
    setFStatus((ns === "unknown" ? "pending" : ns) as CampaignStatus);

    setEditOpen(true);
  };

  const requestStatusChange = (
    campaign: Campaign,
    nextStatus: CampaignStatus
  ) => {
    setStatusReason("");
    setStatusTarget({ campaign, nextStatus });
    setStatusModalOpen(true);
  };

  const commitStatusChange = async () => {
    if (!statusTarget) return;
    if (!user) return;

    const reason = statusReason.trim();
    if (!reason) {
      Alert.alert(
        "Reason required",
        "Please write a short reason for this status change."
      );
      return;
    }

    const campaign = statusTarget.campaign;
    const nextStatus = statusTarget.nextStatus;
    const prevStatus = normalizedStatus(campaign.status);

    try {
      setStatusSaving(true);

      // ✅ Update campaign + store lastStatusChange
      await updateDoc(doc(db, "campaigns", campaign.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        lastStatusChange: {
          from: prevStatus,
          to: nextStatus,
          reason,
          actorUid: user.uid,
          actorEmail: user.email ?? null,
          actorDisplayName: (user as any)?.displayName ?? null,
          at: serverTimestamp(),
        },
      });

      // ✅ Unified history entry
      await addDoc(collection(db, "campaigns", campaign.id, "history"), {
        type: "status",
        fromStatus: prevStatus,
        toStatus: nextStatus,
        reason,
        actorUid: user.uid,
        actorEmail: user.email ?? null,
        actorDisplayName: (user as any)?.displayName ?? null,
        createdAt: serverTimestamp(),
      });

      setStatusModalOpen(false);
      setStatusTarget(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Update failed", e?.message ?? "Could not update campaign.");
    } finally {
      setStatusSaving(false);
    }
  };

  const toNumberOrNull = (v: string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const makeUpdatePayloadAndChanges = (original: Campaign) => {
    const goal = toNumberOrNull(fGoal);
    const minInv = toNumberOrNull(fMinInv);
    const apr = toNumberOrNull(fApr);
    const termMonths = toNumberOrNull(fTermMonths);

    const update = {
      title: fTitle.trim(),
      description: fDesc.trim(),
      address: fAddress.trim(),
      category: fCategory.trim(),

      goal: goal ?? 0,
      minInvestment: minInv ?? 0,
      deadline: fDeadline.trim(),
      apr: apr ?? 0,
      riskLevel: fRisk,
      termMonths: termMonths ?? 0,

      status: fStatus,
      updatedAt: serverTimestamp(),
    };

    // ✅ build diff map
    const changes: Record<string, { from: any; to: any }> = {};

    const safe = (x: any) => {
      if (typeof x === "undefined") return null;
      return x;
    };

    const compare = (a: any, b: any) => {
      // compare numbers & strings reliably
      if (a === b) return true;
      // Treat null/undefined as same for display? (you can adjust)
      if ((a === null || typeof a === "undefined") && (b === null || typeof b === "undefined"))
        return true;
      return false;
    };

    for (const field of TRACKED_FIELDS) {
      const prev = safe((original as any)[field]);
      const next = safe((update as any)[field]);

      if (!compare(prev, next)) {
        changes[field as string] = { from: prev, to: next };
      }
    }

    return { update, changes };
  };

  // ✅ Instead of saving directly, require a reason first
  const startSaveEdit = async () => {
    if (!editCampaign) return;

    if (!fTitle.trim()) {
      Alert.alert("Missing title", "Please add a campaign title.");
      return;
    }

    const goal = toNumberOrNull(fGoal);
    if (goal !== null && goal < 0) {
      Alert.alert("Invalid goal", "Goal must be a positive number.");
      return;
    }

    const { update, changes } = makeUpdatePayloadAndChanges(editCampaign);

    if (Object.keys(changes).length === 0) {
      Alert.alert("No changes", "You didn't change any fields.");
      return;
    }

    setPendingEditPayload({
      id: editCampaign.id,
      update,
      changes,
    });
    setEditReason("");
    setEditReasonOpen(true);
  };

  const commitEditSave = async () => {
    if (!pendingEditPayload || !user) return;

    const reason = editReason.trim();
    if (!reason) {
      Alert.alert("Reason required", "Please write a reason for the edit.");
      return;
    }

    try {
      setEditSaving(true);

      // ✅ Update campaign doc
      await updateDoc(doc(db, "campaigns", pendingEditPayload.id), {
        ...pendingEditPayload.update,
        lastEdit: {
          reason,
          changes: pendingEditPayload.changes,
          actorUid: user.uid,
          actorEmail: user.email ?? null,
          actorDisplayName: (user as any)?.displayName ?? null,
          at: serverTimestamp(),
        },
      });

      // ✅ Unified history entry w/ changes map
      await addDoc(collection(db, "campaigns", pendingEditPayload.id, "history"), {
        type: "edit",
        changes: pendingEditPayload.changes,
        reason,
        actorUid: user.uid,
        actorEmail: user.email ?? null,
        actorDisplayName: (user as any)?.displayName ?? null,
        createdAt: serverTimestamp(),
      });

      // close modals
      setEditReasonOpen(false);
      setPendingEditPayload(null);
      setEditOpen(false);
      setEditCampaign(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Save failed", e?.message ?? "Could not save changes.");
    } finally {
      setEditSaving(false);
    }
  };

  const openHistory = async (c: Campaign) => {
    try {
      setHistoryCampaign(c);
      setHistory([]);
      setHistoryOpen(true);
      setHistoryLoading(true);

      const qy = query(
        collection(db, "campaigns", c.id, "history"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snap = await getDocs(qy);
      const rows: HistoryEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setHistory(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (!user) return null;

  if (roleLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading permissions…</Text>
        </View>
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Access denied</Text>
          <Text style={styles.muted}>Admins only.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.page, isMobile && styles.pageMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Campaigns</Text>
          <Text style={styles.muted}>
            Manage campaigns and statuses. (Demo phase)
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.panel}>
            <Text style={styles.label}>Search</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="title, business, address, category…"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>

          <View style={styles.panel}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.chipsRow}>
              <Chip
                label="All"
                active={statusFilter === "all"}
                onPress={() => setStatusFilter("all")}
              />
              {STATUS_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={statusFilter === s}
                  onPress={() => setStatusFilter(s)}
                />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.smallMuted}>
          Showing {filtered.length} / {campaigns.length}
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Loading campaigns…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No campaigns found</Text>
            <Text style={styles.muted}>Try changing filters or search.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((c) => {
              const st = normalizedStatus(c.status);
              const lastStatus = c.lastStatusChange;
              const lastEdit = c.lastEdit;

              return (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>
                        {c.title ?? "(no title)"}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {c.businessName ?? "Unknown business"}{" "}
                        {c.category ? `• ${c.category}` : ""} {"• "}
                        <Text style={styles.statusText}>{st}</Text>
                      </Text>
                      {c.address ? (
                        <Text style={styles.cardMeta} numberOfLines={1}>
                          {c.address}
                        </Text>
                      ) : null}

                      {lastStatus?.to ? (
                        <Text style={[styles.cardMeta, { marginTop: 6 }]}>
                          Last status:{" "}
                          <Text style={{ fontWeight: "800", color: Theme.colors.text }}>
                            {String(lastStatus.from ?? "-")} → {String(lastStatus.to)}
                          </Text>{" "}
                          {lastStatus?.actorEmail ? `• ${String(lastStatus.actorEmail)}` : ""}
                        </Text>
                      ) : null}

                      {lastEdit?.reason ? (
                        <Text style={[styles.cardMeta, { marginTop: 4 }]}>
                          Last edit:{" "}
                          <Text style={{ fontWeight: "800", color: Theme.colors.text }}>
                            {String(lastEdit.actorEmail ?? "unknown")}
                          </Text>{" "}
                          • {String(lastEdit.reason).slice(0, 60)}
                          {String(lastEdit.reason).length > 60 ? "…" : ""}
                        </Text>
                      ) : null}
                    </View>

                    <View style={{ gap: 8 }}>
                      <Pressable onPress={() => openEdit(c)} style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Edit</Text>
                      </Pressable>

                      <Pressable onPress={() => openHistory(c)} style={styles.logsBtn}>
                        <Text style={styles.logsBtnText}>History</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Numbers */}
                  <View style={styles.kpis}>
                    <Kpi label="Goal" value={formatMoney(c.goal)} />
                    <Kpi label="Raised" value={formatMoney(c.raised)} />
                    <Kpi label="APR" value={formatApr(c.apr)} />
                    <Kpi label="Min inv." value={formatMoney(c.minInvestment)} />
                  </View>

                  {c.description ? (
                    <Text style={styles.cardDesc} numberOfLines={3}>
                      {c.description}
                    </Text>
                  ) : null}

                  {/* Quick actions (reason required) */}
                  <View style={styles.actionsRow}>
                    <ActionBtn
                      label="Activate"
                      tone="green"
                      onPress={() => requestStatusChange(c, "active")}
                      disabled={st === "active"}
                    />
                    <ActionBtn
                      label="Pause"
                      tone="gray"
                      onPress={() => requestStatusChange(c, "paused")}
                      disabled={st === "paused"}
                    />
                    <ActionBtn
                      label="Archive"
                      tone="blue"
                      onPress={() => requestStatusChange(c, "archived")}
                      disabled={st === "archived"}
                    />
                  </View>

                  <Text style={styles.tiny}>
                    id: {c.id} • businessId: {c.businessId ?? "-"} • ownerId:{" "}
                    {c.ownerId ?? "-"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ✅ Status change modal */}
        <Modal
          visible={statusModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!statusSaving) setStatusModalOpen(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalShell}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change status</Text>
                <Pressable
                  onPress={() => setStatusModalOpen(false)}
                  disabled={statusSaving}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.muted}>
                  {statusTarget
                    ? `Changing "${statusTarget.campaign.title ?? "Untitled"}" → ${
                        statusTarget.nextStatus
                      }`
                    : ""}
                </Text>

                <Text style={styles.modalLabel}>Reason (required)</Text>
                <TextInput
                  value={statusReason}
                  onChangeText={setStatusReason}
                  placeholder="Example: Verified business details; campaign can go live."
                  placeholderTextColor="#9ca3af"
                  style={[styles.modalInput, { height: 110 }]}
                  multiline
                />

                <Text style={[styles.muted, { fontSize: 12 }]}>
                  Action by: {user?.email ?? "Unknown"} (uid: {user?.uid})
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setStatusModalOpen(false)}
                  disabled={statusSaving}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnSecondary,
                    statusSaving && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={commitStatusChange}
                  disabled={statusSaving}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    statusSaving && { opacity: 0.7 },
                  ]}
                >
                  {statusSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ✅ Edit modal (scrollable + sticky footer) */}
        <Modal
          visible={editOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setEditOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalShell}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit campaign</Text>
                <Pressable
                  onPress={() => setEditOpen(false)}
                  disabled={editSaving}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Field label="Title" value={fTitle} onChange={setFTitle} />
                <Field label="Category" value={fCategory} onChange={setFCategory} />
                <Field label="Address" value={fAddress} onChange={setFAddress} />

                <Text style={styles.modalLabel}>Description</Text>
                <TextInput
                  value={fDesc}
                  onChangeText={setFDesc}
                  style={[styles.modalInput, { height: 110 }]}
                  multiline
                />

                <View style={[styles.row, isMobile && styles.rowMobile]}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Goal (number)"
                      value={fGoal}
                      onChange={setFGoal}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Min Investment"
                      value={fMinInv}
                      onChange={setFMinInv}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.row, isMobile && styles.rowMobile]}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="APR (number)"
                      value={fApr}
                      onChange={setFApr}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Term Months"
                      value={fTermMonths}
                      onChange={setFTermMonths}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Field
                  label="Deadline (e.g. 12/26/2030)"
                  value={fDeadline}
                  onChange={setFDeadline}
                />

                <Text style={styles.modalLabel}>Risk level</Text>
                <View style={styles.modalChips}>
                  {RISK_OPTIONS.map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      active={fRisk === r}
                      onPress={() => setFRisk(r)}
                    />
                  ))}
                </View>

                <Text style={styles.modalLabel}>Status</Text>
                <View style={styles.modalChips}>
                  {STATUS_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={fStatus === s}
                      onPress={() => setFStatus(s)}
                    />
                  ))}
                </View>

                <View style={{ height: 12 }} />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setEditOpen(false)}
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  disabled={editSaving}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  // ✅ now requires reason before saving
                  onPress={startSaveEdit}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    editSaving && { opacity: 0.7 },
                  ]}
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ✅ Edit reason modal */}
        <Modal
          visible={editReasonOpen}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!editSaving) setEditReasonOpen(false);
          }}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalShell}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reason for edit</Text>
                <Pressable
                  onPress={() => setEditReasonOpen(false)}
                  disabled={editSaving}
                  style={styles.modalClose}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.muted}>
                  Please write why you changed these fields. This will appear in History.
                </Text>

                <Text style={styles.modalLabel}>Reason (required)</Text>
                <TextInput
                  value={editReason}
                  onChangeText={setEditReason}
                  placeholder="Example: Corrected APR and deadline after reviewing documents."
                  placeholderTextColor="#9ca3af"
                  style={[styles.modalInput, { height: 110 }]}
                  multiline
                />

                {pendingEditPayload?.changes ? (
                  <>
                    <Text style={[styles.modalLabel, { marginTop: 10 }]}>
                      Changes summary
                    </Text>
                    <View style={{ gap: 8 }}>
                      {Object.entries(pendingEditPayload.changes).map(([k, v]) => (
                        <View key={k} style={styles.changeRow}>
                          <Text style={styles.changeKey}>{k}</Text>
                          <Text style={styles.changeVal}>
                            {stringifyValue(v.from)} → {stringifyValue(v.to)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                <Text style={[styles.muted, { fontSize: 12, marginTop: 10 }]}>
                  Action by: {user?.email ?? "Unknown"} (uid: {user?.uid})
                </Text>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setEditReasonOpen(false)}
                  disabled={editSaving}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnSecondary,
                    editSaving && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={commitEditSave}
                  disabled={editSaving}
                  style={[
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    editSaving && { opacity: 0.7 },
                  ]}
                >
                  {editSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* ✅ Unified history modal with dates */}
        <Modal
          visible={historyOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setHistoryOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalShell}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>History</Text>
                <Pressable onPress={() => setHistoryOpen(false)} style={styles.modalClose}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.muted}>
                  {historyCampaign?.title ?? "Campaign"} • latest 50 entries
                </Text>

                {historyLoading ? (
                  <View style={[styles.center, { minHeight: 140 }]}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Loading history…</Text>
                  </View>
                ) : history.length === 0 ? (
                  <View style={[styles.empty, { marginTop: 10 }]}>
                    <Text style={styles.emptyTitle}>No history yet</Text>
                    <Text style={styles.muted}>
                      Status changes and edits will appear here.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10, marginTop: 10 }}>
                    {history.map((h) => (
                      <View key={h.id} style={styles.historyRow}>
                        <View style={styles.historyTopLine}>
                          <Text style={styles.historyType}>
                            {h.type === "status" ? "Status change" : "Edit"}
                          </Text>
                          <Text style={styles.historyDate}>
                            {formatHistoryDate(h.createdAt)}
                          </Text>
                        </View>

                        <Text style={styles.historyMain}>
                          {h.type === "status" ? (
                            <>
                              <Text style={{ fontWeight: "800" }}>
                                {String(h.fromStatus)} → {String(h.toStatus)}
                              </Text>{" "}
                              {h.actorEmail ? `• ${h.actorEmail}` : ""}
                            </>
                          ) : (
                            <>
                              <Text style={{ fontWeight: "800" }}>
                                {h.actorEmail ?? "unknown"}
                              </Text>{" "}
                              edited fields
                            </>
                          )}
                        </Text>

                        <Text style={styles.historyReason}>{h.reason}</Text>

                        {h.type === "edit" && h.changes ? (
                          <View style={{ gap: 6, marginTop: 8 }}>
                            {Object.entries(h.changes).map(([field, v]) => (
                              <View key={field} style={styles.changeRow}>
                                <Text style={styles.changeKey}>{field}</Text>
                                <Text style={styles.changeVal}>
                                  {stringifyValue(v.from)} → {stringifyValue(v.to)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ height: 8 }} />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setHistoryOpen(false)}
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                >
                  <Text style={styles.modalBtnSecondaryText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <>
      <Text style={styles.modalLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={styles.modalInput}
        keyboardType={keyboardType}
      />
    </>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ActionBtn({
  label,
  onPress,
  disabled,
  tone,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone: "green" | "blue" | "gray" | "red";
}) {
  const toneStyle =
    tone === "green"
      ? styles.btnGreen
      : tone === "blue"
      ? styles.btnBlue
      : tone === "red"
      ? styles.btnRed
      : styles.btnGray;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionBtn,
        toneStyle,
        disabled && { opacity: 0.5 },
        pressed && !disabled && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={styles.actionBtnText}>{label}</Text>
    </Pressable>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function formatMoney(n: any) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `${Math.round(num).toLocaleString("en-US")} RON`;
}
function formatApr(n: any) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `${num}%`;
}

function stringifyValue(v: any) {
  if (v === null || typeof v === "undefined") return "∅";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v.length > 80 ? v.slice(0, 77) + "…" : v;
  return JSON.stringify(v);
}

function formatHistoryDate(ts: any) {
  // Firestore Timestamp -> Date
  try {
    const d: Date =
      ts?.toDate?.() ??
      (ts instanceof Date ? ts : null);

    if (!d) return "—";

    // readable everywhere
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const styles = StyleSheet.create({
  page: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
    gap: 14,
  },
  pageMobile: { padding: Theme.spacing.md },
  header: { gap: 6 },
  title: { ...Theme.typography.title },
  muted: { ...Theme.typography.body, color: Theme.colors.textMuted },
  smallMuted: { fontSize: 12, color: Theme.colors.textMuted },

  center: {
    flex: 1,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  controls: { gap: 12 },
  panel: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 14,
    padding: 12,
  },
  label: { fontSize: 12, color: Theme.colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.text,
    backgroundColor: "#fff",
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 as any },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipInactive: { backgroundColor: "#fff", borderColor: Theme.colors.border },
  chipActive: { backgroundColor: "#E0ECFF", borderColor: "#BBD3FF" },
  chipText: { fontSize: 12, color: Theme.colors.textMuted },
  chipTextActive: { color: Theme.colors.primary, fontWeight: "700" },

  card: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: Theme.colors.text },
  cardMeta: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 4 },
  statusText: { fontWeight: "800", color: Theme.colors.text },
  cardDesc: { fontSize: 13, color: Theme.colors.textMuted, lineHeight: 18 },

  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#fff",
  },
  editBtnText: { fontSize: 12, fontWeight: "800", color: Theme.colors.primary },

  logsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#fff",
  },
  logsBtnText: { fontSize: 12, fontWeight: "800", color: Theme.colors.text },

  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 10 as any },
  kpi: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  kpiLabel: { fontSize: 11, color: Theme.colors.textMuted },
  kpiValue: { fontSize: 12, fontWeight: "800", color: Theme.colors.text },

  actionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 as any },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  btnGreen: { backgroundColor: "#16A34A" },
  btnBlue: { backgroundColor: "#2563EB" },
  btnGray: { backgroundColor: "#6B7280" },
  btnRed: { backgroundColor: "#DC2626" },

  tiny: { fontSize: 10, color: Theme.colors.textMuted },

  empty: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: "800", color: Theme.colors.text },

  // ✅ Modal shell
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  modalShell: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "92%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  modalHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#fff",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: Theme.colors.text },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  modalCloseText: { fontSize: 16, color: Theme.colors.text },

  modalScroll: { flex: 1, backgroundColor: "#fff" },
  modalScrollContent: { padding: 14, gap: 8 },

  modalFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fff",
  },

  modalLabel: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.text,
    backgroundColor: "#fff",
  },
  modalChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 as any },

  row: { flexDirection: "row", gap: 10 },
  rowMobile: { flexDirection: "column" },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnSecondary: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#fff",
  },
  modalBtnSecondaryText: { fontSize: 13, fontWeight: "800", color: Theme.colors.text },
  modalBtnPrimary: { backgroundColor: Theme.colors.primary },
  modalBtnPrimaryText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  // ✅ History entries
  historyRow: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  historyTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  historyType: { fontSize: 12, fontWeight: "800", color: Theme.colors.text },
  historyDate: { fontSize: 12, color: Theme.colors.textMuted },
  historyMain: { fontSize: 12, color: Theme.colors.text },
  historyReason: { fontSize: 12, color: Theme.colors.textMuted, lineHeight: 16 },

  // ✅ Changed fields rows
  changeRow: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    gap: 4,
  },
  changeKey: { fontSize: 12, fontWeight: "800", color: Theme.colors.text },
  changeVal: { fontSize: 12, color: Theme.colors.textMuted, lineHeight: 16 },
});
