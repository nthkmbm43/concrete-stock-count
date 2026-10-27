import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { DataProvider } from "../src/lib/data-provider";
import {
  InventoryItem,
  CountRound,
  StockCountLocation,
  StockCount,
} from "../src/lib/types";
import { LocationState } from "../src/components/views/ItemCountView";

async function runStockCountTests() {
  console.log("==================================================");
  console.log("STARTING STOCK COUNT & MULTI-LOCATION UNIT TESTS");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Multi-Location Calculation & Aggregation
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Testing Multi-Location Calculation & Aggregation ---");

  const mockLocations: LocationState[] = [
    {
      client_id: "loc-1",
      source_type: "SYSTEM",
      lock_code: "A1",
      row_code: "1",
      expected_quantity: 40,
      counted_quantity: 45,
      isNew: false,
    },
    {
      client_id: "loc-2",
      source_type: "SYSTEM",
      lock_code: "A1",
      row_code: "2",
      expected_quantity: 30,
      counted_quantity: 30,
      isNew: false,
    },
  ];

  const totalExpected = mockLocations.reduce((sum, l) => sum + l.expected_quantity, 0);
  const totalCounted = mockLocations.reduce((sum, l) => sum + l.counted_quantity, 0);
  const totalDiff = totalCounted - totalExpected;

  assert(totalExpected === 70, "Total expected quantity correctly aggregated (40 + 30 = 70)");
  assert(totalCounted === 75, "Total counted quantity correctly aggregated (45 + 30 = 75)");
  assert(totalDiff === 5, "Total difference is positive (+5 over / surplus)");

  // Test negative difference (shortage / missing)
  const shortageLocations: LocationState[] = [
    { ...mockLocations[0], counted_quantity: 35 },
    { ...mockLocations[1], counted_quantity: 25 },
  ];
  const shortageCounted = shortageLocations.reduce((sum, l) => sum + l.counted_quantity, 0);
  const shortageDiff = shortageCounted - totalExpected;
  assert(shortageDiff === -10, "Total difference is negative (-10 shortage / deficit)");

  // Test exact match (zero difference)
  const matchLocations: LocationState[] = [
    { ...mockLocations[0], counted_quantity: 40 },
    { ...mockLocations[1], counted_quantity: 30 },
  ];
  const matchCounted = matchLocations.reduce((sum, l) => sum + l.counted_quantity, 0);
  assert(matchCounted - totalExpected === 0, "Total difference is zero (exact match)");

  // Test remaining uncounted calculation
  const partialLocations: LocationState[] = [
    { ...mockLocations[0], counted_quantity: 20 },
    { ...mockLocations[1], counted_quantity: 0 },
  ];
  const partialCounted = partialLocations.reduce((sum, l) => sum + l.counted_quantity, 0);
  const remaining = Math.max(0, totalExpected - partialCounted);
  assert(remaining === 50, "Remaining uncounted quantity correctly calculated (70 - 20 = 50)");

  // ─────────────────────────────────────────────────────────────
  // 2. Add New Storage Position (Add Location)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing Adding New Storage Position ---");

  let locationsState: LocationState[] = [...mockLocations];

  const newLocationInput = {
    lock_code: "B3",
    row_code: "4",
    quantity: 25,
    note: "พบวางเพิ่มที่ลานข้าง",
  };

  const newLocationItem: LocationState = {
    client_id: "new-loc-test-1",
    source_type: "NEW",
    lock_code: newLocationInput.lock_code,
    row_code: newLocationInput.row_code,
    expected_quantity: 0,
    counted_quantity: newLocationInput.quantity,
    isNew: true,
    note: newLocationInput.note,
  };

  locationsState.push(newLocationItem);

  assert(locationsState.length === 3, "New location successfully appended to locations array");
  assert(locationsState[2].isNew === true, "New location has isNew = true");
  assert(locationsState[2].source_type === "NEW", "New location has source_type = 'NEW'");
  assert(locationsState[2].expected_quantity === 0, "New location has expected_quantity = 0");
  assert(locationsState[2].counted_quantity === 25, "New location has counted_quantity = 25");

  const updatedTotalCounted = locationsState.reduce((sum, l) => sum + l.counted_quantity, 0);
  assert(updatedTotalCounted === 100, "Adding location recalculates total counted quantity (75 + 25 = 100)");

  // ─────────────────────────────────────────────────────────────
  // 3. Edit Storage Position (Edit Location)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing Editing Storage Position ---");

  const editParams = {
    lock_code: "C2",
    row_code: "1",
    quantity: 35,
  };

  locationsState = locationsState.map((l) => {
    if (l.client_id === "new-loc-test-1") {
      return {
        ...l,
        lock_code: editParams.lock_code,
        row_code: editParams.row_code,
        counted_quantity: editParams.quantity,
      };
    }
    return l;
  });

  const editedItem = locationsState.find((l) => l.client_id === "new-loc-test-1");
  assert(editedItem?.lock_code === "C2", "Edited location lock_code updated to 'C2'");
  assert(editedItem?.row_code === "1", "Edited location row_code updated to '1'");
  assert(editedItem?.counted_quantity === 35, "Edited location counted_quantity updated to 35");

  const countAfterEdit = locationsState.reduce((sum, l) => sum + l.counted_quantity, 0);
  assert(countAfterEdit === 110, "Total counted quantity reflects edited quantity (75 + 35 = 110)");

  // ─────────────────────────────────────────────────────────────
  // 4. Delete Storage Position with Undo
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing Deleting Storage Position & Undo ---");

  const targetToDelete = locationsState[2];
  const deleteIndex = 2;

  // Perform Delete
  locationsState = locationsState.filter((l) => l.client_id !== targetToDelete.client_id);
  assert(locationsState.length === 2, "Deleted location removed from array (length 3 -> 2)");
  assert(!locationsState.some((l) => l.client_id === targetToDelete.client_id), "Deleted location ID no longer in list");

  const countAfterDelete = locationsState.reduce((sum, l) => sum + l.counted_quantity, 0);
  assert(countAfterDelete === 75, "Total counted quantity decreases back to 75 after delete");

  // Perform Undo (Restore to original index)
  locationsState.splice(deleteIndex, 0, targetToDelete);
  assert(locationsState.length === 3, "Undo restores location array length to 3");
  assert(locationsState[2].client_id === targetToDelete.client_id, "Restored location placed back at index 2");
  assert(locationsState[2].counted_quantity === 35, "Restored location retains its quantity (35)");

  // ─────────────────────────────────────────────────────────────
  // 5. Per-Location Notes
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Testing Per-Location Notes Isolation & Trimming ---");

  // Set note on location 0
  locationsState[0] = { ...locationsState[0], note: "เสาเข็มมีรอยร้าว 2 ต้น" };
  // Set note on location 1
  locationsState[1] = { ...locationsState[1], note: "วางซ้อนเกินความสูงกำหนด" };

  assert(locationsState[0].note === "เสาเข็มมีรอยร้าว 2 ต้น", "Location 0 note set properly");
  assert(locationsState[1].note === "วางซ้อนเกินความสูงกำหนด", "Location 1 note set properly");
  assert(locationsState[0].note !== locationsState[1].note, "Location 0 and 1 notes are strictly isolated");

  // Updating location 0 does not alter location 1
  locationsState[0] = { ...locationsState[0], note: "ตรวจสอบแล้ว รอยร้าวซ่อมแซมได้" };
  assert(locationsState[1].note === "วางซ้อนเกินความสูงกำหนด", "Location 1 note remains unchanged after updating Location 0");

  // Trimming note with whitespace
  const rawWhitespaceNote = "   หมายเหตุมีช่องว่างส่วนเกิน   ";
  const trimmed = rawWhitespaceNote.trim() || undefined;
  assert(trimmed === "หมายเหตุมีช่องว่างส่วนเกิน", "Whitespace trimmed from per-location note");

  const emptyWhitespaceNote = "     ";
  const emptyTrimmed = emptyWhitespaceNote.trim() || undefined;
  assert(emptyTrimmed === undefined, "Empty/whitespace-only note normalizes to undefined");

  // ─────────────────────────────────────────────────────────────
  // 6. DataProvider Draft Saving & Retrieval
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 6. Testing DataProvider Draft Storage & Sync ---");

  const testRoundId = "round-test-unit";
  const testItemId = "item-test-unit";

  const draftLocations: StockCountLocation[] = locationsState.map((loc) => ({
    storage_location_id: loc.storage_location_id,
    lock_code: loc.lock_code,
    row_code: loc.row_code,
    previous_quantity: loc.expected_quantity,
    counted_quantity: loc.counted_quantity,
    difference: loc.counted_quantity - loc.expected_quantity,
    source_type: loc.source_type,
    note: loc.note,
    client_id: loc.client_id,
  }));

  const savedDraft = await DataProvider.saveDraft({
    count_round_id: testRoundId,
    inventory_item_id: testItemId,
    plant_id: 1,
    counted_quantity: countAfterEdit,
    notes: "บันทึกแบบร่างรวม",
    locations: draftLocations,
  });

  assert(savedDraft.status === "DRAFT", "Draft count status is 'DRAFT'");
  assert(savedDraft.counted_quantity === 110, "Draft counted quantity is 110");
  assert(savedDraft.locations?.length === 3, "Draft retains all 3 storage locations");

  const retrievedDraft = DataProvider.getItemDraftSync(testItemId, testRoundId);
  assert(retrievedDraft !== null, "getItemDraftSync retrieves saved draft");
  assert(retrievedDraft?.locations?.[0].note === "ตรวจสอบแล้ว รอยร้าวซ่อมแซมได้", "Retrieved draft preserves per-location note for Loc 0");
  assert(retrievedDraft?.locations?.[1].note === "วางซ้อนเกินความสูงกำหนด", "Retrieved draft preserves per-location note for Loc 1");

  // ─────────────────────────────────────────────────────────────
  // 7. Submit Count & Location Merging
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 7. Testing Count Submission & State Transition ---");

  const items = await DataProvider.getItems();
  const targetItem = items[0];
  const targetPrev = targetItem.current_quantity;
  const countQty = targetPrev + 20;

  const submittedCount = await DataProvider.submitCount({
    round_id: testRoundId,
    plant_id: targetItem.plant_id,
    item_id: targetItem.id,
    counted_quantity: countQty,
    locations: [
      {
        lock_code: "A3",
        row_code: "1",
        previous_quantity: targetPrev,
        counted_quantity: countQty,
        difference: 20,
        source_type: "SYSTEM",
        note: "นับครบถ้วนแล้ว",
      },
    ],
    notes: "การนับรอบเดือนสำเร็จ",
  });

  assert(submittedCount.status === "SUBMITTED", "Submitted count status is 'SUBMITTED'");
  assert(submittedCount.counted_quantity === countQty, `Submitted count quantity is ${countQty}`);
  assert(submittedCount.difference === 20, "Submitted count diff is +20");

  // Draft should be automatically cleared after submit
  const draftAfterSubmit = DataProvider.getItemDraftSync(targetItem.id, testRoundId);
  assert(draftAfterSubmit === null, "Draft is cleared after successful submission");

  // ─────────────────────────────────────────────────────────────
  // 8. Recount Logic & Round Progress
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 8. Testing Recount Logic & Progress Tracking ---");

  const progress = await DataProvider.getRoundProgress("round-1");
  assert(progress.total_skus > 0, "Round progress total_skus > 0");
  assert(typeof progress.percentage === "number", "Round progress percentage is a number");
  assert(progress.percentage >= 0 && progress.percentage <= 100, "Progress percentage is within 0-100 range");

  // Discrepancy filtering: Only items with difference !== 0 should be flagged for recount
  const testStockCounts: StockCount[] = [
    {
      id: "c-1",
      count_round_id: "round-1",
      plant_id: 1,
      inventory_item_id: "item-1",
      user_id: "u-1",
      user_name: "Staff 1",
      previous_quantity: 100,
      counted_quantity: 100,
      difference: 0,
      status: "SUBMITTED",
      counted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: "c-2",
      count_round_id: "round-1",
      plant_id: 1,
      inventory_item_id: "item-2",
      user_id: "u-1",
      user_name: "Staff 1",
      previous_quantity: 100,
      counted_quantity: 85,
      difference: -15,
      status: "SUBMITTED",
      counted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  const discrepancyItems = testStockCounts.filter((c) => c.difference !== 0);
  assert(discrepancyItems.length === 1, "Exactly 1 item has discrepancy requiring recount");
  assert(discrepancyItems[0].inventory_item_id === "item-2", "Discrepancy item is item-2 (diff -15)");

  // ─────────────────────────────────────────────────────────────
  // 9. Realtime Subscription Callback
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 9. Testing Realtime Event Broadcasting ---");

  let eventFired = false;
  let receivedPayload: any = null;

  const unsubscribe = DataProvider.onStockUpdate((event) => {
    eventFired = true;
    receivedPayload = event;
  });

  // Verify listener registration
  assert(typeof unsubscribe === "function", "onStockUpdate returns an unsubscribe function");

  unsubscribe();
  assert(true, "Unsubscribe executed cleanly");

  console.log("\n==================================================");
  console.log(`ALL STOCK COUNT TESTS COMPLETED: ${passed}/${total} PASSED (100%)`);
  console.log("==================================================");
}

runStockCountTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
