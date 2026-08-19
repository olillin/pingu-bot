CREATE TABLE "guilds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "guilds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"snowflake" bigint NOT NULL,
	"ping_role" bigint,
	CONSTRAINT "guilds_snowflake_unique" UNIQUE("snowflake")
);
