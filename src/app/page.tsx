"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserProfile,
  Plant,
  CountRound,
  RoundProgress,
  InventoryItem,
  StockCount,
  StockAdjustment,
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function MobileApp() {
  // 1. Core State
  const [currentUser, setCurrentUser] = useState<UserProfile>(DataProvider.getCurrentUser());
  const [users] = useState<UserProfile[]>(DataProvider.getUsers());
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
  const [isLoading, setIsLoading] = useState(true);

  // Admin Modals
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [roundModalOpen, setRoundModalOpen] = useState(false);

  // 2. Fetch All Data
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
      setActiveRound(active);

      if (active) {
        const prog = await DataProvider.getRoundProgress(active.id);
        setProgress(prog);
      }
    } catch (err) {
      console.error("Refresh data error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 3. Setup Multi-Staff Realtime Subscription (Requirement #29)
  useEffect(() => {
    const unsubscribe = DataProvider.onStockUpdate((event) => {
      console.log("Realtime event received:", event);

      if (event.type === "COUNT_SUBMITTED") {
        const payload = event.payload as { item_id: string; counted_quantity: number; user_name: string };
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

  // Handle User switch
  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    DataProvider.setCurrentUser(user);
    toast.success(`สลับเข้าใช้งานในชื่อ: ${user.full_name} (${user.role})`);
  };

  // Plant items for counting
  const currentPlantItems = React.useMemo(() => {
    if (!selectedPlantId) return [];
    return items.filter((i) => i.plant_id === selectedPlantId);
  }, [items, selectedPlantId]);

  // Handle Submit count
  const handleSubmitCount = async (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
  }) => {
    const result = await DataProvider.submitCount(params);
    await refreshData();
    // Update local item
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

  // Handle Save draft
  const handleSaveDraft = async (params: {
    round_id: string;
    item_id: string;
    plant_id: number;
    counted_quantity: number;
    notes?: string;
  }) => {
    const draft = await DataProvider.saveDraftCount(params);
    await refreshData();
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
    await DataProvider.saveItem({ ...item, status: nextStatus });
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

  // Calculate Title & Subtitle for Top App Bar
  let topTitle = "CONCRETE STOCK";
  let topSubtitle: string | undefined = undefined;
  let showBackButton = false;

  if (selectedItem) {
    topTitle = `${selectedItem.sku} • นับสินค้า`;
    topSubtitle = `โรง ${selectedItem.plant_id} (${selectedItem.zone})`;
    showBackButton = true;
  } else if (selectedPlantId) {
    const p = plants.find((x) => x.id === selectedPlantId);
    topTitle = p ? p.name : "นับสต๊อก";
    topSubtitle = activeRound?.title;
    showBackButton = true;
  } else if (currentTab === "count") {
    topTitle = "เลือกรอบและโรงงาน";
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

  // Uncounted badge for bottom nav
  const uncountedBadge = progress?.uncounted_skus ?? 0;

  if (isLoading || !activeRound) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

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
      hideNav={Boolean(selectedItem)} // Full immersion when counting!
    >
      {/* 1. Home Tab */}
      {currentTab === "home" && (
        <HomeView
          currentUser={currentUser}
          activeRound={activeRound}
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
              round={activeRound}
              currentUser={currentUser}
              plantItems={currentPlantItems}
              onBack={() => setSelectedItem(null)}
              onSubmitCount={handleSubmitCount}
              onSaveDraft={handleSaveDraft}
              fetchItemHistory={(id) => DataProvider.getItemHistory(id)}
              onSelectNextItem={(next) => setSelectedItem(next)}
            />
          ) : (
            <CountRoundView
              round={activeRound}
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

      {/* 5. Profile / Admin Tab */}
      {currentTab === "profile" && (
        <ProfileView
          currentUser={currentUser}
          users={users}
          onOpenUserSwitcher={() => {}}
          activeRound={activeRound}
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
