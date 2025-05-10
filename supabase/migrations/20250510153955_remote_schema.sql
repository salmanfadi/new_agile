create type "public"."user_role" as enum ('admin', 'warehouse_manager', 'field_operator', 'sales_operator', 'customer');

drop trigger if exists "batch_operation_process" on "public"."batch_operations";

drop trigger if exists "inventory_update_audit" on "public"."inventory";

drop trigger if exists "set_updated_at" on "public"."inventory";

drop trigger if exists "set_updated_at" on "public"."products";

drop trigger if exists "set_updated_at" on "public"."profiles";

drop trigger if exists "set_updated_at" on "public"."stock_in";

drop trigger if exists "set_updated_at" on "public"."stock_in_details";

drop trigger if exists "set_updated_at" on "public"."stock_out";

drop trigger if exists "set_updated_at" on "public"."stock_out_details";

drop trigger if exists "set_updated_at" on "public"."warehouse_locations";

drop trigger if exists "set_updated_at" on "public"."warehouses";

drop policy "Admins can manage all batch operations" on "public"."batch_operations";

drop policy "Field operators can create batch operations" on "public"."batch_operations";

drop policy "Warehouse managers can manage batch operations" on "public"."batch_operations";

drop policy "Admins can do everything with inventory" on "public"."inventory";

drop policy "Field operators can view inventory" on "public"."inventory";

drop policy "Warehouse managers can view and update inventory" on "public"."inventory";

drop policy "Public profiles are viewable by everyone" on "public"."profiles";

drop policy "Users can update own profile" on "public"."profiles";

drop policy "Admins can view all audit records" on "public"."stock_movement_audit";

drop policy "Warehouse managers can view audit records" on "public"."stock_movement_audit";

revoke delete on table "public"."barcodes" from "anon";

revoke insert on table "public"."barcodes" from "anon";

revoke references on table "public"."barcodes" from "anon";

revoke select on table "public"."barcodes" from "anon";

revoke trigger on table "public"."barcodes" from "anon";

revoke truncate on table "public"."barcodes" from "anon";

revoke update on table "public"."barcodes" from "anon";

revoke delete on table "public"."barcodes" from "authenticated";

revoke insert on table "public"."barcodes" from "authenticated";

revoke references on table "public"."barcodes" from "authenticated";

revoke select on table "public"."barcodes" from "authenticated";

revoke trigger on table "public"."barcodes" from "authenticated";

revoke truncate on table "public"."barcodes" from "authenticated";

revoke update on table "public"."barcodes" from "authenticated";

revoke delete on table "public"."barcodes" from "service_role";

revoke insert on table "public"."barcodes" from "service_role";

revoke references on table "public"."barcodes" from "service_role";

revoke select on table "public"."barcodes" from "service_role";

revoke trigger on table "public"."barcodes" from "service_role";

revoke truncate on table "public"."barcodes" from "service_role";

revoke update on table "public"."barcodes" from "service_role";

revoke delete on table "public"."batch_inventory_items" from "anon";

revoke insert on table "public"."batch_inventory_items" from "anon";

revoke references on table "public"."batch_inventory_items" from "anon";

revoke select on table "public"."batch_inventory_items" from "anon";

revoke trigger on table "public"."batch_inventory_items" from "anon";

revoke truncate on table "public"."batch_inventory_items" from "anon";

revoke update on table "public"."batch_inventory_items" from "anon";

revoke delete on table "public"."batch_inventory_items" from "authenticated";

revoke insert on table "public"."batch_inventory_items" from "authenticated";

revoke references on table "public"."batch_inventory_items" from "authenticated";

revoke select on table "public"."batch_inventory_items" from "authenticated";

revoke trigger on table "public"."batch_inventory_items" from "authenticated";

revoke truncate on table "public"."batch_inventory_items" from "authenticated";

revoke update on table "public"."batch_inventory_items" from "authenticated";

revoke delete on table "public"."batch_inventory_items" from "service_role";

revoke insert on table "public"."batch_inventory_items" from "service_role";

revoke references on table "public"."batch_inventory_items" from "service_role";

revoke select on table "public"."batch_inventory_items" from "service_role";

revoke trigger on table "public"."batch_inventory_items" from "service_role";

revoke truncate on table "public"."batch_inventory_items" from "service_role";

revoke update on table "public"."batch_inventory_items" from "service_role";

revoke delete on table "public"."batch_operations" from "anon";

revoke insert on table "public"."batch_operations" from "anon";

revoke references on table "public"."batch_operations" from "anon";

revoke select on table "public"."batch_operations" from "anon";

revoke trigger on table "public"."batch_operations" from "anon";

revoke truncate on table "public"."batch_operations" from "anon";

revoke update on table "public"."batch_operations" from "anon";

revoke delete on table "public"."batch_operations" from "authenticated";

revoke insert on table "public"."batch_operations" from "authenticated";

revoke references on table "public"."batch_operations" from "authenticated";

revoke select on table "public"."batch_operations" from "authenticated";

revoke trigger on table "public"."batch_operations" from "authenticated";

revoke truncate on table "public"."batch_operations" from "authenticated";

revoke update on table "public"."batch_operations" from "authenticated";

revoke delete on table "public"."batch_operations" from "service_role";

revoke insert on table "public"."batch_operations" from "service_role";

revoke references on table "public"."batch_operations" from "service_role";

revoke select on table "public"."batch_operations" from "service_role";

revoke trigger on table "public"."batch_operations" from "service_role";

revoke truncate on table "public"."batch_operations" from "service_role";

revoke update on table "public"."batch_operations" from "service_role";

revoke delete on table "public"."stock_movement_audit" from "anon";

revoke insert on table "public"."stock_movement_audit" from "anon";

revoke references on table "public"."stock_movement_audit" from "anon";

revoke select on table "public"."stock_movement_audit" from "anon";

revoke trigger on table "public"."stock_movement_audit" from "anon";

revoke truncate on table "public"."stock_movement_audit" from "anon";

revoke update on table "public"."stock_movement_audit" from "anon";

revoke delete on table "public"."stock_movement_audit" from "authenticated";

revoke insert on table "public"."stock_movement_audit" from "authenticated";

revoke references on table "public"."stock_movement_audit" from "authenticated";

revoke select on table "public"."stock_movement_audit" from "authenticated";

revoke trigger on table "public"."stock_movement_audit" from "authenticated";

revoke truncate on table "public"."stock_movement_audit" from "authenticated";

revoke update on table "public"."stock_movement_audit" from "authenticated";

revoke delete on table "public"."stock_movement_audit" from "service_role";

revoke insert on table "public"."stock_movement_audit" from "service_role";

revoke references on table "public"."stock_movement_audit" from "service_role";

revoke select on table "public"."stock_movement_audit" from "service_role";

revoke trigger on table "public"."stock_movement_audit" from "service_role";

revoke truncate on table "public"."stock_movement_audit" from "service_role";

revoke update on table "public"."stock_movement_audit" from "service_role";

alter table "public"."barcodes" drop constraint "barcodes_barcode_key";

alter table "public"."barcodes" drop constraint "barcodes_batch_id_fkey";

alter table "public"."barcodes" drop constraint "barcodes_created_by_fkey";

alter table "public"."barcodes" drop constraint "barcodes_location_id_fkey";

alter table "public"."barcodes" drop constraint "barcodes_product_id_fkey";

alter table "public"."barcodes" drop constraint "barcodes_warehouse_id_fkey";

alter table "public"."batch_inventory_items" drop constraint "batch_inventory_items_batch_id_fkey";

alter table "public"."batch_inventory_items" drop constraint "batch_inventory_items_inventory_id_fkey";

alter table "public"."batch_inventory_items" drop constraint "batch_inventory_items_product_id_fkey";

alter table "public"."batch_inventory_items" drop constraint "batch_inventory_items_stock_in_detail_id_fkey";

alter table "public"."batch_inventory_items" drop constraint "batch_inventory_items_warehouse_location_id_fkey";

alter table "public"."batch_operations" drop constraint "batch_operations_batch_number_key";

alter table "public"."batch_operations" drop constraint "batch_operations_created_by_fkey";

alter table "public"."batch_operations" drop constraint "batch_operations_destination_warehouse_id_fkey";

alter table "public"."batch_operations" drop constraint "batch_operations_source_warehouse_id_fkey";

alter table "public"."inventory" drop constraint "inventory_last_updated_by_fkey";

alter table "public"."inventory" drop constraint "inventory_stock_in_detail_id_fkey";

alter table "public"."inventory" drop constraint "inventory_stock_in_id_fkey";

alter table "public"."inventory" drop constraint "inventory_warehouse_location_id_fkey";

alter table "public"."profiles" drop constraint "profiles_role_check";

alter table "public"."stock_in" drop constraint "stock_in_approved_by_fkey";

alter table "public"."stock_in" drop constraint "stock_in_created_by_fkey";

alter table "public"."stock_in" drop constraint "stock_in_warehouse_id_fkey";

alter table "public"."stock_in_details" drop constraint "stock_in_details_product_id_fkey";

alter table "public"."stock_in_details" drop constraint "stock_in_details_stock_in_id_fkey";

alter table "public"."stock_movement_audit" drop constraint "stock_movement_audit_inventory_id_fkey";

alter table "public"."stock_movement_audit" drop constraint "stock_movement_audit_performed_by_fkey";

alter table "public"."stock_movement_audit" drop constraint "stock_movement_audit_reference_type_check";

alter table "public"."stock_out" drop constraint "stock_out_created_by_fkey";

alter table "public"."stock_out" drop constraint "stock_out_warehouse_id_fkey";

alter table "public"."stock_out_details" drop constraint "stock_out_details_product_id_fkey";

alter table "public"."warehouse_locations" drop constraint "warehouse_locations_warehouse_id_fkey";

alter table "public"."inventory" drop constraint "inventory_product_id_fkey";

alter table "public"."profiles" drop constraint "profiles_id_fkey";

alter table "public"."stock_out" drop constraint "stock_out_approved_by_fkey";

alter table "public"."stock_out_details" drop constraint "stock_out_details_stock_out_id_fkey";

drop function if exists "public"."handle_updated_at"();

drop function if exists "public"."process_batch_operation"();

drop function if exists "public"."update_inventory_with_audit"();

alter table "public"."barcodes" drop constraint "barcodes_pkey";

alter table "public"."batch_inventory_items" drop constraint "batch_inventory_items_pkey";

alter table "public"."batch_operations" drop constraint "batch_operations_pkey";

alter table "public"."stock_movement_audit" drop constraint "stock_movement_audit_pkey";

drop index if exists "public"."barcodes_barcode_key";

drop index if exists "public"."barcodes_pkey";

drop index if exists "public"."batch_inventory_items_pkey";

drop index if exists "public"."batch_operations_batch_number_key";

drop index if exists "public"."batch_operations_pkey";

drop index if exists "public"."idx_barcodes_barcode";

drop index if exists "public"."idx_barcodes_batch_id";

drop index if exists "public"."idx_barcodes_location_id";

drop index if exists "public"."idx_barcodes_product_id";

drop index if exists "public"."idx_barcodes_warehouse_id";

drop index if exists "public"."idx_batch_operations_created_by";

drop index if exists "public"."idx_batch_operations_status";

drop index if exists "public"."idx_inventory_last_updated_by";

drop index if exists "public"."idx_inventory_location";

drop index if exists "public"."idx_inventory_product";

drop index if exists "public"."idx_inventory_stock_in";

drop index if exists "public"."idx_inventory_stock_in_detail";

drop index if exists "public"."idx_stock_in_warehouse";

drop index if exists "public"."idx_stock_movement_audit_inventory";

drop index if exists "public"."idx_stock_movement_audit_performed_by";

drop index if exists "public"."idx_stock_out_warehouse";

drop index if exists "public"."stock_movement_audit_pkey";

drop table "public"."barcodes";

drop table "public"."batch_inventory_items";

drop table "public"."batch_operations";

drop table "public"."stock_movement_audit";

alter table "public"."stock_in" alter column "status" drop default;

alter table "public"."stock_out" alter column "status" drop default;

alter type "public"."stock_status" rename to "stock_status__old_version_to_be_dropped";

create type "public"."stock_status" as enum ('pending', 'approved', 'rejected', 'completed', 'processing');

create table "public"."barcode_logs" (
    "id" uuid not null default gen_random_uuid(),
    "barcode" text not null,
    "action" text not null,
    "user_id" uuid not null,
    "timestamp" timestamp with time zone not null default now(),
    "details" jsonb,
    "event_type" text,
    "batch_id" uuid
);


create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" text not null,
    "action_type" text not null,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "is_read" boolean not null default false
);


alter table "public"."notifications" enable row level security;

create table "public"."otp_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "token" text not null,
    "expires_at" timestamp with time zone not null,
    "used" boolean default false,
    "created_at" timestamp with time zone default now()
);


alter table "public"."otp_tokens" enable row level security;

create table "public"."pricing_inquiries" (
    "id" uuid not null default gen_random_uuid(),
    "customer_name" text not null,
    "customer_email" text not null,
    "company" text,
    "products" jsonb not null,
    "status" text not null default 'Pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."pricing_inquiries" enable row level security;

create table "public"."sales_inquiries" (
    "id" uuid not null default gen_random_uuid(),
    "customer_name" text not null,
    "customer_email" text not null,
    "customer_company" text not null,
    "customer_phone" text,
    "message" text,
    "status" text not null default 'new'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "response" text
);


create table "public"."sales_inquiry_items" (
    "id" uuid not null default gen_random_uuid(),
    "inquiry_id" uuid not null,
    "product_id" uuid not null,
    "quantity" integer not null,
    "specific_requirements" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."stock_in" alter column status type "public"."stock_status" using status::text::"public"."stock_status";

alter table "public"."stock_out" alter column status type "public"."stock_status" using status::text::"public"."stock_status";

alter table "public"."stock_in" alter column "status" set default 'pending'::stock_status;

alter table "public"."stock_out" alter column "status" set default 'pending'::stock_status;

drop type "public"."stock_status__old_version_to_be_dropped";

alter table "public"."inventory" drop column "last_updated_at";

alter table "public"."inventory" drop column "last_updated_by";

alter table "public"."inventory" drop column "stock_in_detail_id";

alter table "public"."inventory" drop column "stock_in_id";

alter table "public"."inventory" drop column "warehouse_location_id";

alter table "public"."inventory" add column "batch_id" uuid;

alter table "public"."inventory" add column "color" text;

alter table "public"."inventory" add column "location_id" uuid not null;

alter table "public"."inventory" add column "size" text;

alter table "public"."inventory" add column "warehouse_id" uuid not null;

alter table "public"."inventory" alter column "barcode" set not null;

alter table "public"."inventory" alter column "created_at" set not null;

alter table "public"."inventory" alter column "id" set default gen_random_uuid();

alter table "public"."inventory" alter column "product_id" set not null;

alter table "public"."inventory" alter column "status" set default 'available'::text;

alter table "public"."inventory" alter column "status" set not null;

alter table "public"."inventory" alter column "status" set data type text using "status"::text;

alter table "public"."inventory" alter column "updated_at" set not null;

alter table "public"."products" add column "category" text;

alter table "public"."products" add column "created_by" uuid;

alter table "public"."products" add column "image_url" text;

alter table "public"."products" add column "is_active" boolean not null default true;

alter table "public"."products" add column "sku" text;

alter table "public"."products" alter column "created_at" set not null;

alter table "public"."products" alter column "id" set default gen_random_uuid();

alter table "public"."products" alter column "specifications" set data type text using "specifications"::text;

alter table "public"."products" alter column "updated_at" set not null;

alter table "public"."profiles" add column "active" boolean not null default true;

alter table "public"."profiles" add column "name" text;

alter table "public"."profiles" add column "username" text not null;

alter table "public"."profiles" alter column "created_at" set not null;

alter table "public"."profiles" alter column "role" set default 'field_operator'::user_role;

alter table "public"."profiles" alter column "role" set not null;

alter table "public"."profiles" alter column "role" set data type user_role using "role"::user_role;

alter table "public"."profiles" alter column "updated_at" set not null;

alter table "public"."stock_in" drop column "approved_at";

alter table "public"."stock_in" drop column "approved_by";

alter table "public"."stock_in" drop column "created_by";

alter table "public"."stock_in" drop column "warehouse_id";

alter table "public"."stock_in" add column "boxes" integer not null;

alter table "public"."stock_in" add column "processed_by" uuid;

alter table "public"."stock_in" add column "product_id" uuid not null;

alter table "public"."stock_in" add column "rejection_reason" text;

alter table "public"."stock_in" add column "source" text not null;

alter table "public"."stock_in" add column "submitted_by" uuid not null;

alter table "public"."stock_in" alter column "created_at" set not null;

alter table "public"."stock_in" alter column "id" set default gen_random_uuid();

alter table "public"."stock_in" alter column "status" set not null;

alter table "public"."stock_in" alter column "updated_at" set not null;

alter table "public"."stock_in_details" add column "barcode" text not null;

alter table "public"."stock_in_details" add column "color" text;

alter table "public"."stock_in_details" add column "inventory_id" uuid;

alter table "public"."stock_in_details" add column "location_id" uuid not null;

alter table "public"."stock_in_details" add column "size" text;

alter table "public"."stock_in_details" add column "warehouse_id" uuid not null;

alter table "public"."stock_in_details" alter column "created_at" set not null;

alter table "public"."stock_in_details" alter column "id" set default gen_random_uuid();

alter table "public"."stock_in_details" alter column "stock_in_id" set not null;

alter table "public"."stock_in_details" alter column "updated_at" set not null;

alter table "public"."stock_out" drop column "approved_at";

alter table "public"."stock_out" drop column "created_by";

alter table "public"."stock_out" drop column "notes";

alter table "public"."stock_out" drop column "warehouse_id";

alter table "public"."stock_out" add column "approved_quantity" integer;

alter table "public"."stock_out" add column "destination" text not null;

alter table "public"."stock_out" add column "invoice_number" text;

alter table "public"."stock_out" add column "packing_slip_number" text;

alter table "public"."stock_out" add column "product_id" uuid not null;

alter table "public"."stock_out" add column "quantity" integer not null;

alter table "public"."stock_out" add column "reason" text;

alter table "public"."stock_out" add column "requested_by" uuid not null;

alter table "public"."stock_out" add column "verified_by" text;

alter table "public"."stock_out" alter column "created_at" set not null;

alter table "public"."stock_out" alter column "id" set default gen_random_uuid();

alter table "public"."stock_out" alter column "status" set not null;

alter table "public"."stock_out" alter column "updated_at" set not null;

alter table "public"."stock_out_details" drop column "product_id";

alter table "public"."stock_out_details" add column "inventory_id" uuid not null;

alter table "public"."stock_out_details" alter column "created_at" set not null;

alter table "public"."stock_out_details" alter column "id" set default gen_random_uuid();

alter table "public"."stock_out_details" alter column "stock_out_id" set not null;

alter table "public"."stock_out_details" alter column "updated_at" set not null;

alter table "public"."warehouse_locations" alter column "created_at" set not null;

alter table "public"."warehouse_locations" alter column "floor" set not null;

alter table "public"."warehouse_locations" alter column "floor" set data type integer using "floor"::integer;

alter table "public"."warehouse_locations" alter column "id" set default gen_random_uuid();

alter table "public"."warehouse_locations" alter column "updated_at" set not null;

alter table "public"."warehouse_locations" alter column "warehouse_id" set not null;

alter table "public"."warehouses" drop column "address";

alter table "public"."warehouses" add column "location" text;

alter table "public"."warehouses" alter column "created_at" set not null;

alter table "public"."warehouses" alter column "id" set default gen_random_uuid();

alter table "public"."warehouses" alter column "updated_at" set not null;

drop type "public"."batch_status";

drop type "public"."movement_type";

CREATE UNIQUE INDEX barcode_logs_pkey ON public.barcode_logs USING btree (id);

CREATE INDEX idx_inventory_barcode ON public.inventory USING btree (barcode);

CREATE INDEX idx_inventory_batch_id ON public.inventory USING btree (batch_id);

CREATE INDEX idx_inventory_location_id ON public.inventory USING btree (location_id);

CREATE INDEX idx_inventory_product_id ON public.inventory USING btree (product_id);

CREATE INDEX idx_inventory_warehouse_id ON public.inventory USING btree (warehouse_id);

CREATE INDEX idx_stock_in_submitted_by ON public.stock_in USING btree (submitted_by);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX otp_tokens_email_token_key ON public.otp_tokens USING btree (email, token);

CREATE UNIQUE INDEX otp_tokens_pkey ON public.otp_tokens USING btree (id);

CREATE UNIQUE INDEX pricing_inquiries_pkey ON public.pricing_inquiries USING btree (id);

CREATE UNIQUE INDEX products_name_key ON public.products USING btree (name);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX sales_inquiries_pkey ON public.sales_inquiries USING btree (id);

CREATE UNIQUE INDEX sales_inquiry_items_pkey ON public.sales_inquiry_items USING btree (id);

CREATE UNIQUE INDEX stock_in_details_barcode_key ON public.stock_in_details USING btree (barcode);

CREATE UNIQUE INDEX warehouse_locations_warehouse_id_floor_zone_key ON public.warehouse_locations USING btree (warehouse_id, floor, zone);

CREATE UNIQUE INDEX warehouses_name_key ON public.warehouses USING btree (name);

alter table "public"."barcode_logs" add constraint "barcode_logs_pkey" PRIMARY KEY using index "barcode_logs_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."otp_tokens" add constraint "otp_tokens_pkey" PRIMARY KEY using index "otp_tokens_pkey";

alter table "public"."pricing_inquiries" add constraint "pricing_inquiries_pkey" PRIMARY KEY using index "pricing_inquiries_pkey";

alter table "public"."sales_inquiries" add constraint "sales_inquiries_pkey" PRIMARY KEY using index "sales_inquiries_pkey";

alter table "public"."sales_inquiry_items" add constraint "sales_inquiry_items_pkey" PRIMARY KEY using index "sales_inquiry_items_pkey";

alter table "public"."inventory" add constraint "fk_inventory_location" FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory" validate constraint "fk_inventory_location";

alter table "public"."inventory" add constraint "fk_inventory_product" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory" validate constraint "fk_inventory_product";

alter table "public"."inventory" add constraint "fk_inventory_stock_in_details" FOREIGN KEY (batch_id) REFERENCES stock_in_details(id) ON DELETE SET NULL not valid;

alter table "public"."inventory" validate constraint "fk_inventory_stock_in_details";

alter table "public"."inventory" add constraint "fk_inventory_warehouse" FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory" validate constraint "fk_inventory_warehouse";

alter table "public"."inventory" add constraint "inventory_location_id_fkey" FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory" validate constraint "inventory_location_id_fkey";

alter table "public"."inventory" add constraint "inventory_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory" validate constraint "inventory_warehouse_id_fkey";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."otp_tokens" add constraint "otp_tokens_email_token_key" UNIQUE using index "otp_tokens_email_token_key";

alter table "public"."products" add constraint "products_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."products" validate constraint "products_created_by_fkey";

alter table "public"."products" add constraint "products_name_key" UNIQUE using index "products_name_key";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."sales_inquiry_items" add constraint "sales_inquiry_items_inquiry_id_fkey" FOREIGN KEY (inquiry_id) REFERENCES sales_inquiries(id) ON DELETE CASCADE not valid;

alter table "public"."sales_inquiry_items" validate constraint "sales_inquiry_items_inquiry_id_fkey";

alter table "public"."sales_inquiry_items" add constraint "sales_inquiry_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."sales_inquiry_items" validate constraint "sales_inquiry_items_product_id_fkey";

alter table "public"."stock_in" add constraint "stock_in_processed_by_fkey" FOREIGN KEY (processed_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_in" validate constraint "stock_in_processed_by_fkey";

alter table "public"."stock_in" add constraint "stock_in_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_in" validate constraint "stock_in_product_id_fkey";

alter table "public"."stock_in" add constraint "stock_in_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_in" validate constraint "stock_in_submitted_by_fkey";

alter table "public"."stock_in_details" add constraint "fk_stock_in_details_stock_in" FOREIGN KEY (stock_in_id) REFERENCES stock_in(id) ON DELETE CASCADE not valid;

alter table "public"."stock_in_details" validate constraint "fk_stock_in_details_stock_in";

alter table "public"."stock_in_details" add constraint "stock_in_details_barcode_key" UNIQUE using index "stock_in_details_barcode_key";

alter table "public"."stock_in_details" add constraint "stock_in_details_inventory_id_fkey" FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL not valid;

alter table "public"."stock_in_details" validate constraint "stock_in_details_inventory_id_fkey";

alter table "public"."stock_in_details" add constraint "stock_in_details_location_id_fkey" FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_in_details" validate constraint "stock_in_details_location_id_fkey";

alter table "public"."stock_in_details" add constraint "stock_in_details_warehouse_id_fkey" FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_in_details" validate constraint "stock_in_details_warehouse_id_fkey";

alter table "public"."stock_out" add constraint "stock_out_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_out" validate constraint "stock_out_product_id_fkey";

alter table "public"."stock_out" add constraint "stock_out_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_out" validate constraint "stock_out_requested_by_fkey";

alter table "public"."stock_out_details" add constraint "stock_out_details_inventory_id_fkey" FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_out_details" validate constraint "stock_out_details_inventory_id_fkey";

alter table "public"."warehouse_locations" add constraint "fk_warehouse_locations_warehouse" FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE not valid;

alter table "public"."warehouse_locations" validate constraint "fk_warehouse_locations_warehouse";

alter table "public"."warehouse_locations" add constraint "warehouse_locations_warehouse_id_floor_zone_key" UNIQUE using index "warehouse_locations_warehouse_id_floor_zone_key";

alter table "public"."warehouses" add constraint "warehouses_name_key" UNIQUE using index "warehouses_name_key";

alter table "public"."inventory" add constraint "inventory_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory" validate constraint "inventory_product_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."stock_out" add constraint "stock_out_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."stock_out" validate constraint "stock_out_approved_by_fkey";

alter table "public"."stock_out_details" add constraint "stock_out_details_stock_out_id_fkey" FOREIGN KEY (stock_out_id) REFERENCES stock_out(id) ON DELETE CASCADE not valid;

alter table "public"."stock_out_details" validate constraint "stock_out_details_stock_out_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.find_inventory_by_barcode(search_barcode text)
 RETURNS TABLE(inventory_id uuid, product_name text, product_sku text, warehouse_name text, warehouse_location text, floor integer, zone text, quantity integer, barcode text, color text, size text, batch_id uuid, status text)
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id AS inventory_id,
    p.name AS product_name,
    p.sku AS product_sku,
    w.name AS warehouse_name,
    w.location AS warehouse_location,
    wl.floor,
    wl.zone,
    i.quantity,
    i.barcode,
    i.color,
    i.size,
    i.batch_id,
    i.status
  FROM 
    public.inventory i
    JOIN public.products p ON i.product_id = p.id
    JOIN public.warehouses w ON i.warehouse_id = w.id
    JOIN public.warehouse_locations wl ON i.location_id = wl.id
  WHERE 
    i.barcode = search_barcode;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_inventory_details(item_id uuid)
 RETURNS TABLE(inventory_id uuid, product_name text, product_sku text, warehouse_name text, warehouse_location text, floor integer, zone text, quantity integer, barcode text, color text, size text, batch_id uuid, status text)
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id AS inventory_id,
    p.name AS product_name,
    p.sku AS product_sku,
    w.name AS warehouse_name,
    w.location AS warehouse_location,
    wl.floor,
    wl.zone,
    i.quantity,
    i.barcode,
    i.color,
    i.size,
    i.batch_id,
    i.status
  FROM 
    public.inventory i
    JOIN public.products p ON i.product_id = p.id
    JOIN public.warehouses w ON i.warehouse_id = w.id
    JOIN public.warehouse_locations wl ON i.location_id = wl.id
  WHERE 
    i.id = item_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email), COALESCE(NEW.raw_user_meta_data->>'name', 'User'), 'field_operator');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."barcode_logs" to "anon";

grant insert on table "public"."barcode_logs" to "anon";

grant references on table "public"."barcode_logs" to "anon";

grant select on table "public"."barcode_logs" to "anon";

grant trigger on table "public"."barcode_logs" to "anon";

grant truncate on table "public"."barcode_logs" to "anon";

grant update on table "public"."barcode_logs" to "anon";

grant delete on table "public"."barcode_logs" to "authenticated";

grant insert on table "public"."barcode_logs" to "authenticated";

grant references on table "public"."barcode_logs" to "authenticated";

grant select on table "public"."barcode_logs" to "authenticated";

grant trigger on table "public"."barcode_logs" to "authenticated";

grant truncate on table "public"."barcode_logs" to "authenticated";

grant update on table "public"."barcode_logs" to "authenticated";

grant delete on table "public"."barcode_logs" to "service_role";

grant insert on table "public"."barcode_logs" to "service_role";

grant references on table "public"."barcode_logs" to "service_role";

grant select on table "public"."barcode_logs" to "service_role";

grant trigger on table "public"."barcode_logs" to "service_role";

grant truncate on table "public"."barcode_logs" to "service_role";

grant update on table "public"."barcode_logs" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."otp_tokens" to "anon";

grant insert on table "public"."otp_tokens" to "anon";

grant references on table "public"."otp_tokens" to "anon";

grant select on table "public"."otp_tokens" to "anon";

grant trigger on table "public"."otp_tokens" to "anon";

grant truncate on table "public"."otp_tokens" to "anon";

grant update on table "public"."otp_tokens" to "anon";

grant delete on table "public"."otp_tokens" to "authenticated";

grant insert on table "public"."otp_tokens" to "authenticated";

grant references on table "public"."otp_tokens" to "authenticated";

grant select on table "public"."otp_tokens" to "authenticated";

grant trigger on table "public"."otp_tokens" to "authenticated";

grant truncate on table "public"."otp_tokens" to "authenticated";

grant update on table "public"."otp_tokens" to "authenticated";

grant delete on table "public"."otp_tokens" to "service_role";

grant insert on table "public"."otp_tokens" to "service_role";

grant references on table "public"."otp_tokens" to "service_role";

grant select on table "public"."otp_tokens" to "service_role";

grant trigger on table "public"."otp_tokens" to "service_role";

grant truncate on table "public"."otp_tokens" to "service_role";

grant update on table "public"."otp_tokens" to "service_role";

grant delete on table "public"."pricing_inquiries" to "anon";

grant insert on table "public"."pricing_inquiries" to "anon";

grant references on table "public"."pricing_inquiries" to "anon";

grant select on table "public"."pricing_inquiries" to "anon";

grant trigger on table "public"."pricing_inquiries" to "anon";

grant truncate on table "public"."pricing_inquiries" to "anon";

grant update on table "public"."pricing_inquiries" to "anon";

grant delete on table "public"."pricing_inquiries" to "authenticated";

grant insert on table "public"."pricing_inquiries" to "authenticated";

grant references on table "public"."pricing_inquiries" to "authenticated";

grant select on table "public"."pricing_inquiries" to "authenticated";

grant trigger on table "public"."pricing_inquiries" to "authenticated";

grant truncate on table "public"."pricing_inquiries" to "authenticated";

grant update on table "public"."pricing_inquiries" to "authenticated";

grant delete on table "public"."pricing_inquiries" to "service_role";

grant insert on table "public"."pricing_inquiries" to "service_role";

grant references on table "public"."pricing_inquiries" to "service_role";

grant select on table "public"."pricing_inquiries" to "service_role";

grant trigger on table "public"."pricing_inquiries" to "service_role";

grant truncate on table "public"."pricing_inquiries" to "service_role";

grant update on table "public"."pricing_inquiries" to "service_role";

grant delete on table "public"."sales_inquiries" to "anon";

grant insert on table "public"."sales_inquiries" to "anon";

grant references on table "public"."sales_inquiries" to "anon";

grant select on table "public"."sales_inquiries" to "anon";

grant trigger on table "public"."sales_inquiries" to "anon";

grant truncate on table "public"."sales_inquiries" to "anon";

grant update on table "public"."sales_inquiries" to "anon";

grant delete on table "public"."sales_inquiries" to "authenticated";

grant insert on table "public"."sales_inquiries" to "authenticated";

grant references on table "public"."sales_inquiries" to "authenticated";

grant select on table "public"."sales_inquiries" to "authenticated";

grant trigger on table "public"."sales_inquiries" to "authenticated";

grant truncate on table "public"."sales_inquiries" to "authenticated";

grant update on table "public"."sales_inquiries" to "authenticated";

grant delete on table "public"."sales_inquiries" to "service_role";

grant insert on table "public"."sales_inquiries" to "service_role";

grant references on table "public"."sales_inquiries" to "service_role";

grant select on table "public"."sales_inquiries" to "service_role";

grant trigger on table "public"."sales_inquiries" to "service_role";

grant truncate on table "public"."sales_inquiries" to "service_role";

grant update on table "public"."sales_inquiries" to "service_role";

grant delete on table "public"."sales_inquiry_items" to "anon";

grant insert on table "public"."sales_inquiry_items" to "anon";

grant references on table "public"."sales_inquiry_items" to "anon";

grant select on table "public"."sales_inquiry_items" to "anon";

grant trigger on table "public"."sales_inquiry_items" to "anon";

grant truncate on table "public"."sales_inquiry_items" to "anon";

grant update on table "public"."sales_inquiry_items" to "anon";

grant delete on table "public"."sales_inquiry_items" to "authenticated";

grant insert on table "public"."sales_inquiry_items" to "authenticated";

grant references on table "public"."sales_inquiry_items" to "authenticated";

grant select on table "public"."sales_inquiry_items" to "authenticated";

grant trigger on table "public"."sales_inquiry_items" to "authenticated";

grant truncate on table "public"."sales_inquiry_items" to "authenticated";

grant update on table "public"."sales_inquiry_items" to "authenticated";

grant delete on table "public"."sales_inquiry_items" to "service_role";

grant insert on table "public"."sales_inquiry_items" to "service_role";

grant references on table "public"."sales_inquiry_items" to "service_role";

grant select on table "public"."sales_inquiry_items" to "service_role";

grant trigger on table "public"."sales_inquiry_items" to "service_role";

grant truncate on table "public"."sales_inquiry_items" to "service_role";

grant update on table "public"."sales_inquiry_items" to "service_role";

create policy "Allow all authenticated users to view inventory"
on "public"."inventory"
as permissive
for select
to authenticated
using (true);


create policy "Allow only admins and warehouse managers to manage inventory"
on "public"."inventory"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'warehouse_manager'::user_role])));


create policy "Admins can see all notifications"
on "public"."notifications"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));


create policy "Users can create notifications"
on "public"."notifications"
as permissive
for insert
to public
with check ((auth.uid() IS NOT NULL));


create policy "Warehouse managers can see their own notifications"
on "public"."notifications"
as permissive
for select
to public
using (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'warehouse_manager'::user_role))))));


create policy "Allow service role full access to OTP tokens"
on "public"."otp_tokens"
as permissive
for all
to public
using (true);


create policy "Admin can update inquiries"
on "public"."pricing_inquiries"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));


create policy "Admin can view inquiries"
on "public"."pricing_inquiries"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role)))));


create policy "Allow public submissions"
on "public"."pricing_inquiries"
as permissive
for insert
to anon, authenticated
with check (true);


create policy "Allow all authenticated users to view products"
on "public"."products"
as permissive
for select
to authenticated
using (true);


create policy "Allow only admins to manage products"
on "public"."products"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = 'admin'::user_role));


create policy "Allow only admins to manage profiles"
on "public"."profiles"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = 'admin'::user_role));


create policy "Allow users to view their own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using (((id = auth.uid()) OR (get_user_role(auth.uid()) = 'admin'::user_role)));


create policy "Allow all authenticated users to view stock in"
on "public"."stock_in"
as permissive
for select
to authenticated
using (true);


create policy "Allow field operators to create stock in"
on "public"."stock_in"
as permissive
for insert
to authenticated
with check ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'field_operator'::user_role])));


create policy "Allow warehouse managers and admins to update stock in"
on "public"."stock_in"
as permissive
for update
to authenticated
using ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'warehouse_manager'::user_role])));


create policy "Allow all authenticated users to view stock in details"
on "public"."stock_in_details"
as permissive
for select
to authenticated
using (true);


create policy "Allow warehouse managers and admins to manage stock in details"
on "public"."stock_in_details"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'warehouse_manager'::user_role])));


create policy "Allow all authenticated users to view stock out"
on "public"."stock_out"
as permissive
for select
to authenticated
using (true);


create policy "Allow field operators to create stock out"
on "public"."stock_out"
as permissive
for insert
to authenticated
with check ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'field_operator'::user_role])));


create policy "Allow warehouse managers and admins to update stock out"
on "public"."stock_out"
as permissive
for update
to authenticated
using ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'warehouse_manager'::user_role])));


create policy "Allow all authenticated users to view stock out details"
on "public"."stock_out_details"
as permissive
for select
to authenticated
using (true);


create policy "Allow warehouse managers and admins to manage stock out details"
on "public"."stock_out_details"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::user_role, 'warehouse_manager'::user_role])));


create policy "Allow all authenticated users to view warehouse locations"
on "public"."warehouse_locations"
as permissive
for select
to authenticated
using (true);


create policy "Allow only admins to manage warehouse locations"
on "public"."warehouse_locations"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = 'admin'::user_role));


create policy "Allow all authenticated users to view warehouses"
on "public"."warehouses"
as permissive
for select
to authenticated
using (true);


create policy "Allow only admins to manage warehouses"
on "public"."warehouses"
as permissive
for all
to public
using ((get_user_role(auth.uid()) = 'admin'::user_role));


CREATE TRIGGER set_updated_at_inventory BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_pricing_inquiries_updated_at BEFORE UPDATE ON public.pricing_inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_stock_in BEFORE UPDATE ON public.stock_in FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_stock_in_details BEFORE UPDATE ON public.stock_in_details FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_stock_out BEFORE UPDATE ON public.stock_out FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_stock_out_details BEFORE UPDATE ON public.stock_out_details FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_warehouse_locations BEFORE UPDATE ON public.warehouse_locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_warehouses BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION set_updated_at();


