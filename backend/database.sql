-- ============================================================
-- WhisperBook — MySQL Database Schema
-- Privacy-first storytelling platform
-- ============================================================

CREATE DATABASE IF NOT EXISTS whisperbook
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE whisperbook;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  reset_token   VARCHAR(255) DEFAULT NULL,
  reset_expires DATETIME DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  username      VARCHAR(60) NOT NULL UNIQUE,
  full_name     VARCHAR(120) DEFAULT NULL,
  bio           TEXT DEFAULT NULL,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  favorite_theme VARCHAR(40) NOT NULL DEFAULT 'light',
  joined_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_profiles_username (username)
) ENGINE=InnoDB;

-- ============================================================
-- THEMES (catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS themes (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(40) NOT NULL UNIQUE,
  label VARCHAR(60) NOT NULL,
  config JSON DEFAULT NULL
) ENGINE=InnoDB;

INSERT INTO themes (name, label) VALUES
  ('light','Light'), ('dark','Dark'), ('vintage','Vintage Book'),
  ('forest','Forest'), ('royal','Royal'), ('cyberpunk','Cyberpunk'),
  ('fantasy','Fantasy'), ('sakura','Sakura');

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(80) NOT NULL,
  color       VARCHAR(20) NOT NULL DEFAULT '#8a7a4a',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_category (user_id, name),
  INDEX idx_categories_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- STORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT UNSIGNED NOT NULL,
  category_id      BIGINT UNSIGNED DEFAULT NULL,
  title            VARCHAR(255) NOT NULL DEFAULT 'Untitled',
  content          LONGTEXT NOT NULL,
  excerpt          VARCHAR(500) DEFAULT NULL,
  cover_url        VARCHAR(500) DEFAULT NULL,
  privacy          ENUM('private','shared','password','hidden') NOT NULL DEFAULT 'private',
  status           ENUM('active','archived','trash') NOT NULL DEFAULT 'active',
  is_favourite     BOOLEAN NOT NULL DEFAULT FALSE,
  word_count       INT NOT NULL DEFAULT 0,
  reading_time     INT NOT NULL DEFAULT 0,
  disable_copy     BOOLEAN NOT NULL DEFAULT FALSE,
  disable_download BOOLEAN NOT NULL DEFAULT FALSE,
  last_saved_at    TIMESTAMP NULL DEFAULT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_stories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_stories_user (user_id),
  INDEX idx_stories_status (status),
  INDEX idx_stories_category (category_id),
  INDEX idx_stories_favourite (is_favourite),
  FULLTEXT KEY ft_stories_search (title, content)
) ENGINE=InnoDB;

-- ============================================================
-- STORY VERSIONS (autosave / revision history)
-- ============================================================
CREATE TABLE IF NOT EXISTS story_versions (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  story_id   BIGINT UNSIGNED NOT NULL,
  content    LONGTEXT NOT NULL,
  word_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_versions_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  INDEX idx_versions_story (story_id)
) ENGINE=InnoDB;

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  name    VARCHAR(60) NOT NULL,
  CONSTRAINT fk_tags_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_tag (user_id, name)
) ENGINE=InnoDB;

-- ============================================================
-- STORY TAGS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS story_tags (
  story_id BIGINT UNSIGNED NOT NULL,
  tag_id   BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (story_id, tag_id),
  CONSTRAINT fk_st_tags_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_st_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description TEXT DEFAULT NULL,
  cover_url   VARCHAR(500) DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_collections_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- COLLECTION STORIES (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS collection_stories (
  collection_id BIGINT UNSIGNED NOT NULL,
  story_id      BIGINT UNSIGNED NOT NULL,
  added_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, story_id),
  CONSTRAINT fk_cs_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  CONSTRAINT fk_cs_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- PERMISSIONS (per-story sharing)
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  story_id         BIGINT UNSIGNED NOT NULL,
  shared_with      BIGINT UNSIGNED NOT NULL,
  permission_level ENUM('view','comment','edit','owner') NOT NULL DEFAULT 'view',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_perms_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_perms_user FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_story_user (story_id, shared_with),
  INDEX idx_perms_story (story_id),
  INDEX idx_perms_shared_with (shared_with)
) ENGINE=InnoDB;

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  story_id   BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_story (story_id)
) ENGINE=InnoDB;

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  story_id   BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_bookmark (user_id, story_id)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       VARCHAR(60) NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT DEFAULT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifs_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  action     VARCHAR(80) NOT NULL,
  detail     TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_logs_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- SHARED LINKS (secure share by link)
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_links (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  story_id      BIGINT UNSIGNED NOT NULL,
  token         VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,
  expires_at    TIMESTAMP NULL DEFAULT NULL,
  max_views     INT DEFAULT NULL,
  views         INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sharedlinks_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  INDEX idx_sharedlinks_token (token)
) ENGINE=InnoDB;
