CREATE TABLE "lock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lockKey" varchar(256) NOT NULL,
	"expires" timestamp DEFAULT NOW() + INTERVAL '5 minutes' NOT NULL,
	"created" timestamp DEFAULT NOW() NOT NULL,
	"modified" timestamp DEFAULT NOW() NOT NULL,
	CONSTRAINT "lock_lockKey_unique" UNIQUE("lockKey")
);
--> statement-breakpoint
CREATE TABLE "note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"notices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content" text,
	"created" timestamp DEFAULT NOW() NOT NULL,
	"modified" timestamp DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessionTab" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"token" varchar(128) NOT NULL,
	"created" timestamp DEFAULT NOW() NOT NULL,
	"modified" timestamp DEFAULT NOW() NOT NULL,
	CONSTRAINT "sessionTab_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(128) NOT NULL,
	"activeSessionTabId" uuid,
	"userId" uuid NOT NULL,
	"disabled" boolean DEFAULT false,
	"expiry" timestamp NOT NULL,
	"created" timestamp DEFAULT NOW() NOT NULL,
	"modified" timestamp DEFAULT NOW() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"structure" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created" timestamp DEFAULT NOW() NOT NULL,
	"modified" timestamp DEFAULT NOW() NOT NULL,
	CONSTRAINT "tree_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" text NOT NULL,
	"activeEditSessionTabId" uuid,
	"encryption" jsonb NOT NULL,
	"created" timestamp DEFAULT NOW() NOT NULL,
	"modified" timestamp DEFAULT NOW() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessionTab" ADD CONSTRAINT "sessionTab_sessionId_session_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_activeSessionTabId_sessionTab_id_fk" FOREIGN KEY ("activeSessionTabId") REFERENCES "public"."sessionTab"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree" ADD CONSTRAINT "tree_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_activeEditSessionTabId_sessionTab_id_fk" FOREIGN KEY ("activeEditSessionTabId") REFERENCES "public"."sessionTab"("id") ON DELETE set null ON UPDATE no action;