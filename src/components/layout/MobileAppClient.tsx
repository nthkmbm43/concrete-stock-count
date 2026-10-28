"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
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
import { loginDemoUserAction, logoutUserAction } from "@/actions/auth-actions";
import { LoginView } from "@/components/auth/LoginView";
import { QrScannerModal } from "@/components/scanner/QrScannerModal";
import { ScannedProductSheet } from "@/components/scanner/ScannedProductSheet";
import { ProductQrModal } from "@/components/scanner/ProductQrModal";
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
  currentUser: UserProfile | null;
  users: UserProfile[];
}

interface MobileAppClientProps {
  initialData: InitialAppData;
}

export function MobileAppClient({ initialData }: MobileAppClientProps) {
  // 1. Core State initialized from SSR (Rule 15, 16: Zero Full-Page Skeleton on load)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialData.currentUser);
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

  // Scanner & QR Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [productQrItem, setProductQrItem] = useState<InventoryItem | null>(null);

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

  // Handle URL Deep Links: e.g. /?sku=FP-250-18 or /?scan=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const skuParam = searchParams.get("sku");
    const scanParam = searchParams.get("scan");

    if (scanParam === "1" || scanParam === "true") {
      setScannerOpen(true);
    }

    if (skuParam && items.length > 0) {
      const cleanSku = decodeURIComponent(skuParam).trim().toUpperCase();
      const targetItem = items.find((i) => i.sku.toUpperCase() === cleanSku);
      if (targetItem) {
        if (currentUser) {
          setSelectedItem(targetItem);
          setSelectedPlantId(targetItem.plant_id);
          setCurrentTab("count");
        } else {
          setScannedItem(targetItem);
        }
      }
    }
  }, [items, currentUser]);

  // Initialize session cookie on mount (only in DEMO_MODE)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" && currentUser?.email) {
      loginDemoUserAction(currentUser.email).catch((err) => {
        console.debug("Auto-session init error:", err);
      });
    }
  }, [currentUser?.email]);

  // Handle User Switch
  const handleSelectUser = async (user: UserProfile) => {
    setCurrentUser(user);
    DataProvider.setCurrentUser(user);
    try {
      const res = await loginDemoUserAction(user.email);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        DataProvider.setCurrentUser(res.user);
      }
    } catch (err) {
      console.warn("Failed to set demo user session cookie:", err);
    }
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
              last_counted_by: currentUser?.full_name || "pcryclc",
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
    try {
      await saveCountRoundAction({
        name: roundData.name || roundData.title,
        type: (roundData.type as any) || "MONTHLY",
        status: "OPEN",
        plantIds: roundData.plant_ids || [1, 2, 3, 4],
        startDate: roundData.start_date || new Date().toISOString().split("T")[0],
        endDate: roundData.end_date || new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.warn("Server action save count round error:", err);
    }
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

  const handleLogout = async () => {
    try {
      await logoutUserAction();
      setCurrentUser(null);
      await DataProvider.setCurrentUser(null);
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Logout error:", err);
      setCurrentUser(null);
    }
  };

  // Scanner & QR Code Handlers
  const handleSelectProductFromScan = (item: InventoryItem) => {
    setScannedItem(item);
  };

  const handleStartCountFromScan = (item: InventoryItem) => {
    setSelectedItem(item);
    setSelectedPlantId(item.plant_id);
    setCurrentTab("count");
    setScannedItem(null);
  };

  const handleScanNext = () => {
    setScannedItem(null);
    setScannerOpen(true);
  };

  const handleViewQr = (item: InventoryItem) => {
    setProductQrItem(item);
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

  // ────────────────────────────────────────────────────────
  // Correlated Data: Real Plant SKUs & Live Progress
  // ────────────────────────────────────────────────────────
  const effectivePlants = useMemo(() => {
    return plants.map((plant) => {
      const realCount = items.filter((i) => i.plant_id === plant.id).length;
      return {
        ...plant,
        total_skus: realCount > 0 ? realCount : plant.total_skus,
      };
    });
  }, [plants, items]);

  const effectiveProgress = useMemo<RoundProgress>(() => {
    const roundId = effectiveRound?.id || "default";
    const relevantItems = items.filter((item) =>
      effectiveRound?.plant_ids ? effectiveRound.plant_ids.includes(item.plant_id) : true
    );
    const submittedCounts = counts.filter(
      (c) => c.status === "SUBMITTED" && (!effectiveRound?.id || c.count_round_id === effectiveRound.id)
    );
    const countedItemIds = new Set(submittedCounts.map((c) => c.inventory_item_id));

    const totalSkus = relevantItems.length || items.length;
    const countedSkus = countedItemIds.size;
    const uncountedSkus = Math.max(0, totalSkus - countedSkus);
    const percentage = totalSkus > 0 ? Math.round((countedSkus / totalSkus) * 100) : 0;

    let matchedCount = 0;
    let overCount = 0;
    let underCount = 0;
    let recountedSkus = 0;

    countedItemIds.forEach((itemId) => {
      const itemCounts = submittedCounts.filter((c) => c.inventory_item_id === itemId);
      if (itemCounts.length >= 2) recountedSkus++;
      const latestCount = itemCounts[0];
      if (latestCount) {
        if (latestCount.difference === 0) matchedCount++;
        else if (latestCount.difference > 0) overCount++;
        else underCount++;
      }
    });

    const plantProgressList = effectivePlants.map((plant: Plant) => {
      const plantItems = items.filter((i) => i.plant_id === plant.id);
      const plantCountedIds = new Set(
        submittedCounts
          .filter((c) => plantItems.some((pi) => pi.id === c.inventory_item_id))
          .map((c) => c.inventory_item_id)
      );
      const pTotal = plantItems.length;
      const pCounted = plantCountedIds.size;
      const pUncounted = Math.max(0, pTotal - pCounted);
      const pPct = pTotal > 0 ? Math.round((pCounted / pTotal) * 100) : 0;
      return {
        plant_id: plant.id,
        plant_name: plant.name,
        total_skus: pTotal,
        counted_skus: pCounted,
        uncounted_skus: pUncounted,
        percentage: pPct,
      };
    });

    return {
      count_round_id: roundId,
      round_id: roundId,
      total_skus: totalSkus,
      counted_skus: countedSkus,
      uncounted_skus: uncountedSkus,
      percentage: percentage,
      difference_skus: overCount + underCount,
      matched_skus: matchedCount,
      over_skus: overCount,
      under_skus: underCount,
      recounted_skus: recountedSkus,
      plants: plantProgressList,
    };
  }, [effectiveRound, items, counts, effectivePlants]);

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          DataProvider.setCurrentUser(user);
          refreshData();
        }}
      />
    );
  }

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
        uncountedCount={effectiveProgress.uncounted_skus}
        hideNav={Boolean(selectedItem)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenScan={() => setScannerOpen(true)}
        onLogout={handleLogout}
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
            progress={effectiveProgress}
            plants={effectivePlants}
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
            onOpenScan={() => setScannerOpen(true)}
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
                progress={effectiveProgress}
                plants={effectivePlants}
                items={items}
                counts={counts}
                selectedPlantId={selectedPlantId}
                onSelectPlant={setSelectedPlantId}
                onCountItem={(item) => setSelectedItem(item)}
                onOpenExport={() => setExportModalOpen(true)}
                onOpenScan={() => setScannerOpen(true)}
              />
            )}
          </>
        )}

        {/* 3. Stock Tab */}
        {currentTab === "stock" && (
          <StockView
            items={items}
            plants={effectivePlants}
            currentUser={currentUser}
            onAdjustStock={(item) => setAdjustingItem(item)}
            onCountItem={(item) => {
              setSelectedItem(item);
              setSelectedPlantId(item.plant_id);
              setCurrentTab("count");
            }}
            onOpenExport={() => setExportModalOpen(true)}
            onOpenScan={() => setScannerOpen(true)}
            onViewQr={handleViewQr}
          />
        )}

        {/* 4. History Tab */}
        {currentTab === "history" && (
          <HistoryView
            counts={counts}
            adjustments={adjustments}
            items={items}
            plants={effectivePlants}
            onOpenExport={() => setExportModalOpen(true)}
          />
        )}

        {/* 5. Profile Tab */}
        {currentTab === "profile" && (
          <ProfileView
            currentUser={currentUser}
            users={users}
            onOpenUserSwitcher={() => {}}
            onLogout={handleLogout}
            activeRound={effectiveRound}
            progress={effectiveProgress}
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

        {/* QR & Barcode Scanner Modal */}
        <QrScannerModal
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          items={items}
          onSelectProduct={handleSelectProductFromScan}
        />

        {/* Scanned Product Detail Bottom Sheet */}
        <ScannedProductSheet
          item={scannedItem}
          open={Boolean(scannedItem)}
          onOpenChange={(open) => !open && setScannedItem(null)}
          onStartCount={handleStartCountFromScan}
          onViewQr={handleViewQr}
          onScanNext={handleScanNext}
        />

        {/* Product QR & Barcode Tag Print Modal */}
        <ProductQrModal
          item={productQrItem}
          open={Boolean(productQrItem)}
          onOpenChange={(open) => !open && setProductQrItem(null)}
        />
      </MobileShell>
    </ConcreteRealtimeProvider>
  );
}
