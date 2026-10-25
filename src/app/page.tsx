"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function MobileApp() {
  // 1. Core State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => DataProvider.getCurrentUserSync());
  const [users] = useState<UserProfile[]>(() => DataProvider.getUsersSync());
  const [currentTab, setCurrentTab] = useState<NavTab>("home");

  // Navigation inside Count flow
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Data State
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rounds, setRounds] = useState<CountRound[]>([]);
  const [activeRound, setActiveRound] = useState<CountRound | null>(null);
  const [progress, setProgress] = useState<RoundProgress | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  // Fetch States (Loading / Error / Empty)
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin Modals
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [roundModalOpen, setRoundModalOpen] = useState(false);

  // 2. Fetch All Data with Guaranteed Timeout & Error Handling
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);

    // Safety timeout: 7 seconds max to prevent infinite skeleton
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setErrorMsg((prev) => (prev ? prev : "การเชื่อมต่อใช้เวลานานเกินไป กรุณาแตะปุ่มเพื่อลองใหม่"));
    }, 7000);

    try {
      const [fetchedPlants, fetchedRounds, fetchedItems, fetchedCounts, fetchedAdjustments] =
        await Promise.all([
          DataProvider.getPlants(),
          DataProvider.getCountRounds(),
          DataProvider.getItems(),
          DataProvider.getStockCounts(),
          DataProvider.getAdjustments(),
        ]);

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

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

      setIsLoading(false);
    } catch (err) {
      console.error("Refresh data error:", err);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      setErrorMsg("ไม่สามารถโหลดข้อมูลจากระบบได้ กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [refreshData]);

  // 3. Multi-Staff Realtime Subscription
  useEffect(() => {
    const unsubscribe = DataProvider.onStockUpdate((event) => {
      if (event.type === "COUNT_SUBMITTED") {
        const payload = event.payload as {
          item_id: string;
          counted_quantity: number;
          user_name: string;
        };
        toast.info(
          `⚡ Realtime: คุณ${payload.user_name || "พนักงาน"} เพิ่งส่งยอดนับใหม่`,
          { duration: 4000 }
        );
        refreshData();
      } else if (event.type === "STOCK_ADJUSTED") {
        const payload = event.payload as { item_id: string; adjusted_by: string };
        toast.warning(
          `⚡ Realtime: คุณ${payload.adjusted_by} เพิ่งปรับยอดสต๊อก`,
          { duration: 4000 }
        );
        refreshData();
      } else if (event.type === "USER_SWITCHED") {
        setCurrentUser(event.payload as UserProfile);
      } else {
        refreshData();
      }
    });

    return () => {
      unsubscribe();
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

  // Handle Submit count (with multiple storage locations)
  const handleSubmitCount = async (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
    locations?: StockCountLocation[];
  }) => {
    const result = await DataProvider.submitCount(params);
    await refreshData();
    setItems((prev) =>
      prev.map((i) =>
        i.id === params.item_id
          ? {
              ...i,
              current_quantity: params.counted_quantity,
              last_counted_at: result.counted_at,
              last_counted_by_name: currentUser.full_name,
            }
          : i
      )
    );
    return result;
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

  // Handle Adjust Stock (Admin)
  const handleSaveAdjustment = async (params: {
    item_id: string;
    plant_id: number;
    new_quantity: number;
    reason: string;
  }) => {
    await DataProvider.adjustStock(params);
    await refreshData();
  };

  // Handle Save Item (Admin)
  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    await DataProvider.saveItem(itemData);
    await refreshData();
  };

  // Handle Toggle Item Status
  const handleToggleItemStatus = async (item: InventoryItem) => {
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await DataProvider.saveItem({ ...item, status: nextStatus, is_active: nextStatus === "ACTIVE" });
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
  let topTitle = "CONCRETE STOCK";
  let topSubtitle: string | undefined = undefined;
  let showBackButton = false;

  if (selectedItem) {
    topTitle = "นับแยกตามจุดวาง";
    topSubtitle = `${selectedItem.sku} • โรง ${selectedItem.plant_id}`;
    showBackButton = true;
  } else if (selectedPlantId) {
    const p = plants.find((x) => x.id === selectedPlantId);
    topTitle = p ? p.name : "นับสต๊อก";
    topSubtitle = activeRound?.title;
    showBackButton = true;
  } else if (currentTab === "count") {
    topTitle = "รอบนับสินค้า";
    topSubtitle = activeRound?.title;
    showBackButton = false;
  } else if (currentTab === "stock") {
    topTitle = "ยอดสต๊อกคงเหลือ";
    topSubtitle = "อัปเดตตามยอดนับล่าสุด";
    showBackButton = false;
  } else if (currentTab === "history") {
    topTitle = "ประวัติการนับ";
    topSubtitle = "บันทึกย้อนหลังทุกรายการ";
    showBackButton = false;
  } else if (currentTab === "profile") {
    topTitle = "โปรไฟล์ & แอดมิน";
    topSubtitle = currentUser.full_name;
    showBackButton = false;
  }

  const uncountedBadge = progress?.uncounted_skus ?? 0;

  // 4. Loading UX Requirement: Never hang indefinitely in Skeleton!
  if (isLoading && !plants.length && !errorMsg) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40 rounded-xl" />
            <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="text-center pt-2">
            <span className="text-xs text-slate-400 font-semibold animate-pulse">
              กำลังเชื่อมต่อและโหลดข้อมูลสต๊อก...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Error State with Retry Button
  if (errorMsg && !plants.length) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border-2 border-rose-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            ไม่สามารถโหลดข้อมูลได้
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {errorMsg}
          </p>
          <Button
            onClick={() => refreshData()}
            size="lg"
            className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>ลองใหม่</span>
          </Button>
        </div>
      </div>
    );
  }

  // Fallback active round if database empty
  const effectiveRound =
    activeRound ||
    rounds[0] || {
      id: "round-default",
      name: "รอบนับปัจจุบัน",
      title: "รอบนับปัจจุบัน",
      type: "MONTHLY",
      count_type: "MONTHLY",
      start_date: "2026-10-01",
      end_date: "2026-10-31",
      status: "OPEN",
      plant_ids: [1, 2, 3, 4],
      created_at: new Date().toISOString(),
    };

  return (
    <MobileShell
      title={topTitle}
      subtitle={topSubtitle}
      onBack={showBackButton ? handleBack : undefined}
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setSelectedItem(null);
        setCurrentTab(tab);
      }}
      currentUser={currentUser}
      users={users}
      onSelectUser={handleSelectUser}
      uncountedCount={uncountedBadge}
      hideNav={Boolean(selectedItem)}
    >
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
                  note: c.notes,
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
            setSelectedPlantId(item.plant_id);
            setSelectedItem(item);
            setCurrentTab("count");
          }}
        />
      )}

      {/* 4. History Tab */}
      {currentTab === "history" && (
        <HistoryView
          counts={counts}
          adjustments={adjustments}
          items={items}
          plants={plants}
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

      {/* Admin Adjust Stock Modal */}
      <StockAdjustModal
        open={Boolean(adjustingItem)}
        onOpenChange={(open) => !open && setAdjustingItem(null)}
        item={adjustingItem}
        onSaveAdjustment={handleSaveAdjustment}
      />

      {/* Admin Product Management Modal */}
      <ProductManagementModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        item={editingItem}
        existingItems={items}
        onSave={handleSaveItem}
      />

      {/* Admin Round Management Modal */}
      <RoundManagementModal
        open={roundModalOpen}
        onOpenChange={setRoundModalOpen}
        onCreateRound={handleCreateRound}
      />
    </MobileShell>
  );
}
