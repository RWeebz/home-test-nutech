CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"icon_url" text NOT NULL,
	"tariff" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_type_enum" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" text NOT NULL,
	CONSTRAINT "transaction_type_enum_transaction_type_unique" UNIQUE("transaction_type")
);
--> statement-breakpoint
CREATE TABLE "user_balance" (
	"user_id" integer NOT NULL,
	"balance" integer NOT NULL,
	CONSTRAINT "user_balance_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"invoice_number" text NOT NULL,
	"service_id" integer,
	"description" text NOT NULL,
	"total_amount" integer NOT NULL,
	"created_on" timestamp with time zone,
	"transaction_type_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"profile_image" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_balance" ADD CONSTRAINT "user_balance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_transactions" ADD CONSTRAINT "user_transactions_id_transaction_type_enum_id_fk" FOREIGN KEY ("transaction_type_id") REFERENCES "public"."transaction_type_enum"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE OR REPLACE FUNCTION initialize_user_balance()
    RETURNS TRIGGER AS $$
BEGIN
    -- Insert a balance record for the new user with initial balance of 0
    INSERT INTO user_balance (user_id, balance)
    VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initialize_user_balance ON users;

CREATE TRIGGER trigger_initialize_user_balance
    AFTER INSERT ON users
    FOR EACH ROW
EXECUTE FUNCTION initialize_user_balance();

-- Function to generate sequential invoice numbers per day
-- Pattern: INV{DDMMYYYY}-{SEQUENCE}
-- Example: INV17082023-001, INV17082023-999, INV17082023-1000
-- Sequence starts at 3 digits (001) and grows dynamically (1000, 10000, etc.)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    current_date_str TEXT;
    next_sequence INT;
    new_invoice_number TEXT;
    last_invoice TEXT;
    last_sequence INT;
    min_digits INT;
BEGIN
    -- Format date as DDMMYYYY
    current_date_str := TO_CHAR(CURRENT_DATE, 'DDMMYYYY');

    -- Get the last invoice number for today
    SELECT invoice_number INTO last_invoice
    FROM user_transactions
    WHERE DATE(created_on) = CURRENT_DATE
      AND invoice_number LIKE 'INV' || current_date_str || '-%'
    ORDER BY invoice_number DESC
    LIMIT 1;

    -- Extract sequence number from last invoice or start at 1
    IF last_invoice IS NOT NULL THEN
        -- Extract the sequence part after the last dash
        last_sequence := CAST(SUBSTRING(last_invoice FROM '[0-9]+$') AS INT);
        next_sequence := last_sequence + 1;
    ELSE
        next_sequence := 1;
    END IF;

    -- Determine minimum number of digits (starts at 3, grows as needed)
    min_digits := GREATEST(3, LENGTH(next_sequence::TEXT));

    -- Generate invoice number: INV{DDMMYYYY}-{SEQUENCE}
    -- SEQUENCE is zero-padded to at least 3 digits, grows dynamically
    new_invoice_number := 'INV' || current_date_str || '-' || LPAD(next_sequence::TEXT, min_digits, '0');

    -- Assign the generated invoice number to the new row
    NEW.invoice_number := new_invoice_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON user_transactions;

-- Create trigger that fires before insert on user_transactions
-- Only when invoice_number is NULL
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON user_transactions
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();
