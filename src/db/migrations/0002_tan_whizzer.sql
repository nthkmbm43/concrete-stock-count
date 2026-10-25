CREATE INDEX "product_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "product_plant_sku_idx" ON "products" USING btree ("plant_id","sku");--> statement-breakpoint
CREATE INDEX "sc_loc_storage_idx" ON "stock_count_locations" USING btree ("storage_location_id");--> statement-breakpoint
CREATE INDEX "stock_count_round_prod_idx" ON "stock_counts" USING btree ("round_id","product_id");--> statement-breakpoint
CREATE INDEX "storage_loc_plant_lock_idx" ON "storage_locations" USING btree ("plant_id","lock_code");