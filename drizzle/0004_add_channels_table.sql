CREATE TABLE "channels" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "channels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guildId" integer NOT NULL,
	"channel_snowflake" bigint NOT NULL,
	CONSTRAINT "channels_guildId_channel_snowflake_unique" UNIQUE("guildId","channel_snowflake")
);
--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_guildId_guilds_id_fk" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;