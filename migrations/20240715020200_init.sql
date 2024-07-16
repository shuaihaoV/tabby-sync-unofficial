DROP TABLE IF EXISTS app_config;
DROP TABLE IF EXISTS app_user;
DROP TRIGGER IF EXISTS update_active_config_id;
DROP TRIGGER IF EXISTS update_active_config_id_on_update;
CREATE TABLE "app_user" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" varchar(150) NOT NULL UNIQUE,
    "active_version" varchar(32) NULL,
    "created_at" TEXT NOT NULL,
    "modified_at" TEXT NOT NULL,
    "last_login" TEXT NULL,
    "active_config_id" integer NULL REFERENCES "app_config" ("id") ON DELETE SET NULL,
    "token_hash" text NOT NULL
);

CREATE TABLE "app_config" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" text NOT NULL,
    "last_used_with_version" varchar(32) NULL,
    "created_at" TEXT NOT NULL,
    "modified_at" TEXT NOT NULL,
    "user_id" integer NOT NULL REFERENCES "app_user" ("id") ON DELETE CASCADE,
    "name" text NOT NULL
);

CREATE TRIGGER trigger_on_app_user_update
AFTER UPDATE ON app_user
BEGIN
    UPDATE app_user
    SET modified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER trigger_on_app_config_insert
AFTER INSERT ON app_config
FOR EACH ROW
WHEN NEW.last_used_with_version IS NOT NULL
BEGIN
    UPDATE app_user
    SET active_config_id = NEW.id,
        active_version = NEW.last_used_with_version
    WHERE app_user.id = NEW.user_id;
END;

CREATE TRIGGER trigger_on_app_config_insert_null
AFTER INSERT ON app_config
FOR EACH ROW
WHEN NEW.last_used_with_version IS NULL
BEGIN
    UPDATE app_user
    SET active_config_id = NEW.id
    WHERE app_user.id = NEW.user_id;
END;

CREATE TRIGGER trigger_on_app_config_update
AFTER UPDATE ON app_config
FOR EACH ROW
WHEN NEW.last_used_with_version IS NOT NULL
BEGIN
    UPDATE app_user
    SET active_config_id = NEW.id,
        active_version = NEW.last_used_with_version
    WHERE app_user.id = NEW.user_id;
    UPDATE app_config
    SET modified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER trigger_on_app_config_update_null
AFTER UPDATE ON app_config
FOR EACH ROW
WHEN NEW.last_used_with_version IS NULL
BEGIN
    UPDATE app_user
    SET active_config_id = NEW.id
    WHERE app_user.id = NEW.user_id;
    UPDATE app_config
    SET modified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = OLD.id;
END;
