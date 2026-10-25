"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem, ItemCategory } from "@/lib/types";
import {
  PackagePlus,
  Boxes,
  Layers,
  Ruler,
  MapPin,
  Activity,
  CircleCheck,
  CircleOff,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  MASTER_PLANTS,
  MASTER_CATEGORIES,
  MasterDataService,
  DimensionUnit,
  normalizeMasterValue,
} from "@/lib/master-data";
import { StyledSelect } from "@/components/ui/styled-select";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DimensionInput } from "@/components/ui/dimension-input";
import { cn } from "@/lib/utils";

interface ProductManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  existingItems?: InventoryItem[];
  onSave: (
    item: Partial<InventoryItem> & { default_lock?: string; default_row?: string }
  ) => Promise<void>;
}

export const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  open,
  onOpenChange,
  item,
  existingItems = [],
  onSave,
}) => {
  // Form State
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [plantId, setPlantId] = useState(2);
  const [category, setCategory] = useState<ItemCategory>("finished_goods");

  // Dimensions
  const [height, setHeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<DimensionUnit>("เมตร");
  const [width, setWidth] = useState("");
  const [widthUnit, setWidthUnit] = useState<DimensionUnit>("นิ้ว");
  const [length, setLength] = useState("");
  const [lengthUnit, setLengthUnit] = useState<DimensionUnit>("เมตร");
  const [customSize, setCustomSize] = useState("");
  const [useCustomSize, setUseCustomSize] = useState(false);

  // Variant & Unit
  const [variant, setVariant] = useState("");
  const [unit, setUnit] = useState("ต้น");

  // Location Hierarchy
  const [zone, setZone] = useState("Yard-1");
  const [defaultLock, setDefaultLock] = useState("B5");
  const [defaultRow, setDefaultRow] = useState("1");

  // Stock & Status
  const [quantity, setQuantity] = useState(0);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Master Data Lists
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [availableVariants, setAvailableVariants] = useState<string[]>([]);
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [availableLocks, setAvailableLocks] = useState<string[]>([]);
  const [availableRows, setAvailableRows] = useState<string[]>([]);

  // Refresh Master Data lists
  const refreshMasterLists = (currPlantId: number) => {
    setAvailableUnits(MasterDataService.getUnits());
    setAvailableVariants(MasterDataService.getVariants());
    setAvailableZones(MasterDataService.getZones(currPlantId));
    setAvailableLocks(MasterDataService.getLocks());
    setAvailableRows(MasterDataService.getRows());
  };

  // Pre-fill on open or item change
  useEffect(() => {
    if (open) {
      if (item) {
        setSku(item.sku);
        setName(item.name);
        setPlantId(item.plant_id);
        setCategory(item.category || "finished_goods");

        // Parse Dimensions
        const hParsed = MasterDataService.parseDimensionValue(item.height || item.size, "เมตร");
        const wParsed = MasterDataService.parseDimensionValue(item.width, "นิ้ว");
        const lParsed = MasterDataService.parseDimensionValue(item.length, "เมตร");

        setHeight(item.height ? hParsed.value : "");
        setHeightUnit(hParsed.unit);
        setWidth(item.width ? wParsed.value : "");
        setWidthUnit(wParsed.unit);
        setLength(item.length ? lParsed.value : "");
        setLengthUnit(lParsed.unit);
        setCustomSize(item.size || "");

        // If size has custom format not matching height/width/length, allow custom size
        if (!item.height && !item.width && !item.length && item.size) {
          setUseCustomSize(true);
        } else {
          setUseCustomSize(false);
        }

        setVariant(item.variant || "");
        setUnit(item.unit || "ต้น");
        setZone(item.zone || "Yard-1");

        // Extract first location if present
        const firstLoc = item.locations?.[0];
        setDefaultLock(firstLoc?.lock_code || "B5");
        setDefaultRow(firstLoc?.row_code || "1");

        setQuantity(item.current_quantity || 0);
        setStatus(item.status || "ACTIVE");
        refreshMasterLists(item.plant_id);
      } else {
        // Reset to clean defaults
        setSku("");
        setName("");
        setPlantId(2);
        setCategory("finished_goods");
        setHeight("");
        setHeightUnit("เมตร");
        setWidth("");
        setWidthUnit("นิ้ว");
        setLength("");
        setLengthUnit("เมตร");
        setCustomSize("");
        setUseCustomSize(false);
        setVariant("");
        setUnit("ต้น");
        setZone("Yard-1");
        setDefaultLock("B5");
        setDefaultRow("1");
        setQuantity(0);
        setStatus("ACTIVE");
        refreshMasterLists(2);
      }
    }
  }, [item, open]);

  // When plantId changes, update available zones and adjust default zone if needed
  const handlePlantChange = (newPlantId: number) => {
    setPlantId(newPlantId);
    const zones = MasterDataService.getZones(newPlantId);
    setAvailableZones(zones);
    if (zones.length > 0 && !zones.includes(zone)) {
      setZone(zones[0]);
    }
  };

  // Formatted preview size string
  const calculatedSize = useMemo(() => {
    if (useCustomSize && customSize.trim()) {
      return customSize.trim();
    }
    const formatted = MasterDataService.formatDimensionSize({
      height,
      heightUnit,
      width,
      widthUnit,
      length,
      lengthUnit,
      rawSize: customSize,
    });
    return formatted || customSize || "-";
  }, [useCustomSize, customSize, height, heightUnit, width, widthUnit, length, lengthUnit]);

  // SKU Duplicate Validation
  const isDuplicateSku = useMemo(() => {
    const trimmed = sku.trim().toUpperCase();
    if (!trimmed) return false;
    return existingItems.some(
      (existing) =>
        existing.sku.toUpperCase() === trimmed &&
        (!item || existing.id !== item.id)
    );
  }, [sku, existingItems, item]);

  // Handlers for adding custom master data
  const handleAddCustomUnit = (rawUnit: string) => {
    const res = MasterDataService.addUnit(rawUnit);
    setAvailableUnits(MasterDataService.getUnits());
    return res.value;
  };

  const handleAddCustomZone = (rawZone: string) => {
    const res = MasterDataService.addZone(plantId, rawZone);
    setAvailableZones(MasterDataService.getZones(plantId));
    return res.value;
  };

  const handleAddCustomLock = (rawLock: string) => {
    const res = MasterDataService.addLock(rawLock);
    setAvailableLocks(MasterDataService.getLocks());
    return res;
  };

  const handleAddCustomRow = (rawRow: string) => {
    const res = MasterDataService.addRow(rawRow);
    setAvailableRows(MasterDataService.getRows());
    return res;
  };

  const handleAddCustomVariant = (rawVar: string) => {
    const res = MasterDataService.addVariant(rawVar);
    setAvailableVariants(MasterDataService.getVariants());
    return res.value;
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanUnit = normalizeMasterValue(unit) || "ต้น";

    if (!cleanSku) {
      toast.error("กรุณากรอกรหัสสินค้า (SKU)");
      return;
    }
    if (isDuplicateSku) {
      toast.error(`รหัส SKU "${cleanSku}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
      return;
    }
    if (!cleanName) {
      toast.error("กรุณากรอกชื่อสินค้า");
      return;
    }

    // Determine final size representation
    const finalSize = calculatedSize !== "-" ? calculatedSize : "มาตรฐาน";

    try {
      setIsSubmitting(true);

      // Save custom values to Master Data automatically
      MasterDataService.addUnit(cleanUnit);
      if (zone) MasterDataService.addZone(plantId, zone);
      if (defaultLock) MasterDataService.addLock(defaultLock);
      if (defaultRow) MasterDataService.addRow(defaultRow);
      if (variant) MasterDataService.addVariant(variant);

      await onSave({
        id: item?.id,
        sku: cleanSku,
        name: cleanName,
        category,
        plant_id: plantId,
        size: finalSize,
        height: height.trim() ? `${height.trim()} ${heightUnit}` : undefined,
        width: width.trim() ? `${width.trim()} ${widthUnit}` : undefined,
        length: length.trim() ? `${length.trim()} ${lengthUnit}` : undefined,
        variant: variant.trim() || "-",
        unit: cleanUnit,
        zone: zone.trim() || "Yard-1",
        default_lock: defaultLock.trim() || "B5",
        default_row: defaultRow.trim() || "1",
        current_quantity: !item ? Math.max(0, quantity) : item.current_quantity,
        status,
      });

      toast.success(
        item ? `แก้ไขสินค้า "${cleanSku}" สำเร็จ` : `เพิ่มสินค้าใหม่ "${cleanSku}" เรียบร้อย`
      );
      onOpenChange(false);
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick unit chips for common selections
  const quickUnits = ["ต้น", "แผ่น", "ชิ้น", "ถุง", "ตัน", "คิว", "กก.", "เมตร"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="pb-6 max-h-[94vh] flex flex-col p-0 rounded-t-[2rem] sm:max-w-2xl sm:mx-auto"
      >
        {/* Modal Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-xs shrink-0">
                {item ? <Boxes className="h-6 w-6" /> : <PackagePlus className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-lg font-bold text-slate-900 truncate">
                  {item ? `แก้ไขสินค้า: ${item.sku}` : "เพิ่มสินค้าใหม่เข้าคลัง"}
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 truncate mt-0.5">
                  กรอกรายละเอียดสินค้าคอนกรีตหรือวัตถุดิบ (สิทธิ์แอดมิน)
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar"
        >
          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 1: ข้อมูลสินค้า (Product Info) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-slate-800 font-bold text-sm">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>ข้อมูลสินค้า</span>
            </div>

            <div className="space-y-3">
              {/* SKU */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    รหัส SKU <span className="text-red-500">*</span>
                  </label>
                  {isDuplicateSku && (
                    <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      รหัสนี้มีอยู่ในระบบแล้ว
                    </span>
                  )}
                </div>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  onBlur={() => setSku(sku.trim().toUpperCase())}
                  placeholder="เช่น FP-250-18"
                  className={cn(
                    "font-mono uppercase font-bold text-sm h-12 rounded-2xl bg-white border-2",
                    isDuplicateSku
                      ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500"
                      : "border-slate-200 focus:border-blue-500"
                  )}
                  required
                />
              </div>

              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ชื่อสินค้า <span className="text-red-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น เสารั้วคอนกรีตอัดแรง"
                  className="text-sm h-12 font-medium rounded-2xl bg-white border-2 border-slate-200 focus:border-blue-500"
                  required
                />
              </div>

              {/* Plant & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plant (Styled Select) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    โรงเก็บ / โรงผลิต <span className="text-red-500">*</span>
                  </label>
                  <StyledSelect
                    value={plantId}
                    onChange={handlePlantChange}
                    options={MASTER_PLANTS.map((p) => ({
                      value: p.id,
                      label: p.name,
                      sublabel: p.subname,
                      description: p.description,
                      icon: p.icon,
                      colorName: p.colorName,
                    }))}
                    title="เลือกโรงเก็บ / โรงผลิต"
                  />
                </div>

                {/* Category (Styled Select) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    หมวดหมู่สินค้า <span className="text-red-500">*</span>
                  </label>
                  <StyledSelect
                    value={category}
                    onChange={(cat) => setCategory(cat as ItemCategory)}
                    options={MASTER_CATEGORIES.map((c) => ({
                      value: c.key,
                      label: c.label,
                      description: c.description,
                      icon: c.icon,
                    }))}
                    title="เลือกหมวดหมู่สินค้า"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 2: ขนาดและรุ่น (Dimensions & Specs) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Ruler className="h-4 w-4 text-blue-600" />
                <span>ขนาดและรุ่น</span>
              </div>
              <button
                type="button"
                onClick={() => setUseCustomSize(!useCustomSize)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {useCustomSize ? "ใช้ตัวระบุขนาดแยก" : "ระบุขนาดเอง"}
              </button>
            </div>

            {useCustomSize ? (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ขนาด / สเปกแบบกำหนดเอง
                </label>
                <Input
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  placeholder="เช่น สูง 2.50 ม. • หน้า 18 นิ้ว"
                  className="text-sm h-12 font-bold text-blue-700 rounded-2xl bg-white border-2 border-slate-200"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Dimension Inputs (Height, Width, Length) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <DimensionInput
                    label="ความสูง"
                    value={height}
                    unit={heightUnit}
                    onValueChange={setHeight}
                    onUnitChange={setHeightUnit}
                    placeholder="เช่น 2.50"
                  />
                  <DimensionInput
                    label="หน้ากว้าง / หน้าตัด"
                    value={width}
                    unit={widthUnit}
                    onValueChange={setWidth}
                    onUnitChange={setWidthUnit}
                    placeholder="เช่น 18"
                  />
                  <DimensionInput
                    label="ความยาว"
                    value={length}
                    unit={lengthUnit}
                    onValueChange={setLength}
                    onUnitChange={setLengthUnit}
                    placeholder="เช่น 2.50"
                  />
                </div>

                {/* Dimension Summary Preview Badge */}
                {calculatedSize !== "-" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-900">
                    <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-600">แสดงผล:</span>
                    <span className="font-bold text-blue-700 truncate">{calculatedSize}</span>
                  </div>
                )}
              </div>
            )}

            {/* Variant & Unit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Variant (Searchable Combobox) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  รุ่น / Variant
                </label>
                <SearchableCombobox
                  value={variant}
                  onChange={setVariant}
                  options={availableVariants}
                  title="เลือกรุ่น / Variant"
                  placeholder="เลือกรุ่น..."
                  searchPlaceholder="ค้นหาหรือพิมพ์รุ่นใหม่..."
                  customAddLabel="เพิ่มรุ่นใหม่"
                  onCustomAdd={handleAddCustomVariant}
                />
              </div>

              {/* Counting Unit (Searchable Combobox) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  หน่วยนับ <span className="text-red-500">*</span>
                </label>
                <SearchableCombobox
                  value={unit}
                  onChange={setUnit}
                  options={availableUnits}
                  title="เลือกหน่วยนับ"
                  placeholder="เลือกหน่วยนับ..."
                  searchPlaceholder="ค้นหา เช่น ต้น, แผ่น, ตัน..."
                  customAddLabel="เพิ่มหน่วยนับใหม่"
                  onCustomAdd={handleAddCustomUnit}
                />
              </div>
            </div>

            {/* Quick Select Unit Chips */}
            <div className="pt-0.5">
              <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                หน่วยนับยอดนิยม:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickUnits.map((u) => {
                  const isSelected = unit === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-lg font-semibold transition-all select-none border",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 3: ตำแหน่งจัดเก็บเริ่มต้น (Default Location) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-slate-800 font-bold text-sm">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>ตำแหน่งจัดเก็บเริ่มต้น (Default Position)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              ตำแหน่งหลักสำหรับแนะนำพนักงานตอนเริ่มนับ (ระหว่างตรวจนับจริงสามารถบันทึกจุดวางอื่นได้ตามปกติ)
            </p>

            <div className="space-y-3">
              {/* Zone (Filtered by plant) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ลาน / โซนจัดเก็บ
                </label>
                <SearchableCombobox
                  value={zone}
                  onChange={setZone}
                  options={availableZones}
                  title={`เลือกลาน / โซน (โรง ${plantId})`}
                  placeholder="เลือกลานหรือโซน..."
                  searchPlaceholder="ค้นหาหรือเพิ่มโซนใหม่..."
                  customAddLabel="เพิ่มโซนใหม่"
                  onCustomAdd={handleAddCustomZone}
                />
              </div>

              {/* Lock & Row Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Default Lock */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ล็อคเริ่มต้น
                  </label>
                  <SearchableCombobox
                    value={defaultLock}
                    onChange={setDefaultLock}
                    options={availableLocks}
                    title="เลือกล็อคเริ่มต้น"
                    placeholder="เช่น B5, A3"
                    searchPlaceholder="ค้นหาหรือเพิ่มล็อค..."
                    customAddLabel="เพิ่มล็อค"
                    onCustomAdd={handleAddCustomLock}
                  />
                </div>

                {/* Default Row */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    แถวเริ่มต้น
                  </label>
                  <SearchableCombobox
                    value={defaultRow}
                    onChange={setDefaultRow}
                    options={availableRows}
                    title="เลือกแถวเริ่มต้น"
                    placeholder="เช่น 1, 2"
                    searchPlaceholder="ค้นหาหรือเพิ่มแถว..."
                    customAddLabel="เพิ่มแถว"
                    onCustomAdd={handleAddCustomRow}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* SECTION 4: สต๊อกและสถานะ (Stock & Status) */}
          {/* ──────────────────────────────────────────────────────── */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200/60 text-slate-800 font-bold text-sm">
              <Activity className="h-4 w-4 text-blue-600" />
              <span>สต๊อกและสถานะ</span>
            </div>

            <div className="space-y-3">
              {/* Initial Stock (Only on create or if quantity editable) */}
              {!item && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    สต๊อกเริ่มต้น
                  </label>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="text-base h-12 font-bold pr-16 rounded-2xl bg-white border-2 border-slate-200 focus:border-blue-500"
                    />
                    <span className="absolute right-3.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {unit || "ชิ้น"}
                    </span>
                  </div>
                </div>
              )}

              {/* Status (Segmented Control) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  สถานะสินค้า
                </label>
                <SegmentedControl<"ACTIVE" | "INACTIVE">
                  value={status}
                  onChange={setStatus}
                  options={[
                    {
                      value: "ACTIVE",
                      label: "✓ เปิดใช้งาน",
                      icon: CircleCheck,
                      activeColor: "green",
                    },
                    {
                      value: "INACTIVE",
                      label: "ปิดใช้งาน",
                      icon: CircleOff,
                      activeColor: "red",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Sticky Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-white shrink-0">
          <SheetFooter className="flex-row gap-2.5 p-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-2xl font-semibold border-2 border-slate-200 hover:bg-slate-50"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              form="product-form"
              variant="default"
              disabled={isSubmitting || isDuplicateSku || !sku.trim() || !name.trim()}
              className="flex-1 h-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-md text-white transition-all active:scale-[0.99]"
            >
              {isSubmitting ? "กำลังบันทึก..." : item ? "บันทึกการแก้ไข" : "บันทึกสินค้า"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};
