"use client";

import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import {
  UserProfile,
  Plant,
  CountRound,
  RoundProgress,
  InventoryItem,
  StockCount,
  StockAdjustment,
  StockCountLocation,
} from "@/lib/types";
import { DataProvider } from "@/lib/data-provider";
import { MobileShell } from "@/components/layout/MobileShell";
import { NavTab } from "@/components/layout/BottomNavigation";
import { HomeView } from "@/components/views/HomeView";
import { CountRoundView } from "@/components/views/CountRoundView";
import { ItemCountView } from "@/components/views/ItemCountView";
import { StockView } from "@/components/views/StockView";
import { HistoryView } from "@/components/views/HistoryView";
import { ProfileView } from "@/components/views/ProfileView";
import { StockAdjustModal } from "@/components/admin/StockAdjustModal";
import { ProductManagementModal } from "@/components/admin/ProductManagementModal";
import { RoundManagementModal } from "@/components/admin/RoundManagementModal";
import { ExportReportModal } from "@/components/export/ExportReportModal";
import { Button } from "@/components/ui/button";
import { ConcreteRealtimeProvider } from "@/lib/realtime/RealtimeProvider";
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from "@/lib/realtime/client";
import { adjustStockAction, submitStockCountAction, saveProductAction, saveCountRoundAction } from "@/actions/stock-actions";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";

export interface InitialAppData {
  plants: Plant[];
  activeRound: CountRound | null;
  rounds: CountRound[];
  progress: RoundProgress | null;
  items: InventoryItem[];
  counts: StockCount[];
  adjustments: StockAdjustment[];
  currentUser: UserProfile;
  users: UserProfile[];
}

interface MobileAppClientProps {
  initialData: InitialAppData;
}

export function MobileAppClient({ initialData }: MobileAppClientProps) {
  // 1. Core State initialized from SSR (Rule 15, 16: Zero Full-Page Skeleton on load)
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialData.currentUser);
  const [users] = useState<UserProfile[]>(initialData.users);
  const [currentTab, setCurrentTab] = useState<NavTab>("home");

  // Navigation inside Count flow
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Live Data State
  const [plants, setPlants] = useState<Plant[]>(initialData.plants);
  const [rounds, setRounds] = useState<CountRound[]>(initialData.rounds);
  const [activeRound, setActiveRound] = useState<CountRound | null>(initialData.activeRound);
  const [progress, setProgress] = useState<RoundProgress | null>(initialData.progress);
  const [items, setItems] = useState<InventoryItem[]>(initialData.items);
  const [counts, setCounts] = useState<StockCount[]>(initialData.counts);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(initialData.adjustments);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Admin Modals
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Background refresh helper
  const refreshData = useCallback(async () => {
    try {
      const [fetchedPlants, fetchedRounds, fetchedItems, fetchedCounts, fetchedAdjustments] =
        await Promise.all([
          DataProvider.getPlants(),
          DataProvider.getCountRounds(),
          DataProvider.getItems(),
          DataProvider.getStockCounts(),
          DataProvider.getAdjustments(),
        ]);

      setPlants(fetchedPlants);
      setRounds(fetchedRounds);
      setItems(fetchedItems);
      setCounts(fetchedCounts);
      setAdjustments(fetchedAdjustments);

      const active = fetchedRounds.find((r) => r.status === "OPEN") || fetchedRounds[0];
      setActiveRound(active || null);

      if (active) {
        const prog = await DataProvider.getRoundProgress(active.id);
        setProgress(prog);
      }
    } catch (err) {
      console.warn("Background refresh data error:", err);
    }
  }, []);

  // ────────────────────────────────────────────────────────
  // 6, 7, 8, 71, 72, 73, 75: REALTIME SUBSCRIPTION LISTENER
  // Cross-user & Cross-tab Live Updates without page refresh!
  // ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribeBus = subscribeRealtimeEvents((event) => {
      // 1. Stock updated by Admin (Rule 7: Admin 118 -> 120, Staff sees 120 immediately)
      if (event.type === "STOCK_UPDATED" && event.productId) {
        const newQty = event.newQuantity ?? 0;
        setItems((prev) =>
          prev.map((i) => (i.id === event.productId ? { ...i, current_quantity: newQty } : i))
        );

        // If currently viewing this item in counting screen, update instantly!
        setSelectedItem((curr) => {
          if (curr && curr.id === event.productId) {
            return { ...curr, current_quantity: newQty };
          }
          return curr;
        });

        // Background sync to pull new adjustment history
        refreshData();
      }

      // 2. Count submitted by Staff (Rule 8: Staff A submits, Staff B sees 120 immediately)
      if (event.type === "COUNT_SUBMITTED" && event.productId) {
        const newQty = event.newQuantity ?? 0;
        setItems((prev) =>
          prev.map((i) => (i.id === event.productId ? { ...i, current_quantity: newQty } : i))
        );

        setSelectedItem((curr) => {
          if (curr && curr.id === event.productId) {
            return { ...curr, current_quantity: newQty };
          }
          return curr;
        });

        // Update progress & counts live
        refreshData();
      }

      if (event.type === "PRODUCT_CHANGED" || event.type === "ROUND_CHANGED") {
        refreshData();
      }
    });

    // Also listen to DataProvider local storage sync
    const unsubscribeLocal = DataProvider.onStockUpdate((event) => {
      if (event.type === "COUNT_SUBMITTED") {
        const payload = event.payload as {
          item_id: string;
          counted_quantity: number;
          user_name: string;
        };
        if (payload?.item_id) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === payload.item_id ? { ...i, current_quantity: payload.counted_quantity } : i
            )
          );
        }
        refreshData();
      } else if (event.type === "STOCK_ADJUSTED") {
        refreshData();
      } else if (event.type === "USER_SWITCHED") {
        setCurrentUser(event.payload as UserProfile);
      }
    });

    return () => {
      unsubscribeBus();
      unsubscribeLocal();
    };
  }, [refreshData]);

  // Handle User Switch
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    DataProvider.setCurrentUser(user);
    toast.success(`สลับเข้าใช้งานในชื่อ: ${user.full_name} (${user.role})`);
  };

  // Items for selected plant
  const currentPlantItems = React.useMemo(() => {
    if (!selectedPlantId) return [];
    return items.filter((i) => i.plant_id === selectedPlantId);
  }, [items, selectedPlantId]);

  // ────────────────────────────────────────────────────────
  // 9, 10, 11: OPTIMISTIC UI: SUBMIT COUNT
  // Instant local update, transaction confirmation, rollback on error
  // ────────────────────────────────────────────────────────
  const handleSubmitCount = async (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }) => {
    // 1. Save snapshot for rollback
    const previousItems = [...items];
    const previousProgress = progress ? { ...progress } : null;

    // 2. Optimistic UI update immediately (< 100ms)
    const nowIso = new Date().toISOString();
    setItems((prev) =>
      prev.map((i) =>
        i.id === params.item_id
          ? {
              ...i,
              current_quantity: params.counted_quantity,
              last_counted_at: nowIso,
              last_counted_by: currentUser.full_name,
            }
          : i
      )
    );

    // Optimistically update progress
    if (progress) {
      setProgress((prev) => {
        if (!prev) return null;
        const newCounted = prev.counted_skus + 1;
        return {
          ...prev,
          counted_skus: newCounted,
          uncounted_skus: Math.max(0, prev.total_skus - newCounted),
          percentage: prev.total_skus > 0 ? Math.round((newCounted / prev.total_skus) * 100) : 0,
        };
      });
    }

    try {
      // 3. Execute Server Transaction
      const result = await DataProvider.submitCount(params);

      // 4. Broadcast Realtime Event to other users & tabs
      broadcastRealtimeEvent("COUNT_SUBMITTED", {
        productId: params.item_id,
        roundId: params.round_id,
        newQuantity: params.counted_quantity,
      });

      return result;
    } catch (err) {
      // 10. Rollback on failure
      setItems(previousItems);
      setProgress(previousProgress);
      toast.error("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่");
      throw err;
    }
  };

  // Handle Save draft (with multiple storage locations)
  const handleSaveDraft = async (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }) => {
    const draft = await DataProvider.saveDraftCount(params);
    return draft;
  };

  // ────────────────────────────────────────────────────────
  // 9, 10, 11: OPTIMISTIC UI: ADJUST STOCK (ADMIN)
  // Instant local update, transaction confirmation, rollback on error
  // ────────────────────────────────────────────────────────
  const handleSaveAdjustment = async (params: {
    item_id: string;
    plant_id: number;
    new_quantity: number;
    reason: string;
  }) => {
    // 1. Snapshot for rollback
    const previousItems = [...items];

    // 2. Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === params.item_id ? { ...i, current_quantity: params.new_quantity } : i))
    );

    try {
      // 3. Server Transaction
      await adjustStockAction({
        productId: params.item_id,
        adminUserId: currentUser.id,
        adminRole: currentUser.role,
        newQuantity: params.new_quantity,
        reason: params.reason,
      });

      // 4. Broadcast Realtime Event
      broadcastRealtimeEvent("STOCK_UPDATED", {
        productId: params.item_id,
        newQuantity: params.new_quantity,
      });

      await DataProvider.adjustStock(params);
      toast.success("บันทึกการปรับยอดสต๊อกเรียบร้อยแล้ว");
    } catch (err) {
      // Rollback
      setItems(previousItems);
      toast.error("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่");
      throw err;
    }
  };

  // Handle Save Item (Admin)
  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    await DataProvider.saveItem(itemData);
    broadcastRealtimeEvent("PRODUCT_CHANGED");
    await refreshData();
  };

  // Handle Toggle Item Status
  const handleToggleItemStatus = async (item: InventoryItem) => {
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await DataProvider.saveItem({ ...item, status: nextStatus, is_active: nextStatus === "ACTIVE" });
    broadcastRealtimeEvent("PRODUCT_CHANGED");
    await refreshData();
    toast.info(`เปลี่ยนสถานะ ${item.sku} เป็น ${nextStatus}`);
  };

  // Handle Create Round
  const handleCreateRound = async (roundData: Omit<CountRound, "id" | "created_at">) => {
    const newRound: CountRound = {
      ...roundData,
      id: "round-" + Math.random().toString(36).substring(2, 8),
      created_at: new Date().toISOString(),
    };
    const updated = [newRound, ...rounds];
    setRounds(updated);
    setActiveRound(newRound);
    broadcastRealtimeEvent("ROUND_CHANGED");
    await refreshData();
  };

  // Back button handler
  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedPlantId) {
      setSelectedPlantId(null);
    } else if (currentTab !== "home") {
      setCurrentTab("home");
    }
  };

  // Top App Bar Titles
  const getHeaderTitle = () => {
    if (selectedItem) return "นับสต๊อกสินค้า";
    if (selectedPlantId) {
      const p = plants.find((plant) => plant.id === selectedPlantId);
      return p ? p.name : "เลือกโรงงาน";
    }
    switch (currentTab) {
      case "home":
        return "ภาพรวมคลังสินค้า";
      case "count":
        return activeRound ? activeRound.name : "รอบนับสต๊อก";
      case "stock":
        return "รายการสินค้า & สต๊อก";
      case "history":
        return "ประวัติการนับ & ปรับยอด";
      case "profile":
        return "ข้อมูลพนักงาน";
      default:
        return "ระบบนับสต๊อก";
    }
  };

  const effectiveRound =
    activeRound ||
    rounds[0] || {
      id: "round-default-1",
      name: "รอบนับสต๊อกประจำเดือน",
      title: "รอบนับสต๊อกประจำเดือน",
      type: "MONTHLY" as const,
      count_type: "MONTHLY" as const,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      status: "OPEN" as const,
      plant_ids: [1, 2, 3, 4],
      created_at: new Date().toISOString(),
    };

  return (
    <ConcreteRealtimeProvider>
      <MobileShell
        title={getHeaderTitle()}
        subtitle={selectedItem ? selectedItem.sku : undefined}
        onBack={Boolean(selectedItem || selectedPlantId || currentTab !== "home") ? handleBack : undefined}
        currentTab={currentTab}
        onSelectTab={(tab: NavTab) => {
          setSelectedItem(null);
          setSelectedPlantId(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        uncountedCount={progress ? progress.uncounted_skus : 0}
        hideNav={Boolean(selectedItem)}
        onOpenExport={() => setExportModalOpen(true)}
      >
        {/* Error banner with retry */}
        {errorMsg && (
          <div className="mb-4 rounded-2xl bg-amber-50 p-4 border border-amber-200 flex items-start gap-3 text-amber-900 animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold mb-1">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-amber-700">{errorMsg}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="mt-2.5 h-8 bg-white text-amber-900 border-amber-300 font-bold text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>ลองใหม่อีกครั้ง</span>
              </Button>
            </div>
          </div>
        )}

        {/* 1. Home Tab */}
        {currentTab === "home" && (
          <HomeView
            currentUser={currentUser}
            activeRound={effectiveRound}
            progress={progress}
            plants={plants}
            totalItemCount={items.length}
            onEnterRound={() => {
              setCurrentTab("count");
              setSelectedPlantId(null);
            }}
            onSelectPlant={(plantId) => {
              setSelectedPlantId(plantId);
              setCurrentTab("count");
            }}
            onViewStock={() => setCurrentTab("stock")}
          />
        )}

        {/* 2. Count Tab */}
        {currentTab === "count" && (
          <>
            {selectedItem ? (
              <ItemCountView
                item={selectedItem}
                round={effectiveRound}
                currentUser={currentUser}
                plantItems={currentPlantItems}
                onBack={() => setSelectedItem(null)}
                onSubmitCount={handleSubmitCount}
                onSaveDraft={handleSaveDraft}
                fetchItemHistory={async (id) => {
                  const history = await DataProvider.getItemHistory(id);
                  return history.map((c) => ({
                    id: c.id,
                    type: "COUNT" as const,
                    quantity: c.counted_quantity,
                    previous_quantity: c.previous_quantity,
                    difference: c.difference,
                    by_name: c.user_name,
                    timestamp: c.submitted_at || c.counted_at || c.created_at,
                    notes: c.notes,
                    locations: c.locations,
                  }));
                }}
                onSelectNextItem={(next) => setSelectedItem(next)}
              />
            ) : (
              <CountRoundView
                round={effectiveRound}
                progress={progress}
                plants={plants}
                items={items}
                counts={counts}
                selectedPlantId={selectedPlantId}
                onSelectPlant={setSelectedPlantId}
                onCountItem={(item) => setSelectedItem(item)}
                onOpenExport={() => setExportModalOpen(true)}
              />
            )}
          </>
        )}

        {/* 3. Stock Tab */}
        {currentTab === "stock" && (
          <StockView
            items={items}
            plants={plants}
            currentUser={currentUser}
            onAdjustStock={(item) => setAdjustingItem(item)}
            onCountItem={(item) => {
              setSelectedItem(item);
              setSelectedPlantId(item.plant_id);
              setCurrentTab("count");
            }}
            onOpenExport={() => setExportModalOpen(true)}
          />
        )}

        {/* 4. History Tab */}
        {currentTab === "history" && (
          <HistoryView
            counts={counts}
            adjustments={adjustments}
            items={items}
            plants={plants}
            onOpenExport={() => setExportModalOpen(true)}
          />
        )}

        {/* 5. Profile Tab */}
        {currentTab === "profile" && (
          <ProfileView
            currentUser={currentUser}
            users={users}
            onOpenUserSwitcher={() => {}}
            activeRound={effectiveRound}
            progress={progress}
            items={items}
            onOpenAddProduct={() => {
              setEditingItem(null);
              setProductModalOpen(true);
            }}
            onOpenCreateRound={() => setRoundModalOpen(true)}
            onEditProduct={(item) => {
              setEditingItem(item);
              setProductModalOpen(true);
            }}
            onToggleItemStatus={handleToggleItemStatus}
          />
        )}

        {/* Admin Modals */}
        {adjustingItem && (
          <StockAdjustModal
            open={Boolean(adjustingItem)}
            onOpenChange={(open) => !open && setAdjustingItem(null)}
            item={adjustingItem}
            onSaveAdjustment={handleSaveAdjustment}
          />
        )}

        <ProductManagementModal
          open={productModalOpen}
          onOpenChange={setProductModalOpen}
          item={editingItem}
          existingItems={items}
          onSave={handleSaveItem}
        />

        <RoundManagementModal
          open={roundModalOpen}
          onOpenChange={setRoundModalOpen}
          onCreateRound={handleCreateRound}
        />

        <ExportReportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          rounds={rounds}
          activeRoundId={effectiveRound?.id}
          plants={plants}
          currentPlantId={selectedPlantId || undefined}
        />
      </MobileShell>
    </ConcreteRealtimeProvider>
  );
}
