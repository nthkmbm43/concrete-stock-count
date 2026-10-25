"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountRound, CountRoundType } from "@/lib/types";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { CalendarRange, CheckSquare, Square, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface RoundManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRound: (round: Omit<CountRound, "id" | "created_at">) => Promise<void>;
}

export const RoundManagementModal: React.FC<RoundManagementModalProps> = ({
  open,
  onOpenChange,
  onCreateRound,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CountRoundType>("MONTHLY");
  const [selectedPlants, setSelectedPlants] = useState<number[]>([1, 2, 3, 4]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [notes, setNotes] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!dateRange[0]) {
      setDateRange([new Date(), new Date(Date.now() + 7 * 86400000)]);
    }
  }, []);

  const togglePlant = (id: number) => {
    if (selectedPlants.includes(id)) {
      if (selectedPlants.length === 1) {
        toast.error("ต้องเลือกโรงอย่างน้อย 1 โรง");
        return;
      }
      setSelectedPlants(selectedPlants.filter((p) => p !== id));
    } else {
      setSelectedPlants([...selectedPlants, id]);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("กรุณาระบุชื่อรอบนับ");
      return;
    }
    if (selectedPlants.length === 0) {
      toast.error("กรุณาเลือกโรงงานที่ต้องการนับ");
      return;
    }

    const startDate = dateRange[0]?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0];
    const endDate = dateRange[1]?.toISOString().split("T")[0] || startDate;

    try {
      setIsSubmitting(true);
      await onCreateRound({
        name: title.trim(),
        title: title.trim(),
        type,
        count_type: type,
        start_date: startDate,
        end_date: endDate,
        status: "OPEN",
        plant_ids: selectedPlants,
        notes: notes.trim(),
      });
      toast.success("เปิดรอบนับสต๊อกใหม่สำเร็จ!");
      onOpenChange(false);
      setTitle("");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างรอบนับ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg">สร้างรอบนับใหม่ (Count Round)</SheetTitle>
              <SheetDescription>
                กำหนดรอบนับรายเดือน รายสัปดาห์ หรือตรวจซ้ำ และเลือกโรงที่นับ (1-4 โรง)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 my-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ชื่อรอบนับ <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น รอบนับประจำเดือน พฤศจิกายน 2569"
              className="text-sm font-semibold h-11"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["MONTHLY", "WEEKLY", "RECOUNT"] as CountRoundType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                  type === t
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {t === "MONTHLY" ? "รายเดือน" : t === "WEEKLY" ? "รายสัปดาห์" : "สุ่มตรวจซ้ำ"}
              </button>
            ))}
          </div>

          {/* Plant Selection (1 to 4 plants per Requirement #6) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              โรงงานที่นับในรอบนี้ (เลือก 1 โรง หรือหลายโรงได้)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 1, name: "โรง 1 คลังวัตถุดิบ" },
                { id: 2, name: "โรง 2 คลังสินค้า" },
                { id: 3, name: "โรง 3 สินค้าสำเร็จรูป" },
                { id: 4, name: "โรง 4 สินค้าภายนอก" },
              ].map((p) => {
                const isSelected = selectedPlants.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlant(p.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-600 text-blue-900"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker using React Calendar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                ระยะเวลาของรอบนับ
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>{showCalendar ? "ซ่อนปฏิทิน" : "เลือกวันจากปฏิทิน"}</span>
              </button>
            </div>

            {showCalendar && (
              <div className="p-2 border rounded-2xl bg-white shadow-xs mb-2">
                <Calendar
                  selectRange
                  value={dateRange as any}
                  onChange={(val: any) => setDateRange(val)}
                  className="rounded-xl border-0 shadow-none text-xs"
                />
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-slate-100 text-xs text-slate-700 font-semibold flex items-center justify-between">
              <span>เริ่ม: {dateRange[0]?.toLocaleDateString("th-TH")}</span>
              <span>ถึง: {dateRange[1]?.toLocaleDateString("th-TH")}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              หมายเหตุ / บันทึกเพิ่มเติม
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น สุ่มตรวจสินค้าคงเหลือสิ้นเดือน"
              className="text-xs h-10"
            />
          </div>
        </div>

        <SheetFooter className="mt-4 flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-2xl"
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-2xl font-bold bg-blue-600"
          >
            {isSubmitting ? "กำลังเปิดรอบ..." : "เปิดรอบนับ"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
