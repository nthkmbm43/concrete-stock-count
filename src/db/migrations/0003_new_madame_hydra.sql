CREATE TABLE "company_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"company_name_th" text DEFAULT 'บริษัท ขอนแก่นผลิตภัณฑ์คอนกรีต จำกัด' NOT NULL,
	"company_name_en" text DEFAULT 'KHON KAEN CONCRETE PRODUCT CO., LTD.' NOT NULL,
	"brand_name" text DEFAULT 'KCON' NOT NULL,
	"address_th" text DEFAULT '154 หมู่ 9 ถนนมะลิวัลย์ ตำบลบ้านทุ่ม อำเภอเมืองขอนแก่น จังหวัดขอนแก่น 40000' NOT NULL,
	"phone" text DEFAULT '043-255-111',
	"email" text DEFAULT 'kcon.eng@gmail.com' NOT NULL,
	"website" text DEFAULT 'www.kcon-concrete.com' NOT NULL,
	"logo_url" text,
	"report_footer" text DEFAULT 'เอกสารรายงานผลการตรวจนับคลังสินค้าคอนกรีต • ระบบ Concrete Mobile Stock Counting',
	"data_source_notice" text DEFAULT 'ข้อมูลเริ่มต้นจากแหล่งข้อมูลสาธารณะของบริษัท',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"import_type" text DEFAULT 'product_master' NOT NULL,
	"sheet_name" text,
	"user_id" text,
	"user_name" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"policy" text DEFAULT 'skip' NOT NULL,
	"status" text DEFAULT 'SUCCESS' NOT NULL,
	"error_log" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_batch_user_idx" ON "import_batches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "import_batch_created_idx" ON "import_batches" USING btree ("created_at");